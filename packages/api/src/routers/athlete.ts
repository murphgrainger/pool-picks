import { z } from "zod";
import { prisma } from "@pool-picks/db";
import { router, protectedProcedure } from "../trpc";

export const athleteRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.athlete.findMany();
  }),

  listByTournament: protectedProcedure
    .input(z.object({ tournament_id: z.number() }))
    .query(async ({ input }) => {
      const athletesInTournaments = await prisma.athletesInTournaments.findMany({
        where: { tournament_id: input.tournament_id },
        include: { athlete: true },
      });

      const athletes = athletesInTournaments.map((ait) => ait.athlete);
      athletes.sort((a, b) => a.full_name.localeCompare(b.full_name));
      return athletes;
    }),
});
