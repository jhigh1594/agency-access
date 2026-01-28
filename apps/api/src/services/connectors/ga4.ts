import { env } from '../../lib/env.js';
import type { AccessLevel } from '@agency-platform/shared';

/**
 * Google Analytics 4 (GA4) OAuth Connector
 *
 * Handles OAuth 2.0 flow for Google Analytics Admin API
 *
 * Documentation: https://developers.google.com/analytics/devguides/config/mgmt/v3
 */

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GATokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: Date;
}

interface GA4Property {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
}

export class GA4Connector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    // Use unified Google OAuth credentials (shared across all Google products)
    this.clientId = env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = `${env.API_URL}/agency-platforms/ga4/callback`;
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
    scopes: string[] = ['https://www.googleapis.com/auth/analytics.readonly'],
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
  async exchangeCode(code: string, redirectUri?: string): Promise<GATokens> {
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
      throw new Error(`GA4 token exchange failed: ${error}`);
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
  async refreshToken(refreshToken: string): Promise<GATokens> {
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
      throw new Error(`GA4 token refresh failed: ${error}`);
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
      // Make a simple API call to verify token
      const response = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?access_token=${accessToken}`,
        { method: 'GET' }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Verify agency has access to client's GA4 property
   *
   * Uses agency's OAuth token to query GA4 Admin API for accessible properties.
   *
   * @param agencyAccessToken - Agency's OAuth access token
   * @param clientEmail - Client's email (for validation)
   * @param propertyId - GA4 property ID to verify
   * @param requiredAccessLevel - Minimum access level required
   * @returns Verification result with granted access details
   */
  async verifyClientAccess(
    agencyAccessToken: string,
    clientEmail: string,
    propertyId: string,
    requiredAccessLevel: AccessLevel
  ): Promise<{
    hasAccess: boolean;
    accessLevel: AccessLevel;
    properties: GA4Property[];
    error?: string;
  }> {
    try {
      // Get account summaries which include accessible properties
      const response = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?access_token=${agencyAccessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        return {
          hasAccess: false,
          accessLevel: 'read_only',
          properties: [],
          error: 'Failed to query GA4 properties',
        };
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

      if (!data.accountSummaries || data.accountSummaries.length === 0) {
        return {
          hasAccess: false,
          accessLevel: 'read_only',
          properties: [],
          error: 'No accessible properties found',
        };
      }

      // Extract properties from account summaries
      const properties: GA4Property[] = [];
      let hasRequestedProperty = false;

      for (const accountSummary of data.accountSummaries) {
        if (accountSummary.propertySummaries) {
          for (const propSummary of accountSummary.propertySummaries) {
            if (propSummary.property) {
              // Extract property ID from format: properties/{propertyId}
              const propId = propSummary.property.split('/').pop() || propSummary.property;
              const property: GA4Property = {
                id: propId,
                name: propSummary.property,
                displayName: propSummary.displayName || `Property ${propId}`,
                permissions: [requiredAccessLevel],
              };
              properties.push(property);

              // Check if this is the requested property
              if (propId === propertyId) {
                hasRequestedProperty = true;
              }
            }
          }
        }
      }

      // Check if we have access to the requested property
      const hasAccess = propertyId ? hasRequestedProperty : properties.length > 0;

      return {
        hasAccess,
        accessLevel: hasAccess ? requiredAccessLevel : 'read_only',
        properties,
      };
    } catch (error) {
      return {
        hasAccess: false,
        accessLevel: 'read_only',
        properties: [],
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
export const ga4Connector = new GA4Connector();
