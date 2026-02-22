import { PrismaClient } from "@prisma/client";
import { tournaments } from "../data/tournaments";
import { pools } from "../data/pools";
import { poolInvites } from "../data/poolInvites";

const prisma = new PrismaClient();

async function main() {
  const formattedTournaments = tournaments.map((tournament) => ({
    ...tournament,
    start_date: new Date(tournament.start_date),
    end_date: new Date(tournament.end_date),
  }));

  await prisma.tournament.createMany({
    data: formattedTournaments,
  });

  await prisma.pool.createMany({ data: pools });

  await prisma.poolInvite.createMany({ data: poolInvites });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
