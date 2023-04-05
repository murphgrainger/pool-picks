import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../lib/prisma';
import { getSession } from 'next-auth/react';

import axios from 'axios';
import cheerio from 'cheerio';

const adminKey = process.env.ADMIN_KEY;

interface Athlete {
  full_name: string;
}

interface AthleteInTournament {
  position: number | null;
  score_round_one: number | null;
  score_round_two: number | null;
  score_round_three: number | null;
  score_round_four: number | null;
  score_sum: number | null;
  score_under_par: number | null;
  score_today: number | null;
  thru: string | null;
  status: string;
  [key: string]: number | null | string;
}

interface ParsedAthleteData {
  athlete: Athlete;
  athleteInTournament: AthleteInTournament;
}

interface ParsedTournamentData {
  cut_line: number | null;
}

async function fetchGolfData(id: string) {
  let tournament = await prisma.tournament.findUnique({
    where: { id: parseInt(id) },
  });
  if(!tournament || !tournament.external_id) throw new Error('Invalid tournament ID requested.')
  const externalId = tournament.external_id;
  const url = `${process.env.SCRAPE_URL}/${externalId}`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const parsedAthleteData: ParsedAthleteData[] = [];
  const parsedTournamentData: ParsedTournamentData = {
    cut_line: null
  };
  const columnIndexes: Partial<Record<keyof AthleteInTournament, number>> = {};

  // iterate through column headers to get their indexes
  $('thead.Table__THEAD tr.Table__TR.Table__even th').each((index, element) => {
    const cssClass = $(element).attr('class');

    if (cssClass) {
      const column = cssClass.split(' ')[0];
      switch (column) {
        case 'pos':
          columnIndexes.position = index;
          break;
        case 'toPar':
          columnIndexes.score_under_par = index;
          break;
        case 'today':
          columnIndexes.score_today = index;
          break;
        case 'thru':
          columnIndexes.thru = index;
          break;
        case 'r1':
          columnIndexes.score_round_one = index;
          break;
        case 'r2':
          columnIndexes.score_round_two = index;
          break;
        case 'r3':
          columnIndexes.score_round_three = index;
          break;
        case 'r4':
          columnIndexes.score_round_four = index;
          break;
        case 'tot':
          columnIndexes.score_sum = index;
          break;
        default:
          break;
      }
    }
  });

  $('tr.PlayerRow__Overview').each((index, element) => {
    const fullName = $(element).find('.leaderboard_player_name').text();
    const scores = $(element).find('.Table__TD').map((i, el) => $(el).text()).toArray();
    const athlete: Athlete = {
      full_name: fullName,
    };
  
    const athleteInTournament: AthleteInTournament = {
      position: null,
      score_round_one: null,
      score_round_two: null,
      score_round_three: null,
      score_round_four: null,
      score_sum: null,
      score_under_par: null,
      score_today: null,
      thru: null,
      status: 'Active'
    };

      for (const [key, value] of Object.entries(columnIndexes)) {
        
        if (value !== undefined) {
          let score = scores[value];
          if (score !== '--') {
            if (key === 'position') {
              if (score && score !== '-') {
                if (score.includes('T')) score = score.substring(1);
                athleteInTournament[key] = parseInt(score, 10);
              }
            } else if (key === 'score_under_par') {
              const formattedToPar = parseLeaderboardPosition(score);
              athleteInTournament[key] = formattedToPar;
              athleteInTournament['status'] = formattedToPar === null ? score : 'Active';
            } else if (key === 'score_today') {
              const formattedToPar = parseLeaderboardPosition(score);
              athleteInTournament[key] = formattedToPar;
            } else if (key === 'thru')  {
              athleteInTournament[key] = score;
            } else {
              athleteInTournament[key] = parseInt(score, 10);
            }
          }
        }
      }

    parsedAthleteData.push({ athlete, athleteInTournament });
      console.log(parsedAthleteData)
  });

  const cutLine = $('.cut-score').text();
  parsedTournamentData.cut_line = parseInt(cutLine);

  return { parsedAthleteData, parsedTournamentData };
}


async function updateGolfData(
  { parsedAthleteData, parsedTournamentData }: { 
    parsedAthleteData: ParsedAthleteData[],
    parsedTournamentData: ParsedTournamentData
  }, 
  tournamentId: number
) {
    if(!parsedAthleteData.length) throw new Error('No data available for this tournament!');

    // Split parsedAthleteData into chunks for parallel processing
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < parsedAthleteData.length; i += chunkSize) {
      chunks.push(parsedAthleteData.slice(i, i + chunkSize));
    }

    // Process chunks of data in parallel
    await Promise.all(chunks.map(async (chunk) => {
      const promises = [];
      for (const { athlete, athleteInTournament } of chunk) {
        let existingAthletePromise = prisma.athlete.findUnique({
          where: { full_name: athlete.full_name },
        });

        promises.push(existingAthletePromise);
      }

      const existingAthletes = await Promise.all(promises);

      // Process existingAthletes in parallel
      await Promise.all(existingAthletes.map(async (existingAthlete, index) => {
        const { athlete, athleteInTournament } = chunk[index];

        if (!existingAthlete) {
          existingAthlete = await prisma.athlete.create({
            data: {
              full_name: athlete.full_name,
            },
          });
        }

        await prisma.athletesInTournaments.upsert({
          where: {
            tournament_id_athlete_id: {
              tournament_id: tournamentId,
              athlete_id: existingAthlete.id,
            },
          },
          create: {
            tournament_id: tournamentId,
            athlete_id: existingAthlete.id,
            score_round_one: athleteInTournament.score_round_one,
            score_round_two: athleteInTournament.score_round_two,
            score_round_three: athleteInTournament.score_round_three,
            score_round_four: athleteInTournament.score_round_four,
            score_sum: athleteInTournament.score_sum,
            score_under_par: athleteInTournament.score_under_par,
            score_today: athleteInTournament.score_today,
            position: athleteInTournament.position,
            thru: athleteInTournament.thru,
            status: athleteInTournament.status
          },
          update: {
            score_round_one: athleteInTournament.score_round_one,
            score_round_two: athleteInTournament.score_round_two,
            score_round_three: athleteInTournament.score_round_three,
            score_round_four: athleteInTournament.score_round_four,
            score_under_par: athleteInTournament.score_under_par,
            score_sum: athleteInTournament.score_sum,
            score_today: athleteInTournament.score_today,
            position: athleteInTournament.position,
            thru: athleteInTournament.thru,
            status: athleteInTournament.status
          },
        });
      }));
    }));

    if(parsedTournamentData?.cut_line) {
      await prisma.tournament.update({
        where: {
          id: tournamentId
        },
          data: {
            cut_line: parsedTournamentData.cut_line
          }
      })
    }
  } 

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession({ req });
    if (!session || session.role !== 'ADMIN') {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const id = req.query.id as string;
    if(!id) return res.status(500).json({message: 'No key found!'})

    try {
      const golfData = await fetchGolfData(id);
      await updateGolfData(golfData, parseInt(id));

      res.status(200).json({ message: 'Success updating golf data!' });
    } catch (error:any) {
      console.log('ERROR UPDATING TOURNAMENT SCORES:', error)
      res.status(500).json({ message: error.message });
    }
  }
  
  
  function parseLeaderboardPosition(toPar: string) {
    switch (toPar.toUpperCase()) {
      case 'CUT':
        return null;
      case 'WD':
        return null;
      case 'E':
        return 0;
      default:
        const parsed = parseInt(toPar, 10);
        return isNaN(parsed) ? null : parsed;
    }
  }
