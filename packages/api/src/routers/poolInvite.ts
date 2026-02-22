import { z } from "zod";
import { prisma } from "@pool-picks/db";
import {
  router,
  protectedProcedure,
  commissionerProcedure,
} from "../trpc";

export const poolInviteRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.poolInvite.findMany();
  }),

  listPending: protectedProcedure.query(async ({ ctx }) => {
    return prisma.poolInvite.findMany({
      where: {
        email: ctx.user.email,
        status: "Invited",
        pool: { status: "Open" },
      },
      select: {
        id: true,
        nickname: true,
        pool: {
          select: {
            id: true,
            name: true,
            status: true,
            amount_entry: true,
          },
        },
      },
    });
  }),

  create: commissionerProcedure
    .input(
      z.object({
        pool_id: z.number(),
        email: z.string().email(),
        nickname: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.poolInvite.create({
        data: {
          email: input.email,
          nickname: input.nickname,
          pool: { connect: { id: input.pool_id } },
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.string(),
        pool_id: z.number(),
        nickname: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await prisma.poolInvite.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await prisma.user.update({
        where: { email: input.email },
        data: { nickname: input.nickname },
      });

      if (input.status === "Accepted") {
        const member = await prisma.poolMember.create({
          data: {
            pool: { connect: { id: input.pool_id } },
            user: { connect: { id: ctx.user.id } },
            role: "MEMBER",
          },
        });
        return member;
      }

      return null;
    }),
});
