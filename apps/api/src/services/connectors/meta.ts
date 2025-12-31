import { env } from '../../lib/env.js';
import type { AccessLevel, MetaAdAccount, MetaPage, MetaInstagramAccount, MetaProductCatalog, MetaAllAssets } from '@agency-platform/shared';

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

  /**
   * Default Marketing API permissions for agency access
   *
   * These are NOT Facebook Login permissions (email, public_profile).
   * These are Marketing API permissions for ads and business management.
   *
   * Simplified to only request Business Manager access, not individual pages.
   *
   * Reference: https://developers.facebook.com/docs/marketing-api/overview
   */
  static readonly DEFAULT_SCOPES = [
    'ads_management',      // Create and manage ads
    'ads_read',            // Read ads data
    'business_management', // Access Business Manager assets (includes page management)
    // Note: pages_manage_metadata and pages_show_list are not valid OAuth scopes
    // They are automatically granted with business_management or configured at app level
  ];

  constructor() {
    this.appId = env.META_APP_ID;
    this.appSecret = env.META_APP_SECRET;
    // Use agency-platforms callback for production (redirects to frontend)
    // For testing, use /api/oauth/meta/callback in Meta app settings
    this.redirectUri = `${env.API_URL}/agency-platforms/meta/callback`;
  }

  /**
   * Generate OAuth authorization URL
   *
   * Uses Meta Marketing API permissions (NOT Facebook Login permissions).
   * Default scopes are for ads management, business management, and page access.
   *
   * @param state - CSRF protection token (should be stored in session/database)
   * @param scopes - Marketing API permissions to request
   * @param redirectUri - Optional override for redirect URI (used in client flow)
   * @returns Authorization URL to redirect user to
   */
  getAuthUrl(state: string, scopes?: string[], redirectUri?: string): string {
    // Use default scopes if none provided
    const scopesToUse = scopes ?? MetaConnector.DEFAULT_SCOPES;
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri ?? this.redirectUri,
      state,
      scope: scopesToUse.join(','),
      response_type: 'code',
    });

    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for short-lived access token
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Optional override for redirect URI (must match getAuthUrl)
   * @returns Short-lived access token (expires in ~2 hours)
   */
  async exchangeCode(code: string, redirectUri?: string): Promise<MetaTokens> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri ?? this.redirectUri,
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
   * Note: With Marketing API permissions, email is NOT available.
   * For agency use cases, you should fetch business and ad account info instead.
   *
   * @param accessToken - Valid Meta access token
   * @returns User profile data (id, name - email not available with Marketing API)
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    name: string;
  }> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta user info fetch failed: ${error}`);
    }

    return (await response.json()) as { id: string; name: string };
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
   * Get all Meta Business Manager accounts for the agency
   *
   * Fetches all Business Manager accounts the agency has access to.
   * This is used to display available businesses in the UI after connection.
   *
   * @param accessToken - Valid Meta access token
   * @returns Business Manager accounts with metadata
   */
  async getBusinessAccounts(accessToken: string): Promise<{
    businesses: Array<{
      id: string;
      name: string;
      verticalName?: string;
      verificationStatus?: string;
    }>;
    hasAccess: boolean;
  }> {
    try {
      // Fetch all Business Manager accounts
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me/businesses?fields=id,name,vertical_name,verification_status&access_token=${accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch business accounts: ${error}`);
      }

      const data = (await response.json()) as {
        data?: Array<{
          id: string;
          name: string;
          vertical_name?: string;
          verification_status?: string;
        }>;
      };

      const businesses = (data.data || []).map((business) => ({
        id: business.id,
        name: business.name,
        verticalName: business.vertical_name,
        verificationStatus: business.verification_status,
      }));

      return {
        businesses,
        hasAccess: businesses.length > 0,
      };
    } catch (error) {
      // If fetching fails, return empty but don't throw - connection still valid
      return {
        businesses: [],
        hasAccess: false,
      };
    }
  }

  /**
   * Get ad accounts for a business
   */
  async getAdAccounts(accessToken: string, businessId: string): Promise<MetaAdAccount[]> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/owned_ad_accounts?fields=id,name,account_status,currency&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch ad accounts: ${error}`);
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        name: string;
        account_status: number;
        currency: string;
      }>;
    };

    return (data.data || []).map((account) => ({
      id: account.id,
      name: account.name,
      accountStatus: account.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
      currency: account.currency,
    }));
  }

  /**
   * Get pages for a business
   */
  async getPages(accessToken: string, businessId: string): Promise<MetaPage[]> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/owned_pages?fields=id,name,category,tasks&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch pages: ${error}`);
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        name: string;
        category: string;
        tasks: string[];
      }>;
    };

    return (data.data || []).map((page) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      tasks: page.tasks,
    }));
  }

  /**
   * Get Instagram accounts for a business
   */
  async getInstagramAccounts(accessToken: string, businessId: string): Promise<MetaInstagramAccount[]> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/instagram_accounts?fields=id,username,profile_picture_url&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Instagram accounts: ${error}`);
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        username: string;
        profile_picture_url?: string;
      }>;
    };

    return (data.data || []).map((account) => ({
      id: account.id,
      username: account.username,
      profilePictureUrl: account.profile_picture_url,
    }));
  }

  /**
   * Get product catalogs for a business
   */
  async getProductCatalogs(accessToken: string, businessId: string): Promise<MetaProductCatalog[]> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/owned_product_catalogs?fields=id,name,catalog_type&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch product catalogs: ${error}`);
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        name: string;
        catalog_type: string;
      }>;
    };

    return (data.data || []).map((catalog) => ({
      id: catalog.id,
      name: catalog.name,
      catalogType: catalog.catalog_type,
    }));
  }

  /**
   * Get all assets for a business (composite)
   */
  async getAllAssets(accessToken: string, businessId: string): Promise<MetaAllAssets> {
    // Fetch business name first
    const businessResponse = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}?fields=name&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!businessResponse.ok) {
      const error = await businessResponse.text();
      throw new Error(`Failed to fetch business info: ${error}`);
    }

    const businessData = (await businessResponse.json()) as { name: string };

    // Fetch all assets in parallel
    const [adAccounts, pages, instagramAccounts, productCatalogs] = await Promise.all([
      this.getAdAccounts(accessToken, businessId),
      this.getPages(accessToken, businessId),
      this.getInstagramAccounts(accessToken, businessId),
      this.getProductCatalogs(accessToken, businessId),
    ]);

    return {
      businessId,
      businessName: businessData.name,
      adAccounts,
      pages,
      instagramAccounts,
      productCatalogs,
    };
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
