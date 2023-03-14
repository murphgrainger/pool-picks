import prisma from '../lib/prisma';
import { DateTimeResolver } from "graphql-scalars";


export const resolvers = {
    DateTime: DateTimeResolver,
    Query: {
        tournaments: () => prisma.tournament.findMany(),
        athletes: () => prisma.athlete.findMany(),
        pools: () => prisma.pool.findMany(),
        poolInvites: () => prisma.poolInvite.findMany({include: {
            pool: true
        }}),
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
    },
    PoolInvite: {
        pool: (parent: any) =>
          prisma.poolInvite
            .findUnique({
              where: { id: parent.id },
            })
            .pool(),
      },
}