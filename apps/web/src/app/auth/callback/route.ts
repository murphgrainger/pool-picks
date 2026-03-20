export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  const supabase = createRouteHandlerClient();
  let user = null;

  if (code) {
    // OAuth flow (Google)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) user = data.user;
  } else if (tokenHash && type === "magiclink") {
    // Magic link flow — verify the hashed token directly
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (!error && data.user) user = data.user;
  }

  if (user) {
    // Upsert User row: update existing (migrated from NextAuth) or create new
    await prisma.user.upsert({
      where: { email: user.email! },
      update: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
      },
    });

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth`);
}
