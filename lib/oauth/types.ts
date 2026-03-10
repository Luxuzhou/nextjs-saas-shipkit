export interface OAuthUserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface OAuthProvider {
  /** Get the provider name identifier */
  name: string;
  /** Whether this provider is configured and available */
  isAvailable(): boolean;
  /** Create the authorization URL for redirect */
  createAuthorizationURL(state: string, codeVerifier?: string): URL;
  /** Exchange the authorization code for tokens and return the user profile */
  handleCallback(code: string, codeVerifier?: string): Promise<OAuthUserProfile>;
}

export type OAuthProviderName = 'google' | 'github';
