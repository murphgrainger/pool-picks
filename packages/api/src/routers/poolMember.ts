import { z } from "zod";
import { prisma } from "@pool-picks/db";
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
    return prisma.poolMember.findMany({
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
          },
        },
        user: {
          select: { email: true },
        },
      },
    });
  }),
});
