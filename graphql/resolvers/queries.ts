import prisma from '../../lib/prisma';

export const Query = {
      tournaments: () => prisma.tournament.findMany(),
      athletes: () => prisma.athlete.findMany(),
      pools: () => prisma.pool.findMany(),
      poolInvites: () => prisma.poolInvite.findMany(),
      poolMembers: () => prisma.poolMember.findMany(),
      picks: () => prisma.poolMembersAthletes.findMany(),
      tournament: (_: any, args: { id: string }) => prisma.tournament.findUnique({
          where: {
              id: parseInt(args.id)
          }
      }),
      pendingPoolInvites: () => prisma.poolInvite.findMany({
          where: {
              status: "Invited"
          }
      })
}