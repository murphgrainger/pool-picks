import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { prisma } from "@pool-picks/db";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Any signed-in user
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// Commissioner of a specific pool - expects pool_id in input
const isCommissioner = t.middleware(async ({ ctx, next, getRawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
  }

  const rawInput = await getRawInput();
  const parsed = z.object({ pool_id: z.number() }).safeParse(rawInput);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "pool_id is required for commissioner actions",
    });
  }

  const poolMember = await prisma.poolMember.findFirst({
    where: {
      pool_id: parsed.data.pool_id,
      user_id: ctx.user.id,
      role: "COMMISSIONER",
    },
  });

  if (!poolMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not the commissioner of this pool",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      poolMember,
    },
  });
});

export const commissionerProcedure = t.procedure.use(isCommissioner);

// System admin
const isSystemAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
  }
  if (!ctx.user.is_admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "System admin access required",
    });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const systemAdminProcedure = t.procedure.use(isSystemAdmin);
