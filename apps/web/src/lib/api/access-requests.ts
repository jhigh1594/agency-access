/**
 * Access Requests API Client
 *
 * Phase 5: Client for creating and managing access requests
 * with comprehensive error handling.
 */

import { PlatformGroupConfig } from '@/lib/transform-platforms';
import { IntakeField } from '@/contexts/access-request-context';
import { AuthorizedApiError, authorizedApiFetch } from './authorized-api-fetch';

// ============================================================
// TYPES
// ============================================================

export interface CreateAccessRequestPayload {
  agencyId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  externalReference?: string;
  authModel: 'client_authorization' | 'delegated_access';
  platforms: PlatformGroupConfig[];
  intakeFields?: IntakeField[];
  branding?: {
    logoUrl?: string;
    primaryColor: string;
    subdomain?: string;
  };
}

export interface AccessRequest {
  id: string;
  agencyId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  externalReference?: string;
  authModel: 'client_authorization' | 'delegated_access';
  platforms: PlatformGroupConfig[];
  status: 'pending' | 'partial' | 'completed' | 'expired' | 'revoked';
  uniqueToken: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  intakeFields?: IntakeField[];
  branding?: {
    logoUrl?: string;
    primaryColor: string;
    subdomain?: string;
  };
  shopifySubmission?: {
    status: 'pending_client' | 'submitted' | 'legacy_unreadable';
    connectionId?: string;
    shopDomain?: string;
    collaboratorCode?: string;
    submittedAt?: string;
  };
  authorizationLinkChanged?: boolean;
}

export interface UpdateAccessRequestPayload {
  authModel?: 'client_authorization' | 'delegated_access';
  externalReference?: string;
  platforms?: PlatformGroupConfig[];
  intakeFields?: IntakeField[];
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    subdomain?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: {
    missingPlatforms?: string[];
    [key: string]: any;
  };
}

export interface CreateAccessRequestResponse {
  data?: AccessRequest;
  error?: ApiError;
}

type TokenProvider = () => Promise<string | null>;

// ============================================================
// API CLIENT
// ============================================================

/**
 * Create a new access request
 *
 * @param payload - Access request creation payload
 * @returns Response with data or error
 *
 * @example
 * const result = await createAccessRequest({
 *   agencyId: 'agency-123',
 *   clientName: 'John Doe',
 *   clientEmail: 'john@example.com',
 *   authModel: 'client_authorization',
 *   platforms: [
 *     {
 *       platformGroup: 'google',
 *       products: [
 *         { product: 'google_ads', accessLevel: 'admin', accounts: [] }
 *       ]
 *     }
 *   ]
 * });
 *
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log('Created:', result.data?.id);
 * }
 */
export async function createAccessRequest(
  payload: CreateAccessRequestPayload,
  getToken?: TokenProvider
): Promise<CreateAccessRequestResponse> {
  try {
    const response = await authorizedApiFetch<{ data: AccessRequest; error: null }>(
      '/api/access-requests',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        getToken: getToken ?? (async () => null),
      }
    );

    return { data: response.data };
  } catch (err) {
    if (err instanceof AuthorizedApiError) {
      return {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      };
    }

    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Get access request by ID
 */
export async function getAccessRequest(
  id: string,
  getToken?: TokenProvider
): Promise<CreateAccessRequestResponse> {
  try {
    const response = await authorizedApiFetch<{ data: AccessRequest; error: null }>(
      `/api/access-requests/${id}`,
      {
        getToken: getToken ?? (async () => null),
      }
    );

    return { data: response.data };
  } catch (err) {
    if (err instanceof AuthorizedApiError) {
      return {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      };
    }

    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Update an existing access request
 */
export async function updateAccessRequest(
  id: string,
  payload: UpdateAccessRequestPayload,
  getToken?: TokenProvider
): Promise<CreateAccessRequestResponse> {
  try {
    const response = await authorizedApiFetch<{ data: AccessRequest; error: null }>(
      `/api/access-requests/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
        getToken: getToken ?? (async () => null),
      }
    );

    return { data: response.data };
  } catch (err) {
    if (err instanceof AuthorizedApiError) {
      return {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      };
    }

    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Cancel (revoke) an access request.
 * The authorization link will stop working.
 */
export async function cancelAccessRequest(
  id: string,
  getToken?: TokenProvider
): Promise<{ data?: { success: boolean }; error?: ApiError }> {
  try {
    await authorizedApiFetch<{ data: { success: boolean }; error: null }>(
      `/api/access-requests/${id}/cancel`,
      {
        method: 'POST',
        getToken: getToken ?? (async () => null),
      }
    );
    return { data: { success: true } };
  } catch (err) {
    if (err instanceof AuthorizedApiError) {
      return {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      };
    }
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Get the authorization URL for a client
 */
export function getAuthorizationUrl(accessRequest: AccessRequest): string {
  return buildInviteUrl(accessRequest.uniqueToken);
}
import { buildInviteUrl } from '@/lib/app-url';
