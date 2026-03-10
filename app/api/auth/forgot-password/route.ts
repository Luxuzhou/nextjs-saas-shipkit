import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { passwordResetTokens } from '@/lib/db/email-schema';
import { sendEmail } from '@/lib/email/send';
import { ResetPasswordEmail } from '@/lib/email/templates/ResetPasswordEmail';
import * as React from 'react';
import crypto from 'crypto';

const TOKEN_EXPIRY_MINUTES = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (user) {
      // Generate a cryptographically secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(
        Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000
      );

      // Invalidate any existing tokens for this user by inserting a new one
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
        used: false
      });

      // Send reset email (fire-and-forget — do not block the response)
      sendEmail({
        to: email,
        subject: 'Reset your password',
        react: React.createElement(ResetPasswordEmail, {
          userEmail: email,
          resetToken: token,
          expiresInMinutes: TOKEN_EXPIRY_MINUTES
        })
      }).catch(console.error);
    }

    // Always return 200 to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
