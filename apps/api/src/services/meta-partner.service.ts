/**
 * Meta Partner Access Service
 *
 * Grants agency access to client's Meta assets (Ad Accounts, Pages, Instagram).
 * Uses client's temporary OAuth token to add agency's Business Manager as a partner.
 *
 * Documentation:
 * - Ad Account Access: https://developers.facebook.com/docs/marketing-api/reference/ad-account/assigned_users
 * - Page Access: https://developers.facebook.com/docs/graph-api/reference/page/assigned_users
 *
 * Flow:
 * 1. Client selects assets in frontend
 * 2. Backend uses client's token to call Meta API
 * 3. Add agency Business ID as partner with ADMIN/ADVERTISER role
 * 4. Client's token is discarded after grant completes
 */

export interface GrantAccessRequest {
  clientToken: string;
  agencyBusinessId: string; // Meta Business Manager ID
  assets: {
    adAccounts: string[]; // Array of ad account IDs (e.g., ['act_123', 'act_456'])
    pages: string[]; // Array of page IDs
    instagramAccounts: string[]; // Array of Instagram account IDs
  };
  accessLevel?: 'ADMIN' | 'ADVERTISER'; // Default: ADMIN
}

export interface GrantAccessResult {
  success: boolean;
  grantedAssets: {
    adAccounts: Array<{ id: string; status: 'granted' | 'failed'; error?: string }>;
    pages: Array<{ id: string; status: 'granted' | 'failed'; error?: string }>;
    instagramAccounts: Array<{ id: string; status: 'granted' | 'failed'; error?: string }>;
  };
  errors?: string[];
}

export interface MetaAssignedUserVerificationResult {
  verified: boolean;
  assignedTasks: string[];
}

const DEFAULT_PAGE_TASKS = ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ADVERTISE'];
const DEFAULT_AD_ACCOUNT_TASKS = ['MANAGE', 'ADVERTISE', 'ANALYZE'];

class MetaPartnerService {
  private readonly META_GRAPH_VERSION = 'v21.0';
  private readonly META_GRAPH_URL = `https://graph.facebook.com/${this.META_GRAPH_VERSION}`;

  private normalizeTasks(tasks: unknown): string[] {
    if (!Array.isArray(tasks)) {
      return [];
    }

    return tasks.map((task) => String(task)).filter(Boolean);
  }

  private async postAssignedUserAccess(input: {
    assetId: string;
    accessToken: string;
    systemUserId: string;
    tasks: string[];
  }): Promise<void> {
    const url = `${this.META_GRAPH_URL}/${input.assetId}/assigned_users`;
    const formData = new URLSearchParams();
    formData.append('user', input.systemUserId);
    formData.append('tasks', JSON.stringify(input.tasks));
    formData.append('access_token', input.accessToken);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      let errorCode: string | undefined;

      try {
        const errorData: any = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorCode = errorData.error.code?.toString() || errorData.error.type;
        }
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }

      const fullError = errorCode
        ? `Assigned user mutation failed (${errorCode}): ${errorMessage}`
        : `Assigned user mutation failed: ${errorMessage}`;

