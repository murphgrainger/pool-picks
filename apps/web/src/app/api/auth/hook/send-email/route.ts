export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { sendOtpEmail } from "@pool-picks/api/lib/email";

interface SendEmailHookPayload {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    email_action_type: string;
    redirect_to: string;
    site_url: string;
  };
}

const SUPPORTED_ACTION_TYPES = ["email", "signup"];

export async function POST(request: Request) {
  const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!hookSecret) {
    console.error("SEND_EMAIL_HOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  // Verify the webhook signature using Standard Webhooks
  const base64Secret = hookSecret.replace("v1,whsec_", "");
  const wh = new Webhook(base64Secret);

  let payload: SendEmailHookPayload;

  try {
    payload = wh.verify(rawBody, headers) as SendEmailHookPayload;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { user, email_data } = payload;

  if (!SUPPORTED_ACTION_TYPES.includes(email_data.email_action_type)) {
    console.warn("Unhandled email action type:", email_data.email_action_type);
    return NextResponse.json({});
  }

  const result = await sendOtpEmail({
    to: user.email,
    otp: email_data.token,
  });

  if (!result.success) {
    console.error("Failed to send OTP email:", result.error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }

  return NextResponse.json({});
}
