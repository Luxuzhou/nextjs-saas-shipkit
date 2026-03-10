import { GitHub } from 'arctic';
import type { OAuthProvider, OAuthUserProfile } from '../types';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BASE_URL}/api/auth/oauth/github/callback`;

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export class GitHubOAuthProvider implements OAuthProvider {
  name = 'github' as const;
  private client: GitHub | null = null;

  isAvailable(): boolean {
    return Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
  }

  private getClient(): GitHub {
    if (!this.client) {
      if (!this.isAvailable()) {
        throw new Error('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
      }
      this.client = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, REDIRECT_URI);
    }
    return this.client;
  }

  createAuthorizationURL(state: string): URL {
    return this.getClient().createAuthorizationURL(state, ['user:email']);
  }

  async handleCallback(code: string): Promise<OAuthUserProfile> {
    const tokens = await this.getClient().validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user profile');
    }

    const user = (await userResponse.json()) as GitHubUser;

    let email = user.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as GitHubEmail[];
        const primaryEmail = emails.find((e) => e.primary && e.verified);
        email = primaryEmail?.email || emails[0]?.email || null;
      }
    }

    if (!email) {
      throw new Error('Could not retrieve email from GitHub. Please ensure your GitHub email is public or verified.');
    }

    return {
      id: String(user.id),
      email,
      name: user.name || user.login,
      avatarUrl: user.avatar_url,
    };
  }
}
