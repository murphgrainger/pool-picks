import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
}

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

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `Pool Picks <${fromAddress}>`,
      to,
      subject: `You've been invited to join ${poolName} on Pool Picks`,
      html: buildInviteEmailHtml({ poolName, inviterEmail, appBaseUrl }),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { success: false, error: message };
  }
}

function buildInviteEmailHtml({
  poolName,
  inviterEmail,
  appBaseUrl,
}: {
  poolName: string;
  inviterEmail: string;
  appBaseUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#1a1a1a;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#22c55e;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#000000;font-size:24px;font-weight:bold;">Pool Picks</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              <h2 style="margin:0 0 16px;color:#ffffff;font-size:20px;">You're invited!</h2>
              <p style="margin:0 0 8px;color:#d1d5db;font-size:16px;line-height:1.5;">
                <strong style="color:#ffffff;">${inviterEmail}</strong> has invited you to join
              </p>
              <p style="margin:0 0 24px;color:#22c55e;font-size:20px;font-weight:bold;">
                ${poolName}
              </p>
              <p style="margin:0 0 32px;color:#d1d5db;font-size:14px;line-height:1.5;">
                Sign in to Pool Picks to accept or decline this invitation.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${appBaseUrl}" style="display:inline-block;background-color:#22c55e;color:#000000;font-weight:bold;font-size:16px;padding:12px 32px;border-radius:6px;text-decoration:none;">
                      View Invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #333333;">
              <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">
                Pool Picks — Golf pool wagering with friends
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
