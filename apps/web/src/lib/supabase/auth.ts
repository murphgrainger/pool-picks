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

  let dbUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { is_admin: true },
  });

  // Self-healing: if the Supabase user exists but has no Prisma row
  // (e.g. ensure-user call failed after OTP verify), create it now.
  if (!dbUser) {
    await prisma.user.upsert({
      where: { email: supabaseUser.email },
      update: { id: supabaseUser.id },
      create: { id: supabaseUser.id, email: supabaseUser.email },
    });
    dbUser = { is_admin: false };
  }

  return {
    supabaseUser,
    email: supabaseUser.email,
    isAdmin: dbUser.is_admin,
  };
});
