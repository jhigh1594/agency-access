import { env } from '../../lib/env.js';
import type { NormalizedTokenResponse } from './base.connector.js';

/**
 * Kit OAuth Token Response
 *
 * Kit returns tokens in this specific format.
 * Note: Kit uses "created_at" as a Unix timestamp (seconds since epoch).
 */
interface KitTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

/**
 * Kit Account Info Response
 *
 * Kit's account endpoint returns user profile data.
 */
interface KitAccountResponse {
  id: string;
  name: string;
  primary_email_address: string;
}

/**
 * Kit (ConvertKit) OAuth Connector
 *
 * Kit uses standard OAuth 2.0 with one important difference:
 * Token endpoint expects JSON request body instead of form-encoded data.
 *
 * OAuth flow:
 * 1. Redirect user to https://api.kit.com/v4/oauth/authorize
 * 2. User authorizes, redirected back with code
 * 3. Exchange code for tokens (POST with JSON body)
 * 4. Store tokens in Infisical
 *
 * Token refresh:
 * - Kit supports refresh tokens
 * - Tokens expire after 48 hours (172800 seconds)
 * - Use refresh_token to get new access token
 *
 * @see https://developers.kit.com/oauth/
 */
export class KitConnector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authUrl = 'https://api.kit.com/v4/oauth/authorize';
  private readonly tokenUrl = 'https://api.kit.com/v4/oauth/token';
  private readonly userInfoUrl = 'https://api.kit.com/v4/account';

  constructor() {
    this.clientId = env.KIT_CLIENT_ID;
    this.clientSecret = env.KIT_CLIENT_SECRET;
    this.redirectUri = `${env.API_URL}/agency-platforms/kit/callback`;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string, scopes?: string[], redirectUri?: string): string {
    const scopesToUse = scopes ?? ['public'];
    const scopeString = scopesToUse.join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri ?? this.redirectUri,
      state,
      scope: scopeString,
      response_type: 'code',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   *
   * Kit requires JSON request body instead of form-encoded data.
   */
  async exchangeCode(
    code: string,
    redirectUri?: string
  ): Promise<NormalizedTokenResponse> {
    const body = {
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri ?? this.redirectUri,
    };

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Kit uses JSON, not form-encoded
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kit token exchange failed: ${error}`);
    }

    const data: KitTokenResponse = await response.json();
    return this.normalizeResponse(data);
  }

  /**
   * Refresh access token using refresh token
   *
   * Kit requires JSON request body instead of form-encoded data.
   */
  async refreshToken(refreshToken: string): Promise<NormalizedTokenResponse> {
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
    };

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Kit uses JSON, not form-encoded
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kit token refresh failed: ${error}`);
    }

    const data: KitTokenResponse = await response.json();
    return this.normalizeResponse(data);
  }

  /**
   * Verify token is still valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(this.userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get user info from Kit account endpoint
   *
   * Maps Kit's primary_email_address to standard email field.
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
  }> {
    const response = await fetch(this.userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kit user info fetch failed: ${error}`);
    }

    const data: KitAccountResponse = await response.json();

    // Map Kit's response to standard format
    return {
      id: data.id,
      email: data.primary_email_address,
      name: data.name,
    };
  }

  /**
   * Normalize Kit token response to standard format
   *
   * Kit provides created_at as Unix timestamp (seconds since epoch).
   * We calculate expiresAt as: created_at + expires_in
   */
  private normalizeResponse(data: KitTokenResponse): NormalizedTokenResponse {
    const expiresAt = new Date((data.created_at * 1000) + (data.expires_in * 1000));

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt,
      tokenType: data.token_type,
      scope: data.scope,
      metadata: {
        platform: 'kit',
        authorizedAt: new Date().toISOString(),
      },
    };
  }
}

/**
 * Singleton instance for use throughout the application
 */
export const kitConnector = new KitConnector();
