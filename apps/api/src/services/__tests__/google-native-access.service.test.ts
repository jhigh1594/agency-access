import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyPlatformConnection: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/services/google-native-grant.service', () => ({
  googleNativeGrantService: {
    upsertGrant: vi.fn(),
  },
}));

vi.mock('@/lib/queue-helpers', () => ({
  queueGoogleNativeGrantExecution: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { queueGoogleNativeGrantExecution } from '@/lib/queue-helpers';
import { googleNativeGrantService } from '@/services/google-native-grant.service';
import { googleNativeAccessService } from '../google-native-access.service.js';

describe('GoogleNativeAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('plans manager-link grants per selected Google Ads account and queues one job per asset', async () => {
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue({
      id: 'agency-google-1',
      agencyId: 'agency-1',
      agencyEmail: 'jon.highmu@gmail.com',
      connectedBy: 'owner@agency.test',
      metadata: {
        googleAssetSettings: {
          googleAdsManagement: {
            preferredGrantMode: 'manager_link',
            managerCustomerId: '6449142979',
            managerAccountLabel: 'Pillar AI Agency MCC',
            inviteEmail: 'jon.highmu@gmail.com',
          },
        },
      },
    } as any);

    vi.mocked(googleNativeGrantService.upsertGrant)
      .mockResolvedValueOnce({
        data: { id: 'grant-1' },
        error: null,
      } as any)
      .mockResolvedValueOnce({
        data: { id: 'grant-2' },
        error: null,
      } as any);

    const result = await googleNativeAccessService.planGoogleNativeGrants({
      accessRequest: {
        id: 'request-1',
        agencyId: 'agency-1',
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_ads', accessLevel: 'admin' }],
          },
        ],
      } as any,
      connection: {
        id: 'connection-1',
        agencyId: 'agency-1',
        clientEmail: 'client@example.com',
      } as any,
      platform: 'google_ads',
      selectedAssets: {
        adAccounts: ['1234567890', '0987654321'],
      },
    });

    expect(result.error).toBeNull();
    expect(googleNativeGrantService.upsertGrant).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        accessRequestId: 'request-1',
        connectionId: 'connection-1',
        product: 'google_ads',
        assetId: '1234567890',
        grantMode: 'manager_link',
        requestedRole: 'ADMIN',
        managerCustomerId: '6449142979',
        nativeGrantState: 'pending',
      })
    );
    expect(googleNativeGrantService.upsertGrant).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        assetId: '0987654321',
        grantMode: 'manager_link',
      })
    );
    expect(queueGoogleNativeGrantExecution).toHaveBeenCalledWith('grant-1');
    expect(queueGoogleNativeGrantExecution).toHaveBeenCalledWith('grant-2');
    expect(result.data?.selectedAssets).toEqual(
      expect.objectContaining({
        adAccounts: ['1234567890', '0987654321'],
        googleGrantLifecycle: expect.objectContaining({
          product: 'google_ads',
          fulfillmentMode: 'manager_link',
          state: 'pending_native_grant',
          grantStatus: 'pending',
        }),
      })
    );
  });

  it('falls back to direct user invites and records the fallback reason when MCC preconditions are missing', async () => {
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue({
      id: 'agency-google-1',
      agencyId: 'agency-1',
      agencyEmail: 'jon.highmu@gmail.com',
      connectedBy: 'owner@agency.test',
      metadata: {
        googleAssetSettings: {
          googleAdsManagement: {
            preferredGrantMode: 'manager_link',
            inviteEmail: 'jon.highmu@gmail.com',
          },
        },
      },
    } as any);

    vi.mocked(googleNativeGrantService.upsertGrant).mockResolvedValue({
      data: { id: 'grant-1' },
      error: null,
    } as any);

    const result = await googleNativeAccessService.planGoogleNativeGrants({
      accessRequest: {
        id: 'request-1',
        agencyId: 'agency-1',
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_ads', accessLevel: 'standard' }],
          },
        ],
      } as any,
      connection: {
        id: 'connection-1',
        agencyId: 'agency-1',
        clientEmail: 'client@example.com',
      } as any,
      platform: 'google_ads',
      selectedAssets: {
        adAccounts: ['1234567890'],
      },
    });

    expect(result.error).toBeNull();
    expect(googleNativeGrantService.upsertGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: '1234567890',
        grantMode: 'user_invite',
        recipientEmail: 'jon.highmu@gmail.com',
        metadata: expect.objectContaining({
          fallbackReason: 'missing_manager_customer_id',
          requestedMode: 'manager_link',
          resolvedMode: 'user_invite',
        }),
      })
    );
    expect(result.data?.selectedAssets).toEqual(
      expect.objectContaining({
        googleGrantLifecycle: expect.objectContaining({
          fulfillmentMode: 'user_invite',
          state: 'pending_native_grant',
          grantStatus: 'pending',
        }),
      })
    );
    expect(queueGoogleNativeGrantExecution).toHaveBeenCalledWith('grant-1');
  });

  it('does not persist or queue native grants for discovery-only Google products', async () => {
    const result = await googleNativeAccessService.planGoogleNativeGrants({
      accessRequest: {
        id: 'request-1',
        agencyId: 'agency-1',
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_search_console', accessLevel: 'standard' }],
          },
        ],
      } as any,
      connection: {
        id: 'connection-1',
        agencyId: 'agency-1',
        clientEmail: 'client@example.com',
      } as any,
      platform: 'google_search_console',
      selectedAssets: {
        sites: ['https://example.com/'],
      },
    });

    expect(result.error).toBeNull();
    expect(googleNativeGrantService.upsertGrant).not.toHaveBeenCalled();
    expect(queueGoogleNativeGrantExecution).not.toHaveBeenCalled();
    expect(result.data?.selectedAssets).toEqual(
      expect.objectContaining({
        sites: ['https://example.com/'],
        googleGrantLifecycle: expect.objectContaining({
          fulfillmentMode: 'discovery',
          state: 'fulfilled',
          isFulfilled: true,
        }),
      })
    );
  });
});
