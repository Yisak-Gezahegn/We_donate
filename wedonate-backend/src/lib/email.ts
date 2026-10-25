import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  toEmail: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset Your Password</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#15803d,#16a34a);padding:40px 40px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                    We<span style="color:#fbbf24;">Donate</span>
                  </h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Adama City Community Platform</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Reset Your Password</h2>
                  <p style="margin:0 0 12px;color:#6b7280;font-size:15px;line-height:1.6;">
                    Hello <strong style="color:#111827;">${firstName}</strong>,
                  </p>
                  <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                    We received a request to reset the password for your WeDonate account. 
                    Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
                  </p>

                  <!-- Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                    <tr>
                      <td style="background:#16a34a;border-radius:12px;">
                        <a href="${resetUrl}" 
                           style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                          Reset My Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 12px;color:#9ca3af;font-size:13px;line-height:1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin:0 0 28px;word-break:break-all;">
                    <a href="${resetUrl}" style="color:#16a34a;font-size:13px;">${resetUrl}</a>
                  </p>

                  <div style="background:#f9fafb;border-radius:10px;padding:16px;border-left:4px solid #fbbf24;">
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                      <strong style="color:#374151;">⚠️ Didn't request this?</strong><br/>
                      If you didn't request a password reset, you can safely ignore this email. 
                      Your password will not be changed.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                    © ${new Date().getFullYear()} WeDonate — Adama City Administration<br/>
                    This is an automated message, please do not reply.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"WeDonate Adama" <${process.env.SMTP_USER}>`,
    to:   toEmail,
    subject: 'Reset Your WeDonate Password',
    html,
  });
}
