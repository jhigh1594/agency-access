import { env } from '../../lib/env.js';
import type { AccessLevel } from '@agency-platform/shared';
import { BaseConnector, type NormalizedTokenResponse } from './base.connector.js';
import { buildAdsHeaders, getGoogleUserInfo, normalizeCustomerId } from './google.js';

/**
 * Google Ads OAuth Connector
 *
 * OAuth transport (auth URL, token exchange, refresh) is inherited from
 * BaseConnector via the `google_ads` registry entry. Ads specifics stay here:
 * developer-token headers, manager-link invitations, and user-access
 * verification against the Google Ads API.
 *
 * Documentation: https://developers.google.com/google-ads/api/docs/oauth/overview
 */

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

type CreateManagerLinkInvitationInput = {
  accessToken: string;
  managerCustomerId: string;
  clientCustomerId: string;
};

type FindManagerLinkInput = {
  accessToken: string;
  managerCustomerId: string;
  clientCustomerId: string;
};

type VerifyManagerLinkInput = {
  accessToken: string;
  managerCustomerId: string;
  clientCustomerId: string;
  managerLinkId: string;
};

type CreateUserAccessInvitationInput = {
  accessToken: string;
  clientCustomerId: string;
  emailAddress: string;
  accessRole: string;
};

type FindUserAccessInvitationInput = {
  accessToken: string;
  clientCustomerId: string;
  emailAddress: string;
};

type VerifyUserAccessInput = {
  accessToken: string;
  clientCustomerId: string;
  emailAddress: string;
};

const RETRYABLE_GOOGLE_ADS_STATUSES = new Set([
  'ABORTED',
  'DEADLINE_EXCEEDED',
  'INTERNAL',
  'RESOURCE_EXHAUSTED',
  'UNAVAILABLE',
]);

class GoogleAdsApiError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(message: string, options: { code: string; retryable: boolean; statusCode?: number }) {
    super(message);
    this.name = 'GoogleAdsApiError';
    this.code = options.code;
    this.retryable = options.retryable;
    this.statusCode = options.statusCode;
  }
}

type ParsedGoogleAdsErrorPayload = {
  error?: {
    status?: string;
    message?: string;
    details?: Array<{
      '@type'?: string;
      errors?: Array<{
        message?: string;
        errorCode?: Record<string, string | undefined>;
      }>;
    }>;
  };
};

export class GoogleAdsConnector extends BaseConnector {
  constructor() {
    super('google_ads');
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

  private getDeveloperToken(): string {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    if (!developerToken) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
    }

    return developerToken;
  }

  private isRetryableGoogleAdsError(code: string, statusCode?: number): boolean {
    if (RETRYABLE_GOOGLE_ADS_STATUSES.has(code)) {
      return true;
    }

    return statusCode === 429 || (statusCode !== undefined && statusCode >= 500);
  }

  private extractDetailedGoogleAdsError(parsed: ParsedGoogleAdsErrorPayload): {
    code?: string;
    message?: string;
  } {
    const details = parsed.error?.details;
    if (!Array.isArray(details)) {
      return {};
    }

    for (const detail of details) {
      if (!Array.isArray(detail?.errors)) {
        continue;
      }

      for (const providerError of detail.errors) {
        const errorCodeEntry = providerError.errorCode && Object.values(providerError.errorCode).find(Boolean);

        if (typeof errorCodeEntry === 'string') {
          return {
            code: errorCodeEntry,
            message: providerError.message,
          };
        }
      }
    }

    return {};
  }

  private async throwGoogleAdsApiError(action: string, response: Response): Promise<never> {
    const rawError = await response.text();
    let code = `HTTP_${response.status}`;
    let message = rawError;

    try {
      const parsed = JSON.parse(rawError) as ParsedGoogleAdsErrorPayload;

      if (parsed.error?.status) {
        code = parsed.error.status;
      }

      if (parsed.error?.message) {
        message = parsed.error.message;
      }

      const detailedError = this.extractDetailedGoogleAdsError(parsed);
      if (detailedError.code) {
        code = detailedError.code;
      }

      if (detailedError.message) {
        message = detailedError.message;
      }
    } catch {
      // Preserve the raw response body when Google doesn't return JSON.
    }

    throw new GoogleAdsApiError(`Google Ads ${action} failed: ${message}`, {
      code,
      retryable: this.isRetryableGoogleAdsError(code, response.status),
      statusCode: response.status,
    });
  }

