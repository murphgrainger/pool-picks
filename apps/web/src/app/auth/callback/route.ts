export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { prisma } from "@pool-picks/db";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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

  if (code) {
    // OAuth flow (Google) — PKCE verifier is in cookies
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth exchange error:", error.message);
      return NextResponse.redirect(new URL("/auth/sign-in?error=auth", origin));
    }

    if (data.user) {
      await prisma.user.upsert({
        where: { email: data.user.email! },
        update: { id: data.user.id },
        create: {
          id: data.user.id,
          email: data.user.email!,
        },
      });
    }

    return response;
  }

  return NextResponse.redirect(new URL("/auth/sign-in?error=auth", origin));
}
