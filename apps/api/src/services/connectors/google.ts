import { env } from '../../lib/env';
import type { AccessLevel } from '@agency-platform/shared';

/**
 * Unified Google OAuth Connector
 *
 * Handles OAuth 2.0 flow for all Google products using a single authorization.
 * After connecting, agencies can access all their Google accounts:
 * - Google Ads
 * - Google Analytics (GA4)
 * - Google Business Profile
 * - Google Tag Manager
 * - Google Search Console
 * - Google Merchant Center
 *
 * Documentation: https://developers.google.com/identity/protocols/oauth2
 */

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: Date;
}

// Google product account types
export interface GoogleAdsAccount {
  id: string;
  name: string;
  type: 'google_ads';
  status: string;
}

export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  displayName: string;
  type: 'ga4';
  accountName: string;
}

export interface GoogleBusinessAccount {
  id: string;
  name: string;
  type: 'google_business';
  locationCount?: number;
}

export interface GoogleTagManagerContainer {
  id: string;
  name: string;
  type: 'google_tag_manager';
  accountId: string;
  accountName: string;
}

export interface GoogleSearchConsoleSite {
  id: string;
  url: string;
  type: 'google_search_console';
  permissionLevel: string;
}

export interface GoogleMerchantCenterAccount {
  id: string;
  name: string;
  type: 'google_merchant_center';
  websiteUrl?: string;
}

// Union type for all Google product accounts
export type GoogleProductAccount =
  | GoogleAdsAccount
  | GoogleAnalyticsProperty
  | GoogleBusinessAccount
  | GoogleTagManagerContainer
  | GoogleSearchConsoleSite
  | GoogleMerchantCenterAccount;

// Combined result with all available accounts
export interface GoogleAccountsResponse {
  adsAccounts: GoogleAdsAccount[];
  analyticsProperties: GoogleAnalyticsProperty[];
  businessAccounts: GoogleBusinessAccount[];
  tagManagerContainers: GoogleTagManagerContainer[];
  searchConsoleSites: GoogleSearchConsoleSite[];
  merchantCenterAccounts: GoogleMerchantCenterAccount[];
  hasAccess: boolean;
}

