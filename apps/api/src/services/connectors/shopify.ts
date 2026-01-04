import { BaseConnector, NormalizedTokenResponse, ConnectorError } from './base.connector.js';
import type { Platform } from '@agency-platform/shared';
import crypto from 'crypto';

/**
 * Shopify OAuth Connector
 *
 * Shopify uses a unique OAuth flow with shop-specific URLs:
 * - Authorization: https://{shop}.myshopify.com/admin/oauth/authorize
 * - Token: https://{shop}.myshopify.com/admin/oauth/access_token
 * - Access tokens don't expire
 * - Requires HMAC verification for security
 * - Uses X-Shopify-Access-Token header for API calls
 *
 * @see https://shopify.dev/docs/apps/build/authentication-authorization
 */
export class ShopifyConnector extends BaseConnector {
  constructor() {
    super('shopify' as Platform);
  }

  /**
   * Generate OAuth authorization URL with shop context
   *
   * Shopify requires the shop name in the URL.
   * This must be passed as an additional parameter.
   *
   * @param state - CSRF protection token
   * @param scopes - Optional scopes to request
   * @param redirectUri - Optional override for redirect URI
   * @param shop - Shop name (e.g., "my-store" from my-store.myshopify.com)
   * @returns Authorization URL with shop context
   */
  getAuthUrl(state: string, scopes?: string[], redirectUri?: string, shop?: string): string {
    if (!shop) {
      throw new ConnectorError(
        this.platform,
        'MISSING_SHOP',
        'Shop name is required for Shopify OAuth. Pass shop parameter (e.g., "my-store").'
      );
    }

    const scopesToUse = scopes ?? this.config.defaultScopes;
    const scopeString = scopesToUse.join(this.config.scopeSeparator ?? ',');

    const params = new URLSearchParams({
      client_id: this.getClientId(),
      scope: scopeString,
      redirect_uri: redirectUri ?? this.getRedirectUri(),
      state,
      response_type: 'code',
      grant_options: ['per-user'], // Request per-user token
    });

    // Build shop-specific URL
    return `https://${shop}.myshopify.com/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token with shop context
   *
   * Shopify uses JSON request body (not form-encoded).
   * Must include shop parameter to build the correct URL.
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Optional override for redirect URI
   * @param shop - Shop name (e.g., "my-store" from my-store.myshopify.com)
   * @returns Normalized token response
   */
  override async exchangeCode(
    code: string,
    redirectUri?: string,
    shop?: string
  ): Promise<NormalizedTokenResponse> {
    if (!shop) {
      throw new ConnectorError(
        this.platform,
        'MISSING_SHOP',
        'Shop name is required for Shopify token exchange.'
      );
    }

    const body = JSON.stringify({
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      code,
      redirect_uri: redirectUri ?? this.getRedirectUri(),
    });

    try {
      const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new ConnectorError(
          this.platform,
          'EXCHANGE_FAILED',
          `Token exchange failed: ${error}`,
          { status: response.status, body: error }
        );
      }

      const data = await response.json();
      return this.normalizeResponse(data, shop);
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        this.platform,
        'EXCHANGE_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Normalize Shopify token response
   *
   * Shopify tokens:
   * - Don't expire
   * - Include shop name in metadata for API calls
   *
   * @param data - Response from Shopify token endpoint
   * @param shop - Shop name for metadata (optional, included if provided)
   */
  normalizeResponse(data: any, shop?: string): NormalizedTokenResponse {
    const response: NormalizedTokenResponse = {
      accessToken: data.access_token,
      refreshToken: undefined, // No refresh token - tokens don't expire
      expiresIn: 0, // Never expires
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      tokenType: 'Bearer',
      metadata: {
        scope: data.scope,
      },
    };

    // Include shop in metadata if provided
    if (shop) {
      response.metadata = {
        ...response.metadata,
        shop,
      };
    }

    return response;
  }

  /**
   * Get user info from Shopify
   *
   * Fetches shop information using the shop-specific URL.
   * Uses X-Shopify-Access-Token header instead of Authorization.
   *
   * @param accessToken - Valid Shopify access token
   * @param shop - Shop name (required for URL construction)
   * @returns Shop information
   */
  override async getUserInfo(
    accessToken: string,
    shop?: string
  ): Promise<{
    id: string;
    email?: string;
    name?: string;
    shop?: string;
    [key: string]: any;
  }> {
    if (!shop) {
      throw new ConnectorError(
        this.platform,
        'MISSING_SHOP',
        'Shop name is required to fetch Shopify user info.'
      );
    }

    try {
      // Use Shopify Admin API 2024-01
      const response = await fetch(`https://${shop}.myshopify.com/admin/api/2024-01/shop.json`, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new ConnectorError(
          this.platform,
          'USER_INFO_FAILED',
          `Shop info fetch failed: ${error}`,
          { status: response.status, body: error }
        );
      }

      const json = await response.json() as any;
      const shopData = json.shop;

      return {
        id: shopData.id || shop,
        name: shopData.name,
        email: shopData.email,
        shop,
        domain: shopData.domain,
        shopName: shopData.name,
        shopEmail: shopData.email,
        currency: shopData.currency,
        ...shopData,
      };
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        this.platform,
        'USER_INFO_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Verify HMAC signature for Shopify OAuth requests
   *
   * Shopify uses HMAC to verify the integrity of OAuth requests.
   * This prevents request tampering.
   *
   * @param params - All OAuth parameters (excluding hmac and signature)
   * @param hmac - HMAC signature from request
   * @returns Whether HMAC is valid
   */
  verifyHMAC(params: Record<string, string>, hmac: string): boolean {
    // Remove hmac and signature from params
    const filteredParams = Object.keys(params)
      .filter((key) => key !== 'hmac' && key !== 'signature')
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, string>);

    // Create query string
    const queryString = Object.keys(filteredParams)
      .map((key) => `${key}=${filteredParams[key]}`)
      .join('&');

    // Compute HMAC
    const computedHmac = crypto
      .createHmac('sha256', this.getClientSecret())
      .update(queryString)
      .digest('base64');

    // Use timingSafeEqual to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHmac),
        Buffer.from(hmac)
      );
    } catch {
      // Fall back to string comparison if buffers are incompatible
      return computedHmac === hmac;
    }
  }
}

// Export singleton instance
export const shopifyConnector = new ShopifyConnector();
