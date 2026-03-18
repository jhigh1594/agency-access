import { randomUUID } from 'crypto';
import {
  WEBHOOK_API_VERSION_V1,
  WEBHOOK_API_VERSION_V2,
  type WebhookApiVersion,
  type WebhookConnectionAssetV2,
  type AccessRequestStatus,
  type ConnectionStatus,
  type WebhookAccessRequestLifecycleEventType,
} from '@agency-platform/shared';

interface AccessRequestWebhookEventInput {
  type: WebhookAccessRequestLifecycleEventType;
  apiVersion?: WebhookApiVersion;
  request: {
    id: string;
    status: AccessRequestStatus;
    createdAt: Date;
    authorizedAt: Date | null;
    expiresAt: Date;
    externalReference: string | null;
    uniqueToken: string;
    accessLevel?: string;
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
    grantedAssets?: Record<string, unknown> | null;
    grantedAt?: Date | null;
    authorizationStatuses?: Array<{
      platform: string;
      status: string;
    }>;
  }>;
  requestUrl: string;
  clientPortalUrl?: string;
}

function buildEventId(): string {
  return `evt_${randomUUID().replace(/-/g, '')}`;
}

function buildBaseEnvelope(apiVersion: WebhookApiVersion = WEBHOOK_API_VERSION_V1) {
  return {
    id: buildEventId(),
    apiVersion,
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

/**
 * Maps raw grantedAssets JSON from ClientConnection to normalized V2 asset array.
 * Each platform has a different structure (Meta: adAccounts[], pages[]; Google: adsAccounts[], etc.)
 * This function normalizes them into a uniform WebhookConnectionAssetV2 format.
 */
export function normalizeGrantedAssetsToV2(
  grantedAssets: Record<string, unknown> | null,
  connectionStatus: ConnectionStatus,
  platform: string,
  grantedAt?: Date | null,
  authorizationStatuses?: Array<{ platform: string; status: string }>,
): WebhookConnectionAssetV2[] | undefined {
  if (!grantedAssets || typeof grantedAssets !== 'object') {
    return undefined;
  }

  const assets: WebhookConnectionAssetV2[] = [];
  const normalizedPlatform = platform.toLowerCase();

  // Determine connection-level status for individual assets
  const connectionStatusMap: Record<string, 'Connected' | 'Failed' | 'Pending'> = {
    active: 'Connected',
    completed: 'Connected',
    partial: 'Pending',
    pending: 'Pending',
    failed: 'Failed',
    revoked: 'Failed',
    expired: 'Failed',
  };
  const baseConnectionStatus = connectionStatusMap[connectionStatus] ?? 'Pending';

  // Meta assets
  if (normalizedPlatform === 'meta') {
    const adAccounts = grantedAssets.adAccounts as Array<{ id: string; name: string }> | undefined;
    for (const account of adAccounts ?? []) {
      assets.push({
        assetId: account.id,
        assetName: account.name,
        assetType: 'Ad Account',
        platform: 'Meta',
        connectionStatus: baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
        linkToAsset: `https://business.facebook.com/settings/${account.id}`,
      });
    }

    const pages = grantedAssets.pages as Array<{ id: string; name: string }> | undefined;
    for (const page of pages ?? []) {
      assets.push({
        assetId: page.id,
        assetName: page.name,
        assetType: 'Page',
        platform: 'Meta',
        connectionStatus: baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
        linkToAsset: `https://www.facebook.com/${page.id}`,
      });
    }

    const instagramAccounts = grantedAssets.instagramAccounts as Array<{ id: string; username: string }> | undefined;
    for (const ig of instagramAccounts ?? []) {
      assets.push({
        assetId: ig.id,
        assetName: ig.username,
        assetType: 'Instagram Account',
        platform: 'Meta',
        connectionStatus: baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
        linkToAsset: `https://www.instagram.com/${ig.username}`,
      });
    }

    const catalogs = grantedAssets.productCatalogs as Array<{ id: string; name: string }> | undefined;
    for (const catalog of catalogs ?? []) {
      assets.push({
        assetId: catalog.id,
        assetName: catalog.name,
        assetType: 'Product Catalog',
        platform: 'Meta',
        connectionStatus: baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
      });
    }
  }

  // Google assets
  if (normalizedPlatform === 'google') {
    const adsAccounts = grantedAssets.adsAccounts as Array<{ id: string; name: string; status: string }> | undefined;
    for (const account of adsAccounts ?? []) {
      const isFailed = account.status === 'FAILED' || account.status === 'NOT_GRANTED';
      assets.push({
        assetId: account.id,
        assetName: account.name,
        assetType: 'Google Ads Account',
        platform: 'Google',
        connectionStatus: isFailed ? 'Failed' : baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
        linkToAsset: `https://ads.google.com/aw/accounts/${account.id}`,
        notes: isFailed ? 'Access not granted.' : undefined,
      });
    }

    const analyticsProperties = grantedAssets.analyticsProperties as Array<{ id: string; name: string; displayName?: string }> | undefined;
    for (const prop of analyticsProperties ?? []) {
      assets.push({
        assetId: prop.id,
        assetName: prop.displayName ?? prop.name,
        assetType: 'Google Analytics Property',
        platform: 'Google',
        connectionStatus: baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
      });
    }
  }

  // LinkedIn assets
  if (normalizedPlatform === 'linkedin') {
    const linkedinAds = grantedAssets.adsAccounts as Array<{ id: string; name: string }> | undefined;
    for (const account of linkedinAds ?? []) {
      assets.push({
        assetId: account.id,
        assetName: account.name,
        assetType: 'LinkedIn Ad Account',
        platform: 'LinkedIn',
        connectionStatus: baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
      });
    }

    const linkedinPages = grantedAssets.pages as Array<{ id: string; name: string }> | undefined;
    for (const page of linkedinPages ?? []) {
      assets.push({
        assetId: page.id,
        assetName: page.name,
        assetType: 'LinkedIn Page',
        platform: 'LinkedIn',
        connectionStatus: baseConnectionStatus,
        grantedAt: grantedAt?.toISOString(),
      });
    }
  }

  return assets.length > 0 ? assets : undefined;
}

/**
 * Builds V2 access request webhook event with per-asset detail.
 * Called when endpoint.preferredApiVersion is '2026-03-19'.
 */
function buildAccessRequestWebhookEventV2(input: AccessRequestWebhookEventInput) {
  return {
    ...buildBaseEnvelope(WEBHOOK_API_VERSION_V2),
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
        ...(input.request.accessLevel ? { accessLevel: input.request.accessLevel } : {}),
      },
      client: {
        id: input.client.id,
        name: input.client.name,
        email: input.client.email,
        ...(input.client.company ? { company: input.client.company } : {}),
      },
      connections: input.connections.map((connection) => {
        const primaryPlatform = connection.platforms[0] ?? 'unknown';
        const assets = normalizeGrantedAssetsToV2(
          (connection.grantedAssets as Record<string, unknown> | null) ?? null,
          connection.status,
          primaryPlatform,
          connection.grantedAt ?? undefined,
          connection.authorizationStatuses,
        );

        return {
          connectionId: connection.connectionId,
          status: connection.status,
          platforms: connection.platforms,
          ...(connection.grantedAssetsSummary
            ? { grantedAssetsSummary: connection.grantedAssetsSummary }
            : {}),
          ...(assets ? { assets } : {}),
        };
      }),
    },
  } as const;
}

/**
 * Builds access request webhook event. Routes to V1 or V2 builder based on apiVersion.
 * V1 (default): connection-level summary, unchanged behavior.
 * V2 ('2026-03-19'): per-asset detail with normalized assets array.
 */
export function buildAccessRequestWebhookEvent(input: AccessRequestWebhookEventInput) {
  if (input.apiVersion === WEBHOOK_API_VERSION_V2) {
    return buildAccessRequestWebhookEventV2(input);
  }

  // V1 — existing behavior unchanged
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
  normalizeGrantedAssetsToV2,
};
