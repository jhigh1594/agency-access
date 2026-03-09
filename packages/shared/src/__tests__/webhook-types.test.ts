import { describe, expect, it } from '@jest/globals';
import {
  WebhookApiVersionSchema,
  WebhookDeliverySummarySchema,
  WebhookDeliveryStatusSchema,
  WebhookEndpointConfigInputSchema,
  WebhookEndpointStatusSchema,
  WebhookEventEnvelopeSchema,
  WebhookEventTypeSchema,
} from '../types';

describe('Webhook shared contracts', () => {
  it('accepts the expected webhook event types', () => {
    expect(WebhookEventTypeSchema.parse('webhook.test')).toBe('webhook.test');
    expect(WebhookEventTypeSchema.parse('access_request.partial')).toBe('access_request.partial');
    expect(WebhookEventTypeSchema.parse('access_request.completed')).toBe('access_request.completed');
  });

  it('locks webhook payloads to the current API version', () => {
    expect(WebhookApiVersionSchema.parse('2026-03-08')).toBe('2026-03-08');
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

  it('validates an access request completed webhook envelope', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_123',
      type: 'access_request.completed',
      apiVersion: '2026-03-08',
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
          authModel: 'delegated_access',
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
  });

  it('validates a webhook test event envelope', () => {
    const payload = WebhookEventEnvelopeSchema.parse({
      id: 'evt_test_123',
      type: 'webhook.test',
      apiVersion: '2026-03-08',
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
});
