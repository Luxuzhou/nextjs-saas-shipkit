import { Google } from 'arctic';
import { generateCodeVerifier } from 'arctic';
import type { OAuthProvider, OAuthUserProfile } from '../types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BASE_URL}/api/auth/oauth/google/callback`;

export class GoogleOAuthProvider implements OAuthProvider {
  name = 'google' as const;
  private client: Google | null = null;

  isAvailable(): boolean {
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }

  private getClient(): Google {
    if (!this.client) {
      if (!this.isAvailable()) {
        throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
      }
      this.client = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
    }
    return this.client;
  }

  createAuthorizationURL(state: string, codeVerifier?: string): URL {
    const verifier = codeVerifier || generateCodeVerifier();
    return this.getClient().createAuthorizationURL(state, verifier, [
      'openid',
      'email',
      'profile',
    ]);
  }

  async handleCallback(code: string, codeVerifier?: string): Promise<OAuthUserProfile> {
    if (!codeVerifier) {
      throw new Error('Code verifier is required for Google OAuth');
    }
    const tokens = await this.getClient().validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google user profile');
    }

    const profile = await response.json() as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
    };

    return {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    };
  }
}
