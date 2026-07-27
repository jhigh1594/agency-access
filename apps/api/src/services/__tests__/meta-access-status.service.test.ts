import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessRequest: { findUnique: vi.fn() },
    metaAgencyDestination: { findFirst: vi.fn() },
    metaAssetGrant: { upsert: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    clientConnection: { findUnique: vi.fn() },
    platformAuthorization: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { metaAccessStatusService } from '../meta-access-status.service.js';
import { metaAccessPolicyService } from '../meta-access-policy.service.js';

describe('metaAccessStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));
  });

  it('upserts one logical grant across retries after checking ownership', async () => {
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({ id: 'request-1', agencyId: 'agency-1' } as any);
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue({ id: 'destination-1' } as any);
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      id: 'connection-1',
      accessRequestId: 'request-1',
      agencyId: 'agency-1',
    } as any);
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'authorization-1', connectionId: 'connection-1', platform: 'meta',
    } as any);
    vi.mocked(prisma.metaAssetGrant.upsert).mockResolvedValue({ id: 'grant-1', status: 'pending' } as any);

    const input = {
      agencyId: 'agency-1',
      accessRequestId: 'request-1',
      connectionId: 'connection-1',
      destinationId: 'destination-1',
      clientBusinessId: 'client-business-1',
      recipeId: 'meta_run_ads' as const,
      recipeVersion: 1,
      assetKind: 'ad_account' as const,
      assetId: 'act_1',
      requestedTasks: ['ADVERTISE', 'ANALYZE'],
      grantMethod: 'automatic',
      status: 'pending' as const,
    };

    await metaAccessStatusService.upsertGrant(input);
    await metaAccessStatusService.upsertGrant(input);

    expect(prisma.metaAssetGrant.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.metaAssetGrant.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          accessRequestId_destinationId_clientBusinessId_assetKind_assetId: {
            accessRequestId: 'request-1',
            destinationId: 'destination-1',
            clientBusinessId: 'client-business-1',
            assetKind: 'ad_account',
            assetId: 'act_1',
          },
        },
      })
    );
  });

  it('rejects an authorization that belongs to another connection', async () => {
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({ id: 'request-1', agencyId: 'agency-1' } as any);
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue({ id: 'destination-1' } as any);
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      id: 'connection-1', accessRequestId: 'request-1', agencyId: 'agency-1',
    } as any);
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'authorization-other', connectionId: 'connection-other', platform: 'meta',
    } as any);

    const result = await metaAccessStatusService.upsertGrant({
      agencyId: 'agency-1',
      accessRequestId: 'request-1',
      connectionId: 'connection-1',
      authorizationId: 'authorization-other',
      destinationId: 'destination-1',
      clientBusinessId: 'client-business-1',
      recipeId: 'meta_run_ads',
      recipeVersion: 1,
      assetKind: 'ad_account',
      assetId: 'act_1',
      requestedTasks: ['ADVERTISE', 'ANALYZE'],
      grantMethod: 'automatic',
      status: 'pending',
    });

    expect(result.error?.code).toBe('FORBIDDEN');
    expect(prisma.metaAssetGrant.upsert).not.toHaveBeenCalled();
  });

  it('rejects a verified-to-pending regression', async () => {
    vi.mocked(prisma.metaAssetGrant.findUnique).mockResolvedValue({
      id: 'grant-1',
      status: 'verified',
      attemptVersion: 1,
    } as any);

    const result = await metaAccessStatusService.transitionGrant('grant-1', 'pending');

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('INVALID_GRANT_TRANSITION');
    expect(prisma.metaAssetGrant.update).not.toHaveBeenCalled();
  });

  it('projects legacy OBO grant metadata when normalized rows do not exist', async () => {
    vi.mocked(prisma.metaAssetGrant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      authorizations: [
        {
          platform: 'meta',
          metadata: {
            meta: {
              obo: {
                assetGrantResults: [
                  {
                    assetId: 'page-1',
                    assetType: 'page',
                    requestedTasks: ['ANALYZE'],
                    status: 'verified',
                    verifiedAt: '2026-07-21T00:00:00.000Z',
                  },
                ],
              },
            },
          },
        },
      ],
    } as any);

    const result = await metaAccessStatusService.listForRequest('request-1');

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      expect.objectContaining({ assetId: 'page-1', assetKind: 'page', status: 'verified', source: 'legacy' }),
    ]);
  });

  it('marks outcome fulfillment complete only when every required selected grant is verified', async () => {
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_run_ads', destinationId: 'destination-1' }),
    } as any);
    vi.mocked(prisma.metaAssetGrant.findMany).mockResolvedValue([
      {
        destinationId: 'destination-1', clientBusinessId: 'client-business-1', recipeId: 'meta_run_ads', recipeVersion: 1,
        assetKind: 'ad_account', assetId: 'act-1', status: 'verified', verifiedAt: new Date('2026-07-21T01:00:00.000Z'),
      },
      {
        destinationId: 'destination-1', clientBusinessId: 'client-business-1', recipeId: 'meta_run_ads', recipeVersion: 1,
        assetKind: 'page', assetId: 'page-1', status: 'verified', verifiedAt: new Date('2026-07-21T02:00:00.000Z'),
      },
    ] as any);
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      authorizations: [{ status: 'active', expiresAt: new Date('2026-08-01T00:00:00.000Z') }],
    } as any);

    const result = await metaAccessStatusService.getFulfillmentProjection('request-1');

    expect(result.data).toMatchObject({
      mode: 'outcome',
      status: 'complete',
      complete: true,
      oauthHealth: 'active',
      lastNativeVerifiedAt: new Date('2026-07-21T02:00:00.000Z'),
    });
  });

  it('keeps OAuth health separate and never completes while a grant needs action', async () => {
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_run_ads', destinationId: 'destination-1' }),
    } as any);
    vi.mocked(prisma.metaAssetGrant.findMany).mockResolvedValue([
      {
        destinationId: 'destination-1', clientBusinessId: 'client-business-1', recipeId: 'meta_run_ads', recipeVersion: 1,
        assetKind: 'ad_account', assetId: 'act-1', status: 'verified', verifiedAt: new Date('2026-07-21T01:00:00.000Z'),
      },
      {
        destinationId: 'destination-1', clientBusinessId: 'client-business-1', recipeId: 'meta_run_ads', recipeVersion: 1,
        assetKind: 'page', assetId: 'page-1', status: 'action_required', nextActor: 'client',
      },
    ] as any);
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      authorizations: [{ status: 'expired', expiresAt: new Date('2026-07-20T00:00:00.000Z') }],
    } as any);

    const result = await metaAccessStatusService.getFulfillmentProjection('request-1');

    expect(result.data).toMatchObject({
      status: 'action_required',
      complete: false,
      oauthHealth: 'expired',
      grants: expect.arrayContaining([
        expect.objectContaining({ assetId: 'act-1', clientLabel: 'Access verified' }),
        expect.objectContaining({ assetId: 'page-1', clientLabel: 'Action needed', nextActor: 'client' }),
      ]),
    });
  });

  it('projects only grants for the active recipe, destination, and client portfolio', async () => {
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_run_ads', destinationId: 'destination-1' }),
    } as any);
    vi.mocked(prisma.metaAssetGrant.findMany).mockResolvedValue([
      {
        source: 'normalized', destinationId: 'destination-1', clientBusinessId: 'client-business-active',
        recipeId: 'meta_run_ads', recipeVersion: 1, assetKind: 'ad_account', assetId: 'act-active', status: 'verified',
      },
      {
        source: 'normalized', destinationId: 'destination-1', clientBusinessId: 'client-business-active',
        recipeId: 'meta_run_ads', recipeVersion: 1, assetKind: 'page', assetId: 'page-active', status: 'verified',
      },
      {
        source: 'normalized', destinationId: 'destination-1', clientBusinessId: 'client-business-old',
        recipeId: 'meta_run_ads', recipeVersion: 1, assetKind: 'page', assetId: 'page-old', status: 'action_required',
      },
      {
        source: 'normalized', destinationId: 'destination-old', clientBusinessId: 'client-business-active',
        recipeId: 'meta_run_ads', recipeVersion: 1, assetKind: 'page', assetId: 'page-other-destination', status: 'failed',
      },
    ] as any);
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      authorizations: [{
        status: 'active',
        metadata: { meta: { selection: {
          clientBusinessId: 'client-business-active',
          clientBusinessName: 'Active Portfolio',
          selectedAt: '2026-07-21T00:00:00.000Z',
          source: 'user_selection',
        } } },
      }],
    } as any);

    const result = await metaAccessStatusService.getFulfillmentProjection('request-1');

    expect(result.data).toMatchObject({ status: 'complete', complete: true });
    expect(result.data?.grants.map((grant: any) => grant.assetId)).toEqual(['act-active', 'page-active']);
  });
});
