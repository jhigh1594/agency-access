import { describe, expect, it } from 'vitest';
import { WEBHOOK_API_VERSION_V2 } from '@agency-platform/shared';
import {
  buildAccessRequestWebhookEvent,
  buildConnectionStatusChangedEvent,
  buildWebhookTestEvent,
  normalizeGrantedAssetsToV2,
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

  describe('V2 payload (apiVersion 2026-03-19)', () => {
    it('uses V2 apiVersion when specified', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.completed',
        apiVersion: WEBHOOK_API_VERSION_V2,
        request: {
          id: 'request-v2',
          status: 'completed',
          createdAt: new Date('2026-03-19T00:00:00.000Z'),
          authorizedAt: new Date('2026-03-19T01:00:00.000Z'),
          expiresAt: new Date('2026-04-18T00:00:00.000Z'),
          externalReference: 'crm-v2',
          uniqueToken: 'v2token',
          accessLevel: 'Manage',
        },
        client: {
          id: 'client-v2',
          name: 'V2 User',
          email: 'v2@example.com',
          company: 'V2 Corp',
        },
        authorizationProgress: {
          requestedPlatforms: ['meta'],
          completedPlatforms: ['meta'],
        },
        connections: [
          {
            connectionId: 'conn-v2',
            status: 'active',
            platforms: ['meta'],
            grantedAssets: {
              adAccounts: [{ id: 'act_123', name: 'Test Ad Account' }],
              pages: [{ id: 'page_456', name: 'Test Page' }],
            },
            grantedAt: new Date('2026-03-19T01:00:00.000Z'),
          },
        ],
        requestUrl: 'https://app.example.com/invite/v2token',
      });

      expect(event.apiVersion).toBe('2026-03-19');
      expect(event.data.accessRequest.accessLevel).toBe('Manage');
    });

    it('includes per-asset detail for Meta connections', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.completed',
        apiVersion: WEBHOOK_API_VERSION_V2,
        request: {
          id: 'req-meta',
          status: 'completed',
          createdAt: new Date('2026-03-19T00:00:00.000Z'),
          authorizedAt: new Date('2026-03-19T01:00:00.000Z'),
          expiresAt: new Date('2026-04-18T00:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'meta-token',
        },
        client: { id: 'c1', name: 'Meta Client', email: 'meta@example.com' },
        authorizationProgress: {
          requestedPlatforms: ['meta'],
          completedPlatforms: ['meta'],
        },
        connections: [
          {
            connectionId: 'conn-meta',
            status: 'active',
            platforms: ['meta'],
            grantedAssets: {
              adAccounts: [{ id: 'act_111', name: 'Acme Ads' }],
              pages: [{ id: 'page_222', name: 'Acme Page' }],
              instagramAccounts: [{ id: 'ig_333', username: 'acme_ig' }],
              productCatalogs: [{ id: 'cat_444', name: 'Acme Catalog' }],
            },
            grantedAt: new Date('2026-03-19T01:00:00.000Z'),
          },
        ],
        requestUrl: 'https://app.example.com/invite/meta-token',
      });

      const assets = event.data.connections[0]?.assets;
      expect(assets).toBeDefined();
      expect(assets!.length).toBe(4);
      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ assetId: 'act_111', assetType: 'Ad Account', platform: 'Meta' }),
          expect.objectContaining({ assetId: 'page_222', assetType: 'Page', platform: 'Meta' }),
          expect.objectContaining({ assetId: 'ig_333', assetType: 'Instagram Account', platform: 'Meta', assetName: 'acme_ig' }),
          expect.objectContaining({ assetId: 'cat_444', assetType: 'Product Catalog', platform: 'Meta' }),
        ]),
      );
    });

    it('includes per-asset detail for Google connections', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.completed',
        apiVersion: WEBHOOK_API_VERSION_V2,
        request: {
          id: 'req-google',
          status: 'completed',
          createdAt: new Date('2026-03-19T00:00:00.000Z'),
          authorizedAt: new Date('2026-03-19T01:00:00.000Z'),
          expiresAt: new Date('2026-04-18T00:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'google-token',
        },
        client: { id: 'c1', name: 'Google Client', email: 'google@example.com' },
        authorizationProgress: {
          requestedPlatforms: ['google'],
          completedPlatforms: ['google'],
        },
        connections: [
          {
            connectionId: 'conn-google',
            status: 'active',
            platforms: ['google'],
            grantedAssets: {
              adsAccounts: [
                { id: '123-456-7890', name: 'Google Ads 1', status: 'ACTIVE' },
                { id: '999-888-7777', name: 'Google Ads 2', status: 'NOT_GRANTED' },
              ],
              analyticsProperties: [
                { id: 'UA-12345', name: 'ga-prop', displayName: 'Acme GA4' },
              ],
            },
            grantedAt: new Date('2026-03-19T01:00:00.000Z'),
          },
        ],
        requestUrl: 'https://app.example.com/invite/google-token',
      });

      const assets = event.data.connections[0]?.assets;
      expect(assets).toBeDefined();
      expect(assets!.length).toBe(3);

      const failedAd = assets!.find((a) => a.assetId === '999-888-7777');
      expect(failedAd?.connectionStatus).toBe('Failed');
      expect(failedAd?.notes).toBe('Access not granted.');

      const ga4 = assets!.find((a) => a.assetId === 'UA-12345');
      expect(ga4?.assetName).toBe('Acme GA4');
      expect(ga4?.assetType).toBe('Google Analytics Property');
    });

    it('includes per-asset detail for LinkedIn connections', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.completed',
        apiVersion: WEBHOOK_API_VERSION_V2,
        request: {
          id: 'req-li',
          status: 'completed',
          createdAt: new Date('2026-03-19T00:00:00.000Z'),
          authorizedAt: new Date('2026-03-19T01:00:00.000Z'),
          expiresAt: new Date('2026-04-18T00:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'li-token',
        },
        client: { id: 'c1', name: 'LI Client', email: 'li@example.com' },
        authorizationProgress: {
          requestedPlatforms: ['linkedin'],
          completedPlatforms: ['linkedin'],
        },
        connections: [
          {
            connectionId: 'conn-li',
            status: 'active',
            platforms: ['linkedin'],
            grantedAssets: {
              adsAccounts: [{ id: 'li-act-1', name: 'LI Ads' }],
              pages: [{ id: 'li-page-1', name: 'LI Company Page' }],
            },
            grantedAt: new Date('2026-03-19T01:00:00.000Z'),
          },
        ],
        requestUrl: 'https://app.example.com/invite/li-token',
      });

      const assets = event.data.connections[0]?.assets;
      expect(assets).toBeDefined();
      expect(assets!.length).toBe(2);
      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ assetId: 'li-act-1', assetType: 'LinkedIn Ad Account', platform: 'LinkedIn' }),
          expect.objectContaining({ assetId: 'li-page-1', assetType: 'LinkedIn Page', platform: 'LinkedIn' }),
        ]),
      );
    });

    it('omits assets array when grantedAssets is null', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.completed',
        apiVersion: WEBHOOK_API_VERSION_V2,
        request: {
          id: 'req-no-assets',
          status: 'completed',
          createdAt: new Date('2026-03-19T00:00:00.000Z'),
          authorizedAt: null,
          expiresAt: new Date('2026-04-18T00:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'no-assets',
        },
        client: { id: 'c1', name: 'No Assets', email: 'no@example.com' },
        authorizationProgress: {
          requestedPlatforms: ['meta'],
          completedPlatforms: ['meta'],
        },
        connections: [
          {
            connectionId: 'conn-no-assets',
            status: 'active',
            platforms: ['meta'],
            grantedAssets: null,
          },
        ],
        requestUrl: 'https://app.example.com/invite/no-assets',
      });

      const connection = event.data.connections[0];
      expect(connection).toBeDefined();
      expect(connection).not.toHaveProperty('assets');
    });

    it('defaults to V1 when apiVersion is omitted', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.completed',
        request: {
          id: 'req-default',
          status: 'completed',
          createdAt: new Date('2026-03-19T00:00:00.000Z'),
          authorizedAt: null,
          expiresAt: new Date('2026-04-18T00:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'default',
        },
        client: { id: 'c1', name: 'Default', email: 'default@example.com' },
        authorizationProgress: { requestedPlatforms: [], completedPlatforms: [] },
        connections: [],
        requestUrl: 'https://app.example.com/invite/default',
      });

      expect(event.apiVersion).toBe('2026-03-08');
      expect(event.data.connections[0]).toBeUndefined();
    });
  });

  describe('normalizeGrantedAssetsToV2', () => {
    it('returns undefined for null grantedAssets', () => {
      expect(normalizeGrantedAssetsToV2(null, 'active', 'meta')).toBeUndefined();
    });

    it('returns undefined for empty object grantedAssets', () => {
      expect(normalizeGrantedAssetsToV2({}, 'active', 'meta')).toBeUndefined();
    });

    it('maps connection status to asset connectionStatus', () => {
      const assets = normalizeGrantedAssetsToV2(
        { adAccounts: [{ id: 'a1', name: 'Test' }] },
        'active',
        'meta',
      );
      expect(assets![0].connectionStatus).toBe('Connected');

      const failed = normalizeGrantedAssetsToV2(
        { adAccounts: [{ id: 'a1', name: 'Test' }] },
        'failed',
        'meta',
      );
      expect(failed![0].connectionStatus).toBe('Failed');
    });
  });

  describe('Phase 2 event builders', () => {
    it('builds access_request.revoked event with revokedAt and revokedBy', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.revoked',
        request: {
          id: 'req-revoke-1',
          status: 'revoked',
          createdAt: new Date('2026-03-10T09:00:00.000Z'),
          authorizedAt: new Date('2026-03-11T10:00:00.000Z'),
          expiresAt: new Date('2026-04-07T09:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'revoke-token',
        },
        client: { id: 'c1', name: 'Revoke Client', email: 'revoke@example.com', company: 'Revoke Co' },
        authorizationProgress: { requestedPlatforms: ['meta'], completedPlatforms: ['meta'] },
        connections: [{ connectionId: 'conn-1', status: 'revoked', platforms: ['meta'] }],
        requestUrl: 'https://app.example.com/invite/revoke-token',
        revokedAt: '2026-03-19T14:00:00.000Z',
        revokedBy: 'admin@agency.com',
      });

      expect(event.type).toBe('access_request.revoked');
      expect(event.data.accessRequest.revokedAt).toBe('2026-03-19T14:00:00.000Z');
      expect(event.data.accessRequest.revokedBy).toBe('admin@agency.com');
      expect(event.data.connections[0]?.status).toBe('revoked');
    });

    it('builds access_request.revoked with V2 apiVersion', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.revoked',
        apiVersion: WEBHOOK_API_VERSION_V2,
        request: {
          id: 'req-revoke-v2',
          status: 'revoked',
          createdAt: new Date('2026-03-10T09:00:00.000Z'),
          authorizedAt: null,
          expiresAt: new Date('2026-04-07T09:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'revoke-v2',
        },
        client: { id: 'c1', name: 'V2 Revoke', email: 'v2@example.com' },
        authorizationProgress: { requestedPlatforms: [], completedPlatforms: [] },
        connections: [],
        requestUrl: 'https://app.example.com/invite/revoke-v2',
        revokedAt: '2026-03-19T14:00:00.000Z',
      });

      expect(event.apiVersion).toBe('2026-03-19');
      expect(event.type).toBe('access_request.revoked');
      expect(event.data.accessRequest.revokedAt).toBe('2026-03-19T14:00:00.000Z');
    });

    it('builds access_request.expired event with expiredAt', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.expired',
        request: {
          id: 'req-expire-1',
          status: 'expired',
          createdAt: new Date('2026-03-10T09:00:00.000Z'),
          authorizedAt: null,
          expiresAt: new Date('2026-03-17T09:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'expire-token',
        },
        client: { id: 'c1', name: 'Expired Client', email: 'expired@example.com' },
        authorizationProgress: { requestedPlatforms: ['google'], completedPlatforms: [] },
        connections: [],
        requestUrl: 'https://app.example.com/invite/expire-token',
        expiredAt: '2026-03-19T15:00:00.000Z',
      });

      expect(event.type).toBe('access_request.expired');
      expect(event.data.accessRequest.expiredAt).toBe('2026-03-19T15:00:00.000Z');
      expect(event.data.accessRequest.status).toBe('expired');
    });

    it('omits revoked/expired fields for access_request.completed', () => {
      const event = buildAccessRequestWebhookEvent({
        type: 'access_request.completed',
        request: {
          id: 'req-normal',
          status: 'completed',
          createdAt: new Date('2026-03-19T00:00:00.000Z'),
          authorizedAt: new Date('2026-03-19T01:00:00.000Z'),
          expiresAt: new Date('2026-04-18T00:00:00.000Z'),
          externalReference: null,
          uniqueToken: 'normal',
        },
        client: { id: 'c1', name: 'Normal', email: 'normal@example.com' },
        authorizationProgress: { requestedPlatforms: [], completedPlatforms: [] },
        connections: [],
        requestUrl: 'https://app.example.com/invite/normal',
      });

      expect(event.data.accessRequest).not.toHaveProperty('revokedAt');
      expect(event.data.accessRequest).not.toHaveProperty('revokedBy');
      expect(event.data.accessRequest).not.toHaveProperty('expiredAt');
    });

    it('builds connection.status_changed event', () => {
      const event = buildConnectionStatusChangedEvent({
        connectionId: 'conn-status-1',
        agencyId: 'agency-1',
        platform: 'meta_ads',
        previousStatus: 'active',
        newStatus: 'invalid',
        client: {
          id: 'c1',
          name: 'Status Changed Client',
          email: 'status@example.com',
          company: 'Status Co',
        },
      });

      expect(event.type).toBe('connection.status_changed');
      expect(event.apiVersion).toBe('2026-03-08');
      expect(event.data.connectionId).toBe('conn-status-1');
      expect(event.data.previousStatus).toBe('active');
      expect(event.data.newStatus).toBe('invalid');
      expect(event.data.detectedAt).toBeDefined();
      expect(event.data.client?.company).toBe('Status Co');
    });

    it('builds connection.status_changed without client info', () => {
      const event = buildConnectionStatusChangedEvent({
        connectionId: 'conn-status-2',
        agencyId: 'agency-2',
        platform: 'google_ads',
        previousStatus: 'active',
        newStatus: 'expired',
      });

      expect(event.type).toBe('connection.status_changed');
      expect(event.data.client).toBeUndefined();
    });

    it('builds connection.status_changed with V2 apiVersion', () => {
      const event = buildConnectionStatusChangedEvent({
        connectionId: 'conn-v2',
        agencyId: 'agency-1',
        platform: 'meta_ads',
        previousStatus: 'active',
        newStatus: 'expired',
        apiVersion: WEBHOOK_API_VERSION_V2,
      });

      expect(event.apiVersion).toBe('2026-03-19');
    });
  });

  describe('normalizeGrantedAssetsToV2 runtime validation', () => {
    it('returns undefined for array instead of object', () => {
      // grantedAssets could be stored as an array in the DB due to a bug
      const result = normalizeGrantedAssetsToV2(
        ['not', 'an', 'object'] as unknown as Record<string, unknown>,
        'completed',
        'meta',
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when grantedAssets is a string', () => {
      const result = normalizeGrantedAssetsToV2(
        'malformed' as unknown as Record<string, unknown>,
        'completed',
        'meta',
      );
      expect(result).toBeUndefined();
    });

    it('skips asset entries missing required fields (id, name)', () => {
      const result = normalizeGrantedAssetsToV2(
        {
          adAccounts: [
            { id: 'a1', name: 'Valid Account' },
            { id: 'a2' }, // missing name
            { name: 'No ID' }, // missing id
            null, // null entry
            'string-entry', // string instead of object
          ],
        },
        'completed',
        'meta',
      );
      expect(result).toHaveLength(1);
      expect(result![0].assetId).toBe('a1');
      expect(result![0].assetName).toBe('Valid Account');
    });

    it('skips asset entries where id/name are not strings', () => {
      const result = normalizeGrantedAssetsToV2(
        {
          adAccounts: [
            { id: 123, name: 'Numeric ID' },
            { id: 'a1', name: 456 },
            { id: 'valid', name: 'Account' },
          ],
        },
        'completed',
        'meta',
      );
      expect(result).toHaveLength(1);
      expect(result![0].assetId).toBe('valid');
    });

    it('handles empty asset arrays gracefully', () => {
      const result = normalizeGrantedAssetsToV2(
        { adAccounts: [], pages: [] },
        'completed',
        'meta',
      );
      expect(result).toBeUndefined();
    });

    it('handles non-array values for asset fields', () => {
      const result = normalizeGrantedAssetsToV2(
        { adAccounts: 'not-an-array', pages: 42 },
        'completed',
        'meta',
      );
      expect(result).toBeUndefined();
    });

    it('filters invalid entries in Google assets', () => {
      const result = normalizeGrantedAssetsToV2(
        {
          adsAccounts: [
            { id: 'g1', name: 'Valid Google', status: 'ACTIVE' },
            { id: 'g2' }, // missing name
          ],
          analyticsProperties: [
            { id: 'p1', name: 'UA', displayName: 'Universal' },
            { id: 'p2' }, // missing name
          ],
        },
        'completed',
        'google',
      );
      expect(result).toHaveLength(2);
      expect(result![0].assetId).toBe('g1');
      expect(result![1].assetId).toBe('p1');
    });

    it('filters invalid entries in LinkedIn assets', () => {
      const result = normalizeGrantedAssetsToV2(
        {
          adsAccounts: [
            { id: 'l1', name: 'Valid LinkedIn' },
            null as unknown as Record<string, string>,
          ],
          pages: [
            { id: 'lp1', name: 'Valid Page' },
            { name: 'No ID' } as unknown as Record<string, string>,
          ],
        },
        'completed',
        'linkedin',
      );
      expect(result).toHaveLength(2);
      expect(result![0].assetId).toBe('l1');
      expect(result![1].assetId).toBe('lp1');
    });
  });
});
