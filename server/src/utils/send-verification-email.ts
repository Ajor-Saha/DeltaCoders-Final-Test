import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verifyCode: string
) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, message: 'RESEND_API_KEY is not configured' };
  }

  const from = process.env.RESEND_FROM;
  if (!from) {
    return { success: false, message: 'RESEND_FROM is not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: 'Verify Your Account',
      text: `Hello ${firstName},\n\nYour verification code is: ${verifyCode}\n\nUse this code to verify your account.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="margin: 0 0 12px; color: #111827;">Verify your account</h2>
          <p style="margin: 0 0 12px; color: #374151;">Hello ${firstName},</p>
          <p style="margin: 0 0 12px; color: #374151;">Use this verification code to complete your sign up:</p>
          <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 0 0 16px; color: #111827;">${verifyCode}</p>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend verification email error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send verification email',
      };
    }

    return { success: true, message: `Email sent: ${data?.id}` };
  } catch (networkError) {
    console.error('Resend network error:', networkError);
    return {
      success: false,
      message:
        networkError instanceof Error
          ? networkError.message
          : 'Failed to send verification email',
    };
  }
}
