import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@pool-picks/api";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const supabase = createRouteHandlerClient();

      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      if (!supabaseUser?.email) {
        return createContext({ user: null });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
        select: { id: true, email: true, is_admin: true },
      });

      if (!dbUser) {
        return createContext({ user: null });
      }

      return createContext({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          is_admin: dbUser.is_admin,
        },
      });
    },
  });

export { handler as GET, handler as POST };
