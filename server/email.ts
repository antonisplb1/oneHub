import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  return {
    client: new Resend(apiKey),
    fromEmail: "uniHub <noreply@unihub.live>",
  };
}

export async function sendVerificationEmail(
  email: string,
  shopName: string,
  token: string,
) {
  try {
    const { client, fromEmail } = getResendClient();
    const verifyUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "http://localhost:5000"}/verify-email/${token}`;

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "Verify your uniHub account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to uniHub, ${shopName}!</h1>
          <p style="color: #666; font-size: 16px;">Thank you for registering. Please verify your email address to complete your registration.</p>
          <div style="margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #999; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
          <p style="color: #999; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  shopName: string,
  token: string,
) {
  try {
    const { client, fromEmail } = getResendClient();
    const resetUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "http://localhost:5000"}/reset-password/${token}`;

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "Reset your uniHub password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p style="color: #666; font-size: 16px;">Hi ${shopName},</p>
          <p style="color: #666; font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #999; font-size: 14px;">Or copy this link: ${resetUrl}</p>
          <p style="color: #999; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}
