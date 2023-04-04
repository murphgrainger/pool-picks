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

  const athletePromises: Promise<Athlete>[] = [];

  $('tr.PlayerRow__Overview').each((index, element) => {
    const fullName = $(element).find('.leaderboard_player_name').text();

    const athletePromise = new Promise<Athlete>((resolve, reject) => {
      setImmediate(async () => {
        try {
          const athlete: Athlete = {
            full_name: fullName,
          };
          resolve(athlete);
        } catch (err) {
          reject(err);
        }
      });
    });

    athletePromises.push(athletePromise);
  });

  return Promise.all(athletePromises);
}


async function updateAthleteField(parsedAthletes: Athlete[], tournamentId: number) {
  if (!parsedAthletes.length) {
    throw new Error('No athlete data available for this tournament!');
  }

  // Split parsedAthletes into chunks for parallel processing
  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < parsedAthletes.length; i += chunkSize) {
    chunks.push(parsedAthletes.slice(i, i + chunkSize));
  }

  // Process chunks of data in parallel
  await Promise.all(
    chunks.map(async (chunk) => {
      const promises = [];
      for (const athlete of chunk) {
        let existingAthletePromise = prisma.athlete.findUnique({
          where: { full_name: athlete.full_name },
        });

        promises.push(existingAthletePromise);
      }

      const existingAthletes = await Promise.all(promises);

      for (let i = 0; i < existingAthletes.length; i++) {
        let existingAthlete = existingAthletes[i];

        if (!existingAthlete) {
          existingAthlete = await prisma.athlete.create({
            data: {
              full_name: chunk[i].full_name,
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
          update: {},
        });
      }
    })
  );
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
