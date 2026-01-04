/**
 * ClientAssetsService
 *
 * Fetches client's platform assets using OAuth tokens stored in Infisical.
 * This is the simplified version that fetches assets for display purposes only,
 * NOT for partner access granting (which was removed in favor of standard OAuth).
 *
 * Usage Pattern:
 * 1. Get token from Infisical using PlatformAuthorization.secretId
 * 2. Call fetchMetaAssets(token) to get all assets
 * 3. Display assets to agency or client for informational purposes
 */

import { logger } from '../lib/logger.js';

export interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency?: string;
}

export interface MetaPage {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface MetaInstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

export interface GoogleAdsAccount {
  id: string;
  name: string;
  status: string;
}

export interface GA4Property {
  id: string;
  name: string;
  displayName: string;
  accountName: string;
}

export interface MetaAssets {
  adAccounts: MetaAdAccount[];
  pages: MetaPage[];
  instagramAccounts: MetaInstagramAccount[];
}

class ClientAssetsService {
  private readonly GRAPH_API_VERSION = 'v21.0';
  private readonly GRAPH_API_BASE = `https://graph.facebook.com/${this.GRAPH_API_VERSION}`;

  /**
   * Fetch all Meta assets (ad accounts, pages, Instagram) in parallel
   *
   * @param accessToken - Client's OAuth access token (from Infisical)
   * @returns Object containing arrays of ad accounts, pages, and Instagram accounts
   */
  async fetchMetaAssets(accessToken: string): Promise<MetaAssets> {
    logger.info('Fetching Meta assets for client');

    try {
      // Fetch all assets in parallel for performance
      const [adAccounts, pages, instagramAccounts] = await Promise.all([
        this.fetchAdAccounts(accessToken),
        this.fetchPages(accessToken),
        this.fetchInstagramAccounts(accessToken),
      ]);

      logger.info('Successfully fetched Meta assets', {
        adAccountCount: adAccounts.length,
        pageCount: pages.length,
        instagramAccountCount: instagramAccounts.length,
      });

      return {
        adAccounts,
        pages,
        instagramAccounts,
      };
    } catch (error) {
      logger.error('Failed to fetch Meta assets', { error });
      throw new Error(
        `Failed to fetch Meta assets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch client's Meta ad accounts
   *
   * @param accessToken - Client's OAuth access token
   * @returns Array of ad accounts with id, name, status, and currency
   * @private
   */
  private async fetchAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    try {
      const url = `${this.GRAPH_API_BASE}/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meta API error (ad accounts): ${error}`);
      }

      const data: any = await response.json();
      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch ad accounts', { error });
      // Return empty array on error - don't fail entire fetch
      return [];
    }
  }

  /**
   * Fetch client's Meta pages (Facebook Pages)
   *
   * @param accessToken - Client's OAuth access token
   * @returns Array of pages with id, name, and profile picture
   * @private
   */
  private async fetchPages(accessToken: string): Promise<MetaPage[]> {
    try {
      const url = `${this.GRAPH_API_BASE}/me/accounts?fields=id,name,picture&access_token=${accessToken}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meta API error (pages): ${error}`);
      }

      const data: any = await response.json();
      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch pages', { error });
      // Return empty array on error - don't fail entire fetch
      return [];
    }
  }

  /**
   * Fetch client's Instagram Business accounts
   *
   * This is a two-step process:
   * 1. Get businesses the user owns/manages
   * 2. For each business, fetch connected Instagram accounts
   *
   * @param accessToken - Client's OAuth access token
   * @returns Array of Instagram accounts with id, username, and profile picture
   * @private
   */
  private async fetchInstagramAccounts(accessToken: string): Promise<MetaInstagramAccount[]> {
    try {
      // Step 1: Get businesses
      const businessesUrl = `${this.GRAPH_API_BASE}/me/businesses?fields=id,name&access_token=${accessToken}`;
      const businessesResponse = await fetch(businessesUrl);

      if (!businessesResponse.ok) {
        const error = await businessesResponse.text();
        throw new Error(`Meta API error (businesses): ${error}`);
      }

      const businessesData: any = await businessesResponse.json();
      const businesses = businessesData.data || [];

      if (businesses.length === 0) {
        return [];
      }

      // Step 2: Fetch Instagram accounts for each business in parallel
      const instagramAccountsPromises = businesses.map(async (business: { id: string }) => {
        const igUrl = `${this.GRAPH_API_BASE}/${business.id}/instagram_accounts?fields=id,username,profile_picture_url&access_token=${accessToken}`;
        const igResponse = await fetch(igUrl);

        if (!igResponse.ok) {
          logger.warn(`Failed to fetch Instagram accounts for business ${business.id}`);
          return [];
        }

        const igData: any = await igResponse.json();
        return igData.data || [];
      });

      const instagramAccountsArrays = await Promise.all(instagramAccountsPromises);

      // Flatten arrays and deduplicate by ID
      const allAccounts: any[] = instagramAccountsArrays.flat();
      const uniqueAccounts = Array.from(
        new Map(allAccounts.map((account: any) => [account.id, account])).values()
      ) as MetaInstagramAccount[];

      return uniqueAccounts;
    } catch (error) {
      logger.error('Failed to fetch Instagram accounts', { error });
      // Return empty array on error - don't fail entire fetch
      return [];
    }
  }

  /**
   * Fetch accessible Google Ads accounts
   * Note: This method is deprecated - use GoogleConnector.getAdsAccounts instead
   * which properly handles the developer token header
   */
  async fetchGoogleAdsAccounts(accessToken: string): Promise<GoogleAdsAccount[]> {
    try {
      const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      if (!developerToken) {
        logger.warn('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
        return [];
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
        const error = await response.text();
        throw new Error(`Google Ads API error: ${error}`);
      }

      const data = (await response.json()) as any;
      const resourceNames = data.resourceNames || [];

      return resourceNames.map((name: string) => {
        const id = name.split('/').pop() || name;
        return {
          id,
          name: `Account ${id}`,
          status: 'active',
        };
      });
    } catch (error) {
      logger.error('Failed to fetch Google Ads accounts', { error });
      return [];
    }
  }

  /**
   * Fetch accessible GA4 properties
   */
  async fetchGA4Properties(accessToken: string): Promise<GA4Property[]> {
    try {
      const response = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GA4 API error: ${error}`);
      }

      const data = (await response.json()) as any;
      const properties: GA4Property[] = [];

      for (const accountSummary of data.accountSummaries || []) {
        const accountName = accountSummary.displayName || 'Unknown Account';
        for (const propSummary of accountSummary.propertySummaries || []) {
          const id = propSummary.property?.split('/').pop() || '';
          properties.push({
            id,
            name: propSummary.property || '',
            displayName: propSummary.displayName || `Property ${id}`,
            accountName,
          });
        }
      }

      return properties;
    } catch (error) {
      logger.error('Failed to fetch GA4 properties', { error });
      return [];
    }
  }

