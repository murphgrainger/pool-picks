import { z } from "zod";
import { prisma } from "@pool-picks/db";
import { router, protectedProcedure, systemAdminProcedure } from "../trpc";

export const tournamentRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.tournament.findMany();
  }),

  listWithPools: protectedProcedure.query(async () => {
    return prisma.tournament.findMany({
      include: {
        pools: {
          select: {
            id: true,
            name: true,
            status: true,
            created_at: true,
            pool_members: { select: { id: true, user_id: true, role: true } },
            pool_invites: {
              where: { status: "Invited" },
              select: { id: true },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return prisma.tournament.findUnique({
        where: { id: input.id },
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
      });
    }),

  listSelectable: protectedProcedure.query(async () => {
    return prisma.tournament.findMany({
      where: { end_date: { gte: new Date() } },
      orderBy: { start_date: "asc" },
      select: {
        id: true,
        name: true,
        course: true,
        city: true,
        region: true,
        start_date: true,
        end_date: true,
        status: true,
      },
    });
  }),

  getHealth: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const athleteCount = await prisma.athletesInTournaments.count({
        where: { tournament_id: input.id },
      });
      const scoredCount = await prisma.athletesInTournaments.count({
        where: {
          tournament_id: input.id,
          score_round_one: { not: null },
        },
      });
      return { athleteCount, scoredCount };
    }),

  updateStatus: systemAdminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.tournament.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),
});
