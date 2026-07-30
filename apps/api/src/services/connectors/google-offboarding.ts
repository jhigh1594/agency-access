type OffboardingProviderOutcome =
  | 'deleted'
  | 'already_absent'
  | 'approval_pending'
  | 'manual_handoff'
  | 'reconnect_required'
  | 'transient_failure'
  | 'terminal_failure'
  | 'verification_failed';

export interface OffboardingProviderResult {
  success: boolean;
  providerOutcome: OffboardingProviderOutcome;
  requestId?: string;
  reason?: string;
  retryable: boolean;
}

const TRANSIENT_HTTP_CODES = new Set([429, 500, 502, 503, 504]);

export function normalizeProviderError(error: unknown): OffboardingProviderResult {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes('network') || message.includes('ECONN') || message.includes('fetch failed')) {
      return {
        success: false,
        providerOutcome: 'transient_failure',
        reason: message,
        retryable: true,
      };
    }
  }

  const status = extractHttpStatus(error);
  if (status !== undefined && TRANSIENT_HTTP_CODES.has(status)) {
    return {
      success: false,
      providerOutcome: 'transient_failure',
      reason: extractErrorMessage(error),
      retryable: true,
    };
  }

  if (status === 403) {
    return {
      success: false,
      providerOutcome: 'terminal_failure',
      reason: extractErrorMessage(error),
      retryable: false,
    };
  }

  return {
    success: false,
    providerOutcome: 'terminal_failure',
    reason: extractErrorMessage(error),
    retryable: false,
  };
}

function extractHttpStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.status === 'number') return obj.status;
    if (typeof obj.statusCode === 'number') return obj.statusCode;
  }
  return undefined;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
  }
  return String(error);
}

function buildBearerHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

function buildAdsHeaders(accessToken: string, loginCustomerId?: string): Record<string, string> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  };

  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId;
  }

  return headers;
}

