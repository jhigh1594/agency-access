import { describe, expect, it } from 'vitest';
import {
  buildAccessRequestWebhookEvent,
  buildWebhookTestEvent,
} from '@/services/webhook-event.service';

describe('webhook-event.service', () => {
  it('builds a webhook.test event envelope', () => {
    const event = buildWebhookTestEvent();

    expect(event.type).toBe('webhook.test');
    expect(event.apiVersion).toBe('2026-03-08');
    expect(event.data.message).toContain('test webhook');
  });

  it('builds an access_request.completed event envelope from stable request state', () => {
    const event = buildAccessRequestWebhookEvent({
      type: 'access_request.completed',
      request: {
        id: 'request-1',
        status: 'completed',
        createdAt: new Date('2026-03-08T00:00:00.000Z'),
        authorizedAt: new Date('2026-03-08T01:00:00.000Z'),
        expiresAt: new Date('2026-04-07T00:00:00.000Z'),
        authModel: 'delegated_access',
        externalReference: 'crm-123',
        uniqueToken: 'abc123',
      },
      client: {
        id: 'client-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        company: 'Acme Inc',
      },
      authorizationProgress: {
        requestedPlatforms: ['google', 'meta'],
        completedPlatforms: ['google', 'meta'],
      },
      connections: [
        {
          connectionId: 'connection-1',
          status: 'active',
          platforms: ['google'],
          grantedAssetsSummary: { platform: 'google' },
        },
      ],
      requestUrl: 'https://app.example.com/invite/abc123',
    });

    expect(event.type).toBe('access_request.completed');
    expect(event.data.accessRequest.externalReference).toBe('crm-123');
    expect(event.data.accessRequest.completedPlatforms).toEqual(['google', 'meta']);
    expect(event.data.connections[0]?.platforms).toEqual(['google']);
  });

  it('builds an access_request.partial event envelope without leaking unstable provider fields', () => {
    const event = buildAccessRequestWebhookEvent({
      type: 'access_request.partial',
      request: {
        id: 'request-2',
        status: 'partial',
        createdAt: new Date('2026-03-08T00:00:00.000Z'),
        authorizedAt: null,
        expiresAt: new Date('2026-04-07T00:00:00.000Z'),
        authModel: 'client_authorization',
        externalReference: null,
        uniqueToken: 'xyz789',
      },
      client: {
        id: 'client-2',
        name: 'John Doe',
        email: 'john@example.com',
      },
      authorizationProgress: {
        requestedPlatforms: ['google', 'meta'],
        completedPlatforms: ['google'],
      },
      connections: [],
      requestUrl: 'https://app.example.com/invite/xyz789',
    });

    expect(event.type).toBe('access_request.partial');
    expect(event.data.accessRequest.completedPlatforms).toEqual(['google']);
    expect(event.data.accessRequest).not.toHaveProperty('assignedUsers');
    expect(event.data.accessRequest).not.toHaveProperty('linkToAsset');
  });
});
