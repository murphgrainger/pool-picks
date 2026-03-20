import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@pool-picks/db";
import {
  router,
  protectedProcedure,
  commissionerProcedure,
} from "../trpc";
import { sendPoolInviteEmail } from "../lib/email";

export const poolInviteRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.poolInvite.findMany();
  }),

  listPending: protectedProcedure.query(async ({ ctx }) => {
    return prisma.poolInvite.findMany({
      where: {
        email: ctx.user.email,
        status: "Invited",
        pool: { status: { in: ["Open", "Setup"] } },
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
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.poolInvite.findFirst({
        where: {
          pool_id: input.pool_id,
          email: input.email,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already invited",
        });
      }

      const invite = await prisma.poolInvite.create({
        data: {
          email: input.email,
          nickname: input.nickname,
          pool: { connect: { id: input.pool_id } },
        },
      });

      // Send invite email (non-blocking — invite is saved even if email fails)
      let emailSent = false;
      const pool = await prisma.pool.findUnique({
        where: { id: input.pool_id },
        select: { name: true },
      });

      if (pool) {
        const result = await sendPoolInviteEmail({
          to: input.email,
          poolName: pool.name,
          inviterEmail: ctx.user.email,
          appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        });
        emailSent = result.success;
        if (!result.success) {
          console.error(
            `Failed to send invite email to ${input.email}:`,
            result.error
          );
        }
      }

      return { ...invite, emailSent };
    }),

  pastEmails: commissionerProcedure
    .input(
      z.object({
        pool_id: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      // Find all pools where this user is commissioner
      const commissionerPools = await prisma.poolMember.findMany({
        where: {
          user_id: ctx.user.id,
          role: "COMMISSIONER",
        },
        select: { pool_id: true },
      });

      const poolIds = commissionerPools.map((p) => p.pool_id);

      // Get distinct emails from all invites across commissioner's pools
      const invites = await prisma.poolInvite.findMany({
        where: {
          pool_id: { in: poolIds },
        },
        select: {
          email: true,
          nickname: true,
        },
        distinct: ["email"],
        orderBy: { created_at: "desc" },
      });

      return invites;
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
