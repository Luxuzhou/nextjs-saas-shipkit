import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { twoFactorSecrets } from '@/lib/db/oauth-schema';
import { getUser } from '@/lib/db/queries';
import {
  generateSecret,
  generateOtpAuthUri,
  generateQRCodeDataUrl,
  generateBackupCodes,
} from '@/lib/oauth/totp';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if 2FA is already enabled
    const [existing] = await db
      .select()
      .from(twoFactorSecrets)
      .where(eq(twoFactorSecrets.userId, user.id))
      .limit(1);

    if (existing?.enabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 }
      );
    }

    const secret = generateSecret();
    const backupCodes = generateBackupCodes();
    const otpauthUri = generateOtpAuthUri(secret, user.email);
    const qrCodeDataUrl = generateQRCodeDataUrl(otpauthUri);

    // Upsert the secret (not yet enabled)
    if (existing) {
      await db
        .update(twoFactorSecrets)
        .set({
          secret,
          enabled: false,
          backupCodes,
          updatedAt: new Date(),
        })
        .where(eq(twoFactorSecrets.id, existing.id));
    } else {
      await db.insert(twoFactorSecrets).values({
        userId: user.id,
        secret,
        enabled: false,
        backupCodes,
      });
    }

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      otpauthUri,
      backupCodes,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up 2FA' },
      { status: 500 }
    );
  }
}
