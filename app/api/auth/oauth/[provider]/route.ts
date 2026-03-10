import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProvider, isValidProvider } from '@/lib/oauth/factory';
import { generateState, generateCodeVerifier } from 'arctic';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;

  if (!isValidProvider(providerName)) {
    return NextResponse.json(
      { error: `Unknown OAuth provider: ${providerName}` },
      { status: 400 }
    );
  }

  const provider = getOAuthProvider(providerName);
  if (!provider || !provider.isAvailable()) {
    return NextResponse.json(
      { error: `OAuth provider "${providerName}" is not configured. Please set the required environment variables.` },
      { status: 503 }
    );
  }

  const state = generateState();
  const codeVerifier = providerName === 'google' ? generateCodeVerifier() : undefined;

  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  if (codeVerifier) {
    cookieStore.set('oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });
  }

  const url = provider.createAuthorizationURL(state, codeVerifier);
  return NextResponse.redirect(url.toString());
}
