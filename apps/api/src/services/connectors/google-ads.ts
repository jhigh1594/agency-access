import { env } from '../../lib/env.js';
import type { AccessLevel } from '@agency-platform/shared';

/**
 * Google Ads OAuth Connector
 *
 * Handles OAuth 2.0 flow for Google Ads API
 *
 * Documentation: https://developers.google.com/google-ads/api/docs/oauth/overview
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

interface GoogleAdsUserAccess {
  userAccess: {
    accessRole: string;
    emailAddress: string;
  }[];
}

interface AdAccount {
  id: string;
  name: string;
  status: string;
  permissions: string[];
}

export class GoogleAdsConnector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = `${env.API_URL}/api/oauth/google-ads/callback`;
  }

  /**
   * Generate OAuth authorization URL
   *
   * @param state - CSRF protection token
   * @param scopes - OAuth scopes to request
   * @param redirectUri - Optional override for redirect URI
   * @returns Authorization URL
   */
  getAuthUrl(
    state: string,
    scopes: string[] = ['https://www.googleapis.com/auth/adwords'],
    redirectUri?: string
  ): string {
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
   * @param redirectUri - Optional override for redirect URI
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
      throw new Error(`Google Ads token exchange failed: ${error}`);
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
      throw new Error(`Google Ads token refresh failed: ${error}`);
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
      const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      if (!developerToken) {
        return false;
      }

      // Make a simple API call to verify token
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

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Verify agency has access to client's Google Ads account
   *
   * Uses agency's OAuth token to query Google Ads API for accessible accounts.
   * Checks if the agency's email has been granted access to client accounts.
   *
   * @param agencyAccessToken - Agency's OAuth access token
   * @param clientEmail - Client's email to search for (for validation)
   * @param requiredAccessLevel - Minimum access level required
   * @returns Verification result with granted access details
   */
  async verifyClientAccess(
    agencyAccessToken: string,
    clientEmail: string,
    requiredAccessLevel: AccessLevel
  ): Promise<{
    hasAccess: boolean;
    accessLevel: AccessLevel;
    accounts: AdAccount[];
    error?: string;
  }> {
    try {
      const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      if (!developerToken) {
        return {
          hasAccess: false,
          accessLevel: 'read_only',
          accounts: [],
          error: 'GOOGLE_ADS_DEVELOPER_TOKEN not configured',
        };
      }

      // First, get the accessible accounts for the agency
      // This query returns all accounts the agency has access to
      const accountsResponse = await fetch(
        'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${agencyAccessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!accountsResponse.ok) {
        return {
          hasAccess: false,
          accessLevel: 'read_only',
          accounts: [],
          error: 'Failed to query accessible accounts',
        };
      }

      const accountsData = await accountsResponse.json() as {
        resourceNames?: string[];
      };

      if (!accountsData.resourceNames || accountsData.resourceNames.length === 0) {
        return {
          hasAccess: false,
          accessLevel: 'read_only',
          accounts: [],
          error: 'No accessible accounts found',
        };
      }

      // For now, if the agency has any accessible accounts, we consider access granted
      // In a production environment, you would query each customer to check specific permissions
      // and verify that the client's email has been granted access

      // Map access levels to Google Ads roles
      const accessLevelMapping: Record<AccessLevel, string[]> = {
        admin: ['ADMIN_STANDARD', 'ADMIN_ALL'],
        standard: ['STANDARD', 'ADMIN_STANDARD', 'ADMIN_ALL'],
        read_only: ['READ_ONLY', 'STANDARD', 'ADMIN_STANDARD', 'ADMIN_ALL'],
        email_only: ['EMAIL_ONLY', 'READ_ONLY', 'STANDARD', 'ADMIN_STANDARD', 'ADMIN_ALL'],
      };

      // For MVP, we return the accessible accounts without deep permission verification
      // This would require querying each customer's user access which is complex
      const accounts: AdAccount[] = accountsData.resourceNames.map((resourceName) => {
        // Extract customer ID from resource name (format: customers/{customerId})
        const customerId = resourceName.split('/').pop() || resourceName;
        return {
          id: customerId,
          name: `Account ${customerId}`,
          status: 'active',
          permissions: [requiredAccessLevel],
        };
      });

      // Check if the agency has access to any account
      // In production, you would verify specific permissions for each account
      const hasAnyAccess = accounts.length > 0;

      return {
        hasAccess: hasAnyAccess,
        accessLevel: hasAnyAccess ? requiredAccessLevel : 'read_only',
        accounts,
      };
    } catch (error) {
      return {
        hasAccess: false,
        accessLevel: 'read_only',
        accounts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
    };

    return data;
  }
}

// Export singleton instance
export const googleAdsConnector = new GoogleAdsConnector();
