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

import { logger } from '@/lib/logger';

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

      const data = await response.json();
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

      const data = await response.json();
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

      const businessesData = await businessesResponse.json();
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

        const igData = await igResponse.json();
        return igData.data || [];
      });

      const instagramAccountsArrays = await Promise.all(instagramAccountsPromises);

      // Flatten arrays and deduplicate by ID
      const allAccounts = instagramAccountsArrays.flat();
      const uniqueAccounts = Array.from(
        new Map(allAccounts.map((account) => [account.id, account])).values()
      );

      return uniqueAccounts;
    } catch (error) {
      logger.error('Failed to fetch Instagram accounts', { error });
      // Return empty array on error - don't fail entire fetch
      return [];
    }
  }
}

export const clientAssetsService = new ClientAssetsService();
