import { authorizedApiFetch, AuthorizedApiError } from './authorized-api-fetch';

type TokenProvider = () => Promise<string | null>;

export interface OffboardingItem {
  id: string;
  product: string;
  classification:
    | 'eligible_automatic'
    | 'manual_action_required'
    | 'reconnect_required'
    | 'not_safely_reversible';
  productName: string;
  description: string;
}

export interface PrepareOffboardingResponse {
  runId: string;
  items: OffboardingItem[];
  capabilityToken: string;
}

export interface OffboardingItemStatus {
  id: string;
  product: string;
  productName: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'completed_with_manual_follow_up'
    | 'failed_retryable'
    | 'failed_permanent'
    | 'awaiting_client_approval'
    | 'not_applicable'
    | 'skipped';
  outcome?: string;
  nextAction?: string;
  secretCleanupResult?: 'deleted' | 'already_absent' | 'failed';
  verificationMethod?: 'human_reported' | 'automatic';
}

export interface OffboardingRun {
  id: string;
  connectionId: string;
  status:
    | 'pending_confirmation'
    | 'executing'
    | 'completed'
    | 'completed_with_manual_follow_up'
    | 'incomplete'
    | 'failed';
  items: OffboardingItemStatus[];
  startedAt?: string;
  completedAt?: string;
}

export interface OffboardingApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type OffboardingResult<T> = { data: T } | { error: OffboardingApiError };

function toError(err: unknown): OffboardingApiError {
  if (err instanceof AuthorizedApiError) {
    return { code: err.code, message: err.message, details: err.details };
  }
  return {
    code: 'NETWORK_ERROR',
    message: err instanceof Error ? err.message : 'Network error. Please try again.',
  };
}

export async function prepareOffboarding(
  agencyId: string,
  connectionId: string,
  getToken: TokenProvider,
): Promise<OffboardingResult<PrepareOffboardingResponse>> {
  try {
    const res = await authorizedApiFetch<{ data: PrepareOffboardingResponse }>(
      `/api/clients/${agencyId}/connections/${connectionId}/offboarding/prepare`,
      { method: 'POST', getToken },
    );
    return { data: res.data };
  } catch (err) {
    return { error: toError(err) };
  }
}

export async function confirmOffboarding(
  agencyId: string,
  connectionId: string,
  capabilityToken: string,
  getToken: TokenProvider,
): Promise<OffboardingResult<OffboardingRun>> {
  try {
    const res = await authorizedApiFetch<{ data: OffboardingRun }>(
      `/api/clients/${agencyId}/connections/${connectionId}/offboarding/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ capabilityToken }),
        getToken,
      },
    );
    return { data: res.data };
  } catch (err) {
    return { error: toError(err) };
  }
}

export async function getOffboardingRun(
  agencyId: string,
  connectionId: string,
  runId: string,
  getToken: TokenProvider,
): Promise<OffboardingResult<OffboardingRun>> {
  try {
    const res = await authorizedApiFetch<{ data: OffboardingRun }>(
      `/api/clients/${agencyId}/connections/${connectionId}/offboarding/runs/${runId}`,
      { getToken },
    );
    return { data: res.data };
  } catch (err) {
    return { error: toError(err) };
  }
}

export async function retryOffboardingRun(
  agencyId: string,
  connectionId: string,
  runId: string,
  getToken: TokenProvider,
): Promise<OffboardingResult<OffboardingRun>> {
  try {
    const res = await authorizedApiFetch<{ data: OffboardingRun }>(
      `/api/clients/${agencyId}/connections/${connectionId}/offboarding/runs/${runId}/retry`,
      { method: 'POST', getToken },
    );
    return { data: res.data };
  } catch (err) {
    return { error: toError(err) };
  }
}

export async function attestOffboardingItem(
  agencyId: string,
  connectionId: string,
  runId: string,
  itemId: string,
  getToken: TokenProvider,
): Promise<OffboardingResult<OffboardingRun>> {
  try {
    const res = await authorizedApiFetch<{ data: OffboardingRun }>(
      `/api/clients/${agencyId}/connections/${connectionId}/offboarding/runs/${runId}/items/${itemId}/attest`,
      { method: 'POST', getToken },
    );
    return { data: res.data };
  } catch (err) {
    return { error: toError(err) };
  }
}
