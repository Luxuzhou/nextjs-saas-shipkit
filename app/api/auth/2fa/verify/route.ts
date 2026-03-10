import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { twoFactorSecrets } from '@/lib/db/oauth-schema';
import { getUser } from '@/lib/db/queries';
import { verifyToken } from '@/lib/oauth/totp';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as { token: string };
    const { token } = body;

    if (!token || typeof token !== 'string' || token.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid token format. Must be a 6-digit code.' },
        { status: 400 }
      );
    }

    const [tfSecret] = await db
      .select()
      .from(twoFactorSecrets)
      .where(eq(twoFactorSecrets.userId, user.id))
      .limit(1);

    if (!tfSecret) {
      return NextResponse.json(
        { error: '2FA has not been set up. Call /api/auth/2fa/setup first.' },
        { status: 400 }
      );
    }

    const isValid = verifyToken(token, tfSecret.secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA if not already enabled
    if (!tfSecret.enabled) {
      await db
        .update(twoFactorSecrets)
        .set({ enabled: true, updatedAt: new Date() })
        .where(eq(twoFactorSecrets.id, tfSecret.id));
    }

    return NextResponse.json({ success: true, message: '2FA verified and enabled' });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA token' },
      { status: 500 }
    );
  }
}
