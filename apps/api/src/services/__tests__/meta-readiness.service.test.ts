import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    metaAgencyDestination: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/env.js', () => ({
  env: {
    META_APP_ID: 'app-1',
    META_APP_SECRET: 'secret-1',
    META_LOGIN_FOR_BUSINESS_CONFIG_ID: 'config-1',
  },
}));

vi.mock('../agency-platform.service.js', () => ({
  agencyPlatformService: { getValidToken: vi.fn() },
}));

vi.mock('../meta-system-user.service.js', () => ({
  metaSystemUserService: { getSystemUsers: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env.js';
import { metaReadinessService } from '../meta-readiness.service.js';
import { agencyPlatformService } from '../agency-platform.service.js';
import { metaSystemUserService } from '../meta-system-user.service.js';

function destinationFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'destination-1',
    agencyId: 'agency-1',
    businessId: 'biz-1',
    name: 'Agency Portfolio',
    agencyConnection: {
      id: 'connection-1',
      status: 'active',
      secretId: 'meta-secret',
      scope: 'ads_management,ads_read,business_management',
      metadata: {
        selectedBusinessId: 'biz-1',
        metaBusinessAccounts: { businesses: [{ id: 'biz-1', name: 'Agency Portfolio' }] },
        partnerAdminSystemUserStatus: 'ready',
        systemUserId: 'system-user-1',
        partnerAdminSystemUserTokenSecretId: 'system-user-secret',
      },
    },
    ...overrides,
  };
}

describe('metaReadinessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(env, {
      META_APP_ID: 'app-1',
      META_APP_SECRET: 'secret-1',
      META_LOGIN_FOR_BUSINESS_CONFIG_ID: 'config-1',
    });
    vi.mocked(agencyPlatformService.getValidToken).mockResolvedValue({ data: 'agency-token', error: null } as any);
    vi.mocked(metaSystemUserService.getSystemUsers).mockResolvedValue({
      data: [{ id: 'system-user-1', name: 'Agency Platform Admin System User', role: 'ADMIN' }],
      error: null,
    } as any);
  });

  it('marks a configured, visible destination ready', async () => {
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue(destinationFixture() as any);
    vi.mocked(prisma.metaAgencyDestination.update).mockImplementation(async ({ data }: any) => ({
      ...destinationFixture(),
      ...data,
    }));

    const result = await metaReadinessService.checkDestination('agency-1', 'destination-1');

    expect(result.data?.readinessStatus).toBe('ready');
    expect(result.data?.readinessDetails.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'portfolio_visibility', status: 'pass' })])
    );
  });

  it('reports missing Business Login configuration as action needed', async () => {
    Object.assign(env, { META_LOGIN_FOR_BUSINESS_CONFIG_ID: undefined });
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue(destinationFixture() as any);
    vi.mocked(prisma.metaAgencyDestination.update).mockImplementation(async ({ data }: any) => ({
      ...destinationFixture(),
      ...data,
    }));

    const result = await metaReadinessService.checkDestination('agency-1', 'destination-1');

    expect(result.data?.readinessStatus).toBe('action_needed');
    expect(result.data?.readinessDetails.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'business_login_config', status: 'action_needed' })])
    );
  });

  it('marks a no-longer-visible portfolio unavailable without deleting it', async () => {
    const fixture = destinationFixture();
    (fixture.agencyConnection.metadata.metaBusinessAccounts as any).businesses = [{ id: 'biz-other' }];
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue(fixture as any);
    vi.mocked(prisma.metaAgencyDestination.update).mockImplementation(async ({ data }: any) => ({
      ...fixture,
      ...data,
    }));

    const result = await metaReadinessService.checkDestination('agency-1', 'destination-1');

    expect(result.data?.readinessStatus).toBe('unavailable');
    expect(prisma.metaAgencyDestination.update).toHaveBeenCalled();
  });

  it('does not mark a destination ready when live provider authority cannot be proven', async () => {
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue(destinationFixture() as any);
    vi.mocked(metaSystemUserService.getSystemUsers).mockResolvedValue({
      data: null,
      error: { code: 'SYSTEM_USER_LIST_FAILED', message: 'Permission denied' },
    });
    vi.mocked(prisma.metaAgencyDestination.update).mockImplementation(async ({ data }: any) => ({
      ...destinationFixture(),
      ...data,
    }));

    const result = await metaReadinessService.checkDestination('agency-1', 'destination-1');

    expect(result.data?.readinessStatus).toBe('action_needed');
    expect(result.data?.readinessDetails.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'provider_authority', status: 'action_needed' }),
      ])
    );
  });

  it('fails closed when the matching provider system user is not an administrator', async () => {
    vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue(destinationFixture() as any);
    vi.mocked(metaSystemUserService.getSystemUsers).mockResolvedValue({
      data: [{ id: 'system-user-1', name: 'Agency Platform System User', role: 'EMPLOYEE' }],
      error: null,
    } as any);
    vi.mocked(prisma.metaAgencyDestination.update).mockImplementation(async ({ data }: any) => ({
      ...destinationFixture(),
      ...data,
    }));

    const result = await metaReadinessService.checkDestination('agency-1', 'destination-1');

    expect(result.data?.readinessStatus).toBe('action_needed');
    expect(result.data?.readinessDetails.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'provider_authority',
          status: 'action_needed',
          message: expect.stringMatching(/administrator authority/i),
        }),
      ])
    );
  });
});
