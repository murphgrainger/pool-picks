import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
}

function buildEmailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
          <!-- Header -->
          <tr>
            <td style="background-color:#EDEC32;padding:20px;text-align:center;">
              <h1 style="margin:0;color:#181818;font-size:24px;font-weight:bold;letter-spacing:0.5px;">PoolPicks</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 24px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;padding:16px 24px;border-top:1px solid #e5e5e5;">
              <p style="margin:0;color:#999999;font-size:12px;text-align:center;">
                PoolPicks &mdash; Golf pool wagering with friends
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildButton(href: string, label: string): string {
  return `
<table cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center">
      <a href="${href}" style="display:inline-block;background-color:#A3DBA0;color:#181818;font-weight:bold;font-size:16px;padding:12px 32px;border-radius:6px;text-decoration:none;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

// --- Pool Invite Email ---

interface SendPoolInviteEmailParams {
  to: string;
  poolName: string;
  tournamentName: string;
  tournamentDates: string;
  appBaseUrl: string;
  poolId: number;
  inviteCode: string;
}

export async function sendPoolInviteEmail({
  to,
  poolName,
  tournamentName,
  tournamentDates,
  appBaseUrl,
  inviteCode,
}: SendPoolInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const content = `
<p style="margin:0 0 8px;color:#333333;font-size:16px;line-height:1.5;">
  You have been invited to join the following pool:
</p>
<p style="margin:0 0 4px;color:#181818;font-size:20px;font-weight:bold;">
  ${poolName}
</p>
<p style="margin:0 0 24px;color:#777777;font-size:13px;line-height:1.4;">
  ${tournamentName} &middot; ${tournamentDates}
</p>
<p style="margin:0 0 32px;color:#555555;font-size:14px;line-height:1.5;">
  Sign in to PoolPicks to accept or decline this invitation.
</p>
${buildButton(`${appBaseUrl}/join/${inviteCode}`, "View Invitation")}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `PoolPicks <${fromAddress}>`,
      to,
      subject: `You've been invited to join ${poolName} on PoolPicks`,
      html: buildEmailWrapper(content),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}

// --- Auth OTP Email ---

interface SendOtpEmailParams {
  to: string;
  otp: string;
}

export async function sendOtpEmail({
  to,
  otp,
}: SendOtpEmailParams): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const content = `
<h2 style="margin:0 0 16px;color:#181818;font-size:20px;">Sign in to PoolPicks</h2>
<p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.5;">
  Enter this code to sign in. It expires in 10 minutes.
</p>
<div style="text-align:center;margin:0 0 24px;">
  <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;color:#181818;background-color:#f5f5f5;padding:16px 24px;border-radius:8px;border:1px solid #e5e5e5;font-family:monospace;">
    ${otp}
  </span>
</div>
<p style="margin:0;color:#999999;font-size:12px;line-height:1.5;">
  If you didn't request this email, you can safely ignore it.
</p>`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `PoolPicks <${fromAddress}>`,
      to,
      subject: "Your PoolPicks sign-in code",
      html: buildEmailWrapper(content),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}

// --- Pool Open Notification Email ---

interface SendPoolOpenEmailParams {
  to: string;
  poolName: string;
  appBaseUrl: string;
  poolId: number;
}

// --- Pool Auto-Complete Notification Email ---

interface SendPoolAutoCompleteEmailParams {
  to: string;
  poolName: string;
  tournamentName: string;
  appBaseUrl: string;
  poolId: number;
}

export async function sendPoolAutoCompleteEmail({
  to,
  poolName,
  tournamentName,
  appBaseUrl,
  poolId,
}: SendPoolAutoCompleteEmailParams): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const poolUrl = `${appBaseUrl}/pool/${poolId}`;

  const content = `
<h2 style="margin:0 0 16px;color:#181818;font-size:20px;">Pool Automatically Completed</h2>
<p style="margin:0 0 8px;color:#333333;font-size:16px;line-height:1.5;">
  The tournament for <strong>${poolName}</strong> (${tournamentName}) ended over a week ago.
</p>
<p style="margin:0 0 32px;color:#555555;font-size:14px;line-height:1.5;">
  Your pool has been automatically marked as complete. You can view the final results below.
</p>
${buildButton(poolUrl, "View Results")}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `PoolPicks <${fromAddress}>`,
      to,
      subject: `${poolName} has been automatically completed`,
      html: buildEmailWrapper(content),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}

// --- Pool Open Notification Email ---

export async function sendPoolOpenEmail({
  to,
  poolName,
  appBaseUrl,
  poolId,
}: SendPoolOpenEmailParams): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const poolUrl = `${appBaseUrl}/pool/${poolId}`;

  const content = `
<h2 style="margin:0 0 16px;color:#181818;font-size:20px;">The field is set!</h2>
<p style="margin:0 0 8px;color:#333333;font-size:16px;line-height:1.5;">
  The field for <strong>${poolName}</strong> has been finalized.
</p>
<p style="margin:0 0 32px;color:#555555;font-size:14px;line-height:1.5;">
  Head over to the pool to make your picks before the commissioner locks it.
</p>
${buildButton(poolUrl, "Make Your Picks")}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `PoolPicks <${fromAddress}>`,
      to,
      subject: `${poolName} is open — time to make your picks!`,
      html: buildEmailWrapper(content),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}
