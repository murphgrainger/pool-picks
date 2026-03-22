export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { prisma } from "@pool-picks/db";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  // Build the redirect response first so the Supabase client can set cookies on it
  const redirectUrl = new URL(next, origin);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;

  if (code) {
    // OAuth flow (Google) — PKCE verifier is in cookies, don't clear them
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("OAuth exchange error:", error.message);
    if (!error && data.user) user = data.user;
  } else if (tokenHash && type === "magiclink") {
    // Clear any stale session before verifying — prevents conflicts when
    // switching between OAuth and magic link auth methods
    await supabase.auth.signOut();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (error) console.error("Magic link verify error:", error.message);
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

    return response;
  }

  return NextResponse.redirect(new URL("/auth/sign-in?error=auth", origin));
}
