import { BaseConnector, NormalizedTokenResponse } from './base.connector.js';
import type { Platform } from '@agency-platform/shared';

/**
 * Pinterest Ads OAuth Connector
 *
 * Pinterest uses standard OAuth 2.0 flow with:
 * - Access tokens expire in 30 days
 * - Continuous refresh tokens (don't expire)
 * - Supports token refresh
 *
 * @see https://developers.pinterest.com/docs/api/v5/oauth-token/
 */
export class PinterestConnector extends BaseConnector {
  constructor() {
    super('pinterest' as Platform);
  }

  /**
   * Normalize Pinterest token response
   *
   * Pinterest returns:
   * - access_token: Bearer token
   * - refresh_token: Continuous refresh token (doesn't expire)
   * - expires_in: null (access tokens expire in 30 days)
   * - refresh_token_expires_in: null (continuous)
   *
   * We normalize expires_in to 30 days (2592000 seconds) since Pinterest returns null.
   */
  normalizeResponse(data: any): NormalizedTokenResponse {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 2592000, // 30 days default
      expiresAt: new Date(Date.now() + (data.expires_in || 2592000) * 1000),
      tokenType: data.token_type ?? 'bearer',
      scope: data.scope,
    };
  }
}

// Export singleton instance
export const pinterestConnector = new PinterestConnector();
