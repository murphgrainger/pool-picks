import { PrismaClient } from '@prisma/client';
import { athletes } from '../data/athletes';
import { tournaments } from '../data/tournaments';


const prisma = new PrismaClient();

async function main() {

  const formattedTournaments = tournaments.map((tournament) => ({
    ...tournament,
    start_date: new Date(tournament.start_date),
    end_date: new Date(tournament.end_date),
  }));

  await prisma.tournament.createMany({
    data: formattedTournaments
  })
  await prisma.athlete.createMany({
    data: athletes,
  });
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
