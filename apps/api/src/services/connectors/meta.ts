import { env } from '../../lib/env';
import type { AccessLevel } from '@agency-platform/shared';

/**
 * Meta (Facebook) OAuth Connector
 *
 * Handles OAuth 2.0 flow for Meta platforms (Facebook, Instagram, WhatsApp)
 *
 * Documentation: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
 */

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MetaTokens {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  expiresAt?: Date;
}

export class MetaConnector {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.appId = env.META_APP_ID;
    this.appSecret = env.META_APP_SECRET;
    this.redirectUri = `${env.FRONTEND_URL.replace('3000', '3001')}/api/oauth/meta/callback`;
  }

  /**
   * Generate OAuth authorization URL
   *
   * @param state - CSRF protection token (should be stored in session/database)
   * @param scopes - Permissions to request (default: email, public_profile)
   * @returns Authorization URL to redirect user to
   */
  getAuthUrl(state: string, scopes: string[] = ['email', 'public_profile']): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      state,
      scope: scopes.join(','),
      response_type: 'code',
    });

    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for short-lived access token
   *
   * @param code - Authorization code from OAuth callback
   * @returns Short-lived access token (expires in ~2 hours)
   */
  async exchangeCode(code: string): Promise<MetaTokens> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta token exchange failed: ${error}`);
    }

    const data = (await response.json()) as MetaTokenResponse;

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  /**
   * Exchange short-lived token for long-lived token
   *
   * Meta best practice: Always exchange for long-lived tokens (60 days)
   *
   * @param shortLivedToken - Short-lived access token from exchangeCode
   * @returns Long-lived access token (expires in ~60 days)
   */
  async getLongLivedToken(shortLivedToken: string): Promise<MetaTokens> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta long-lived token exchange failed: ${error}`);
    }

    const data = (await response.json()) as MetaLongLivedTokenResponse;

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  /**
   * Refresh access token (NOT SUPPORTED BY META)
   *
   * Meta does not support token refresh via refresh_token.
   * Instead, Meta uses long-lived tokens valid for 60 days.
   * When tokens expire, the user must re-authorize via OAuth flow.
   *
   * For token refresh, use the token refresh job to detect expiring tokens
   * and prompt users to re-authorize before expiration.
   *
   * @throws Error - Always throws as this is not supported
   */
  async refreshToken(_refreshToken: string): Promise<MetaTokens> {
    throw new Error(
      'Meta does not support token refresh via refresh_token. ' +
      'Meta uses long-lived tokens valid for 60 days. ' +
      'When tokens expire, the user must re-authorize via OAuth flow. ' +
      'Use getLongLivedToken() during initial authorization to get 60-day tokens.'
    );
  }

  /**
   * Get user info from Meta Graph API
   *
   * @param accessToken - Valid Meta access token
   * @returns User profile data
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    name: string;
    email?: string;
  }> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta user info fetch failed: ${error}`);
    }

    return (await response.json()) as { id: string; name: string; email?: string };
  }

  /**
   * Verify token is still valid
   *
   * @param accessToken - Token to verify
   * @returns Whether token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        input_token: accessToken,
        access_token: `${this.appId}|${this.appSecret}`, // App access token
      });

      const response = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?${params.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) return false;

      const data = (await response.json()) as { data?: { is_valid?: boolean } };
      return data.data?.is_valid === true;
    } catch {
      return false;
    }
  }

  /**
   * Revoke access token (when user disconnects)
   *
   * @param accessToken - Token to revoke
   */
  async revokeToken(accessToken: string): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta token revocation failed: ${error}`);
    }
  }

  /**
   * Verify agency has access to client's Meta assets
   *
   * Uses agency's OAuth token to query Meta Business Manager API for granted partnerships.
   *
   * @param agencyAccessToken - Agency's OAuth access token
   * @param businessId - Agency's Business Manager ID
   * @param clientEmail - Client's email (for validation)
   * @param requiredAccessLevel - Minimum access level required
   * @returns Verification result with granted access details
   */
  async verifyClientAccess(
    agencyAccessToken: string,
    businessId: string,
    clientEmail: string,
    requiredAccessLevel: AccessLevel
  ): Promise<{
    hasAccess: boolean;
    accessLevel: AccessLevel;
    businessName?: string;
    assets: Array<{
      type: 'ad_account' | 'page' | 'instagram_account';
      id: string;
      name: string;
      permissions: string[];
    }>;
    error?: string;
  }> {
    try {
      // Query the agency's Business Manager to check partnerships
      // This returns all businesses the agency manages
      const businessResponse = await fetch(
        `https://graph.facebook.com/v21.0/${businessId}?fields=name,id&access_token=${agencyAccessToken}`,
        { method: 'GET' }
      );

      if (!businessResponse.ok) {
        return {
          hasAccess: false,
          accessLevel: 'read_only',
          assets: [],
          error: 'Failed to verify Business Manager access',
        };
      }

      const businessData = await businessResponse.json() as {
        name?: string;
        id?: string;
      };

      // For MVP, we consider access granted if the Business Manager exists and token is valid
      // In production, you would query specific client relationships
      // This could be done via:
      // 1. Querying client's business settings for partner relationships
      // 2. Checking granted ad accounts and permissions
      // 3. Verifying specific access levels match requirements

      // Map access levels to Meta permissions
      const accessLevelMapping: Record<AccessLevel, string[]> = {
        admin: ['ADVERTISE', 'MANAGE', 'ANALYZE'],
        standard: ['ADVERTISE', 'ANALYZE'],
        read_only: ['ANALYZE'],
        email_only: [],
      };

      // For MVP, return basic verification
      // In production, query the client's business to find this agency as a partner
      const hasAccess = businessData.id === businessId;

      return {
        hasAccess,
        accessLevel: hasAccess ? requiredAccessLevel : 'read_only',
        businessName: businessData.name,
        assets: [],
      };
    } catch (error) {
      return {
        hasAccess: false,
        accessLevel: 'read_only',
        assets: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const metaConnector = new MetaConnector();
