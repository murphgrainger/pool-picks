import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@pool-picks/db";
import {
  router,
  protectedProcedure,
  commissionerProcedure,
} from "../trpc";
import { sendPoolOpenEmail } from "../lib/email";

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
        amount_entry: z.number().min(0),
        tournament_id: z.number().int(),
        username: z.string().min(1),
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
          username: input.username,
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
      // When moving to Open, verify the tournament has athletes
      if (input.status === "Open") {
        const pool = await prisma.pool.findUnique({
          where: { id: input.pool_id },
          select: { tournament_id: true, name: true },
        });

        if (!pool) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pool not found",
          });
        }

        const athleteCount = await prisma.athletesInTournaments.count({
          where: { tournament_id: pool.tournament_id },
        });

        if (athleteCount === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Cannot open this pool — no athletes are associated with the tournament. Scrape the field first.",
          });
        }

        // Update status
        const updated = await prisma.pool.update({
          where: { id: input.pool_id },
          data: { status: input.status },
        });

        // Send email notifications to all pool members
        const members = await prisma.poolMember.findMany({
          where: { pool_id: input.pool_id },
          select: { user: { select: { email: true } } },
        });

        const appBaseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Fire off emails in parallel (non-blocking for the mutation response)
        Promise.allSettled(
          members.map((m) =>
            sendPoolOpenEmail({
              to: m.user.email,
              poolName: pool.name,
              appBaseUrl,
              poolId: input.pool_id,
            })
          )
        ).then((results) => {
          const failed = results.filter((r) => r.status === "rejected");
          if (failed.length > 0) {
            console.error(
              `Failed to send ${failed.length} pool-open emails for pool ${input.pool_id}`
            );
          }
        });

        return updated;
      }

      return prisma.pool.update({
        where: { id: input.pool_id },
        data: { status: input.status },
      });
    }),
});
