import "server-only";
import { appRouter, createContext } from "@pool-picks/api";
import { prisma } from "@pool-picks/db";
import { createClient } from "@/lib/supabase/server";

export async function createServerCaller() {
  const supabase = createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  let userContext = null;

  if (supabaseUser?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: { id: true, email: true, is_admin: true },
    });

    if (dbUser) {
      userContext = {
        id: dbUser.id,
        email: dbUser.email,
        is_admin: dbUser.is_admin,
      };
    }
  }

  const ctx = createContext({ user: userContext });
  return appRouter.createCaller(ctx);
}
