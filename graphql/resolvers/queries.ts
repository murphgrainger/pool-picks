import prisma from '../../lib/prisma';

export const Query = {
      tournaments: () => prisma.tournament.findMany(),
      pools: () => prisma.pool.findMany(),
      athletes: () => prisma.athlete.findMany(),
      poolInvites: () => prisma.poolInvite.findMany(),
      poolMembers: () => prisma.poolMember.findMany(),
      picks: () => prisma.poolMembersAthletes.findMany(),
      tournament: (_: any, args: { id: string }) => prisma.tournament.findUnique({
          where: {
              id: parseInt(args.id)
          }
      }),
      tournamentsAndPools: async () => {
        console.log('this is running????')
        const tournaments = await prisma.tournament.findMany({ include: { pools: true } })
        console.log('tourneys', tournaments)
        return tournaments
      },
      pendingPoolInvites: () => prisma.poolInvite.findMany({
          where: {
              status: "Invited"
          }
      }),
      athletesByTournamentId: async (_: any, args: any, context: any) => {
        try {
          const { tournament_id } = args;
          const athletesInTournaments = await prisma.athletesInTournaments.findMany({
            where: { tournament_id },
            include: {
              athlete: true,
            },
          });
                
          // Extract athletes from athletesInTournaments
          const athletes = athletesInTournaments.map((ait: any) => ait.athlete);
          athletes.sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));

          return athletes;
        } catch (error) {
          console.log(error);
        }
      }
}