import type { ClientDetailResponse } from '@agency-platform/shared';

export const CLIENT_DETAIL_HARNESS_PRESET_NAMES = [
  'fully-connected',
  'mixed-google',
  'revoked-meta',
  'empty-client',
  'multi-request-history',
] as const;

export type ClientDetailHarnessPresetName =
  (typeof CLIENT_DETAIL_HARNESS_PRESET_NAMES)[number];

function buildBaseFixture(): ClientDetailResponse {
  return {
    client: {
      id: 'client-brightland',
      name: 'Brightland Dental',
      company: 'Brightland Dental Studio',
      email: 'hello@brightlanddental.com',
      website: 'https://brightlanddental.com',
      language: 'en',
      createdAt: new Date('2026-01-12T16:00:00.000Z'),
      updatedAt: new Date('2026-03-10T16:00:00.000Z'),
    },
    stats: {
      totalRequests: 3,
      activeConnections: 1,
      pendingConnections: 1,
      expiredConnections: 0,
    },
    platformGroups: [
      {
        platformGroup: 'google',
        status: 'needs_follow_up',
        fulfilledCount: 4,
        requestedCount: 5,
        latestRequestId: 'request-google-refresh',
        latestRequestName: 'Q1 performance access',
        latestRequestedAt: new Date('2026-03-08T15:00:00.000Z'),
        products: [
          { product: 'google_ads', status: 'connected' },
          { product: 'ga4', status: 'connected' },
          { product: 'google_tag_manager', status: 'connected' },
          { product: 'google_search_console', status: 'connected' },
          {
            product: 'google_merchant_center',
            status: 'no_assets',
            note: 'No merchant accounts discovered',
          },
        ],
      },
      {
        platformGroup: 'meta',
        status: 'pending',
        fulfilledCount: 0,
        requestedCount: 1,
        latestRequestId: 'request-meta-new',
        latestRequestName: 'Spring launch setup',
        latestRequestedAt: new Date('2026-03-10T12:00:00.000Z'),
        products: [{ product: 'meta_ads', status: 'pending' }],
      },
    ],
    accessRequests: [
      {
        id: 'request-google-refresh',
        name: 'Q1 performance access',
        platforms: ['google', 'google_ads', 'ga4'],
        status: 'partial',
        createdAt: new Date('2026-03-08T15:00:00.000Z'),
        authorizedAt: new Date('2026-03-08T16:30:00.000Z'),
        connectionId: 'connection-google-1',
        connectionStatus: 'active',
      },
      {
        id: 'request-meta-new',
        name: 'Spring launch setup',
        platforms: ['meta_ads'],
        status: 'pending',
        createdAt: new Date('2026-03-10T12:00:00.000Z'),
      },
      {
        id: 'request-archive',
        name: 'Legacy reconnect',
        platforms: ['google_ads'],
        status: 'completed',
        createdAt: new Date('2026-02-01T12:00:00.000Z'),
        authorizedAt: new Date('2026-02-01T13:00:00.000Z'),
        connectionId: 'connection-google-legacy',
        connectionStatus: 'active',
      },
    ],
    activity: [
      {
        id: 'activity-1',
        type: 'request_created',
        description: 'Created Q1 performance access request',
        timestamp: new Date('2026-03-08T15:00:00.000Z'),
        metadata: {
          requestName: 'Q1 performance access',
          platforms: ['google', 'google_ads', 'ga4'],
          status: 'partial',
        },
      },
      {
        id: 'activity-2',
        type: 'connection_created',
        description: 'Google connection authorized',
        timestamp: new Date('2026-03-08T16:30:00.000Z'),
        metadata: {
          requestName: 'Q1 performance access',
          platforms: ['google', 'google_ads', 'ga4'],
          status: 'active',
        },
      },
    ],
  };
}

const CLIENT_DETAIL_HARNESS_PRESETS: Record<
  ClientDetailHarnessPresetName,
  ClientDetailResponse
