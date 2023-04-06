import prisma from '../../lib/prisma';
import { ApolloError } from 'apollo-server-micro';

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
        const tournaments = await prisma.tournament.findMany({ include: { pools: true } })
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
                
          const athletes = athletesInTournaments.map((ait: any) => ait.athlete);
          athletes.sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));

          return athletes;
        } catch (error) {
          console.log(error);
        }
      },
      getPoolScores: async (_: any, args: any, context: any) => {
        try {
          const poolMembers = await prisma.poolMember.findMany({
            where: {
              pool_id: parseInt(args.pool_id),
            },
            include: {
              user: true,
              athletes: {
                include: {
                  athlete: {
                    include: {
                      tournaments: true
                    }
                  }
                }
              }
            }
          });
      
          return poolMembers;
        } catch (error) {
          throw new ApolloError(`Could not get scores: ${args.pool_id}`);
        }
      },    
      getPoolMembers: async (_: any, args: any, context: any) => {
        try {
          const poolMembers = await prisma.poolMember.findMany({
            where: {
              pool_id: 1,
            },
          })

          return poolMembers
        } catch(error) {
          throw new ApolloError(`Could not get members: ${error}`);
        }
      }  
}