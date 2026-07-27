import { beforeEach, describe, expect, it, vi } from 'vitest';
import { metaAccessPolicyService } from '../meta-access-policy.service.js';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessRequest: { findFirst: vi.fn() },
    metaAgencyDestination: { findFirst: vi.fn() },
  },
}));

vi.mock('../meta-access-status.service.js', () => ({
  metaAccessStatusService: {
    listForRequest: vi.fn(),
    upsertGrant: vi.fn(),
  },
}));

vi.mock('../meta-partner.service.js', () => ({
  metaPartnerService: {
    grantPageAccess: vi.fn(),
    verifyPageAccess: vi.fn(),
    grantAdAccountAccess: vi.fn(),
    verifyAdAccountAccess: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { metaAccessStatusService } from '../meta-access-status.service.js';
import { metaPartnerService } from '../meta-partner.service.js';
import { metaGrantOrchestratorService } from '../meta-grant-orchestrator.service.js';

const baseInput = {
  agencyId: 'agency-1',
  accessRequestId: 'request-1',
  connectionId: 'connection-1',
  authorizationId: 'authorization-1',
  clientBusinessId: 'client-business-1',
  clientSystemUserAccessToken: 'secure-token',
};

describe('metaGrantOrchestratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue({
      id: 'destination-1',
      agencyConnection: { metadata: { systemUserId: 'agency-destination-system-user' } },
    } as any);
    vi.mocked(metaAccessStatusService.listForRequest).mockResolvedValue({ data: [], error: null });
    vi.mocked(metaAccessStatusService.upsertGrant).mockResolvedValue({ data: { id: 'grant-1' }, error: null });
    vi.mocked(metaPartnerService.verifyPageAccess).mockResolvedValue({ verified: true } as any);
    vi.mocked(metaPartnerService.verifyAdAccountAccess).mockResolvedValue({ verified: true } as any);
  });

  it('uses only tasks from the immutable run-ads snapshot', async () => {
    vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_run_ads', destinationId: 'destination-1' }),
    } as any);

    const result = await metaGrantOrchestratorService.execute({
      ...baseInput,
      selectedAssets: {
        ad_account: [{ id: 'act-1' }],
        page: [{ id: 'page-1' }],
      },
    });

    expect(result.error).toBeNull();
    expect(metaPartnerService.grantAdAccountAccess).toHaveBeenCalledWith(
      'secure-token', 'act-1', 'agency-destination-system-user', ['ADVERTISE', 'ANALYZE']
    );
    expect(metaPartnerService.grantPageAccess).toHaveBeenCalledWith(
      'secure-token', 'page-1', 'agency-destination-system-user', ['ADVERTISE', 'ANALYZE']
    );
    expect(JSON.stringify(vi.mocked(metaAccessStatusService.upsertGrant).mock.calls)).not.toContain('MANAGE');
  });

  it('fails closed before provider mutation when a required selection is missing', async () => {
    vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_run_ads', destinationId: 'destination-1' }),
    } as any);

    const result = await metaGrantOrchestratorService.execute({
      ...baseInput,
      selectedAssets: { ad_account: [{ id: 'act-1' }] },
    });

    expect(result.error?.code).toBe('META_REQUIRED_ASSET_SELECTION_MISSING');
    expect(metaPartnerService.grantAdAccountAccess).not.toHaveBeenCalled();
    expect(metaPartnerService.grantPageAccess).not.toHaveBeenCalled();
  });

  it('preserves verified grants and retries only unresolved assets', async () => {
    vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_view_only_audit', destinationId: 'destination-1' }),
    } as any);
    vi.mocked(metaAccessStatusService.listForRequest).mockResolvedValue({
      data: [{
        assetKind: 'ad_account',
        assetId: 'act-verified',
        status: 'verified',
        source: 'normalized',
        destinationId: 'destination-1',
        clientBusinessId: 'client-business-1',
        recipeId: 'meta_view_only_audit',
        recipeVersion: 1,
        verifiedTasks: ['ANALYZE'],
      }],
      error: null,
    });

    await metaGrantOrchestratorService.execute({
      ...baseInput,
      selectedAssets: {
        ad_account: [{ id: 'act-verified' }, { id: 'act-retry' }],
      },
    });

    expect(metaPartnerService.grantAdAccountAccess).toHaveBeenCalledTimes(1);
    expect(metaPartnerService.grantAdAccountAccess).toHaveBeenCalledWith(
      'secure-token', 'act-retry', 'agency-destination-system-user', ['ANALYZE']
    );
  });

  it('verifies same-batch Instagram relationship evidence only after its selected Page verifies', async () => {
    vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_organic_social', destinationId: 'destination-1' }),
    } as any);

    const result = await metaGrantOrchestratorService.execute({
      ...baseInput,
      selectedAssets: {
        page: [{ id: 'page-1' }],
        instagram_account: [{ id: 'ig-1' }],
      },
      instagramRelationshipEvidence: {
        'ig-1': { pageId: 'page-1', observedAt: '2026-07-21T00:00:00.000Z' },
      },
    });

    expect(result.data?.grants).toEqual(expect.arrayContaining([
      expect.objectContaining({ assetId: 'ig-1', status: 'verified', grantMethod: 'relationship_backed' }),
    ]));
    expect(metaPartnerService.grantPageAccess).toHaveBeenCalledTimes(1);
    expect(metaPartnerService.grantAdAccountAccess).not.toHaveBeenCalled();
  });

  it('does not reuse a verified grant from another destination, portfolio, or weaker task set', async () => {
    vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_run_ads', destinationId: 'destination-1' }),
    } as any);
    vi.mocked(metaAccessStatusService.listForRequest).mockResolvedValue({
      data: [
        {
          assetKind: 'ad_account', assetId: 'act-other-destination', status: 'verified', source: 'normalized',
          destinationId: 'destination-other', clientBusinessId: 'client-business-1', recipeId: 'meta_run_ads', recipeVersion: 1,
          verifiedTasks: ['ADVERTISE', 'ANALYZE'],
        },
        {
          assetKind: 'ad_account', assetId: 'act-other-portfolio', status: 'verified', source: 'normalized',
          destinationId: 'destination-1', clientBusinessId: 'client-business-other', recipeId: 'meta_run_ads', recipeVersion: 1,
          verifiedTasks: ['ADVERTISE', 'ANALYZE'],
        },
        {
          assetKind: 'ad_account', assetId: 'act-weaker', status: 'verified', source: 'normalized',
          destinationId: 'destination-1', clientBusinessId: 'client-business-1', recipeId: 'meta_run_ads', recipeVersion: 1,
          verifiedTasks: ['ANALYZE'],
        },
      ],
      error: null,
    });

    await metaGrantOrchestratorService.execute({
      ...baseInput,
      selectedAssets: {
        ad_account: [{ id: 'act-other-destination' }, { id: 'act-other-portfolio' }, { id: 'act-weaker' }],
        page: [{ id: 'page-1' }],
      },
    });

    expect(metaPartnerService.grantAdAccountAccess).toHaveBeenCalledTimes(3);
    expect(metaPartnerService.grantAdAccountAccess).toHaveBeenCalledWith(
      'secure-token', 'act-weaker', 'agency-destination-system-user', ['ADVERTISE', 'ANALYZE']
    );
  });

  it('cannot target a caller-supplied or cross-destination system user', async () => {
    vi.mocked(prisma.accessRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      metaAccessConfig: metaAccessPolicyService.createSnapshot({ recipeId: 'meta_view_only_audit', destinationId: 'destination-1' }),
    } as any);

    await metaGrantOrchestratorService.execute({
      ...baseInput,
      selectedAssets: { ad_account: [{ id: 'act-1' }] },
      clientSystemUserId: 'attacker-controlled-system-user',
    } as any);

    expect(metaPartnerService.grantAdAccountAccess).toHaveBeenCalledWith(
      'secure-token', 'act-1', 'agency-destination-system-user', ['ANALYZE']
    );
    expect(JSON.stringify(vi.mocked(metaPartnerService.grantAdAccountAccess).mock.calls)).not.toContain('attacker-controlled');
  });
});
