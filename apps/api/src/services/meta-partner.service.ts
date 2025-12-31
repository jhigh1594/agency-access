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

class MetaPartnerService {
  private readonly META_GRAPH_VERSION = 'v21.0';
  private readonly META_GRAPH_URL = `https://graph.facebook.com/${this.META_GRAPH_VERSION}`;

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
        await this.grantAdAccountAccess(clientToken, adAccountId, agencyBusinessId, accessLevel);
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
  private async grantAdAccountAccess(
    clientToken: string,
    adAccountId: string,
    businessId: string,
    role: 'ADMIN' | 'ADVERTISER'
  ): Promise<void> {
    const url = `${this.META_GRAPH_URL}/${adAccountId}/assigned_users`;

    // Map role to Meta's task permissions
    // ADMIN = full access, ADVERTISER = create/edit ads only
    const tasks = role === 'ADMIN'
      ? ['MANAGE', 'ADVERTISE', 'ANALYZE']
      : ['ADVERTISE'];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business: businessId,
        tasks,
        access_token: clientToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to grant ad account access: ${error}`);
    }
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
    clientBusinessId?: string
  ): Promise<void> {
    // According to Meta API docs: https://developers.facebook.com/docs/business-management-apis/business-asset-management/guides/pages/
    // To programmatically grant access to a page, we use the assigned_users endpoint 
    // with the agency's System User ID.
    
    // 1. Ensure we have the client's business ID (the one that owns the page)
    let owningBusinessId = clientBusinessId;
    
    if (!owningBusinessId) {
      const pageUrl = `${this.META_GRAPH_URL}/${pageId}?fields=business&access_token=${clientToken}`;
      const pageResponse = await fetch(pageUrl);
      
      if (pageResponse.ok) {
        try {
          const pageData: any = await pageResponse.json();
          if (pageData.business && pageData.business.id) {
            owningBusinessId = pageData.business.id;
          }
        } catch (e) {
          // Error parsing page business
        }
      }
      
      // Fallback: try to get from the user's business connection
      if (!owningBusinessId) {
        const meUrl = `${this.META_GRAPH_URL}/me?fields=business&access_token=${clientToken}`;
        const meResponse = await fetch(meUrl);
        if (meResponse.ok) {
          try {
            const meData: any = await meResponse.json();
            if (meData.business && meData.business.data && meData.business.data.length > 0) {
              owningBusinessId = meData.business.data[0].id;
            }
          } catch (e) {
            // Error parsing user business
          }
        }
      }
    }
    
    if (!owningBusinessId) {
      throw new Error('Unable to determine client business ID. Please ensure the page is associated with a Business Manager.');
    }
    
    // 2. Use assigned_users endpoint with System User ID
    // POST /{pageId}/assigned_users
    const url = `${this.META_GRAPH_URL}/${pageId}/assigned_users`;

    // Use form data format as shown in Meta API docs
    const formData = new URLSearchParams();
    formData.append('user', agencySystemUserId); // Agency's System User app-scoped ID
    formData.append('business', owningBusinessId); // Client's business ID (owns the page)
    formData.append('tasks', JSON.stringify(['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ADVERTISE']));
    formData.append('access_token', clientToken);

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
        
        // Meta Graph API error format: { error: { message: string, type: string, code: number, ... } }
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorCode = errorData.error.code?.toString() || errorData.error.type;
          
          // Add more context for common error codes
          if (errorCode === '200' || errorData.error.error_subcode === 2018218) {
            errorMessage = `System User ${agencySystemUserId} is not valid or not associated with the agency's Business Manager.`;
          } else if (errorCode === '190' || errorData.error.error_subcode === 463) {
            errorMessage = `Invalid or expired access token. Please reconnect your Meta account.`;
          } else if (errorCode === '200' || errorData.error.error_subcode === 2018219) {
            errorMessage = `You don't have permission to grant access to this page. Please ensure you're an admin of the page and have business_management permissions.`;
          } else if (errorCode === '100') {
            errorMessage = `Missing required parameter (user). Ensure the System User ID is correct.`;
          } else if (errorCode === '10' || errorCode === '200') {
            errorMessage = `Permission denied. Please ensure you have business_management, pages_manage_metadata, and pages_show_list permissions.`;
          }
        } else {
          // Fallback: try to parse as text if not JSON
          errorMessage = JSON.stringify(errorData);
        }
      } catch (parseError) {
        // If JSON parsing fails, try text
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      
      const fullError = errorCode 
        ? `Failed to grant page access (${errorCode}): ${errorMessage}`
        : `Failed to grant page access: ${errorMessage}`;
      
      throw new Error(fullError);
    }
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

