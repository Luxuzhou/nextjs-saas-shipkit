import { Resend } from 'resend';
import { ReactElement } from 'react';

const resendApiKey = process.env.RESEND_API_KEY;

let resend: Resend | null = null;
if (resendApiKey && resendApiKey.trim() !== '') {
  resend = new Resend(resendApiKey);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  from = 'SaaS Starter <noreply@example.com>'
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn(
      '[email] RESEND_API_KEY is not configured. Skipping email send to:',
      to
    );
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      react
    });

    if (error) {
      console.error('[email] Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[email] Unexpected error sending email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
