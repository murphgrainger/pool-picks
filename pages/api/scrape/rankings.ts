import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import prisma from '../../../lib/prisma';

import axios from 'axios';
import cheerio from 'cheerio';

const adminKey = process.env.ADMIN_KEY;

interface Athlete {
  full_name: string;
  ranking: number;
}

const parsedAthletes: Athlete[] = [];

async function fetchAthleteRankings(url: string) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const athletePromises: Promise<Athlete>[] = [];

  const table = $('.Table.Table--align-right.Table--fixed.Table--fixed-left tbody tr');

  table.each((index, element) => {
    const ranking = parseInt($(element).find('.rank_column span').text());
    const fullName = $(element).find('.flex .AnchorLink').text();

    const athletePromise = new Promise<Athlete>((resolve, reject) => {
      setImmediate(async () => {
        try {
          const athlete: Athlete = {
            full_name: fullName,
            ranking: ranking,
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


async function updateAthleteRankings(parsedAthletes: Athlete[]) {
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

        if (existingAthlete) {
          await prisma.athlete.update({
            where: { full_name: existingAthlete.full_name },
            data: {
              ranking: chunk[i].ranking,
            },
          });
        }
      }
    })
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)
  if (!session || session.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized request' });
  }

  try {
    const url = `${process.env.RANKINGS_SCRAPE_URL}`
    const rankings = await fetchAthleteRankings(url);
    await updateAthleteRankings(rankings);

    res.status(200).json({ message: 'Success updating athlete rankings!' });
  } catch (error:any) {
    console.log('ERROR UPDATING ATHLETE RANKINGS:', error);
    res.status(500).json({ message: error.message });
  }
}
