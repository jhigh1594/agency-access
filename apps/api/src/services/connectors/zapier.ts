import { BaseConnector, NormalizedTokenResponse } from './base.connector.js';
import type { Platform } from '@agency-platform/shared';

/**
 * Zapier OAuth Connector
 *
 * Zapier uses standard OAuth 2.0 flow:
 * - Authorization URL: https://zapier.com/oauth/authorize
 * - Token URL: https://zapier.com/oauth/token
 * - Supports refresh tokens
 * - Access tokens typically expire after 1 hour
 *
 * @see https://platform.zapier.com/docs/authentication.html
 */
export class ZapierConnector extends BaseConnector {
  constructor() {
    super('zapier' as Platform);
  }

  /**
   * Normalize Zapier token response to standard format
   *
   * Zapier returns standard OAuth 2.0 response:
   * - access_token: Access token for API calls
   * - refresh_token: For token refresh
   * - expires_in: Token lifetime in seconds (default 3600)
   * - token_type: "Bearer"
   * - scope: Granted OAuth scopes
   */
  normalizeResponse(data: any): NormalizedTokenResponse {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in ?? 3600, // Default 1 hour
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : new Date(Date.now() + 3600 * 1000), // Default 1 hour
      tokenType: data.token_type ?? 'Bearer',
      scope: data.scope,
      metadata: {
        platform: 'zapier',
        authorizedAt: new Date().toISOString(),
      },
    };
  }
}

// Export singleton instance
export const zapierConnector = new ZapierConnector();
