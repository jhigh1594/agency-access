import { env } from '../../lib/env.js';
import type {
  AccessLevel,
  GoogleAdsAccount,
  GoogleAnalyticsProperty,
  GoogleBusinessAccount,
  GoogleTagManagerContainer,
  GoogleSearchConsoleSite,
  GoogleMerchantCenterAccount,
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

export type GoogleProduct =
  | 'google_ads'
  | 'ga4'
  | 'google_business_profile'
  | 'google_tag_manager'
  | 'google_search_console'
  | 'google_merchant_center';

export class GoogleConnector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  // Combined OAuth scopes for all Google products
  private readonly DEFAULT_SCOPES = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/tagmanager.readonly',
    'https://www.googleapis.com/auth/webmasters',
    'https://www.googleapis.com/auth/content',
  ];

  constructor() {
    this.clientId = env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = env.GOOGLE_CLIENT_SECRET || '';
    const backendUrl = env.API_URL || `http://localhost:${env.PORT}`;
    this.redirectUri = `${backendUrl}/agency-platforms/google/callback`;
  }

  private appendPageToken(url: string, pageToken?: string): string {
    if (!pageToken) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}pageToken=${encodeURIComponent(pageToken)}`;
  }

  /**
   * Generate OAuth authorization URL with combined scopes
   */
  getAuthUrl(state: string, scopes: string[] = this.DEFAULT_SCOPES, redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri ?? this.redirectUri,
      state,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
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
      refreshToken,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  /**
   * Verify token is still valid
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
      this.getBusinessLocations(accessToken).catch(() => ({ accounts: [] })),
      this.getTagManagerContainers(accessToken).catch(() => ({ containers: [] })),
      this.getSearchConsoleSites(accessToken).catch(() => ({ sites: [] })),
      this.getMerchantCenterAccounts(accessToken).catch(() => ({ accounts: [] })),
    ]);

    if (adsResult.status === 'fulfilled' && adsResult.value.accounts.length > 0) {
      result.adsAccounts = adsResult.value.accounts;
      result.hasAccess = true;
    }

    if (analyticsResult.status === 'fulfilled' && analyticsResult.value.properties.length > 0) {
      result.analyticsProperties = analyticsResult.value.properties;
      result.hasAccess = true;
    }

    if (businessResult.status === 'fulfilled' && businessResult.value.accounts.length > 0) {
      result.businessAccounts = businessResult.value.accounts;
      result.hasAccess = true;
    }

    if (tagManagerResult.status === 'fulfilled' && tagManagerResult.value.containers.length > 0) {
      result.tagManagerContainers = tagManagerResult.value.containers;
      result.hasAccess = true;
    }

    if (searchConsoleResult.status === 'fulfilled' && searchConsoleResult.value.sites.length > 0) {
      result.searchConsoleSites = searchConsoleResult.value.sites;
      result.hasAccess = true;
    }

    if (merchantResult.status === 'fulfilled' && merchantResult.value.accounts.length > 0) {
      result.merchantCenterAccounts = merchantResult.value.accounts;
      result.hasAccess = true;
    }

    return result;
  }

  async getAccountsForProduct(
    product: GoogleProduct,
    accessToken: string
  ): Promise<GoogleProductAccount[]> {
    switch (product) {
      case 'google_ads':
        return (await this.getAdsAccounts(accessToken)).accounts;
      case 'ga4':
        return (await this.getAnalyticsProperties(accessToken)).properties;
      case 'google_business_profile':
        return (await this.getBusinessLocations(accessToken)).accounts;
      case 'google_tag_manager':
        return (await this.getTagManagerContainers(accessToken)).containers;
      case 'google_search_console':
        return (await this.getSearchConsoleSites(accessToken)).sites;
      case 'google_merchant_center':
        return (await this.getMerchantCenterAccounts(accessToken)).accounts;
    }
  }

  /**
   * Fetch Google Ads accounts
   */
  private async getAdsAccounts(accessToken: string): Promise<{ accounts: GoogleAdsAccount[] }> {
    try {
      console.log('🔍 Starting Google Ads account fetch...');
      const developerToken = env.GOOGLE_ADS_DEVELOPER_TOKEN;

      if (!developerToken) {
        console.warn('GOOGLE_ADS_DEVELOPER_TOKEN not configured - Google Ads accounts will not be available');
        return { accounts: [] };
      }

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

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;

            if (errorMessage.includes('Google Ads API has not been used') || errorMessage.includes('it is disabled')) {
              console.error('Google Ads API Error: API not enabled in Google Cloud project');
              console.error('Enable it at: https://console.developers.google.com/apis/api/googleads.googleapis.com/overview');
              console.error('Full error:', errorMessage);
            }
          }
        } catch {
          // Ignore JSON parse failures for error payloads.
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

      const data = (await response.json()) as {
        resourceNames?: string[];
      };

      if (!data.resourceNames || data.resourceNames.length === 0) {
        console.log('⚠️ No accessible Google Ads accounts found');
        return { accounts: [] };
      }

      const customerIds = data.resourceNames.map((resourceName) => {
        const id = resourceName.split('/').pop() || resourceName;
        return id.replace(/-/g, '');
      });

      console.log(`📋 Found ${customerIds.length} accessible Google Ads account(s):`, customerIds);

      const accountMap = new Map<string, { id: string; name: string }>();

      if (customerIds.length > 0) {
        const accountQueries = customerIds.map(async (customerId) => {
          try {
            console.log(`🔎 Querying account details for customer ${customerId}...`);

            const searchResponse = await fetch(
              `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:search`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'developer-token': developerToken,
                  'Content-Type': 'application/json',
                  'login-customer-id': customerId,
                },
                body: JSON.stringify({
                  query: 'SELECT customer_client.descriptive_name, customer_client.id, customer_client.status, customer_client.manager FROM customer_client WHERE customer_client.level <= 1',
                }),
              }
            );

            if (searchResponse.ok) {
              const searchData = (await searchResponse.json()) as {
                results?: Array<{
                  customerClient?: {
                    id?: string;
                    descriptiveName?: string;
                    status?: string;
                    manager?: boolean;
                  };
                }>;
              };

              for (const result of searchData.results || []) {
                const client = result.customerClient;
                if (!client?.id || !client.descriptiveName) {
                  continue;
                }

                const clientId = client.id.toString().replace(/^customers\//, '').replace(/-/g, '');
                if (!clientId) {
                  continue;
                }

                console.log(`  📝 Account: ${clientId} = "${client.descriptiveName}" ${client.manager ? '(Manager)' : ''}`);
                accountMap.set(clientId, {
                  id: clientId,
                  name: client.descriptiveName,
                });
              }

              return;
            }

            const errorText = await searchResponse.text();
            let errorMessage = '';
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error?.message || '';
            } catch {
              errorMessage = errorText.substring(0, 200);
            }

            if (searchResponse.status === 403) {
              console.warn(`❌ Access denied for ${customerId} (403 Permission Denied)`);
              console.warn('   This likely means your Developer Token is "Test Access" but you are trying to query Production accounts.');
              console.warn('   Solution: Apply for "Basic Access" in Google Ads Manager Account > Tools & Settings > API Center');
              console.warn('   Or use Test Accounts for development: https://ads.google.com/aw/billing/testaccountcreate');
              accountMap.set(customerId, {
                id: customerId,
                name: `Account ${customerId} (Restricted - Check Dev Token Access Level)`,
              });
              return;
            }

            console.warn(`❌ Failed to query account ${customerId}:`, {
              status: searchResponse.status,
              error: errorMessage,
            });
          } catch (error) {
            console.error(`❌ Error querying account ${customerId}:`, error);
          }
        });

        await Promise.all(accountQueries);
      }

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

        const formattedId =
          customerId.length === 10
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
   */
  private async getAnalyticsProperties(
    accessToken: string
  ): Promise<{ properties: GoogleAnalyticsProperty[] }> {
    try {
      const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn('Google Analytics Admin API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 300),
        });
        return { properties: [] };
      }

      const data = (await response.json()) as {
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
    } catch (error) {
      console.error('Failed to fetch Google Analytics properties:', error);
      return { properties: [] };
    }
  }

  /**
   * Fetch Google Business Profile locations.
   */
  private async getBusinessLocations(
    accessToken: string
  ): Promise<{ accounts: GoogleBusinessAccount[] }> {
    try {
      const businessAccounts: Array<{ name: string; accountName?: string }> = [];
      let nextAccountsPageToken: string | undefined;

      do {
        const response = await fetch(
          this.appendPageToken(
            'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
            nextAccountsPageToken
          ),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();

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

        const data = (await response.json()) as {
          accounts?: Array<{
            name: string;
            accountName?: string;
            type?: string;
          }>;
          nextPageToken?: string;
        };

        businessAccounts.push(...(data.accounts || []));
        nextAccountsPageToken = data.nextPageToken;
      } while (nextAccountsPageToken);

      const locationResponses = await Promise.all(
        businessAccounts.map(async (account) => {
          try {
            const locations: GoogleBusinessAccount[] = [];
            let nextLocationsPageToken: string | undefined;

            do {
              const response = await fetch(
                this.appendPageToken(
                  `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`,
                  nextLocationsPageToken
                ),
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.warn('Google Business Profile locations API error:', {
                  status: response.status,
                  statusText: response.statusText,
                  error: errorText.substring(0, 200),
                  account: account.name,
                });
                return [];
              }

              const data = (await response.json()) as {
                locations?: Array<{
                  name: string;
                  title?: string;
                }>;
                nextPageToken?: string;
              };

              locations.push(
                ...(data.locations || []).map((location) => ({
                  id: location.name?.split('/').pop() || '',
                  name: location.title || location.name,
                  type: 'google_business' as const,
                  accountName: account.accountName || account.name,
                }))
              );

              nextLocationsPageToken = data.nextPageToken;
            } while (nextLocationsPageToken);

            return locations;
          } catch (error) {
            console.warn(`Failed to fetch locations for GBP account ${account.name}:`, error);
            return [];
          }
        })
      );

      return { accounts: locationResponses.flat() };
    } catch (error) {
      console.error('Failed to fetch Google Business Profile accounts:', error);
      return { accounts: [] };
    }
  }

  /**
   * Fetch Google Tag Manager containers
   */
  private async getTagManagerContainers(
    accessToken: string
  ): Promise<{ containers: GoogleTagManagerContainer[] }> {
    try {
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

      const accountsData = (await accountsResponse.json()) as {
        account?: Array<{
          accountId: string;
          name: string;
        }>;
      };

      const containerArrays = await Promise.all(
        (accountsData.account || []).map(async (account) => {
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

            if (!containersResponse.ok) {
              return [];
            }

            const containersData = (await containersResponse.json()) as {
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
          } catch (error) {
            console.warn(`Failed to fetch containers for GTM account ${account.accountId}:`, error);
            return [];
          }
        })
      );

      return { containers: containerArrays.flat() };
    } catch (error) {
      console.error('Failed to fetch Google Tag Manager containers:', error);
      return { containers: [] };
    }
  }

  /**
   * Fetch Google Search Console sites
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

      const data = (await response.json()) as {
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
   */
  private async getMerchantCenterAccounts(
    accessToken: string
  ): Promise<{ accounts: GoogleMerchantCenterAccount[] }> {
    try {
      const response = await fetch(
        'https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Google Merchant Center API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
        });
        return { accounts: [] };
      }

      const data = (await response.json()) as {
        accountIdentifiers?: Array<{
          merchantId?: string | number;
        }>;
      };

      const merchantIds = (data.accountIdentifiers || [])
        .map((account) => String(account.merchantId || ''))
        .filter(Boolean);

      const accountMap = new Map<string, GoogleMerchantCenterAccount>();

      await Promise.all(
        merchantIds.map(async (merchantId) => {
          try {
            const detailResponse = await fetch(
              `https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/accounts/${merchantId}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );

            if (detailResponse.ok) {
              const detail = (await detailResponse.json()) as {
                id?: string | number;
                name?: string;
                websiteUrl?: string;
              };

              const id = String(detail.id || merchantId);
              accountMap.set(id, {
                id,
                name: detail.name || `Merchant Center ${id}`,
                type: 'google_merchant_center',
                websiteUrl: detail.websiteUrl,
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch Merchant Center account detail for ${merchantId}:`, error);
          }

          try {
            const listResponse = await fetch(
              `https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/accounts`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );

            if (listResponse.ok) {
              const listData = (await listResponse.json()) as {
                resources?: Array<{
                  id?: string | number;
                  name?: string;
                  websiteUrl?: string;
                }>;
              };

              for (const account of listData.resources || []) {
                const id = String(account.id || '');
                if (!id) {
                  continue;
                }

                accountMap.set(id, {
                  id,
                  name: account.name || `Merchant Center ${id}`,
                  type: 'google_merchant_center',
                  websiteUrl: account.websiteUrl,
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to list Merchant Center sub-accounts for ${merchantId}:`, error);
          }

          if (!accountMap.has(merchantId)) {
            accountMap.set(merchantId, {
              id: merchantId,
              name: `Merchant Center ${merchantId}`,
              type: 'google_merchant_center',
            });
          }
        })
      );

      return { accounts: Array.from(accountMap.values()) };
    } catch (error) {
      console.error('Failed to fetch Google Merchant Center accounts:', error);
      return { accounts: [] };
    }
  }
}

// Export singleton instance
export const googleConnector = new GoogleConnector();
