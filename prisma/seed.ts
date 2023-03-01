import { Athlete, PrismaClient } from '@prisma/client';
import { tournaments } from '../data/tournaments';
import { tournamentAthletes } from '../data/tournamentAthletes';
import { pools } from '../data/pools';


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
 
  await importAthletesForTournament(8, tournamentAthletes);

  await prisma.pool.createMany({ data: pools })
  
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

  interface AthleteSeed {
    full_name: string;
    first_name: string;
    last_name: string;
  };

  async function importAthletesForTournament(tournamentId: number, tournamentAthletes: AthleteSeed[]): Promise<void> {
  
    const athleteRecords: Athlete[] = await Promise.all(
      tournamentAthletes.map(async (athleteData: AthleteSeed): Promise<Athlete> => {
        let athlete: Athlete | null = await prisma.athlete.findUnique({ where: { full_name: athleteData.full_name } })
  
        if (!athlete) {
          athlete = await prisma.athlete.create({ data: { ...athleteData } })
        }
  
        return athlete
      })
    )
  
    await prisma.athletesInTournaments.createMany({
      data: athleteRecords.map((athlete: Athlete): { athlete_id: number; tournament_id: number } => ({
        athlete_id: athlete.id,
        tournament_id: tournamentId,
      })),
    })
  }
