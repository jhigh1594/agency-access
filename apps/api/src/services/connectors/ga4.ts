import { env } from '../../lib/env.js';
import type { AccessLevel } from '@agency-platform/shared';
import { BaseConnector, type NormalizedTokenResponse } from './base.connector.js';
import { getGoogleUserInfo } from './google.js';

/**
 * Google Analytics 4 (GA4) OAuth Connector
 *
 * OAuth transport (auth URL, token exchange, refresh) is inherited from
 * BaseConnector via the `ga4` registry entry. Google Analytics specifics —
 * token verification against the Analytics Admin API and property access
 * verification — stay here.
 *
 * Documentation: https://developers.google.com/analytics/devguides/config/mgmt/v3
 */

interface GA4Property {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
}

export class GA4Connector extends BaseConnector {
  constructor() {
    super('ga4');
  }

  // All Google products share one OAuth client (the "google" platform group),
  // so the per-platform env lookup in BaseConnector must map to the shared keys.
  // Empty string (not a throw) preserves the historic tolerance for an
  // unconfigured client id.
  protected override getClientId(): string {
    return env.GOOGLE_CLIENT_ID || '';
  }

  protected override getClientSecret(): string {
    return env.GOOGLE_CLIENT_SECRET || '';
  }

  normalizeResponse(data: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }): NormalizedTokenResponse {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
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
    return getGoogleUserInfo(accessToken);
  }
}

// Export singleton instance
export const ga4Connector = new GA4Connector();
