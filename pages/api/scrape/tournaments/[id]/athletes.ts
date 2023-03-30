import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../lib/prisma';

import axios from 'axios';
import cheerio from 'cheerio';

const adminKey = process.env.ADMIN_KEY;

interface Athlete {
  full_name: string;
}

const parsedAthletes: Athlete[] = [];

async function fetchAthleteField(id: string) {
  let tournament = await prisma.tournament.findUnique({
    where: { id: parseInt(id) },
  });
  if(!tournament || !tournament.external_id) throw new Error('Invalid tournament ID requested.')
  const externalId = tournament.external_id;
  const url = `${process.env.SCRAPE_URL}/${externalId}`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  $('tr.PlayerRow__Overview').each((index, element) => {
    const fullName = $(element).find('.leaderboard_player_name').text();

    const athlete: Athlete = {
      full_name: fullName,
    };

    parsedAthletes.push(athlete);
  });
  console.log(parsedAthletes)
  return parsedAthletes;
}


async function updateAthleteField(parsedAthletes: Athlete[], tournamentId: number) {

    if(!parsedAthletes.length) throw new Error('No athlete data available for this tournament!');

    for (const athlete of parsedAthletes) {
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
        },
        update: {
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
      const field = await fetchAthleteField(id);
      await updateAthleteField(field, parseInt(id));

      res.status(200).json({ message: 'Success updating athlete field!' });
    } catch (error:any) {
      console.log('ERROR UPDATING TOURNAMENT FIELD:', error)
      res.status(500).json({ message: error.message });
    }
  }
