import type { OAuthProvider, OAuthProviderName } from './types';
import { GoogleOAuthProvider } from './providers/google';
import { GitHubOAuthProvider } from './providers/github';

const providers: Record<OAuthProviderName, OAuthProvider> = {
  google: new GoogleOAuthProvider(),
  github: new GitHubOAuthProvider(),
};

export function getOAuthProvider(name: string): OAuthProvider | null {
  const provider = providers[name as OAuthProviderName];
  if (!provider) return null;
  return provider;
}

export function getAvailableProviders(): OAuthProvider[] {
  return Object.values(providers).filter((p) => p.isAvailable());
}

export function isValidProvider(name: string): name is OAuthProviderName {
  return name in providers;
}