  // ==========================================================================
  // NEW PLATFORM ASSET FETCHING (Mailchimp, Pinterest, Klaviyo, Shopify, TikTok)
  // ==========================================================================

  /**
   * Fetch Mailchimp assets (lists/audiences and campaigns)
   *
   * @param accessToken - Client's OAuth access token
   * @param dc - Data center prefix (e.g., "us12") from metadata
   * @returns Object containing arrays of lists and campaigns
   */
  async fetchMailchimpAssets(accessToken: string, dc: string): Promise<{
    lists: any[];
    campaigns: any[];
  }> {
    logger.info('Fetching Mailchimp assets');

    try {
      const baseUrl = `https://${dc}.api.mailchimp.com/3.0/`;

      // Fetch lists (audiences)
      const listsResponse = await fetch(`${baseUrl}lists?count=100`, {
        headers: { 'Authorization': `OAuth ${accessToken}` },
      });

      // Fetch campaigns
      const campaignsResponse = await fetch(`${baseUrl}campaigns?count=100`, {
        headers: { 'Authorization': `OAuth ${accessToken}` },
      });

      const listsData = await listsResponse.json() as any;
      const campaignsData = await campaignsResponse.json() as any;

      logger.info('Successfully fetched Mailchimp assets', {
        listCount: listsData.lists?.length || 0,
        campaignCount: campaignsData.campaigns?.length || 0,
      });

      return {
        lists: listsData.lists || [],
        campaigns: campaignsData.campaigns || [],
      };
    } catch (error) {
      logger.error('Failed to fetch Mailchimp assets', { error });
      return { lists: [], campaigns: [] };
    }
  }

