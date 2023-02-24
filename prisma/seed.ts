import { PrismaClient } from '@prisma/client';
import { athletes } from '../data/athletes';

const prisma = new PrismaClient();

async function main() {
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
