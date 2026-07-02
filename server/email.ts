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

function getBaseUrl(): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }
  const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0]?.trim();
  if (replitDomain) return `https://${replitDomain}`;
  return process.env.NODE_ENV === 'production' ? 'https://unihub.live' : 'http://localhost:5000';
}

export async function sendVerificationEmail(
  email: string,
  shopName: string,
  token: string,
) {
  try {
    const { client, fromEmail } = getResendClient();
    const verifyUrl = `${getBaseUrl()}/verify-email/${token}`;

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
  isAdmin: boolean = false,
) {
  try {
    const { client, fromEmail } = getResendClient();
    const resetUrl = isAdmin 
      ? `${getBaseUrl()}/admin/reset-password/${token}`
      : `${getBaseUrl()}/reset-password/${token}`;

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `Reset your uniHub ${isAdmin ? 'Admin ' : ''}password`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p style="color: #666; font-size: 16px;">Hi ${shopName},</p>
          <p style="color: #666; font-size: 16px;">We received a request to reset your ${isAdmin ? 'admin ' : ''}password. Click the button below to create a new password:</p>
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

export async function sendTrialEndingSoonEmail(
  email: string,
  shopName: string,
) {
  try {
    const { client, fromEmail } = getResendClient();
    const accountUrl = `${getBaseUrl()}/dashboard/account`;

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "Your uniHub free trial ends soon",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your free trial ends soon</h1>
          <p style="color: #666; font-size: 16px;">Hi ${shopName},</p>
          <p style="color: #666; font-size: 16px;">Your uniHub free trial ends in less than 24 hours. Subscribe now to keep your loyalty cards, spin wheel, menu, and shift tools running without interruption.</p>
          <div style="margin: 30px 0;">
            <a href="${accountUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Subscribe Now</a>
          </div>
          <p style="color: #999; font-size: 14px;">Or copy this link: ${accountUrl}</p>
          <p style="color: #999; font-size: 14px;">Thanks for trying uniHub!</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending trial-ending-soon email:", error);
    throw new Error("Failed to send trial-ending-soon email");
  }
}

export async function sendTrialEndedEmail(
  email: string,
  shopName: string,
) {
  try {
    const { client, fromEmail } = getResendClient();
    const accountUrl = `${getBaseUrl()}/dashboard/account`;

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "Your uniHub free trial has ended",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your free trial has ended</h1>
          <p style="color: #666; font-size: 16px;">Hi ${shopName},</p>
          <p style="color: #666; font-size: 16px;">Your uniHub free trial has ended. Subscribe now to restore access to your dashboard and pick up right where you left off — your data is safe and waiting for you.</p>
          <div style="margin: 30px 0;">
            <a href="${accountUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Subscribe Now</a>
          </div>
          <p style="color: #999; font-size: 14px;">Or copy this link: ${accountUrl}</p>
          <p style="color: #999; font-size: 14px;">We'd love to have you back!</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending trial-ended email:", error);
    throw new Error("Failed to send trial-ended email");
  }
}

export async function sendSubuserInvitationEmail(
  email: string,
  shopName: string,
  token: string,
  permissions: string[],
) {
  try {
    const { client, fromEmail } = getResendClient();
    const setupUrl = `${getBaseUrl()}/subuser-setup/${token}`;

    const permissionLabels: Record<string, string> = {
      'loyalty': 'QR Scanner (Loyalty Cards)',
      'spin': 'Spin Wheel (In-Store Wheel)',
      'menu': 'Menu Builder',
      'shift': 'Shift Manager',
      'analytics': 'Analytics',
    };

    const permissionsList = permissions
      .map(p => permissionLabels[p] || p)
      .join(', ');

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `You've been invited to ${shopName}'s team on uniHub`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Team Invitation</h1>
          <p style="color: #666; font-size: 16px;">You've been invited to join <strong>${shopName}</strong>'s team on uniHub!</p>
          <p style="color: #666; font-size: 16px;">You'll have access to the following features:</p>
          <p style="color: #555; font-size: 16px; margin-left: 20px;">${permissionsList}</p>
          <p style="color: #666; font-size: 16px;">Click the button below to set up your password and get started:</p>
          <div style="margin: 30px 0;">
            <a href="${setupUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Up Account</a>
          </div>
          <p style="color: #999; font-size: 14px;">Or copy this link: ${setupUrl}</p>
          <p style="color: #999; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending subuser invitation email:", error);
    throw new Error("Failed to send subuser invitation email");
  }
}
