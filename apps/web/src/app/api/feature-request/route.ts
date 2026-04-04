import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import { Resend } from "resend";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const devEmail = process.env.ADMIN_ALERT_EMAIL || fromAddress;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: `PoolPicks <${fromAddress}>`,
      to: devEmail,
      subject: "PoolPicks Feature Request",
      html: `
<h2>Feature Request from ${user.email}</h2>
<p><strong>User:</strong> ${user.email}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br>")}</p>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send request" },
      { status: 500 },
    );
  }
}
