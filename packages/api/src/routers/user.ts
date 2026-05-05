import { z } from "zod";
import { prisma } from "@pool-picks/db";
import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
  setPushToken: protectedProcedure
    .input(z.object({ token: z.string().nullable() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { expo_push_token: input.token },
      });
      return { ok: true };
    }),
});
