export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAuthEmail } from "@pool-picks/api/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      console.error("Failed to generate magic link:", error.message);
      return NextResponse.json(
        { error: "Failed to send sign-in email" },
        { status: 500 }
      );
    }

    // Build our own magic link using the hashed_token so we can verify it
    // server-side. Using action_link directly fails because PKCE code verifier
    // is never stored in the user's browser.
    const tokenHash = data.properties.hashed_token;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLink = `${appUrl}/auth/callback?token_hash=${tokenHash}&type=magiclink`;

    const result = await sendAuthEmail({ to: email, magicLink });

    if (!result.success) {
      console.error("Failed to send auth email:", result.error);
      return NextResponse.json(
        { error: "Failed to send sign-in email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send magic link error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
