import { randomUUID } from 'crypto';
import {
  type AccessRequestStatus,
  type ConnectionStatus,
  type WebhookAccessRequestLifecycleEventType,
} from '@agency-platform/shared';

interface AccessRequestWebhookEventInput {
  type: WebhookAccessRequestLifecycleEventType;
  request: {
    id: string;
    status: AccessRequestStatus;
    createdAt: Date;
    authorizedAt: Date | null;
    expiresAt: Date;
    externalReference: string | null;
    uniqueToken: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  authorizationProgress: {
    requestedPlatforms: string[];
    completedPlatforms: string[];
  };
  connections: Array<{
    connectionId: string;
    status: ConnectionStatus;
    platforms: string[];
    grantedAssetsSummary?: Record<string, unknown>;
  }>;
  requestUrl: string;
  clientPortalUrl?: string;
}

function buildEventId(): string {
  return `evt_${randomUUID().replace(/-/g, '')}`;
}

function buildBaseEnvelope() {
  return {
    id: buildEventId(),
    apiVersion: '2026-03-08' as const,
    createdAt: new Date().toISOString(),
  };
}

export function buildWebhookTestEvent() {
  return {
    ...buildBaseEnvelope(),
    type: 'webhook.test',
    data: {
      message: 'This is a test webhook from Agency Access.',
    },
  } as const;
}

export function buildAccessRequestWebhookEvent(input: AccessRequestWebhookEventInput) {
  return {
    ...buildBaseEnvelope(),
    type: input.type,
    data: {
      accessRequest: {
        id: input.request.id,
        status: input.request.status,
        createdAt: input.request.createdAt.toISOString(),
        authorizedAt: input.request.authorizedAt?.toISOString() ?? null,
        expiresAt: input.request.expiresAt.toISOString(),
        requestUrl: input.requestUrl,
        ...(input.clientPortalUrl ? { clientPortalUrl: input.clientPortalUrl } : {}),
        requestedPlatforms: input.authorizationProgress.requestedPlatforms,
        completedPlatforms: input.authorizationProgress.completedPlatforms,
        externalReference: input.request.externalReference,
      },
      client: {
        id: input.client.id,
        name: input.client.name,
        email: input.client.email,
        ...(input.client.company ? { company: input.client.company } : {}),
      },
      connections: input.connections.map((connection) => ({
        connectionId: connection.connectionId,
        status: connection.status,
        platforms: connection.platforms,
        ...(connection.grantedAssetsSummary
          ? { grantedAssetsSummary: connection.grantedAssetsSummary }
          : {}),
      })),
    },
  } as const;
}

export const webhookEventService = {
  buildWebhookTestEvent,
  buildAccessRequestWebhookEvent,
};
