/**
 * Client Assets Service
 *
 * Fetches client's platform assets using their temporary OAuth token.
 * Assets are displayed in the frontend for selection before granting agency access.
 *
 * Supported platforms:
 * - Meta (Facebook): Ad Accounts, Pages, Instagram Accounts
 * - Google (future): Ads accounts, Analytics properties
 */

export interface MetaAdAccount {
  id: string;
  name: string;
  status: string; // 'ACTIVE', 'PAUSED', etc.
  currency?: string;
}

export interface MetaPage {
  id: string;
  name: string;
  avatar?: string; // picture.data.url
  category?: string;
}

export interface MetaInstagramAccount {
  id: string;
  username: string;
  name?: string;
  avatar?: string; // profile_picture_url
}

export interface MetaAssets {
  adAccounts: MetaAdAccount[];
  pages: MetaPage[];
  instagramAccounts: MetaInstagramAccount[];
}

class ClientAssetsService {
  private readonly META_GRAPH_VERSION = 'v21.0';
  private readonly META_GRAPH_URL = `https://graph.facebook.com/${this.META_GRAPH_VERSION}`;

  /**
   * Fetch all Meta assets for a client
   *
   * @param accessToken - Client's temporary OAuth access token
   * @returns Ad accounts, pages, and Instagram accounts
   */
  async fetchMetaAssets(accessToken: string): Promise<MetaAssets> {
    try {
      // Fetch all asset types in parallel
      const [adAccounts, pages, instagramAccounts] = await Promise.all([
        this.fetchMetaAdAccounts(accessToken),
        this.fetchMetaPages(accessToken),
        this.fetchMetaInstagramAccounts(accessToken),
      ]);

      return {
        adAccounts,
        pages,
        instagramAccounts,
      };
    } catch (error) {
      throw new Error(`Failed to fetch Meta assets: ${error}`);
    }
  }

  /**
   * Fetch client's Meta Ad Accounts
   *
   * @param accessToken - Client's access token
   * @returns Array of ad accounts
   */
  private async fetchMetaAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    const url = `${this.META_GRAPH_URL}/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta Ad Accounts fetch failed: ${error}`);
    }

    const data = await response.json();

    return (data.data || []).map((account: any) => ({
      id: account.id,
      name: account.name,
      status: account.account_status || 'UNKNOWN',
      currency: account.currency,
    }));
  }

  /**
   * Fetch client's Meta Pages
   *
   * @param accessToken - Client's access token
   * @returns Array of pages
   */
  private async fetchMetaPages(accessToken: string): Promise<MetaPage[]> {
    const url = `${this.META_GRAPH_URL}/me/accounts?fields=id,name,picture,category&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta Pages fetch failed: ${error}`);
    }

    const data = await response.json();

    return (data.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      avatar: page.picture?.data?.url,
      category: page.category,
    }));
  }

  /**
   * Fetch client's Instagram Business Accounts
   *
   * Note: This requires first fetching businesses, then Instagram accounts per business
   *
   * @param accessToken - Client's access token
   * @returns Array of Instagram accounts
   */
  private async fetchMetaInstagramAccounts(accessToken: string): Promise<MetaInstagramAccount[]> {
    try {
      // Step 1: Get user's businesses
      const businessesUrl = `${this.META_GRAPH_URL}/me/businesses?fields=id,name&access_token=${accessToken}`;
      const businessesResponse = await fetch(businessesUrl);

      if (!businessesResponse.ok) {
        const error = await businessesResponse.text();
        throw new Error(`Meta Businesses fetch failed: ${error}`);
      }

      const businessesData = await businessesResponse.json();
      const businesses = businessesData.data || [];

      if (businesses.length === 0) {
        return [];
      }

      // Step 2: Fetch Instagram accounts for each business
      const instagramAccountsPromises = businesses.map(async (business: any) => {
        const igUrl = `${this.META_GRAPH_URL}/${business.id}/instagram_accounts?fields=id,username,name,profile_picture_url&access_token=${accessToken}`;
        const igResponse = await fetch(igUrl);

        if (!igResponse.ok) {
          // Some businesses may not have Instagram accounts, return empty array
          return [];
        }

        const igData = await igResponse.json();
        return (igData.data || []).map((account: any) => ({
          id: account.id,
          username: account.username,
          name: account.name,
          avatar: account.profile_picture_url,
        }));
      });

      const instagramAccountsArrays = await Promise.all(instagramAccountsPromises);

      // Flatten and deduplicate Instagram accounts
      const allAccounts = instagramAccountsArrays.flat();
      const uniqueAccounts = Array.from(
        new Map(allAccounts.map((account) => [account.id, account])).values()
      );

      return uniqueAccounts;
    } catch (error) {
      // Instagram accounts are optional, return empty array on error
      console.warn('Failed to fetch Instagram accounts:', error);
      return [];
    }
  }

  /**
   * Future: Fetch Google Ads accounts and Analytics properties
   *
   * @param accessToken - Client's Google OAuth token
   */
  // async fetchGoogleAssets(accessToken: string): Promise<GoogleAssets> {
  //   // TODO: Implement Google Ads MCC and Analytics API calls
  // }
}

export const clientAssetsService = new ClientAssetsService();