function normalizeCustomerId(customerId: string): string {
  return customerId.replace(/^customers\//, '').replace(/\D/g, '');
}

async function parseJsonBody(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════
// Google Ads
// ═══════════════════════════════════════════════════════════════

export async function revokeAdsManagerLink(
  token: string,
  customerLoginId: string,
  managerLinkId: string,
): Promise<OffboardingProviderResult> {
  try {
    const customerId = normalizeCustomerId(customerLoginId);
    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/customerManagerLinks:mutate`,
      {
        method: 'POST',
        headers: buildAdsHeaders(token, customerId),
        body: JSON.stringify({
          operation: {
            update: {
              resourceName: `customers/${customerId}/customerManagerLinks/${managerLinkId}`,
              status: 'INACTIVE',
            },
          },
          updateMask: 'status',
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    const data = await parseJsonBody(response);
    return {
      success: true,
      providerOutcome: 'deleted',
      requestId: (data.result as Record<string, unknown>)?.resourceName as string | undefined,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function revokeAdsDirectUser(
  token: string,
  customerLoginId: string,
  userId: string,
): Promise<OffboardingProviderResult> {
  try {
    const customerId = normalizeCustomerId(customerLoginId);
    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/customerUserAccesses:mutate`,
      {
        method: 'POST',
        headers: buildAdsHeaders(token, customerId),
        body: JSON.stringify({
          operation: {
            remove: `customers/${customerId}/customerUserAccesses/${userId}`,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    const data = await parseJsonBody(response);
    return {
      success: true,
      providerOutcome: 'deleted',
      requestId: (data.result as Record<string, unknown>)?.resourceName as string | undefined,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function revokeAdsPendingInvitation(
  token: string,
  customerLoginId: string,
  invitationId: string,
): Promise<OffboardingProviderResult> {
  try {
    const customerId = normalizeCustomerId(customerLoginId);
    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/customerUserAccessInvitations:mutate`,
      {
        method: 'POST',
        headers: buildAdsHeaders(token, customerId),
        body: JSON.stringify({
          operation: {
            remove: `customers/${customerId}/customerUserAccessInvitations/${invitationId}`,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    const data = await parseJsonBody(response);
    return {
      success: true,
      providerOutcome: 'deleted',
      requestId: (data.result as Record<string, unknown>)?.resourceName as string | undefined,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function verifyAdsManagerLink(
  token: string,
  customerLoginId: string,
  managerLinkId: string,
): Promise<OffboardingProviderResult> {
  try {
    const customerId = normalizeCustomerId(customerLoginId);
    const query = [
      'SELECT customer_manager_link.manager_customer,',
      'customer_manager_link.manager_link_id,',
      'customer_manager_link.status',
      'FROM customer_manager_link',
      `WHERE customer_manager_link.manager_link_id = ${managerLinkId}`,
    ].join(' ');

    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: buildAdsHeaders(token, customerId),
        body: JSON.stringify({ query }),
      },
    );

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    const data = await parseJsonBody(response);
    const results = Array.isArray(data)
      ? (data as Array<Record<string, unknown>>).flatMap((chunk) => {
          const r = chunk.results as Array<Record<string, unknown>> | undefined;
          return r || [];
        })
      : ((data.results as Array<Record<string, unknown>>) || []);

    const link = results[0]?.customerManagerLink as Record<string, unknown> | undefined;
    if (!link) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    const status = String(link.status ?? '');
    if (status === 'INACTIVE') {
      return { success: true, providerOutcome: 'deleted', retryable: false };
    }

    if (status === 'PENDING') {
      return {
        success: false,
        providerOutcome: 'approval_pending',
        reason: `Manager link ${managerLinkId} still in PENDING status`,
        retryable: true,
      };
    }

    return {
      success: false,
      providerOutcome: 'verification_failed',
      reason: `Manager link ${managerLinkId} has unexpected status: ${status}`,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function verifyAdsUserRemoved(
  token: string,
  customerLoginId: string,
  userId: string,
): Promise<OffboardingProviderResult> {
  try {
    const customerId = normalizeCustomerId(customerLoginId);
    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/customerUserAccesses/${userId}`,
      {
        method: 'GET',
        headers: buildAdsHeaders(token, customerId),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return {
      success: false,
      providerOutcome: 'verification_failed',
      reason: `User access ${userId} still exists`,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// GA4
// ═══════════════════════════════════════════════════════════════

export async function revokeGa4AccessBinding(
  token: string,
  account: string,
  property: string,
  bindingId: string,
): Promise<OffboardingProviderResult> {
  const requiredScope = 'https://www.googleapis.com/auth/analytics.manage.users';
  const hasScope = await checkTokenScope(token, requiredScope);

  if (!hasScope) {
    return {
      success: false,
      providerOutcome: 'reconnect_required',
      reason: `Missing required scope ${requiredScope}`,
      retryable: false,
    };
  }

  try {
    const response = await fetch(
      `https://analyticsadmin.googleapis.com/v1alpha/properties/${property}/accessBindings/${bindingId}`,
      {
        method: 'DELETE',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return { success: true, providerOutcome: 'deleted', retryable: false };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function verifyGa4BindingRemoved(
  token: string,
  account: string,
  property: string,
  bindingId: string,
): Promise<OffboardingProviderResult> {
  try {
    const response = await fetch(
      `https://analyticsadmin.googleapis.com/v1alpha/properties/${property}/accessBindings/${bindingId}`,
      {
        method: 'GET',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return {
      success: false,
      providerOutcome: 'verification_failed',
      reason: `GA4 access binding ${bindingId} still exists`,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// Business Profile
// ═══════════════════════════════════════════════════════════════

export async function revokeBusinessAdmin(
  token: string,
  accountName: string,
  adminName: string,
): Promise<OffboardingProviderResult> {
  try {
    const guard = await guardBusinessAdminRemoval(token, accountName, adminName);
    if (!guard.allowed) {
      return {
        success: false,
        providerOutcome: guard.outcome!,
        reason: guard.reason!,
        retryable: false,
      };
    }

    if (guard.outcome === 'already_absent') {
      return {
        success: false,
        providerOutcome: 'already_absent',
        reason: guard.reason,
        retryable: false,
      };
    }

    const response = await fetch(
      `https://businessprofilelocations.googleapis.com/v1/${adminName}`,
      {
        method: 'DELETE',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return { success: true, providerOutcome: 'deleted', retryable: false };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function revokeBusinessLocationAdmin(
  token: string,
  accountName: string,
  locationName: string,
  adminName: string,
): Promise<OffboardingProviderResult> {
  try {
    const response = await fetch(
      `https://businessprofilelocations.googleapis.com/v1/${adminName}`,
      {
        method: 'DELETE',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return { success: true, providerOutcome: 'deleted', retryable: false };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

interface AdminGuardResult {
  allowed: boolean;
  outcome?: OffboardingProviderOutcome;
  reason?: string;
}

async function guardBusinessAdminRemoval(
  token: string,
  accountName: string,
  adminName: string,
): Promise<AdminGuardResult> {
  try {
    const response = await fetch(
      `https://mybusinessaccountmanagement.googleapis.com/v1/${accountName}/admins`,
      {
        method: 'GET',
        headers: buildBearerHeaders(token),
      },
    );

    if (!response.ok) {
      return { allowed: false, outcome: 'terminal_failure', reason: 'Guard check failed', retryable: true };
    }

    const data = await parseJsonBody(response);
    const admins = (data.admins as Array<Record<string, unknown>>) || [];
    const totalAdmins = admins.length;

    const targetAdmin = admins.find(
      (a) => (a.name as string) === adminName || (a.adminName as string) === adminName,
    );
    if (!targetAdmin) {
      return { allowed: true, outcome: 'already_absent', reason: 'Admin not found in account' };
    }

    const role = String(targetAdmin.role ?? '');
    if (role === 'PRIMARY_OWNER' || role === 'OWNER') {
      if (totalAdmins <= 1) {
        return {
          allowed: false,
          outcome: 'terminal_failure',
          reason: 'Cannot remove primary/sole owner — account would have no admin',
        };
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: false, outcome: 'terminal_failure', reason: 'Guard check failed', retryable: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// Tag Manager
// ═══════════════════════════════════════════════════════════════

export async function revokeGtmUserPermission(
  token: string,
  accountId: string,
  permissionId: string,
): Promise<OffboardingProviderResult> {
  try {
    const response = await fetch(
      `https://tagmanager.googleapis.com/v2/accounts/${accountId}/user_permissions/${permissionId}`,
      {
        method: 'DELETE',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return { success: true, providerOutcome: 'deleted', retryable: false };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function verifyGtmPermissionRemoved(
  token: string,
  accountId: string,
  permissionId: string,
): Promise<OffboardingProviderResult> {
  try {
    const response = await fetch(
      `https://tagmanager.googleapis.com/v2/accounts/${accountId}/user_permissions/${permissionId}`,
      {
        method: 'GET',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return {
      success: false,
      providerOutcome: 'verification_failed',
      reason: `GTM user permission ${permissionId} still exists`,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// Merchant Center
// ═══════════════════════════════════════════════════════════════

const MERCHANT_BASE_URL = 'https://merchantapi.googleapis.com/accounts/v1beta';

export async function revokeMerchantUser(
  token: string,
  accountId: string,
  userId: string,
): Promise<OffboardingProviderResult> {
  try {
    const guard = await guardMerchantUserRemoval(token, accountId, userId);
    if (!guard.allowed) {
      return {
        success: false,
        providerOutcome: guard.outcome!,
        reason: guard.reason!,
        retryable: false,
      };
    }

    const response = await fetch(
      `${MERCHANT_BASE_URL}/${accountId}/users/${userId}`,
      {
        method: 'DELETE',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return { success: true, providerOutcome: 'deleted', retryable: false };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

export async function verifyMerchantUserRemoved(
  token: string,
  accountId: string,
  userId: string,
): Promise<OffboardingProviderResult> {
  try {
    const response = await fetch(
      `${MERCHANT_BASE_URL}/${accountId}/users/${userId}`,
      {
        method: 'GET',
        headers: buildBearerHeaders(token),
      },
    );

    if (response.status === 404) {
      return { success: true, providerOutcome: 'already_absent', retryable: false };
    }

    if (!response.ok) {
      const errorBody = await parseJsonBody(response);
      const error = new Error(
        JSON.stringify(errorBody.error || errorBody) || `HTTP ${response.status}`,
      );
      return normalizeProviderError(Object.assign(error, { status: response.status }));
    }

    return {
      success: false,
      providerOutcome: 'verification_failed',
      reason: `Merchant user ${userId} still exists in account ${accountId}`,
      retryable: false,
    };
  } catch (error) {
    return normalizeProviderError(error);
  }
}

async function guardMerchantUserRemoval(
  token: string,
  accountId: string,
  userId: string,
): Promise<AdminGuardResult> {
  try {
    const response = await fetch(
      `${MERCHANT_BASE_URL}/${accountId}/users`,
      {
        method: 'GET',
        headers: buildBearerHeaders(token),
      },
    );

    if (!response.ok) {
      return { allowed: false, outcome: 'terminal_failure', reason: 'Guard check failed', retryable: true };
    }

    const data = await parseJsonBody(response);
    const users = (data.users as Array<Record<string, unknown>>) || [];
    const targetUsers = users.filter(
      (u) => {
        const name = u.name as string;
        return name === userId || name.endsWith(`/${userId}`);
      },
    );

    if (targetUsers.length === 0) {
      return { allowed: true };
    }

    const targetAdmins = targetUsers.filter(
      (u) => u.role === 'admin' || u.role === 'primaryAdmin',
    );

    if (targetAdmins.length === 0) {
      return { allowed: true };
    }

    const totalAdmins = users.filter(
      (u) => u.role === 'admin' || u.role === 'primaryAdmin',
    ).length;

    if (totalAdmins <= 1) {
      return {
        allowed: false,
        outcome: 'terminal_failure',
        reason: 'Cannot remove last admin/super-admin from Merchant Center account',
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: false, outcome: 'terminal_failure', reason: 'Guard check failed', retryable: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// Search Console
// ═══════════════════════════════════════════════════════════════

export function buildSearchConsoleHandoff(siteUrl: string): OffboardingProviderResult {
  return {
    success: true,
    providerOutcome: 'manual_handoff',
    reason: [
      'Search Console has no API for removing access.',
      `The client must manually remove your agency's access in:`,
      `  https://search.google.com/search-console/settings?siteUrl=${encodeURIComponent(siteUrl)}`,
      '',
      'Attestation template:',
      '  "I, [client name], confirm that agency access to Search Console property',
      `   ${siteUrl} has been removed from the Settings > Users and permissions page."`,
    ].join('\n'),
    retryable: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════

async function checkTokenScope(_token: string, _requiredScope: string): Promise<boolean> {
  const scopeEnv = process.env.GOOGLE_MOCK_SCOPES;
  if (scopeEnv) {
    const grantedScopes = new Set(scopeEnv.split(','));
    return grantedScopes.has(_requiredScope);
  }

  return true;
}
