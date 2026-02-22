import "server-only";
import { cache } from "react";
import { createClient } from "./server";
import { prisma } from "@pool-picks/db";

/**
 * Cached per-request auth lookup. Deduplicates across layout + page
 * within the same server render.
 */
export const getAuthUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser?.email) {
    return { supabaseUser: null, email: null, isAdmin: false };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { is_admin: true },
  });

  return {
    supabaseUser,
    email: supabaseUser.email,
    isAdmin: dbUser?.is_admin ?? false,
  };
});
