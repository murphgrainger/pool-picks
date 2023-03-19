import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

import axios from 'axios';
import cheerio from 'cheerio';

interface Athlete {
    full_name: string;
  }
  
  interface AthleteInTournament {
    score_round_one: number | null;
    score_round_two: number | null;
    score_round_three: number | null;
    score_round_four: number | null;
    score_sum: number | null;
  }

interface ParsedAthleteData {
    athlete: Athlete;
    athleteInTournament: AthleteInTournament;
}

async function fetchGolfData() {
  const url = 'https://www.espn.com/golf/leaderboard/_/tournamentId/401465527';
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const parsedAthleteData: ParsedAthleteData[] = [];
  
    $('tr.PlayerRow__Overview').each((index, element) => {
        const fullName = $(element).find('.leaderboard_player_name').text();
        const scores = $(element).find('.Table__TD').not('.tl, .tc').map((i, el) => $(el).text()).toArray();
        const [,,,,scoreRoundOne, scoreRoundTwo, scoreRoundThree, scoreRoundFour, scoreSum] = scores;

        const athlete: Athlete = {
        full_name: fullName,
        };

        const athleteInTournament: AthleteInTournament = {
            score_round_one: scoreRoundOne === '--' ? null : parseInt(scoreRoundOne, 10),
            score_round_two: scoreRoundTwo === '--' ? null : parseInt(scoreRoundTwo, 10),
            score_round_three: scoreRoundThree === '--' ? null : parseInt(scoreRoundThree, 10),
            score_round_four: scoreRoundFour === '--' ? null : parseInt(scoreRoundFour, 10),
            score_sum: scoreSum === '--' ? null : parseInt(scoreSum, 10),
          };
          

        parsedAthleteData.push({ athlete, athleteInTournament });
    });

    return parsedAthleteData;
}

async function updateGolfData(parsedAthleteData: ParsedAthleteData[], tournamentId: number) {
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
        },
        update: {
          score_round_one: athleteInTournament.score_round_one,
          score_round_two: athleteInTournament.score_round_two,
          score_round_three: athleteInTournament.score_round_three,
          score_round_four: athleteInTournament.score_round_four,
          score_sum: athleteInTournament.score_sum,
        },
      });
    }
  } 

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const golfData = await fetchGolfData();
      await updateGolfData(golfData, 4); // Replace tournament ID dynamically
      res.status(200).json({ message: 'Success updating golf data!' });
    } catch (error) {
        console.log('yikes!', error)
      res.status(500).json({ message: 'An error occurred while fetching and updating data.' });
    }
  }
  
