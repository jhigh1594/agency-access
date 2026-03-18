import { describe, expect, it } from '@jest/globals';
import {
  WebhookApiVersionSchema,
  WEBHOOK_API_VERSION_V1,
  WEBHOOK_API_VERSION_V2,
  WebhookDeliverySummarySchema,
  WebhookDeliveryStatusSchema,
  WebhookEndpointConfigInputSchema,
  WebhookEndpointStatusSchema,
  WebhookEventEnvelopeSchema,
  WebhookEventTypeSchema,
  WebhookConnectionAssetV2Schema,
} from '../types';

describe('Webhook shared contracts', () => {
  it('accepts the expected webhook event types', () => {
    expect(WebhookEventTypeSchema.parse('webhook.test')).toBe('webhook.test');
    expect(WebhookEventTypeSchema.parse('access_request.partial')).toBe('access_request.partial');
    expect(WebhookEventTypeSchema.parse('access_request.completed')).toBe('access_request.completed');
  });

  it('accepts both V1 and V2 API versions', () => {
    expect(WebhookApiVersionSchema.parse(WEBHOOK_API_VERSION_V1)).toBe(WEBHOOK_API_VERSION_V1);
    expect(WebhookApiVersionSchema.parse(WEBHOOK_API_VERSION_V2)).toBe(WEBHOOK_API_VERSION_V2);
    expect(() => WebhookApiVersionSchema.parse('2026-03-09')).toThrow();
  });

  it('validates a webhook endpoint configuration payload', () => {
    const payload = WebhookEndpointConfigInputSchema.parse({
      url: 'https://example.com/webhooks/agency-access',
      subscribedEvents: ['access_request.partial', 'access_request.completed'],
    });

    expect(payload.url).toBe('https://example.com/webhooks/agency-access');
    expect(payload.subscribedEvents).toEqual([
      'access_request.partial',
      'access_request.completed',
    ]);
  });

  it('accepts preferredApiVersion in endpoint config', () => {
    const payload = WebhookEndpointConfigInputSchema.parse({
      url: 'https://example.com/webhooks/agency-access',
      subscribedEvents: ['access_request.completed'],
      preferredApiVersion: WEBHOOK_API_VERSION_V2,
    });

    expect(payload.preferredApiVersion).toBe(WEBHOOK_API_VERSION_V2);
  });

  it('defaults preferredApiVersion to V1 when omitted', () => {
    const payload = WebhookEndpointConfigInputSchema.parse({
      url: 'https://example.com/webhooks/agency-access',
      subscribedEvents: ['access_request.completed'],
    });

    expect(payload.preferredApiVersion).toBeUndefined();
  });

  it('allows all current event types (max updated to 6 for Phase 2 expansion)', () => {
    const payload = WebhookEndpointConfigInputSchema.parse({
      url: 'https://example.com/webhooks/agency-access',
      subscribedEvents: [
        'webhook.test',
        'access_request.partial',
        'access_request.completed',
      ],
    });

    expect(payload.subscribedEvents).toHaveLength(3);
  });

  it('requires at least one subscribed event', () => {
    const result = WebhookEndpointConfigInputSchema.safeParse({
      url: 'https://example.com/webhooks/agency-access',
      subscribedEvents: [],
    });

    expect(result.success).toBe(false);
  });

  it('accepts the expected endpoint and delivery statuses', () => {
    expect(WebhookEndpointStatusSchema.parse('active')).toBe('active');
    expect(WebhookEndpointStatusSchema.parse('disabled')).toBe('disabled');
    expect(WebhookDeliveryStatusSchema.parse('pending')).toBe('pending');
    expect(WebhookDeliveryStatusSchema.parse('delivered')).toBe('delivered');
    expect(WebhookDeliveryStatusSchema.parse('failed')).toBe('failed');
  });

  it('validates a V1 access request completed webhook envelope (unchanged)', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_123',
      type: 'access_request.completed',
      apiVersion: WEBHOOK_API_VERSION_V1,
      createdAt: '2026-03-08T18:00:00.000Z',
      data: {
        accessRequest: {
          id: 'request_123',
          status: 'completed',
          createdAt: '2026-03-08T17:00:00.000Z',
          authorizedAt: '2026-03-08T17:59:00.000Z',
          expiresAt: '2026-04-07T17:00:00.000Z',
          requestUrl: 'https://app.example.com/invite/abc123',
          requestedPlatforms: ['google', 'meta'],
          completedPlatforms: ['google', 'meta'],
          externalReference: 'crm-42',
        },
        client: {
          id: 'client_123',
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme Inc',
        },
        connections: [
          {
            connectionId: 'connection_123',
            status: 'active',
            platforms: ['google'],
            grantedAssetsSummary: {
              platform: 'google',
            },
          },
        ],
      },
    });

    expect(payload.type).toBe('access_request.completed');
    if (payload.type !== 'access_request.completed') {
      throw new Error('Expected an access_request.completed event');
    }

    expect(payload.data.accessRequest.externalReference).toBe('crm-42');
    expect(payload.data.connections[0]?.platforms).toEqual(['google']);
    // V1 envelope: no assets field, no accessLevel
    expect(payload.data.connections[0]?.assets).toBeUndefined();
  });

  it('validates a V2 access request completed envelope with per-asset detail', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_456',
      type: 'access_request.completed',
      apiVersion: WEBHOOK_API_VERSION_V2,
      createdAt: '2026-03-19T10:00:00.000Z',
      data: {
        accessRequest: {
          id: 'request_456',
          status: 'completed',
          createdAt: '2026-03-19T09:00:00.000Z',
          authorizedAt: '2026-03-19T09:45:00.000Z',
          expiresAt: '2026-04-16T09:00:00.000Z',
          requestUrl: 'https://app.example.com/invite/xyz789',
          requestedPlatforms: ['meta', 'google'],
          completedPlatforms: ['meta', 'google'],
          accessLevel: 'admin',
        },
        client: {
          id: 'client_456',
          name: 'John Smith',
          email: 'john@example.com',
          company: 'Big Agency',
        },
        connections: [
          {
            connectionId: 'connection_456',
            status: 'active',
            platforms: ['meta'],
            assets: [
              {
                assetId: '178046477',
                assetName: 'Test Ad Account',
                assetType: 'Ad Account',
                platform: 'Meta',
                connectionStatus: 'Connected',
                accessLevel: 'Manage',
                grantedAt: '2026-03-19T09:45:00.000Z',
                linkToAsset: 'https://business.facebook.com/settings/178046477',
                statusLastCheckedAt: '2026-03-19T09:46:00.000Z',
              },
              {
                assetId: '581293397',
                assetName: 'Test Page',
                assetType: 'Page',
                platform: 'Meta',
                connectionStatus: 'Connected',
                accessLevel: 'Manage',
                grantedAt: '2026-03-19T09:45:00.000Z',
                linkToAsset: 'https://www.facebook.com/581293397',
              },
            ],
          },
        ],
      },
    });

    expect(payload.apiVersion).toBe(WEBHOOK_API_VERSION_V2);
    if (payload.type !== 'access_request.completed') {
      throw new Error('Expected an access_request.completed event');
    }
    expect(payload.data.accessRequest.accessLevel).toBe('admin');
    expect(payload.data.connections[0]?.assets).toHaveLength(2);
    expect(payload.data.connections[0]?.assets?.[0]?.assetId).toBe('178046477');
    expect(payload.data.connections[0]?.assets?.[0]?.assetType).toBe('Ad Account');
    expect(payload.data.connections[0]?.assets?.[0]?.platform).toBe('Meta');
    expect(payload.data.connections[0]?.assets?.[0]?.linkToAsset).toBe('https://business.facebook.com/settings/178046477');
  });

  it('validates a V2 envelope with failed asset and notes', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_789',
      type: 'access_request.completed',
      apiVersion: WEBHOOK_API_VERSION_V2,
      createdAt: '2026-03-19T11:00:00.000Z',
      data: {
        accessRequest: {
          id: 'request_789',
          status: 'completed',
          createdAt: '2026-03-19T10:00:00.000Z',
          authorizedAt: '2026-03-19T10:30:00.000Z',
          expiresAt: '2026-04-16T10:00:00.000Z',
          requestUrl: 'https://app.example.com/invite/fail123',
          requestedPlatforms: ['google'],
          completedPlatforms: [],
        },
        client: {
          id: 'client_789',
          name: 'Bob Jones',
          email: 'bob@example.com',
        },
        connections: [
          {
            connectionId: 'connection_789',
            status: 'active',
            platforms: ['google'],
            assets: [
              {
                assetId: '12345',
                assetName: 'Failed Account',
                assetType: 'Google Ads Account',
                platform: 'Google',
                connectionStatus: 'Failed',
                notes: 'Client did not grant Google Ads access. Only Analytics was authorized.',
              },
            ],
          },
        ],
      },
    });

    if (payload.type !== 'access_request.completed') {
      throw new Error('Expected an access_request.completed event');
    }
    expect(payload.data.connections[0]?.assets?.[0]?.connectionStatus).toBe('Failed');
    expect(payload.data.connections[0]?.assets?.[0]?.notes).toBe(
      'Client did not grant Google Ads access. Only Analytics was authorized.',
    );
  });

  it('validates a V2 envelope with optional asset fields omitted', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_minimal',
      type: 'access_request.completed',
      apiVersion: WEBHOOK_API_VERSION_V2,
      createdAt: '2026-03-19T12:00:00.000Z',
      data: {
        accessRequest: {
          id: 'request_min',
          status: 'completed',
          createdAt: '2026-03-19T11:00:00.000Z',
          authorizedAt: '2026-03-19T11:30:00.000Z',
          expiresAt: '2026-04-16T11:00:00.000Z',
          requestUrl: 'https://app.example.com/invite/min',
          requestedPlatforms: ['meta'],
          completedPlatforms: ['meta'],
        },
        client: {
          id: 'client_min',
          name: 'Minimal Client',
          email: 'min@example.com',
        },
        connections: [
          {
            connectionId: 'connection_min',
            status: 'active',
            platforms: ['meta'],
            assets: [
              {
                assetId: '999',
                assetName: 'Simple Asset',
                assetType: 'Page',
                platform: 'Meta',
                connectionStatus: 'Connected',
              },
            ],
          },
        ],
      },
    });

    if (payload.type !== 'access_request.completed') {
      throw new Error('Expected an access_request.completed event');
    }
    expect(payload.data.connections[0]?.assets?.[0]?.accessLevel).toBeUndefined();
    expect(payload.data.connections[0]?.assets?.[0]?.grantedAt).toBeUndefined();
    expect(payload.data.connections[0]?.assets?.[0]?.linkToAsset).toBeUndefined();
    expect(payload.data.connections[0]?.assets?.[0]?.statusLastCheckedAt).toBeUndefined();
  });

  it('validates a V2 envelope with isReplay flag', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_replay',
      type: 'webhook.test',
      apiVersion: WEBHOOK_API_VERSION_V2,
      createdAt: '2026-03-19T12:00:00.000Z',
      isReplay: true,
      data: {
        message: 'This is a replayed test webhook.',
      },
    });

    expect(payload.isReplay).toBe(true);
  });

  it('validates a webhook test event envelope', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_test_123',
      type: 'webhook.test',
      apiVersion: WEBHOOK_API_VERSION_V1,
      createdAt: '2026-03-08T18:00:00.000Z',
      data: {
        message: 'This is a test webhook from Agency Access.',
      },
    });

    expect(payload.type).toBe('webhook.test');
  });

  it('validates a delivery summary payload', () => {
    const payload = WebhookDeliverySummarySchema.parse({
      id: 'delivery_123',
      eventId: 'evt_123',
      eventType: 'access_request.completed',
      status: 'failed',
      attemptNumber: 2,
      responseStatus: 500,
      responseBodySnippet: 'internal server error',
      errorMessage: 'Socket timeout',
      deliveredAt: null,
      createdAt: '2026-03-08T18:00:00.000Z',
    });

    expect(payload.status).toBe('failed');
    expect(payload.attemptNumber).toBe(2);
  });

  describe('WebhookConnectionAssetV2', () => {
    it('validates a complete V2 asset', () => {
      const asset = WebhookConnectionAssetV2Schema.parse({
        assetId: '178046477',
        assetName: 'Test Ad Account',
        assetType: 'Ad Account',
        platform: 'Meta',
        connectionStatus: 'Connected',
        accessLevel: 'Manage',
        grantedAt: '2026-03-19T09:45:00.000Z',
        notes: 'Client granted full management access.',
        linkToAsset: 'https://business.facebook.com/settings/178046477',
        statusLastCheckedAt: '2026-03-19T09:46:00.000Z',
      });

      expect(asset.assetId).toBe('178046477');
      expect(asset.platform).toBe('Meta');
      expect(asset.connectionStatus).toBe('Connected');
      expect(asset.accessLevel).toBe('Manage');
    });

    it('validates asset with minimal required fields', () => {
      const asset = WebhookConnectionAssetV2Schema.parse({
        assetId: '123',
        assetName: 'Minimal Asset',
        assetType: 'Page',
        platform: 'Google',
        connectionStatus: 'Connected',
      });

      expect(asset.accessLevel).toBeUndefined();
      expect(asset.notes).toBeUndefined();
      expect(asset.linkToAsset).toBeUndefined();
    });

    it('rejects invalid connectionStatus', () => {
      const result = WebhookConnectionAssetV2Schema.safeParse({
        assetId: '123',
        assetName: 'Bad Asset',
        assetType: 'Page',
        platform: 'Google',
        connectionStatus: 'InvalidStatus',
      });

      expect(result.success).toBe(false);
    });

    it('rejects invalid accessLevel', () => {
      const result = WebhookConnectionAssetV2Schema.safeParse({
        assetId: '123',
        assetName: 'Bad Asset',
        assetType: 'Page',
        platform: 'Google',
        connectionStatus: 'Connected',
        accessLevel: 'SuperAdmin',
      });

      expect(result.success).toBe(false);
    });
  });
});
