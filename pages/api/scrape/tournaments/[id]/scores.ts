import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../lib/prisma';

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
  status: string;
  [key: string]: number | null | string;
}

interface ParsedAthleteData {
  athlete: Athlete;
  athleteInTournament: AthleteInTournament;
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
    const scores = $(element).find('.Table__TD').not('.tc').map((i, el) => $(el).text()).toArray();
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
      status: 'ACTIVE'
    };

    for (const column in columnIndexes) {
      if (column in athleteInTournament && columnIndexes[column] !== undefined) {
        const scoreIndex = columnIndexes[column]!;
        let score = scores[scoreIndex];

        if (column === 'position') {
          if (score && score !== '-') {
            if(score.includes('T')) score = score.substring(1);
            athleteInTournament[column] = parseInt(score, 10);
          }
        } else if (column === 'score_under_par') {
          const formattedToPar = parseLeaderboardPosition(score);
          athleteInTournament[column] = formattedToPar;
          athleteInTournament['status'] = !formattedToPar ? score : 'Active';
        } else if (score !== '--') {
          athleteInTournament[column] = parseInt(score, 10);
        }
      }
    }
    parsedAthleteData.push({ athlete, athleteInTournament });
  });

  return parsedAthleteData;
}


async function updateGolfData(parsedAthleteData: ParsedAthleteData[], tournamentId: number) {

    if(!parsedAthleteData.length) throw new Error('No data available for this tournament!');

    for (const { athlete, athleteInTournament } of parsedAthleteData) {
      let existingAthlete = await prisma.athlete.findUnique({
        where: { full_name: athlete.full_name },
      });
  
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
          position: athleteInTournament.position,
          status: athleteInTournament.status
        },
        update: {
          score_round_one: athleteInTournament.score_round_one,
          score_round_two: athleteInTournament.score_round_two,
          score_round_three: athleteInTournament.score_round_three,
          score_round_four: athleteInTournament.score_round_four,
          score_under_par: athleteInTournament.score_under_par,
          score_sum: athleteInTournament.score_sum,
          position: athleteInTournament.position,
          status: athleteInTournament.status
        },
      });
    }
  } 

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string;
    if(!id) return res.status(500).json({message: 'No key found!'})

    if (!adminKey || req.headers.authorization !== `Bearer ${adminKey}`) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

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