export class GoogleConnector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  // Combined OAuth scopes for all Google products
  private readonly DEFAULT_SCOPES = [
    // Google Ads
    'https://www.googleapis.com/auth/adwords',
    // Google Analytics
    'https://www.googleapis.com/auth/analytics.readonly',
    // Google Business Profile (optional, requires verification)
    'https://www.googleapis.com/auth/business.manage',
    // Google Tag Manager
    'https://www.googleapis.com/auth/tagmanager.readonly',
    // Google Search Console (uses OAuth, no specific scope needed)
    // Google Merchant Center
    'https://www.googleapis.com/auth/content',
  ];

  constructor() {
    this.clientId = env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = env.GOOGLE_CLIENT_SECRET || '';
    // Use backend API URL for OAuth callback (not frontend)
    // In development: http://localhost:3001/agency-platforms/google/callback
    // In production: Configure API_URL environment variable
    const backendUrl = env.API_URL || `http://localhost:${env.PORT}`;
    this.redirectUri = `${backendUrl}/agency-platforms/google/callback`;
  }

  /**
   * Generate OAuth authorization URL with combined scopes
   *
   * @param state - CSRF protection token
   * @param scopes - OAuth scopes (defaults to all Google products)
   * @returns Authorization URL
   */
  getAuthUrl(state: string, scopes: string[] = this.DEFAULT_SCOPES): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline', // Enable refresh tokens
      prompt: 'consent', // Force consent to get refresh token
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   *
   * @param code - Authorization code from OAuth callback
   * @returns Access token with refresh token
   */
  async exchangeCode(code: string): Promise<GoogleTokens> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token exchange failed: ${error}`);
    }

    const data = (await response.json()) as GoogleTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Refresh token from initial exchange
   * @returns New access token
   */
  async refreshToken(refreshToken: string): Promise<GoogleTokens> {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token refresh failed: ${error}`);
    }

    const data = (await response.json()) as GoogleTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken, // Keep the same refresh token
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  /**
   * Verify token is still valid
   *
   * @param accessToken - Token to verify
   * @returns Whether token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=${accessToken}`,
        { method: 'GET' }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get user info from Google OAuth
   *
   * @param accessToken - Valid access token
   * @returns User profile data
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  }> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google user info fetch failed: ${error}`);
    }

    const data = (await response.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    return data;
  }

  /**
   * Fetch all available Google accounts across all products
   *
   * This method queries all supported Google APIs to discover which
   * accounts the user has access to. Each product API is called independently
   * and errors are caught per-product so partial failures don't affect the overall result.
   *
   * @param accessToken - Valid Google OAuth access token
   * @returns All available Google accounts across products
   */
  async getAllGoogleAccounts(accessToken: string): Promise<GoogleAccountsResponse> {
    const result: GoogleAccountsResponse = {
      adsAccounts: [],
      analyticsProperties: [],
      businessAccounts: [],
      tagManagerContainers: [],
      searchConsoleSites: [],
      merchantCenterAccounts: [],
      hasAccess: false,
    };

    // Fetch accounts from each Google product in parallel
    const [
      adsResult,
      analyticsResult,
      businessResult,
      tagManagerResult,
      searchConsoleResult,
      merchantResult,
    ] = await Promise.allSettled([
      this.getAdsAccounts(accessToken).catch(() => ({ accounts: [] })),
      this.getAnalyticsProperties(accessToken).catch(() => ({ properties: [] })),
      this.getBusinessAccounts(accessToken).catch(() => ({ accounts: [] })),
      this.getTagManagerContainers(accessToken).catch(() => ({ containers: [] })),
      this.getSearchConsoleSites(accessToken).catch(() => ({ sites: [] })),
      this.getMerchantCenterAccounts(accessToken).catch(() => ({ accounts: [] })),
    ]);

    // Process Google Ads
    if (adsResult.status === 'fulfilled' && adsResult.value.accounts.length > 0) {
      result.adsAccounts = adsResult.value.accounts;
      result.hasAccess = true;
    }

    // Process Google Analytics
    if (analyticsResult.status === 'fulfilled' && analyticsResult.value.properties.length > 0) {
      result.analyticsProperties = analyticsResult.value.properties;
      result.hasAccess = true;
    }

    // Process Google Business Profile
    if (businessResult.status === 'fulfilled' && businessResult.value.accounts.length > 0) {
      result.businessAccounts = businessResult.value.accounts;
      result.hasAccess = true;
    }

    // Process Google Tag Manager
    if (tagManagerResult.status === 'fulfilled' && tagManagerResult.value.containers.length > 0) {
      result.tagManagerContainers = tagManagerResult.value.containers;
      result.hasAccess = true;
    }

    // Process Google Search Console
    if (searchConsoleResult.status === 'fulfilled' && searchConsoleResult.value.sites.length > 0) {
      result.searchConsoleSites = searchConsoleResult.value.sites;
      result.hasAccess = true;
    }

    // Process Google Merchant Center
    if (merchantResult.status === 'fulfilled' && merchantResult.value.accounts.length > 0) {
      result.merchantCenterAccounts = merchantResult.value.accounts;
      result.hasAccess = true;
    }

    return result;
  }

  /**
   * Fetch Google Ads accounts
   *
   * @param accessToken - Valid access token
   * @returns Accessible Google Ads accounts
   */
  private async getAdsAccounts(accessToken: string): Promise<{ accounts: GoogleAdsAccount[] }> {
    try {
      const response = await fetch(
        `https://googleads.googleapis.com/v17/customers:listAccessibleCustomers?access_token=${accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        return { accounts: [] };
      }

      const data = await response.json() as {
        resourceNames?: string[];
      };

      const accounts: GoogleAdsAccount[] = (data.resourceNames || []).map((resourceName) => {
        const customerId = resourceName.split('/').pop() || resourceName;
        return {
          id: customerId,
          name: `Account ${customerId}`,
          type: 'google_ads',
          status: 'active',
        };
      });

      return { accounts };
    } catch {
      return { accounts: [] };
    }
  }

  /**
   * Fetch Google Analytics (GA4) properties
   *
   * @param accessToken - Valid access token
   * @returns Accessible GA4 properties
   */
  private async getAnalyticsProperties(
    accessToken: string
  ): Promise<{ properties: GoogleAnalyticsProperty[] }> {
    try {
      const response = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?access_token=${accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        return { properties: [] };
      }

      const data = await response.json() as {
        accountSummaries?: Array<{
          account?: string;
          displayName?: string;
          propertySummaries?: Array<{
            property?: string;
            displayName?: string;
          }>;
        }>;
      };

      const properties: GoogleAnalyticsProperty[] = [];

      for (const accountSummary of data.accountSummaries || []) {
        const accountId = accountSummary.account?.split('/').pop() || '';
        const accountName = accountSummary.displayName || `Account ${accountId}`;

        for (const propSummary of accountSummary.propertySummaries || []) {
          const propertyId = propSummary.property?.split('/').pop() || '';
          properties.push({
            id: propertyId,
            name: propSummary.property || '',
            displayName: propSummary.displayName || `Property ${propertyId}`,
            type: 'ga4',
            accountName,
          });
        }
      }

      return { properties };
    } catch {
      return { properties: [] };
    }
  }

  /**
   * Fetch Google Business Profile accounts
   *
   * @param accessToken - Valid access token
   * @returns Accessible Business Profile accounts
   */
  private async getBusinessAccounts(
    accessToken: string
  ): Promise<{ accounts: GoogleBusinessAccount[] }> {
    try {
      const response = await fetch(
        `https://mybusinessaccountmanagement.googleapis.com/v1/accounts?access_token=${accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        return { accounts: [] };
      }

      const data = await response.json() as {
        accounts?: Array<{
          name: string;
          accountName?: string;
          type?: string;
        }>;
      };

      const accounts: GoogleBusinessAccount[] = (data.accounts || []).map((account) => ({
        id: account.name?.split('/').pop() || '',
        name: account.accountName || account.name,
        type: 'google_business',
      }));

      return { accounts };
    } catch {
      return { accounts: [] };
    }
  }

  /**
   * Fetch Google Tag Manager containers
   *
   * @param accessToken - Valid access token
   * @returns Accessible GTM containers
   */
  private async getTagManagerContainers(
    accessToken: string
  ): Promise<{ containers: GoogleTagManagerContainer[] }> {
    try {
      // First, get all accounts
      const accountsResponse = await fetch(
        `https://www.googleapis.com/tagmanager/v2/accounts?access_token=${accessToken}`,
        { method: 'GET' }
      );

      if (!accountsResponse.ok) {
        return { containers: [] };
      }

      const accountsData = await accountsResponse.json() as {
        account?: Array<{
          accountId: string;
          name: string;
        }>;
      };

      const containers: GoogleTagManagerContainer[] = [];

      // For each account, fetch containers
      for (const account of accountsData.account || []) {
        const containersResponse = await fetch(
          `https://www.googleapis.com/tagmanager/v2/accounts/${account.accountId}/containers?access_token=${accessToken}`,
          { method: 'GET' }
        );

        if (containersResponse.ok) {
          const containersData = await containersResponse.json() as {
            container?: Array<{
              containerId: string;
              name: string;
            }>;
          };

          for (const container of containersData.container || []) {
            containers.push({
              id: container.containerId,
              name: container.name,
              type: 'google_tag_manager',
              accountId: account.accountId,
              accountName: account.name,
            });
          }
        }
      }

      return { containers };
    } catch {
      return { containers: [] };
    }
  }

  /**
   * Fetch Google Search Console sites
   *
   * @param accessToken - Valid access token
   * @returns Accessible Search Console sites
   */
  private async getSearchConsoleSites(
    accessToken: string
  ): Promise<{ sites: GoogleSearchConsoleSite[] }> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites?access_token=${accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        return { sites: [] };
      }

      const data = await response.json() as {
        siteEntry?: Array<{
          siteUrl: string;
          permissionLevel?: string;
        }>;
      };

      const sites: GoogleSearchConsoleSite[] = (data.siteEntry || []).map((site) => ({
        id: site.siteUrl,
        url: site.siteUrl,
        type: 'google_search_console',
        permissionLevel: site.permissionLevel || 'unknown',
      }));

      return { sites };
    } catch {
      return { sites: [] };
    }
  }

  /**
   * Fetch Google Merchant Center accounts
   *
   * @param accessToken - Valid access token
   * @returns Accessible Merchant Center accounts
   */
  private async getMerchantCenterAccounts(
    accessToken: string
  ): Promise<{ accounts: GoogleMerchantCenterAccount[] }> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/content/v2.1/accounts?access_token=${accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        return { accounts: [] };
      }

      const data = await response.json() as {
        resources?: Array<{
          id: string;
          name?: string;
          websiteUrl?: string;
        }>;
      };

      const accounts: GoogleMerchantCenterAccount[] = (data.resources || []).map((account) => ({
        id: account.id,
        name: account.name || `Account ${account.id}`,
        type: 'google_merchant_center',
        websiteUrl: account.websiteUrl,
      }));

      return { accounts };
    } catch {
      return { accounts: [] };
    }
  }
}

// Export singleton instance
export const googleConnector = new GoogleConnector();
