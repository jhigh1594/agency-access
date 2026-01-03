import { BaseConnector, NormalizedTokenResponse, ConnectorError } from './base.connector.js';

/**
 * LinkedIn OAuth Connector (New Pattern)
 *
 * This connector uses the BaseConnector pattern which provides:
 * - Standard OAuth 2.0 flow implementation
 * - Token refresh capability
 * - Token verification
 * - User info fetching
 *
 * All we need to implement is normalizeResponse() to handle LinkedIn's
 * specific response format.
 *
 * This is ~80% less code than the legacy pattern!
 *
 * Documentation: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 */

interface LinkedInTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface LinkedInUserInfo {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

export class LinkedInConnector extends BaseConnector {
  constructor() {
    super('linkedin' as any); // Platform type will be resolved from registry
  }

  /**
   * Normalize LinkedIn's token response to our standard format
   *
   * LinkedIn returns:
   * - access_token
   * - refresh_token (if approved - LinkedIn grants 1-year refresh tokens)
   * - expires_in (seconds)
   *
   * We convert this to our NormalizedTokenResponse format.
   */
  normalizeResponse(data: LinkedInTokenResponse): NormalizedTokenResponse {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // LinkedIn recently added refresh token support
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tokenType: 'Bearer',
      metadata: {
        platform: 'linkedin',
        authorizedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Get LinkedIn user info
   *
   * LinkedIn's user info endpoint returns OpenID Connect formatted data.
   * We map it to a consistent format for storage.
   *
   * @override
   */
  override async getUserInfo(accessToken: string): Promise<{
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
  }> {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ConnectorError(
        'linkedin',
        'USER_INFO_FAILED',
        `LinkedIn user info fetch failed: ${error}`,
        { status: response.status, body: error }
      );
    }

    const data = (await response.json()) as LinkedInUserInfo;

    // Map LinkedIn's OpenID format to our standard format
    return {
      id: data.sub,
      email: data.email,
      name: data.name,
      firstName: data.given_name,
      lastName: data.family_name,
      picture: data.picture,
    };
  }
}

// Export singleton instance (matching our factory pattern)
export const linkedinConnector = new LinkedInConnector();
