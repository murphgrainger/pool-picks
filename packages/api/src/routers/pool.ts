import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@pool-picks/db";
import {
  router,
  publicProcedure,
  protectedProcedure,
  commissionerProcedure,
} from "../trpc";
import {
  sendPoolOpenEmail,
  sendPoolAutoCompleteEmail,
  sendPoolLockedEmail,
} from "../lib/email";
import { generateUniqueInviteCode } from "../lib/inviteCode";

const STALE_POOL_DAYS = 7;

/**
 * Auto-completes Locked pools whose tournament ended 7+ days ago.
 * Updates the DB status to "Complete" and emails the commissioner.
 * Runs as a side-effect on key read paths.
 */
export async function autoCompleteStaleLockedPools() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_POOL_DAYS);

  const stalePools = await prisma.pool.findMany({
    where: {
      status: { in: ["Locked", "Active"] },
      tournament: {
        status: "Completed",
        end_date: { lt: cutoff },
      },
    },
    select: {
      id: true,
      name: true,
      tournament: { select: { name: true } },
      pool_members: {
        where: { role: "COMMISSIONER" },
        select: { user: { select: { email: true } } },
      },
    },
  });

  if (stalePools.length === 0) return;

  // Update all stale pools to Complete
  await prisma.pool.updateMany({
    where: { id: { in: stalePools.map((p) => p.id) } },
    data: { status: "Complete" },
  });

  // Email each commissioner (non-blocking)
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  Promise.allSettled(
    stalePools.flatMap((pool) =>
      pool.pool_members.map((m) =>
        sendPoolAutoCompleteEmail({
          to: m.user.email,
          poolName: pool.name,
          tournamentName: pool.tournament.name,
          appBaseUrl,
          poolId: pool.id,
        })
      )
    )
  ).then((results) => {
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(`Failed to send ${failed.length} auto-complete emails`);
    }
  });
}

export const poolRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.pool.findMany({
      include: { tournament: true },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      await autoCompleteStaleLockedPools();
      return prisma.pool.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          status: true,
          invite_code: true,
          join_mode: true,
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
              start_date: true,
              end_date: true,
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
                      ranking: true,
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
        join_mode: z.enum(["OPEN", "INVITE_ONLY"]).default("INVITE_ONLY"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invite_code = await generateUniqueInviteCode();

      const pool = await prisma.pool.create({
        data: {
          name: input.name,
          amount_entry: input.amount_entry,
          join_mode: input.join_mode,
          invite_code,
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
        status: z.enum(["Setup", "Open", "Locked", "Complete"]),
        notify: z.boolean().optional().default(true),
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
              "Cannot open this pool — no field has been added to the tournament yet. Check back soon.",
          });
        }

        // Update status
        const updated = await prisma.pool.update({
          where: { id: input.pool_id },
          data: { status: input.status },
        });

        // Send email notifications to all pool members (if requested)
        if (input.notify) {
          const members = await prisma.poolMember.findMany({
            where: { pool_id: input.pool_id },
            select: { user: { select: { email: true } } },
          });

          const appBaseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
        }

        return updated;
      }

      // When moving to Locked, optionally notify all pool members
      if (input.status === "Locked") {
        const pool = await prisma.pool.findUnique({
          where: { id: input.pool_id },
          select: { name: true },
        });

        const updated = await prisma.pool.update({
          where: { id: input.pool_id },
          data: { status: input.status },
        });

        if (input.notify && pool) {
          const members = await prisma.poolMember.findMany({
            where: { pool_id: input.pool_id },
            select: { user: { select: { email: true } } },
          });

          const appBaseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

          Promise.allSettled(
            members.map((m) =>
              sendPoolLockedEmail({
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
                `Failed to send ${failed.length} pool-locked emails for pool ${input.pool_id}`
              );
            }
          });
        }

        return updated;
      }

      return prisma.pool.update({
        where: { id: input.pool_id },
        data: { status: input.status },
      });
    }),

  getByInviteCode: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const pool = await prisma.pool.findUnique({
        where: { invite_code: input.code.toUpperCase() },
        select: {
          id: true,
          name: true,
          status: true,
          join_mode: true,
          amount_entry: true,
          tournament: {
            select: {
              name: true,
              course: true,
              start_date: true,
              end_date: true,
            },
          },
          _count: { select: { pool_members: true } },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite code",
        });
      }

      return pool;
    }),

  joinByCode: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        username: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const pool = await prisma.pool.findUnique({
        where: { invite_code: input.code.toUpperCase() },
        select: { id: true, status: true, join_mode: true },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite code",
        });
      }

      if (pool.join_mode !== "OPEN") {
        // Allow users with a pending invite to join even if invite-only
        const pendingInvite = await prisma.poolInvite.findFirst({
          where: {
            pool_id: pool.id,
            email: { equals: ctx.user.email, mode: "insensitive" },
            status: "Invited",
          },
        });
        if (!pendingInvite) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This pool is invite-only. Ask the commissioner to invite you.",
          });
        }
      }

      if (pool.status !== "Setup" && pool.status !== "Open") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This pool is no longer accepting new members.",
        });
      }

      // Check if already a member
      const existingMember = await prisma.poolMember.findFirst({
        where: { pool_id: pool.id, user_id: ctx.user.id },
      });
      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You're already a member of this pool.",
        });
      }

      // Check if username is taken in this pool
      const usernameTaken = await prisma.poolMember.findFirst({
        where: { pool_id: pool.id, username: input.username },
      });
      if (usernameTaken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That username is already taken in this pool.",
        });
      }

      // Create the member
      const member = await prisma.poolMember.create({
        data: {
          pool: { connect: { id: pool.id } },
          user: { connect: { id: ctx.user.id } },
          role: "MEMBER",
          username: input.username,
        },
      });

      // Auto-accept any pending invite for this user's email
      await prisma.poolInvite.updateMany({
        where: {
          pool_id: pool.id,
          email: ctx.user.email,
          status: "Invited",
        },
        data: { status: "Accepted" },
      });

      return { poolId: pool.id, memberId: member.id };
    }),

  updateJoinMode: commissionerProcedure
    .input(
      z.object({
        pool_id: z.number(),
        join_mode: z.enum(["OPEN", "INVITE_ONLY"]),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.pool.update({
        where: { id: input.pool_id },
        data: { join_mode: input.join_mode },
      });
    }),
});
