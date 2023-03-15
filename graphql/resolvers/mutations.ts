import prisma from '../../lib/prisma';

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
}