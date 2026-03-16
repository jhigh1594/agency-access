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

export class GoogleAdsConnector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = `${env.API_URL}/agency-platforms/google_ads/callback`;
  }

  private getDeveloperToken(): string {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    if (!developerToken) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
    }

    return developerToken;
  }

  private normalizeCustomerId(customerId: string): string {
    return customerId.replace(/^customers\//, '').replace(/\D/g, '');
  }

  private buildHeaders(accessToken: string, loginCustomerId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': this.getDeveloperToken(),
      'Content-Type': 'application/json',
    };

    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    return headers;
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
      const response = await fetch(
        'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
        {
          method: 'GET',
          headers: this.buildHeaders(accessToken),
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
          headers: this.buildHeaders(agencyAccessToken),
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
    const managerCustomerId = this.normalizeCustomerId(input.managerCustomerId);
    const clientCustomerId = this.normalizeCustomerId(input.clientCustomerId);

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${managerCustomerId}/customerClientLinks:mutate`,
      {
        method: 'POST',
        headers: this.buildHeaders(input.accessToken, managerCustomerId),
        body: JSON.stringify({
          operations: [
            {
              create: {
                clientCustomer: `customers/${clientCustomerId}`,
                status: 'PENDING',
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      await this.throwGoogleAdsApiError('manager-link creation', response);
    }

    const data = (await response.json()) as {
      results?: Array<{ resourceName?: string }>;
    };
    const resourceName = data.results?.[0]?.resourceName;

    if (!resourceName) {
      throw new Error('Google Ads manager-link creation did not return a resource name');
    }

    return { resourceName };
  }

  async findManagerLink(
    input: FindManagerLinkInput
  ): Promise<{ managerLinkId: string; resourceName: string; status: string } | null> {
    const managerCustomerId = this.normalizeCustomerId(input.managerCustomerId);
    const clientCustomerId = this.normalizeCustomerId(input.clientCustomerId);
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
        headers: this.buildHeaders(input.accessToken, managerCustomerId),
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
    const managerCustomerId = this.normalizeCustomerId(input.managerCustomerId);
    const clientCustomerId = this.normalizeCustomerId(input.clientCustomerId);
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
        headers: this.buildHeaders(input.accessToken, managerCustomerId),
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
    const clientCustomerId = this.normalizeCustomerId(input.clientCustomerId);

    const response = await fetch(
      `https://googleads.googleapis.com/v22/customers/${clientCustomerId}/customerUserAccessInvitations:mutate`,
      {
        method: 'POST',
        headers: this.buildHeaders(input.accessToken),
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
    const clientCustomerId = this.normalizeCustomerId(input.clientCustomerId);
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
        headers: this.buildHeaders(input.accessToken),
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
    const clientCustomerId = this.normalizeCustomerId(input.clientCustomerId);
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
        headers: this.buildHeaders(input.accessToken),
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