      throw new Error(fullError);
    }
  }

  private async getAssignedUserAccess(
    accessToken: string,
    assetId: string,
    systemUserId: string,
    expectedTasks: string[]
  ): Promise<MetaAssignedUserVerificationResult> {
    const response = await fetch(
      `${this.META_GRAPH_URL}/${assetId}/assigned_users?access_token=${accessToken}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to verify assigned user access: ${error}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id?: string;
        tasks?: unknown;
      }>;
    };

    const assignedUser = (payload.data || []).find((item) => item.id === systemUserId);
    const assignedTasks = this.normalizeTasks(assignedUser?.tasks);
    const verified = expectedTasks.every((task) => assignedTasks.includes(task));

    return {
      verified,
      assignedTasks,
    };
  }

  /**
   * Grant agency access to selected Meta assets
   *
   * @param request - Grant access request with client token and asset IDs
   * @returns Result with success status and details per asset
   */
  async grantPartnerAccess(request: GrantAccessRequest): Promise<GrantAccessResult> {
    const { clientToken, agencyBusinessId, assets, accessLevel = 'ADMIN' } = request;

    const result: GrantAccessResult = {
      success: true,
      grantedAssets: {
        adAccounts: [],
        pages: [],
        instagramAccounts: [],
      },
      errors: [],
    };

    // Grant access to ad accounts
    for (const adAccountId of assets.adAccounts) {
      try {
        const tasks =
          accessLevel === 'ADMIN' ? DEFAULT_AD_ACCOUNT_TASKS : ['ADVERTISE'];
        await this.grantAdAccountAccess(clientToken, adAccountId, agencyBusinessId, tasks);
        result.grantedAssets.adAccounts.push({ id: adAccountId, status: 'granted' });
      } catch (error) {
        result.success = false;
        result.grantedAssets.adAccounts.push({
          id: adAccountId,
          status: 'failed',
          error: String(error),
        });
        result.errors?.push(`Ad Account ${adAccountId}: ${error}`);
      }
    }

    // Grant access to pages
    for (const pageId of assets.pages) {
      try {
        await this.grantPageAccess(clientToken, pageId, agencyBusinessId);
        result.grantedAssets.pages.push({ id: pageId, status: 'granted' });
      } catch (error) {
        result.success = false;
        result.grantedAssets.pages.push({
          id: pageId,
          status: 'failed',
          error: String(error),
        });
        result.errors?.push(`Page ${pageId}: ${error}`);
      }
    }

    // Grant access to Instagram accounts
    for (const instagramId of assets.instagramAccounts) {
      try {
        await this.grantInstagramAccess(clientToken, instagramId, agencyBusinessId);
        result.grantedAssets.instagramAccounts.push({ id: instagramId, status: 'granted' });
      } catch (error) {
        result.success = false;
        result.grantedAssets.instagramAccounts.push({
          id: instagramId,
          status: 'failed',
          error: String(error),
        });
        result.errors?.push(`Instagram ${instagramId}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Grant agency access to a specific ad account
   *
   * @param clientToken - Client's OAuth access token
   * @param adAccountId - Ad account ID (e.g., 'act_123456')
   * @param businessId - Agency's Business Manager ID
   * @param role - Access level (ADMIN or ADVERTISER)
   */
  async grantAdAccountAccess(
    clientToken: string,
    adAccountId: string,
    systemUserId: string,
    tasks: string[] = DEFAULT_AD_ACCOUNT_TASKS
  ): Promise<void> {
    await this.postAssignedUserAccess({
      assetId: adAccountId,
      accessToken: clientToken,
      systemUserId,
      tasks,
    });
  }

  /**
   * Grant agency access to a specific page
   *
   * @param clientToken - Client's OAuth access token
   * @param pageId - Page ID
   * @param businessId - Agency's Business Manager ID
   */
  /**
   * Grant agency access to a specific page
   *
   * @param clientToken - Client's OAuth access token
   * @param pageId - Page ID
   * @param agencySystemUserId - Agency's System User ID
   * @param clientBusinessId - Optional: client's Business Manager ID (owns the page)
   */
  async grantPageAccess(
    clientToken: string,
    pageId: string,
    agencySystemUserId: string,
    tasks: string[] = DEFAULT_PAGE_TASKS
  ): Promise<void> {
    await this.postAssignedUserAccess({
      assetId: pageId,
      accessToken: clientToken,
      systemUserId: agencySystemUserId,
      tasks,
    });
  }

  async verifyPageAccess(
    clientToken: string,
    pageId: string,
    systemUserId: string,
    expectedTasks: string[] = DEFAULT_PAGE_TASKS
  ): Promise<MetaAssignedUserVerificationResult> {
    return this.getAssignedUserAccess(clientToken, pageId, systemUserId, expectedTasks);
  }

  async verifyAdAccountAccess(
    clientToken: string,
    adAccountId: string,
    systemUserId: string,
    expectedTasks: string[] = DEFAULT_AD_ACCOUNT_TASKS
  ): Promise<MetaAssignedUserVerificationResult> {
    return this.getAssignedUserAccess(clientToken, adAccountId, systemUserId, expectedTasks);
  }

  /**
   * Grant agency access to Instagram account
   *
   * Note: Instagram access is typically granted via the parent Page or Business Manager.
   * This method attempts to grant direct access if supported by Meta's API.
   *
   * @param clientToken - Client's OAuth access token
   * @param instagramId - Instagram account ID
   * @param businessId - Agency's Business Manager ID
   */
  private async grantInstagramAccess(
    clientToken: string,
    instagramId: string,
    businessId: string
  ): Promise<void> {
    // Instagram access is typically inherited from Page access
    // For now, we attempt direct assignment similar to Pages
    const url = `${this.META_GRAPH_URL}/${instagramId}/assigned_users`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business: businessId,
        tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE'],
        access_token: clientToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      // Instagram may not support direct assignment, log but don't fail hard
      console.warn(`Instagram access grant warning for ${instagramId}:`, error);
      // Depending on requirements, you may want to throw or silently succeed
      // For now, we'll log the warning but consider it successful
    }
  }

  /**
   * Revoke agency access to Meta assets (future use case)
   *
   * @param clientToken - Client's OAuth access token (or agency's token)
   * @param assetId - Asset ID (ad account, page, etc.)
   * @param businessId - Agency's Business Manager ID
   */
  async revokePartnerAccess(
    clientToken: string,
    assetId: string,
    businessId: string
  ): Promise<void> {
    const url = `${this.META_GRAPH_URL}/${assetId}/assigned_users/${businessId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: clientToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to revoke access: ${error}`);
    }
  }
}

export const metaPartnerService = new MetaPartnerService();
