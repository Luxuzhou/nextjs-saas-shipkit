import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, activityLogs, ActivityType } from '@/lib/db/schema';
import { oauthAccounts } from '@/lib/db/oauth-schema';
import { setSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/session';
import { getOAuthProvider, isValidProvider } from '@/lib/oauth/factory';
import { randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=oauth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=oauth_missing_params`);
  }

  if (!isValidProvider(providerName)) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=oauth_invalid_provider`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value;

  // Clean up OAuth cookies
  cookieStore.delete('oauth_state');
  cookieStore.delete('oauth_code_verifier');

  if (!storedState || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=oauth_state_mismatch`);
  }

  const provider = getOAuthProvider(providerName);
  if (!provider || !provider.isAvailable()) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=oauth_not_configured`);
  }

  try {
    const profile = await provider.handleCallback(code, codeVerifier);

    // Check if this OAuth account already exists
    const [existingOAuth] = await db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, providerName),
          eq(oauthAccounts.providerAccountId, profile.id)
        )
      )
      .limit(1);

    if (existingOAuth) {
      // Existing OAuth account - sign in
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingOAuth.userId))
        .limit(1);

      if (!existingUser || existingUser.deletedAt) {
        return NextResponse.redirect(`${baseUrl}/sign-in?error=oauth_account_deleted`);
      }

      const [teamMember] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, existingUser.id))
        .limit(1);

      await Promise.all([
        setSession(existingUser),
        teamMember
          ? db.insert(activityLogs).values({
              teamId: teamMember.teamId,
              userId: existingUser.id,
              action: ActivityType.SIGN_IN,
              ipAddress: request.headers.get('x-forwarded-for') || '',
            })
          : Promise.resolve(),
      ]);

      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }

    // Check if a user with this email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.email))
      .limit(1);

    if (existingUser) {
      // Link OAuth account to existing user
      await db.insert(oauthAccounts).values({
        userId: existingUser.id,
        provider: providerName,
        providerAccountId: profile.id,
        email: profile.email,
      });

      const [teamMember] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, existingUser.id))
        .limit(1);

      await Promise.all([
        setSession(existingUser),
        teamMember
          ? db.insert(activityLogs).values({
              teamId: teamMember.teamId,
              userId: existingUser.id,
              action: ActivityType.SIGN_IN,
              ipAddress: request.headers.get('x-forwarded-for') || '',
            })
          : Promise.resolve(),
      ]);

      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }

    // New user - create user, team, and link OAuth account
    const randomPasswordHash = await hashPassword(randomBytes(32).toString('hex'));

    const [newUser] = await db
      .insert(users)
      .values({
        email: profile.email,
        name: profile.name || null,
        passwordHash: randomPasswordHash,
        role: 'owner',
      })
      .returning();

    const [newTeam] = await db
      .insert(teams)
      .values({
        name: `${profile.email}'s Team`,
      })
      .returning();

    await Promise.all([
      db.insert(teamMembers).values({
        userId: newUser.id,
        teamId: newTeam.id,
        role: 'owner',
      }),
      db.insert(oauthAccounts).values({
        userId: newUser.id,
        provider: providerName,
        providerAccountId: profile.id,
        email: profile.email,
      }),
      db.insert(activityLogs).values({
        teamId: newTeam.id,
        userId: newUser.id,
        action: ActivityType.SIGN_UP,
        ipAddress: request.headers.get('x-forwarded-for') || '',
      }),
      setSession(newUser),
    ]);

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (err) {
    console.error(`OAuth callback error for ${providerName}:`, err);
    return NextResponse.redirect(`${baseUrl}/sign-in?error=oauth_callback_failed`);
  }
}
