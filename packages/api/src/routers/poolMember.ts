import { z } from "zod";
import { prisma } from "@pool-picks/db";
import { sumMemberPicks } from "@pool-picks/utils";
import { router, protectedProcedure } from "../trpc";

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
    .mutation(async ({ input }) => {
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
              select: { name: true, start_date: true, end_date: true },
            },
          },
        },
        user: {
          select: { email: true },
        },
      },
    });

    // For active pools, compute rank and score server-side
    const activePoolIds = memberships
      .filter((m) => m.pool.status === "Active")
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
