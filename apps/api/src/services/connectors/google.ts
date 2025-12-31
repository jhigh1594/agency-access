import { env } from '../../lib/env.js';
import type { 
  AccessLevel,
  GoogleAdsAccount,
  GoogleAnalyticsProperty,
  GoogleBusinessAccount,
  GoogleTagManagerContainer,
  GoogleSearchConsoleSite,
  GoogleMerchantCenterAccount
} from '@agency-platform/shared';

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
   * @param redirectUri - Optional override for redirect URI (used in client flow)
   * @returns Authorization URL
   */
  getAuthUrl(state: string, scopes: string[] = this.DEFAULT_SCOPES, redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri ?? this.redirectUri,
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
   * @param redirectUri - Optional override for redirect URI (must match getAuthUrl)
   * @returns Access token with refresh token
   */
  async exchangeCode(code: string, redirectUri?: string): Promise<GoogleTokens> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri ?? this.redirectUri,
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
   * The Google Ads API requires:
   * - Authorization header with Bearer token
   * - developer-token header for API access
   *
   * @param accessToken - Valid access token
   * @returns Accessible Google Ads accounts
   */
  private async getAdsAccounts(accessToken: string): Promise<{ accounts: GoogleAdsAccount[] }> {
    try {
      console.log('🔍 Starting Google Ads account fetch...');
      const developerToken = env.GOOGLE_ADS_DEVELOPER_TOKEN;
      
      // Developer token is required for Google Ads API
      if (!developerToken) {
        console.warn('GOOGLE_ADS_DEVELOPER_TOKEN not configured - Google Ads accounts will not be available');
        return { accounts: [] };
      }

      // Google Ads API REST endpoint for listAccessibleCustomers
      // According to official docs: https://developers.google.com/google-ads/api/docs/account-management/listing-accounts#curl
      // Using v22 (latest version)
      const response = await fetch(
        'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        
        // Try to parse JSON error response for better error messages
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
            
            // Special handling for API not enabled error
            if (errorMessage.includes('Google Ads API has not been used') || 
                errorMessage.includes('it is disabled')) {
              console.error('Google Ads API Error: API not enabled in Google Cloud project');
              console.error('Enable it at: https://console.developers.google.com/apis/api/googleads.googleapis.com/overview');
              console.error('Full error:', errorMessage);
            }
          }
        } catch {
          // If not JSON, use the raw error text
        }
        
        console.error('Google Ads API error:', {
          status: response.status,
          statusText: response.statusText,
          url: 'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
          error: errorMessage.substring(0, 500),
          hasDeveloperToken: !!developerToken,
        });
        return { accounts: [] };
      }

      const data = await response.json() as {
        resourceNames?: string[];
      };

      if (!data.resourceNames || data.resourceNames.length === 0) {
        console.log('⚠️ No accessible Google Ads accounts found');
        return { accounts: [] };
      }

      // Extract customer IDs from resource names
      // Format: "customers/1234567890" -> "1234567890"
      const customerIds = data.resourceNames.map((resourceName) => {
        const id = resourceName.split('/').pop() || resourceName;
        // Remove dashes from customer ID if present (Google Ads IDs can be XXX-XXX-XXXX)
        return id.replace(/-/g, '');
      });

      console.log(`📋 Found ${customerIds.length} accessible Google Ads account(s):`, customerIds);

      // Strategy: Use the "Universal" customer_client query
      // This single query works for BOTH direct accounts and manager accounts
      // - If it's a direct account: returns 1 row (itself)
      // - If it's a manager account: returns itself + all client accounts
      const accountMap = new Map<string, { id: string; name: string }>();

      if (customerIds.length > 0) {
        // Query each account using the universal customer_client query
        const accountQueries = customerIds.map(async (customerId) => {
          try {
            console.log(`🔎 Querying account details for customer ${customerId}...`);
            
            // Universal query: Works for both direct accounts and manager accounts
            const response = await fetch(
              `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:search`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'developer-token': developerToken,
                  'Content-Type': 'application/json',
                  'login-customer-id': customerId, // Required: specifies which account context to use
                },
                body: JSON.stringify({
                  query: 'SELECT customer_client.descriptive_name, customer_client.id, customer_client.status, customer_client.manager FROM customer_client WHERE customer_client.level <= 1',
                }),
              }
            );

            if (response.ok) {
              const data = await response.json() as {
                results?: Array<{
                  customerClient?: {
                    id?: string;
                    descriptiveName?: string;
                    status?: string;
                    manager?: boolean;
                  };
                }>;
              };
              
              const results = data.results || [];
              
              if (results.length > 0) {
                // If we got results, this account is accessible
                // Results include: the account itself (if direct) or the account + its clients (if manager)
                console.log(`✅ Got ${results.length} result(s) for account ${customerId}`);
                
                for (const result of results) {
                  const client = result.customerClient;
                  if (!client?.id || !client.descriptiveName) continue;
                  
                  // Extract customer ID (handle both formats: "1234567890" or "customers/1234567890")
                  const clientId = client.id.toString().replace(/^customers\//, '').replace(/-/g, '');
                  
                  if (clientId) {
                    console.log(`  📝 Account: ${clientId} = "${client.descriptiveName}" ${client.manager ? '(Manager)' : ''}`);
                    accountMap.set(clientId, {
                      id: clientId,
                      name: client.descriptiveName,
                    });
                  }
                }
              } else {
                console.log(`ℹ️ Account ${customerId} returned empty results`);
              }
            } else {
              // Handle 403 errors - likely due to Test Access token trying to access Production accounts
              const errorText = await response.text();
              let errorMessage = '';
              try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || '';
              } catch {
                errorMessage = errorText.substring(0, 200);
              }
              
              if (response.status === 403) {
                console.warn(`❌ Access denied for ${customerId} (403 Permission Denied)`);
                console.warn(`   This likely means your Developer Token is "Test Access" but you're trying to query Production accounts.`);
                console.warn(`   Solution: Apply for "Basic Access" in Google Ads Manager Account > Tools & Settings > API Center`);
                console.warn(`   Or use Test Accounts for development: https://ads.google.com/aw/billing/testaccountcreate`);
                
                // Add fallback entry so UI doesn't break
                accountMap.set(customerId, {
                  id: customerId,
                  name: `Account ${customerId} (Restricted - Check Dev Token Access Level)`,
                });
              } else {
                console.warn(`❌ Failed to query account ${customerId}:`, {
                  status: response.status,
                  error: errorMessage,
                });
              }
            }
          } catch (error) {
            console.error(`❌ Error querying account ${customerId}:`, error);
          }
        });

        // Wait for all queries to complete
        await Promise.all(accountQueries);
      }

      // Build final accounts list using names from map, or fallback to formatted IDs
      const accounts: GoogleAdsAccount[] = customerIds.map((customerId) => {
        const accountInfo = accountMap.get(customerId);
        
        if (accountInfo) {
          return {
            id: customerId,
            name: accountInfo.name,
            type: 'google_ads' as const,
            status: 'active' as const,
          };
        }

        // Fallback: Format customer ID nicely if we couldn't get the name
        // Format: 1234567890 -> 123-456-7890
        const formattedId = customerId.length === 10
          ? `${customerId.slice(0, 3)}-${customerId.slice(3, 6)}-${customerId.slice(6)}`
          : customerId;
        
        return {
          id: customerId,
          name: `Account ${formattedId}`,
          type: 'google_ads' as const,
          status: 'active' as const,
        };
      });

      console.log(`✅ Google Ads fetch complete: ${accounts.length} account(s) found`);
      accounts.forEach((account) => {
        console.log(`  📦 ${account.id}: "${account.name}"`);
      });

      return { accounts };
    } catch (error) {
      console.error('Failed to fetch Google Ads accounts:', error);
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
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle rate limiting (429) - return empty array to avoid blocking other services
        if (response.status === 429) {
          console.warn('Google Business Profile API rate limited (429). Will retry on next request.');
          return { accounts: [] };
        }

        console.warn('Google Business Profile API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
        });
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
    } catch (error) {
      console.error('Failed to fetch Google Business Profile accounts:', error);
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
        'https://www.googleapis.com/tagmanager/v2/accounts',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!accountsResponse.ok) {
        const errorText = await accountsResponse.text();
        console.warn('Google Tag Manager API error (accounts):', {
          status: accountsResponse.status,
          statusText: accountsResponse.statusText,
          error: errorText.substring(0, 200),
        });
        return { containers: [] };
      }

      const accountsData = await accountsResponse.json() as {
        account?: Array<{
          accountId: string;
          name: string;
        }>;
      };

      const containers: GoogleTagManagerContainer[] = [];

      // For each account, fetch containers in parallel
      const containerPromises = (accountsData.account || []).map(async (account) => {
        try {
          const containersResponse = await fetch(
            `https://www.googleapis.com/tagmanager/v2/accounts/${account.accountId}/containers`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (containersResponse.ok) {
            const containersData = await containersResponse.json() as {
              container?: Array<{
                containerId: string;
                name: string;
              }>;
            };

            return (containersData.container || []).map((container) => ({
              id: container.containerId,
              name: container.name,
              type: 'google_tag_manager' as const,
              accountId: account.accountId,
              accountName: account.name,
            }));
          }
          return [];
        } catch (error) {
          console.warn(`Failed to fetch containers for GTM account ${account.accountId}:`, error);
          return [];
        }
      });

      const containerArrays = await Promise.all(containerPromises);
      containers.push(...containerArrays.flat());

      return { containers };
    } catch (error) {
      console.error('Failed to fetch Google Tag Manager containers:', error);
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
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Google Search Console API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
        });
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
    } catch (error) {
      console.error('Failed to fetch Google Search Console sites:', error);
      return { sites: [] };
    }
  }

  /**
   * Fetch Google Merchant Center accounts
   *
   * Note: Merchant Center API may require different authentication or endpoint
   * The Content API for Shopping endpoint structure may vary
   *
   * @param accessToken - Valid access token
   * @returns Accessible Merchant Center accounts
   */
  private async getMerchantCenterAccounts(
    accessToken: string
  ): Promise<{ accounts: GoogleMerchantCenterAccount[] }> {
    try {
      // Try the standard Content API endpoint
      // If this fails, the API may need to be enabled or use a different endpoint
      const response = await fetch(
        'https://shoppingcontent.googleapis.com/content/v2.1/accounts',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // If shoppingcontent fails, try the regular content API
        if (response.status === 404) {
          const altResponse = await fetch(
            'https://www.googleapis.com/content/v2.1/accounts',
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (altResponse.ok) {
            const altData = await altResponse.json() as {
              resources?: Array<{
                id: string;
                name?: string;
                websiteUrl?: string;
              }>;
            };

            const accounts: GoogleMerchantCenterAccount[] = (altData.resources || []).map((account) => ({
              id: account.id,
              name: account.name || `Account ${account.id}`,
              type: 'google_merchant_center',
              websiteUrl: account.websiteUrl,
            }));

            return { accounts };
          }
        }

        const errorText = await response.text();
        console.warn('Google Merchant Center API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
        });
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
    } catch (error) {
      console.error('Failed to fetch Google Merchant Center accounts:', error);
      return { accounts: [] };
    }
  }
}

// Export singleton instance
export const googleConnector = new GoogleConnector();