> = {
  'fully-connected': {
    ...buildBaseFixture(),
    client: {
      id: 'client-northstar',
      name: 'Northstar Running',
      company: 'Northstar Running Co.',
      email: 'ops@northstarrunning.com',
      website: 'https://northstarrunning.com',
      language: 'en',
      createdAt: new Date('2025-11-10T16:00:00.000Z'),
      updatedAt: new Date('2026-03-10T16:00:00.000Z'),
    },
    stats: {
      totalRequests: 2,
      activeConnections: 2,
      pendingConnections: 0,
      expiredConnections: 0,
    },
    platformGroups: [
      {
        platformGroup: 'google',
        status: 'connected',
        fulfilledCount: 3,
        requestedCount: 3,
        latestRequestId: 'request-fully-google',
        latestRequestName: 'Core reporting stack',
        latestRequestedAt: new Date('2026-03-05T15:00:00.000Z'),
        products: [
          { product: 'google_ads', status: 'connected' },
          { product: 'ga4', status: 'connected' },
          { product: 'google_tag_manager', status: 'connected' },
        ],
      },
      {
        platformGroup: 'meta',
        status: 'connected',
        fulfilledCount: 1,
        requestedCount: 1,
        latestRequestId: 'request-fully-meta',
        latestRequestName: 'Paid social handoff',
        latestRequestedAt: new Date('2026-03-06T15:00:00.000Z'),
        products: [{ product: 'meta_ads', status: 'connected' }],
      },
    ],
    accessRequests: [
      {
        id: 'request-fully-google',
        name: 'Core reporting stack',
        platforms: ['google', 'google_ads', 'ga4'],
        status: 'completed',
        createdAt: new Date('2026-03-05T15:00:00.000Z'),
        authorizedAt: new Date('2026-03-05T16:00:00.000Z'),
        connectionId: 'connection-google-fully',
        connectionStatus: 'active',
      },
      {
        id: 'request-fully-meta',
        name: 'Paid social handoff',
        platforms: ['meta_ads'],
        status: 'completed',
        createdAt: new Date('2026-03-06T15:00:00.000Z'),
        authorizedAt: new Date('2026-03-06T16:00:00.000Z'),
        connectionId: 'connection-meta-fully',
        connectionStatus: 'active',
      },
    ],
  },
  'mixed-google': buildBaseFixture(),
  'revoked-meta': {
    ...buildBaseFixture(),
    client: {
      id: 'client-atlas-peak',
      name: 'Atlas Peak',
      company: 'Atlas Peak Creative',
      email: 'team@atlaspeak.co',
      website: 'https://atlaspeak.co',
      language: 'en',
      createdAt: new Date('2025-08-18T16:00:00.000Z'),
      updatedAt: new Date('2026-03-10T16:00:00.000Z'),
    },
    stats: {
      totalRequests: 2,
      activeConnections: 0,
      pendingConnections: 0,
      expiredConnections: 1,
    },
    platformGroups: [
      {
        platformGroup: 'meta',
        status: 'revoked',
        fulfilledCount: 0,
        requestedCount: 1,
        latestRequestId: 'request-meta-revoked',
        latestRequestName: 'Meta reconnect',
        latestRequestedAt: new Date('2026-03-09T11:00:00.000Z'),
        products: [
          {
            product: 'meta_ads',
            status: 'revoked',
            note: 'Connection was revoked by the client',
          },
        ],
      },
    ],
    accessRequests: [
      {
        id: 'request-meta-revoked',
        name: 'Meta reconnect',
        platforms: ['meta_ads'],
        status: 'revoked',
        createdAt: new Date('2026-03-09T11:00:00.000Z'),
        authorizedAt: new Date('2026-03-09T11:45:00.000Z'),
        connectionId: 'connection-meta-revoked',
        connectionStatus: 'revoked',
      },
      {
        id: 'request-meta-original',
        name: 'Initial Meta setup',
        platforms: ['meta_ads'],
        status: 'completed',
        createdAt: new Date('2026-01-14T11:00:00.000Z'),
        authorizedAt: new Date('2026-01-14T11:30:00.000Z'),
        connectionId: 'connection-meta-original',
        connectionStatus: 'expired',
      },
    ],
  },
  'empty-client': {
    ...buildBaseFixture(),
    client: {
      id: 'client-summit-bookkeeping',
      name: 'Summit Bookkeeping',
      company: 'Summit Bookkeeping',
      email: 'owner@summitbookkeeping.com',
      website: null,
      language: 'en',
      createdAt: new Date('2026-03-01T16:00:00.000Z'),
      updatedAt: new Date('2026-03-10T16:00:00.000Z'),
    },
    stats: {
      totalRequests: 0,
      activeConnections: 0,
      pendingConnections: 0,
      expiredConnections: 0,
    },
    platformGroups: [],
    accessRequests: [],
    activity: [],
  },
  'multi-request-history': {
    ...buildBaseFixture(),
    client: {
      id: 'client-hinterland',
      name: 'Hinterland Hospitality',
      company: 'Hinterland Hospitality Group',
      email: 'marketing@hinterlandhg.com',
      website: 'https://hinterlandhg.com',
      language: 'en',
      createdAt: new Date('2025-09-14T16:00:00.000Z'),
      updatedAt: new Date('2026-03-10T16:00:00.000Z'),
    },
    stats: {
      totalRequests: 4,
      activeConnections: 1,
      pendingConnections: 2,
      expiredConnections: 1,
    },
    accessRequests: [
      {
        id: 'request-history-1',
        name: 'Launch analytics handoff',
        platforms: ['google_ads', 'ga4'],
        status: 'completed',
        createdAt: new Date('2026-01-04T10:00:00.000Z'),
        authorizedAt: new Date('2026-01-04T11:00:00.000Z'),
        connectionId: 'connection-history-1',
        connectionStatus: 'active',
      },
      {
        id: 'request-history-2',
        name: 'Holiday promo reactivation',
        platforms: ['meta_ads'],
        status: 'expired',
        createdAt: new Date('2026-02-12T10:00:00.000Z'),
        connectionId: 'connection-history-2',
        connectionStatus: 'expired',
      },
      {
        id: 'request-history-3',
        name: 'Local SEO audit',
        platforms: ['google'],
        status: 'partial',
        createdAt: new Date('2026-02-26T10:00:00.000Z'),
        authorizedAt: new Date('2026-02-26T12:00:00.000Z'),
        connectionId: 'connection-history-3',
        connectionStatus: 'active',
      },
      {
        id: 'request-history-4',
        name: 'Spring campaign setup',
        platforms: ['meta_ads'],
        status: 'pending',
        createdAt: new Date('2026-03-10T10:00:00.000Z'),
      },
    ],
  },
};

export function getClientDetailHarnessFixture(
  presetName: ClientDetailHarnessPresetName
): ClientDetailResponse {
  return CLIENT_DETAIL_HARNESS_PRESETS[presetName];
}
