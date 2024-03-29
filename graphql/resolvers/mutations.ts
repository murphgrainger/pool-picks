import prisma from '../../lib/prisma';
import { ApolloError } from 'apollo-server-micro';

export const Mutation = {
  createPool: async (_: any, args: any, context: any) => {
    try {
      const pool = await prisma.pool.create({
        data: {
          name: args.name,
          amount_entry: args.amount_entry,
          tournament: {
            connect: { id: args.tournament_id },
          },
        },
      });
      return pool;
    } catch (error : any) {
      throw new Error(`Could not create pool: ${error.message}`);
    }
  },
  createPicks: async (_: any, args: any, context: any) => {
    try {
      const { poolMemberId, athleteIds } = args;
      const picks = await Promise.all(
        athleteIds.map(async (athleteId: string) => {
          const pick = await prisma.poolMembersAthletes.create({
            data: {
              poolMember: {
                connect: { id: parseInt(poolMemberId) },
              },
              athlete: {
                connect: { id: parseInt(athleteId) },
              },
            },
          });
          return pick;
        })
      );
      return null;
    } catch (error: any) {     
      throw new ApolloError(`Could not create picks: ${error.message}`);
    }
  },
  updateInviteStatus: async(_: any, args: any, context: any) => {
    try {
      await prisma.poolInvite.update({
        where: { id: parseInt(args.id) },
        data: { status: args.status }
      });

      await prisma.user.update({
        where: { email: args.email },
        data: { nickname: args.nickname }
      })
  
      if (args.status === "Accepted") {
        const response = await prisma.poolMember.create({
          data: {
            pool: { connect: { id: parseInt(args.pool_id) } },
            user: { connect: { email: args.email } }
          }
        });
        return response.id;
      }
  
    } catch (error: any) {
      throw new Error(`Could not update username: ${error.message}`);
    }
  },
  updatePoolMemberUsername: async(_: any, args: any, context: any) => {
    try {
      await prisma.poolMember.update({
        where: { id: parseInt(args.id) },
        data: { username: args.username }
      });
  } catch (error:any) {
    throw new ApolloError(`Could not update username: ${error.message}`);

  }
  },
  updateTournament: async(_: any, args: any, context: any) => {
    try {
      await prisma.tournament.update({
        where: { id: parseInt(args.id) },
        data: { status: args.status }
      });
  } catch (error:any) {
    throw new ApolloError(`Could not update tournament: ${error.message}`);
    }
  },
  updatePool: async(_: any, args: any, context: any) => {
    try {
      await prisma.pool.update({
        where: { id: parseInt(args.id) },
        data: { status: args.status }
      });
  } catch (error:any) {
    throw new ApolloError(`Could not update pool: ${error.message}`);
    }
  },
  
}