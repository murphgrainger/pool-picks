import "server-only";
import { appRouter, createContext } from "@pool-picks/api";
import { getAuthUser } from "@/lib/supabase/auth";

export async function createServerCaller() {
  const { supabaseUser, email, isAdmin } = await getAuthUser();

  let userContext = null;

  if (supabaseUser && email) {
    userContext = {
      id: supabaseUser.id,
      email,
      is_admin: isAdmin,
    };
  }

  const ctx = createContext({ user: userContext });
  return appRouter.createCaller(ctx);
}
