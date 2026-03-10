import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { oauthAccounts, twoFactorSecrets } from '@/lib/db/oauth-schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [accounts, tfSecrets] = await Promise.all([
      db
        .select({
          id: oauthAccounts.id,
          provider: oauthAccounts.provider,
          email: oauthAccounts.email,
          createdAt: oauthAccounts.createdAt,
        })
        .from(oauthAccounts)
        .where(eq(oauthAccounts.userId, user.id)),
      db
        .select({ enabled: twoFactorSecrets.enabled })
        .from(twoFactorSecrets)
        .where(eq(twoFactorSecrets.userId, user.id))
        .limit(1),
    ]);

    return NextResponse.json({
      linkedAccounts: accounts,
      twoFactor: {
        enabled: tfSecrets[0]?.enabled || false,
      },
    });
  } catch (error) {
    console.error('OAuth status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security status' },
      { status: 500 }
    );
  }
}
