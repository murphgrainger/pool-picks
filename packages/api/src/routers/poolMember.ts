import { z } from "zod";
import { prisma } from "@pool-picks/db";
import {
  sumMemberPicks,
  resolveTournamentStatus,
  getEffectivePoolPhase,
  MAX_A_GROUP_PICKS,
} from "@pool-picks/utils";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { autoAdvanceScheduledTournaments } from "./tournament";
import { autoCompleteStaleLockedPools } from "./pool";

export const poolMemberRouter = router({
  getPicks: protectedProcedure
    .input(z.object({ pool_member_id: z.number() }))
    .query(async ({ input }) => {
      return prisma.poolMembersAthletes.findMany({
        where: { poolMember_id: input.pool_member_id },
        include: {
          athlete: true,
          poolMember: true,
        },
      });
    }),

  submitPicks: protectedProcedure
    .input(
      z.object({
        poolMemberId: z.number(),
        athleteIds: z.array(z.number()).length(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const poolMember = await prisma.poolMember.findUnique({
        where: { id: input.poolMemberId },
        include: { pool: true },
      });

      if (!poolMember || poolMember.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only submit picks for yourself.",
        });
      }

      // Verify pool is open
      if (poolMember.pool.status !== "Open") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Picks can only be submitted when the pool is open.",
        });
      }

      // Check for duplicate athlete IDs
      const uniqueIds = new Set(input.athleteIds);
      if (uniqueIds.size !== input.athleteIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicate picks are not allowed.",
        });
      }

      // Verify A Group limit
      const athletes = await prisma.athlete.findMany({
        where: { id: { in: input.athleteIds } },
        select: { id: true, ranking: true },
      });

      const aGroupCount = athletes.filter(
        (a) => a.ranking !== null && a.ranking <= 20
      ).length;

      if (aGroupCount > MAX_A_GROUP_PICKS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can only pick ${MAX_A_GROUP_PICKS} players from the A Group.`,
        });
      }

      // Check no other pool member has the exact same 6 picks
      const otherMembers = await prisma.poolMember.findMany({
        where: {
          pool_id: poolMember.pool_id,
          id: { not: input.poolMemberId },
          athletes: { some: {} },
        },
        select: {
          athletes: { select: { athlete_id: true } },
        },
      });

      const submittedSet = [...input.athleteIds].sort().join(",");
      const hasDuplicate = otherMembers.some((member) => {
        const memberSet = member.athletes.map((a) => a.athlete_id).sort().join(",");
        return memberSet === submittedSet;
      });

      if (hasDuplicate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Another pool member already picked the exact same 6 players. Swap at least one player out.",
        });
      }

      const picks = await Promise.all(
        input.athleteIds.map((athleteId) =>
          prisma.poolMembersAthletes.create({
            data: {
              poolMember: { connect: { id: input.poolMemberId } },
              athlete: { connect: { id: athleteId } },
            },
          })
        )
      );
      return picks;
    }),

  updateUsername: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        username: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.poolMember.update({
        where: { id: input.id },
        data: { username: input.username },
      });
    }),

  listByUser: protectedProcedure.query(async ({ ctx }) => {
    await autoAdvanceScheduledTournaments();
    await autoCompleteStaleLockedPools();
    const memberships = await prisma.poolMember.findMany({
      where: { user_id: ctx.user.id },
      select: {
        id: true,
        role: true,
        pool: {
          select: {
            id: true,
            name: true,
            status: true,
            amount_entry: true,
            tournament_id: true,
            tournament: {
              select: {
                name: true,
                start_date: true,
                end_date: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: { email: true },
        },
      },
    });

    // For live/completed pools, compute rank and score server-side
    const activePoolIds = memberships
      .filter((m) => {
        const tournamentStatus = resolveTournamentStatus(m.pool.tournament);
        const phase = getEffectivePoolPhase(m.pool.status, tournamentStatus);
        return phase === "live" || phase === "completed";
      })
      .map((m) => m.pool.id);

    const rankMap: Record<
      number,
      { rank: number | null; score: number | null; isTied: boolean }
    > = {};

    if (activePoolIds.length > 0) {
      const activePools = await prisma.pool.findMany({
        where: { id: { in: activePoolIds } },
        select: {
          id: true,
          tournament_id: true,
          pool_members: {
            select: {
              id: true,
              athletes: {
                select: {
                  athlete: {
                    select: {
                      tournaments: {
                        select: {
                          status: true,
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

      for (const pool of activePools) {
        const memberScores = pool.pool_members.map((member) => {
          const picks = member.athletes.map((a) => {
            const t = a.athlete.tournaments.find(
              (t) => t.tournament_id === pool.tournament_id
            );
            return {
              status: t?.status ?? "",
              score_under_par: t?.score_under_par ?? null,
            };
          });
          return { id: member.id, score: sumMemberPicks(picks) };
        });

        const sorted = memberScores
          .filter((m): m is { id: number; score: number } => m.score !== null)
          .sort((a, b) => a.score - b.score);

        let rank = 1;
        for (let i = 0; i < sorted.length; i++) {
          if (i > 0 && sorted[i].score !== sorted[i - 1].score) {
            rank = i + 1;
          }
          const isTied =
            (i > 0 && sorted[i].score === sorted[i - 1].score) ||
            (i < sorted.length - 1 &&
              sorted[i].score === sorted[i + 1].score);
          rankMap[sorted[i].id] = {
            rank,
            score: sorted[i].score,
            isTied,
          };
        }
      }
    }

    return memberships.map((m) => ({
      ...m,
      ...(rankMap[m.id] ?? { rank: null, score: null, isTied: false }),
    }));
  }),
});
