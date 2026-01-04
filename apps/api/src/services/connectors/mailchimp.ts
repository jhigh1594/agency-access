import { BaseConnector, NormalizedTokenResponse, ConnectorError } from './base.connector.js';
import type { Platform } from '@agency-platform/shared';

/**
 * Mailchimp OAuth Connector
 *
 * Mailchimp uses a unique OAuth flow:
 * - No granular scopes - account-level permissions based on user's access
 * - Access tokens never expire
 * - Requires calling metadata endpoint to get data center (dc) prefix
 * - All API calls use the format: https://{dc}.api.mailchimp.com/3.0/
 *
 * @see https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/
 */
export class MailchimpConnector extends BaseConnector {
  constructor() {
    super('mailchimp' as Platform);
  }

  /**
   * Normalize Mailchimp token response
   *
   * Mailchimp tokens don't expire (expires_in: 0).
   * We set a far future date for expiresAt.
   */
  normalizeResponse(data: any): NormalizedTokenResponse {
    return {
      accessToken: data.access_token,
      refreshToken: undefined, // No refresh token - tokens don't expire
      expiresIn: 0, // Never expires
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      tokenType: data.token_type ?? 'Bearer',
      metadata: {
        needsMetadataFetch: true, // Flag that metadata endpoint needs to be called
      },
    };
  }

  /**
   * Get user info from Mailchimp
   *
   * For Mailchimp, this is a two-step process:
   * 1. Call metadata endpoint to get data center (dc) prefix
   * 2. Call API root with the dc prefix to get account info
   *
   * @param accessToken - Valid Mailchimp access token
   * @returns User account info with dc prefix
   */
  override async getUserInfo(accessToken: string): Promise<{
    id: string;
    email?: string;
    name?: string;
    dc?: string; // Data center prefix (e.g., "us12")
    [key: string]: any;
  }> {
    try {
      // Step 1: Get metadata (data center prefix)
      const metadataResponse = await fetch('https://login.mailchimp.com/oauth2/metadata', {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${accessToken}`,
        },
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.text();
        throw new ConnectorError(
          this.platform,
          'METADATA_FETCH_FAILED',
          `Mailchimp metadata fetch failed: ${error}`,
          { status: metadataResponse.status, body: error }
        );
      }

      const metadata = await metadataResponse.json() as any;

      // Step 2: Get account info using the data center prefix
      const apiResponse = await fetch(`https://${metadata.dc}.api.mailchimp.com/3.0/`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${accessToken}`,
        },
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        throw new ConnectorError(
          this.platform,
          'USER_INFO_FAILED',
          `Mailchimp account info fetch failed: ${error}`,
          { status: apiResponse.status, body: error }
        );
      }

      const accountInfo = await apiResponse.json() as any;

      // Combine metadata with account info
      return {
        id: accountInfo.account_id || accountInfo.account_id,
        email: accountInfo.email,
        name: accountInfo.account_name,
        dc: metadata.dc, // Store data center prefix for API calls
        accountName: accountInfo.account_name,
        contactEmail: accountInfo.email,
        ...(metadata),
        ...(accountInfo),
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
}

// Export singleton instance
export const mailchimpConnector = new MailchimpConnector();