  /**
   * Verify token is still valid
   *
   * @param accessToken - Token to verify
   * @returns Whether token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
        {
          method: 'GET',
          headers: buildAdsHeaders(accessToken, this.getDeveloperToken()),
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
      // First, get the accessible accounts for the agency
      // This query returns all accounts the agency has access to
      const accountsResponse = await fetch(
        'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
        {
          method: 'GET',
          headers: buildAdsHeaders(agencyAccessToken, this.getDeveloperToken()),
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

  async createManagerLinkInvitation(
    input: CreateManagerLinkInvitationInput
  ): Promise<{ resourceName: string }> {
    const managerCustomerId = normalizeCustomerId(input.managerCustomerId);
    const clientCustomerId = normalizeCustomerId(input.clientCustomerId);

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${managerCustomerId}/customerClientLinks:mutate`,
      {
        method: 'POST',
        headers: buildAdsHeaders(input.accessToken, this.getDeveloperToken(), managerCustomerId),
        body: JSON.stringify({
          operation: {
            create: {
              clientCustomer: `customers/${clientCustomerId}`,
              status: 'PENDING',
            },
          },
        }),
      }
    );

    if (!response.ok) {
      await this.throwGoogleAdsApiError('manager-link creation', response);
    }

    const data = (await response.json()) as {
      result?: { resourceName?: string };
    };
    const resourceName = data.result?.resourceName;

    if (!resourceName) {
      throw new Error('Google Ads manager-link creation did not return a resource name');
    }

    return { resourceName };
  }

  async findManagerLink(
    input: FindManagerLinkInput
  ): Promise<{ managerLinkId: string; resourceName: string; status: string } | null> {
    const managerCustomerId = normalizeCustomerId(input.managerCustomerId);
    const clientCustomerId = normalizeCustomerId(input.clientCustomerId);
    const query = [
      'SELECT customer_client_link.resource_name,',
      'customer_client_link.client_customer,',
      'customer_client_link.manager_link_id,',
      'customer_client_link.status',
      'FROM customer_client_link',
      `WHERE customer_client_link.client_customer = 'customers/${clientCustomerId}'`,
    ].join(' ');

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${managerCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: buildAdsHeaders(input.accessToken, this.getDeveloperToken(), managerCustomerId),
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      await this.throwGoogleAdsApiError('manager-link lookup', response);
    }

    const data = (await response.json()) as Array<{
      results?: Array<{
        customerClientLink?: {
          resourceName?: string;
          managerLinkId?: string | number;
          status?: string;
        };
      }>;
    }> | {
      results?: Array<{
        customerClientLink?: {
          resourceName?: string;
          managerLinkId?: string | number;
          status?: string;
        };
      }>;
    };
    const results = Array.isArray(data) ? data.flatMap((chunk) => chunk.results || []) : data.results || [];
    const firstLink = results[0]?.customerClientLink;

    if (!firstLink?.resourceName || firstLink.managerLinkId === undefined || !firstLink.status) {
      return null;
    }

    return {
      managerLinkId: String(firstLink.managerLinkId),
      resourceName: firstLink.resourceName,
      status: firstLink.status,
    };
  }

  async verifyManagerLink(
    input: VerifyManagerLinkInput
  ): Promise<{ isLinked: boolean; status?: string; managerLinkId?: string }> {
    const managerCustomerId = normalizeCustomerId(input.managerCustomerId);
    const clientCustomerId = normalizeCustomerId(input.clientCustomerId);
    const managerLinkId = String(input.managerLinkId);
    const query = [
      'SELECT customer_manager_link.manager_customer,',
      'customer_manager_link.manager_link_id,',
      'customer_manager_link.status',
      'FROM customer_manager_link',
      `WHERE customer_manager_link.manager_customer = 'customers/${managerCustomerId}'`,
      `AND customer_manager_link.manager_link_id = ${managerLinkId}`,
    ].join(' ');

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${clientCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: buildAdsHeaders(input.accessToken, this.getDeveloperToken(), managerCustomerId),
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      await this.throwGoogleAdsApiError('manager-link verification', response);
    }

    const data = (await response.json()) as Array<{
      results?: Array<{
        customerManagerLink?: {
          managerLinkId?: string | number;
          status?: string;
        };
      }>;
    }> | {
      results?: Array<{
        customerManagerLink?: {
          managerLinkId?: string | number;
          status?: string;
        };
      }>;
    };
    const results = Array.isArray(data) ? data.flatMap((chunk) => chunk.results || []) : data.results || [];
    const managerLink = results[0]?.customerManagerLink;

    if (!managerLink) {
      return { isLinked: false };
    }

    const status = managerLink.status;
    const normalizedManagerLinkId =
      managerLink.managerLinkId !== undefined ? String(managerLink.managerLinkId) : managerLinkId;

    return {
      isLinked: status === 'ACTIVE',
      status,
      managerLinkId: normalizedManagerLinkId,
    };
  }

  async createUserAccessInvitation(
    input: CreateUserAccessInvitationInput
  ): Promise<{ resourceName: string }> {
    const clientCustomerId = normalizeCustomerId(input.clientCustomerId);

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${clientCustomerId}/customerUserAccessInvitations:mutate`,
      {
        method: 'POST',
        headers: buildAdsHeaders(input.accessToken, this.getDeveloperToken()),
        body: JSON.stringify({
          operation: {
            create: {
              emailAddress: input.emailAddress,
              accessRole: input.accessRole,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      await this.throwGoogleAdsApiError('user invitation creation', response);
    }

    const data = (await response.json()) as {
      result?: { resourceName?: string };
    };
    const resourceName = data.result?.resourceName;

    if (!resourceName) {
      throw new Error('Google Ads user invitation creation did not return a resource name');
    }

    return { resourceName };
  }

  async findUserAccessInvitation(
    input: FindUserAccessInvitationInput
  ): Promise<{
    invitationId: string;
    resourceName: string;
    emailAddress: string;
    accessRole?: string;
  } | null> {
    const clientCustomerId = normalizeCustomerId(input.clientCustomerId);
    const query = [
      'SELECT customer_user_access_invitation.resource_name,',
      'customer_user_access_invitation.invitation_id,',
      'customer_user_access_invitation.email_address,',
      'customer_user_access_invitation.access_role',
      'FROM customer_user_access_invitation',
      `WHERE customer_user_access_invitation.email_address = '${input.emailAddress.replace(/'/g, "\\'")}'`,
    ].join(' ');

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${clientCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: buildAdsHeaders(input.accessToken, this.getDeveloperToken()),
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      await this.throwGoogleAdsApiError('user invitation lookup', response);
    }

    const data = (await response.json()) as Array<{
      results?: Array<{
        customerUserAccessInvitation?: {
          resourceName?: string;
          invitationId?: string | number;
          emailAddress?: string;
          accessRole?: string;
        };
      }>;
    }> | {
      results?: Array<{
        customerUserAccessInvitation?: {
          resourceName?: string;
          invitationId?: string | number;
          emailAddress?: string;
          accessRole?: string;
        };
      }>;
    };
    const results = Array.isArray(data) ? data.flatMap((chunk) => chunk.results || []) : data.results || [];
    const invitation = results[0]?.customerUserAccessInvitation;

    if (
      !invitation?.resourceName ||
      invitation.invitationId === undefined ||
      !invitation.emailAddress
    ) {
      return null;
    }

    return {
      invitationId: String(invitation.invitationId),
      resourceName: invitation.resourceName,
      emailAddress: invitation.emailAddress,
      accessRole: invitation.accessRole,
    };
  }

  async verifyUserAccess(
    input: VerifyUserAccessInput
  ): Promise<{ hasAccess: boolean; accessRole?: string; emailAddress?: string }> {
    const clientCustomerId = normalizeCustomerId(input.clientCustomerId);
    const query = [
      'SELECT customer_user_access.email_address,',
      'customer_user_access.access_role',
      'FROM customer_user_access',
      `WHERE customer_user_access.email_address = '${input.emailAddress.replace(/'/g, "\\'")}'`,
    ].join(' ');

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${clientCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: buildAdsHeaders(input.accessToken, this.getDeveloperToken()),
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      await this.throwGoogleAdsApiError('user access verification', response);
    }

    const data = (await response.json()) as Array<{
      results?: Array<{
        customerUserAccess?: {
          emailAddress?: string;
          accessRole?: string;
        };
      }>;
    }> | {
      results?: Array<{
        customerUserAccess?: {
          emailAddress?: string;
          accessRole?: string;
        };
      }>;
    };
    const results = Array.isArray(data) ? data.flatMap((chunk) => chunk.results || []) : data.results || [];
    const userAccess = results[0]?.customerUserAccess;

    if (!userAccess?.emailAddress) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      accessRole: userAccess.accessRole,
      emailAddress: userAccess.emailAddress,
    };
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
export const googleAdsConnector = new GoogleAdsConnector();
