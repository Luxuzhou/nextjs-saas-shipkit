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

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const [tfSecret] = await db
      .select()
      .from(twoFactorSecrets)
      .where(eq(twoFactorSecrets.userId, user.id))
      .limit(1);

    if (!tfSecret || !tfSecret.enabled) {
      return NextResponse.json(
        { error: '2FA is not currently enabled' },
        { status: 400 }
      );
    }

    // Verify using TOTP token or backup code
    const isValidTotp = verifyToken(token, tfSecret.secret);
    const backupCodes = tfSecret.backupCodes || [];
    const backupCodeIndex = backupCodes.indexOf(token.toUpperCase());
    const isValidBackup = backupCodeIndex !== -1;

    if (!isValidTotp && !isValidBackup) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // If backup code was used, remove it
    if (isValidBackup) {
      const updatedCodes = [...backupCodes];
      updatedCodes.splice(backupCodeIndex, 1);
      await db
        .update(twoFactorSecrets)
        .set({
          enabled: false,
          backupCodes: updatedCodes,
          updatedAt: new Date(),
        })
        .where(eq(twoFactorSecrets.id, tfSecret.id));
    } else {
      await db
        .update(twoFactorSecrets)
        .set({ enabled: false, updatedAt: new Date() })
        .where(eq(twoFactorSecrets.id, tfSecret.id));
    }

    return NextResponse.json({ success: true, message: '2FA has been disabled' });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
