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
              <h1 style="margin:0;color:#181818;font-size:24px;font-weight:bold;letter-spacing:0.5px;">Pool Picks</h1>
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
                Pool Picks &mdash; Golf pool wagering with friends
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
  inviterEmail: string;
  appBaseUrl: string;
}

export async function sendPoolInviteEmail({
  to,
  poolName,
  inviterEmail,
  appBaseUrl,
}: SendPoolInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const content = `
<h2 style="margin:0 0 16px;color:#181818;font-size:20px;">You're invited!</h2>
<p style="margin:0 0 8px;color:#333333;font-size:16px;line-height:1.5;">
  <strong>${inviterEmail}</strong> has invited you to join
</p>
<p style="margin:0 0 24px;color:#181818;font-size:20px;font-weight:bold;">
  ${poolName}
</p>
<p style="margin:0 0 32px;color:#555555;font-size:14px;line-height:1.5;">
  Sign in to Pool Picks to accept or decline this invitation.
</p>
${buildButton(appBaseUrl, "View Invitation")}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `Pool Picks <${fromAddress}>`,
      to,
      subject: `You've been invited to join ${poolName} on Pool Picks`,
      html: buildEmailWrapper(content),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}

// --- Auth OTP / Magic Link Email ---

interface SendAuthEmailParams {
  to: string;
  magicLink: string;
}

export async function sendAuthEmail({
  to,
  magicLink,
}: SendAuthEmailParams): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const content = `
<h2 style="margin:0 0 16px;color:#181818;font-size:20px;">Sign in to Pool Picks</h2>
<p style="margin:0 0 32px;color:#555555;font-size:14px;line-height:1.5;">
  Click the button below to sign in. This link will expire in 1 hour.
</p>
${buildButton(magicLink, "Sign In")}
<p style="margin:24px 0 0;color:#999999;font-size:12px;line-height:1.5;">
  If you didn't request this email, you can safely ignore it.
</p>`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `Pool Picks <${fromAddress}>`,
      to,
      subject: "Sign in to Pool Picks",
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
      from: `Pool Picks <${fromAddress}>`,
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
