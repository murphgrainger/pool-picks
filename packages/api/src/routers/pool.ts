import { z } from "zod";
import { prisma } from "@pool-picks/db";
import {
  router,
  protectedProcedure,
  commissionerProcedure,
} from "../trpc";

export const poolRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.pool.findMany({
      include: { tournament: true },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return prisma.pool.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          status: true,
          amount_entry: true,
          amount_sum: true,
          tournament_id: true,
          tournament: {
            select: {
              id: true,
              name: true,
              course: true,
              city: true,
              region: true,
              status: true,
              cut_line: true,
              external_id: true,
              updated_at: true,
            },
          },
          pool_invites: {
            where: { status: "Invited" },
            select: {
              id: true,
              status: true,
              email: true,
              nickname: true,
            },
          },
          pool_members: {
            select: {
              id: true,
              user_id: true,
              username: true,
              role: true,
              user: {
                select: {
                  email: true,
                  nickname: true,
                },
              },
              athletes: {
                select: {
                  athlete: {
                    select: {
                      id: true,
                      full_name: true,
                      tournaments: {
                        select: {
                          status: true,
                          position: true,
                          thru: true,
                          score_today: true,
                          score_round_one: true,
                          score_round_two: true,
                          score_round_three: true,
                          score_round_four: true,
                          score_sum: true,
                          score_under_par: true,
                          tournament_id: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }),

  getScores: protectedProcedure
    .input(z.object({ pool_id: z.number() }))
    .query(async ({ input }) => {
      return prisma.poolMember.findMany({
        where: { pool_id: input.pool_id },
        include: {
          user: true,
          athletes: {
            include: {
              athlete: {
                include: {
                  tournaments: true,
                },
              },
            },
          },
        },
      });
    }),

  getMembers: protectedProcedure
    .input(z.object({ pool_id: z.number() }))
    .query(async ({ input }) => {
      return prisma.poolMember.findMany({
        where: { pool_id: input.pool_id },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        amount_entry: z.number().int().min(0),
        tournament_id: z.number().int(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const pool = await prisma.pool.create({
        data: {
          name: input.name,
          amount_entry: input.amount_entry,
          tournament: { connect: { id: input.tournament_id } },
        },
      });

      // Creator automatically becomes commissioner
      await prisma.poolMember.create({
        data: {
          pool: { connect: { id: pool.id } },
          user: { connect: { id: ctx.user.id } },
          role: "COMMISSIONER",
        },
      });

      return pool;
    }),

  updateStatus: commissionerProcedure
    .input(
      z.object({
        pool_id: z.number(),
        status: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.pool.update({
        where: { id: input.pool_id },
        data: { status: input.status },
      });
    }),
});
