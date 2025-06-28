export interface OAuthCredentials {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expiry_date: number;
  readonly scope: string;
  readonly token_type: string;
}

export interface OAuthConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly credentialsPath: string;
}

export interface RefreshedToken {
  readonly access_token: string;
  readonly expiry_date: number;
}