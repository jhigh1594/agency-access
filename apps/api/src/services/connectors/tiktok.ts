import { BaseConnector, NormalizedTokenResponse } from './base.connector.js';
import type { Platform } from '@agency-platform/shared';

/**
 * TikTok Ads OAuth Connector
 *
 * TikTok uses standard OAuth 2.0 flow:
 * - Authorization URL: https://business-api.tiktok.com/passport/v2/authorize/
 * - Token URL: https://business-api.tiktok.com/passport/v2/token/
 * - Supports refresh tokens
 * - Access tokens expire in X hours
 *
 * @see https://business-api.tiktok.com/
 */
export class TikTokConnector extends BaseConnector {
  constructor() {
    super('tiktok' as Platform);
  }

  /**
   * Normalize TikTok token response
   *
   * TikTok returns:
   * - access_token: Access token for API calls
   * - refresh_token: For token refresh
   * - expires_in: Token lifetime in seconds
   * - token_type: "Bearer"
   *
   * @param data - Response from TikTok token endpoint
   */
  normalizeResponse(data: any): NormalizedTokenResponse {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 86400, // Default 24 hours
      expiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000),
      tokenType: data.token_type ?? 'Bearer',
      scope: data.scope,
    };
  }

  /**
   * Get user info from TikTok
   *
   * Fetches user information from TikTok API.
   *
   * @param accessToken - Valid TikTok access token
   * @returns User profile data
   */
  override async getUserInfo(accessToken: string): Promise<{
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
  }> {
    if (!this.config.userInfoUrl) {
      throw new Error('User info endpoint not configured for TikTok');
    }

    const response = await fetch(this.config.userInfoUrl, {
      method: 'GET',
      headers: {
        'Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TikTok user info fetch failed: ${error}`);
    }

    const data = await response.json() as any;

    return {
      id: data.data?.user_id || data.data?.advertiser_id || '',
      email: data.data?.email,
      name: data.data?.display_name || data.data?.username,
      ...(data.data),
    };
  }
}

// Export singleton instance
export const tiktokConnector = new TikTokConnector();
