import { describe, expect, it } from '@jest/globals';
import {
  evaluateGoogleProductFulfillment,
  type ClientAuthorizationProgress,
  type ClientDetailResponse,
  type GoogleProductGrantLifecycle,
} from '../types';

describe('Google native fulfillment contract', () => {
  it('treats OAuth-only authorization as insufficient for native-grant-supported products', () => {
    expect(
      evaluateGoogleProductFulfillment({
        productId: 'ga4',
        hasOAuthAuthorization: true,
        fulfillmentMode: 'access_binding',
      })
    ).toMatchObject({
      isFulfilled: false,
      requiresNativeGrant: true,
      state: 'oauth_only_insufficient',
      pendingActor: 'system',
    });
  });

  it('marks native-grant-supported products fulfilled only after the native grant is verified', () => {
    expect(
      evaluateGoogleProductFulfillment({
        productId: 'google_ads',
        hasOAuthAuthorization: true,
        fulfillmentMode: 'manager_link',
        grantStatus: 'verified',
      })
    ).toMatchObject({
      isFulfilled: true,
      requiresNativeGrant: true,
      state: 'fulfilled',
    });
  });

  it('maps pending native grants to a pending fulfillment state', () => {
    expect(
      evaluateGoogleProductFulfillment({
        productId: 'google_ads',
        hasOAuthAuthorization: true,
        fulfillmentMode: 'user_invite',
        grantStatus: 'awaiting_agency_acceptance',
      })
    ).toMatchObject({
      isFulfilled: false,
      state: 'pending_native_grant',
      pendingActor: 'agency',
    });
  });

  it('allows discovery-only products to complete when the explicit discovery mode is chosen', () => {
    expect(
      evaluateGoogleProductFulfillment({
        productId: 'google_search_console',
        hasOAuthAuthorization: true,
        fulfillmentMode: 'discovery',
      })
    ).toMatchObject({
      isFulfilled: true,
      requiresNativeGrant: false,
      state: 'fulfilled',
    });
  });

  it('does not allow unsupported native automation paths to be marked complete', () => {
    expect(
      evaluateGoogleProductFulfillment({
        productId: 'google_search_console',
        hasOAuthAuthorization: true,
        fulfillmentMode: 'user_permission',
        grantStatus: 'verified',
      })
    ).toMatchObject({
      isFulfilled: false,
      state: 'unsupported_automation_path',
    });
  });

  it('adds native grant lifecycle detail to client authorization progress additively', () => {
    const authorizationProgress: ClientAuthorizationProgress = {
      completedPlatforms: [],
      isComplete: false,
      googleProductFulfillment: [
        {
          product: 'ga4',
          capabilityTier: 'native_grant_supported',
          fulfillmentMode: 'access_binding',
          state: 'oauth_only_insufficient',
          requiresNativeGrant: true,
          isFulfilled: false,
          pendingActor: 'system',
        },
      ],
    };

    expect(authorizationProgress.googleProductFulfillment?.[0]?.state).toBe(
      'oauth_only_insufficient'
    );
  });

  it('allows client detail responses to expose per-product native grant lifecycle detail', () => {
    const lifecycle: GoogleProductGrantLifecycle = {
      product: 'google_ads',
      capabilityTier: 'native_grant_supported',
      fulfillmentMode: 'manager_link',
      state: 'pending_native_grant',
      requiresNativeGrant: true,
      isFulfilled: false,
      grantStatus: 'awaiting_client_acceptance',
      pendingActor: 'client',
    };

    const response: ClientDetailResponse = {
      client: {
        id: 'client-1',
        name: 'Taylor Client',
        company: 'Acme',
        email: 'taylor@acme.com',
        website: null,
        language: 'en',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-05T00:00:00.000Z'),
      },
      stats: {
        totalRequests: 1,
        activeConnections: 1,
        pendingConnections: 0,
        expiredConnections: 0,
      },
      platformGroups: [
        {
          platformGroup: 'google',
          status: 'partial',
          fulfilledCount: 0,
          requestedCount: 1,
          products: [
            {
              product: 'google_ads',
              status: 'pending',
              googleGrantLifecycle: lifecycle,
            },
          ],
        },
      ],
      accessRequests: [],
      activity: [],
    };

    expect(response.platformGroups[0]?.products[0]?.googleGrantLifecycle?.pendingActor).toBe(
      'client'
    );
  });
});