  /**
   * Fetch Pinterest ad accounts
   *
   * @param accessToken - Client's OAuth access token
   * @returns Object containing arrays of ad accounts
   */
  async fetchPinterestAssets(accessToken: string): Promise<{
    adAccounts: any[];
  }> {
    logger.info('Fetching Pinterest assets');

    try {
      // Fetch ad accounts
      const adAccountsResponse = await fetch('https://api.pinterest.com/v5/ad_accounts', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const adAccountsData = await adAccountsResponse.json() as any;

      logger.info('Successfully fetched Pinterest assets', {
        adAccountCount: adAccountsData.items?.length || 0,
      });

      return {
        adAccounts: adAccountsData.items || [],
      };
    } catch (error) {
      logger.error('Failed to fetch Pinterest assets', { error });
      return { adAccounts: [] };
    }
  }

  /**
   * Fetch Klaviyo assets (lists and campaigns)
   *
   * @param accessToken - Client's OAuth access token
   * @returns Object containing arrays of lists and campaigns
   */
  async fetchKlaviyoAssets(accessToken: string): Promise<{
    lists: any[];
    campaigns: any[];
  }> {
    logger.info('Fetching Klaviyo assets');

    try {
      const baseUrl = 'https://a.klaviyo.com/api/';

      // Fetch lists (audiences)
      const listsResponse = await fetch(`${baseUrl}lists/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      // Fetch campaigns
      const campaignsResponse = await fetch(`${baseUrl}campaigns/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const listsData = await listsResponse.json() as any;
      const campaignsData = await campaignsResponse.json() as any;

      logger.info('Successfully fetched Klaviyo assets', {
        listCount: listsData.data?.length || 0,
        campaignCount: campaignsData.data?.length || 0,
      });

      return {
        lists: listsData.data || [],
        campaigns: campaignsData.data || [],
      };
    } catch (error) {
      logger.error('Failed to fetch Klaviyo assets', { error });
      return { lists: [], campaigns: [] };
    }
  }

  /**
   * Fetch Shopify store information
   *
   * @param accessToken - Client's OAuth access token
   * @param shop - Shop name (e.g., "my-store" from my-store.myshopify.com)
   * @returns Object containing store metrics
   */
  async fetchShopifyAssets(accessToken: string, shop: string): Promise<{
    products: number;
    orders: number;
    customers: number;
    shop: string;
  }> {
    logger.info('Fetching Shopify assets');

    try {
      const baseUrl = `https://${shop}.myshopify.com/admin/api/2024-01/`;

      // Fetch products count
      const productsResponse = await fetch(`${baseUrl}products/count.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });

      // Fetch orders count
      const ordersResponse = await fetch(`${baseUrl}orders/count.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });

      // Fetch customers count
      const customersResponse = await fetch(`${baseUrl}customers/count.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken },
      });

      const productsData = await productsResponse.json() as any;
      const ordersData = await ordersResponse.json() as any;
      const customersData = await customersResponse.json() as any;

      logger.info('Successfully fetched Shopify assets', {
        products: productsData.count || 0,
        orders: ordersData.count || 0,
        customers: customersData.count || 0,
      });

      return {
        products: productsData.count || 0,
        orders: ordersData.count || 0,
        customers: customersData.count || 0,
        shop,
      };
    } catch (error) {
      logger.error('Failed to fetch Shopify assets', { error });
      return { products: 0, orders: 0, customers: 0, shop };
    }
  }

  /**
   * Fetch TikTok advertisers
   *
   * @param accessToken - Client's OAuth access token
   * @returns Object containing arrays of advertisers
   */
  async fetchTikTokAssets(accessToken: string): Promise<{
    advertisers: any[];
  }> {
    logger.info('Fetching TikTok assets');

    try {
      // Fetch advertiser info
      const advertiserResponse = await fetch(
        'https://business-api.tiktok.com/open_api/v1.3/advertiser/info/',
        {
          method: 'POST',
          headers: {
            'Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            advertiser_id: null, // Fetch all accessible advertisers
          }),
        }
      );

      const advertiserData = await advertiserResponse.json() as any;

      logger.info('Successfully fetched TikTok assets', {
        advertiserCount: advertiserData.data?.list?.length || 0,
      });

      return {
        advertisers: advertiserData.data?.list || [],
      };
    } catch (error) {
      logger.error('Failed to fetch TikTok assets', { error });
      return { advertisers: [] };
    }
  }
}

export const clientAssetsService = new ClientAssetsService();
