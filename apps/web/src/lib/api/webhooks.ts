import type {
  WebhookDeliverySummary,
  WebhookEndpointConfigInput,
  WebhookEndpointSummary,
} from '@agency-platform/shared';
import { AuthorizedApiError, authorizedApiFetch } from './authorized-api-fetch';

type TokenProvider = () => Promise<string | null>;

interface ApiEnvelope<T> {
  data: T;
  error: null;
}

export interface WebhookEndpointMutationResult {
  endpoint: WebhookEndpointSummary;
  signingSecret?: string;
}

export interface WebhookDeliveryListResult {
  endpoint: WebhookEndpointSummary | null;
  deliveries: WebhookDeliverySummary[];
}

export interface WebhookTestEventResult {
  eventId: string;
  queued: true;
}

export async function getWebhookEndpoint(
  agencyId: string,
  getToken: TokenProvider
): Promise<WebhookEndpointSummary | null> {
  try {
    const response = await authorizedApiFetch<ApiEnvelope<{ endpoint: WebhookEndpointSummary }>>(
      `/api/agencies/${agencyId}/webhook-endpoint`,
      { getToken }
    );

    return response.data.endpoint;
  } catch (error) {
    if (error instanceof AuthorizedApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function listWebhookDeliveries(
  agencyId: string,
  limit: number,
  getToken: TokenProvider
): Promise<WebhookDeliveryListResult> {
  const response = await authorizedApiFetch<ApiEnvelope<WebhookDeliveryListResult>>(
    `/api/agencies/${agencyId}/webhook-deliveries?limit=${limit}`,
    { getToken }
  );

  return response.data;
}

export async function upsertWebhookEndpoint(
  agencyId: string,
  payload: WebhookEndpointConfigInput,
  getToken: TokenProvider
): Promise<WebhookEndpointMutationResult> {
  const response = await authorizedApiFetch<ApiEnvelope<WebhookEndpointMutationResult>>(
    `/api/agencies/${agencyId}/webhook-endpoint`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      getToken,
    }
  );

  return response.data;
}

export async function rotateWebhookEndpointSecret(
  agencyId: string,
  getToken: TokenProvider
): Promise<WebhookEndpointMutationResult> {
  const response = await authorizedApiFetch<ApiEnvelope<WebhookEndpointMutationResult>>(
    `/api/agencies/${agencyId}/webhook-endpoint/rotate-secret`,
    {
      method: 'POST',
      getToken,
    }
  );

  return response.data;
}

export async function disableWebhookEndpoint(
  agencyId: string,
  getToken: TokenProvider
): Promise<{ endpoint: WebhookEndpointSummary }> {
  const response = await authorizedApiFetch<ApiEnvelope<{ endpoint: WebhookEndpointSummary }>>(
    `/api/agencies/${agencyId}/webhook-endpoint/disable`,
    {
      method: 'POST',
      getToken,
    }
  );

  return response.data;
}

export async function sendWebhookTestEvent(
  agencyId: string,
  getToken: TokenProvider
): Promise<WebhookTestEventResult> {
  const response = await authorizedApiFetch<ApiEnvelope<WebhookTestEventResult>>(
    `/api/agencies/${agencyId}/webhook-endpoint/test`,
    {
      method: 'POST',
      getToken,
    }
  );

  return response.data;
}
