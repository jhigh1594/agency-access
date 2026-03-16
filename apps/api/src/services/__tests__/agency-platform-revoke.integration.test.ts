/**
 * Integration tests: revoke flow succeeds when Infisical delete fails
 *
 * Verifies the full chain: route -> service -> infisical.deleteOAuthTokens.
 * When the Infisical SDK rejects, our wrapper swallows the error so revoke
 * still completes at the DB level.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as agencyPlatformService from '@/services/agency-platform.service';

const deleteSecretMock = vi.fn();
const { deleteCacheMock, invalidateDashboardCacheMock } = vi.hoisted(() => ({
  deleteCacheMock: vi.fn(async () => true),
  invalidateDashboardCacheMock: vi.fn(async () => {}),
}));

vi.mock('@infisical/sdk', () => ({
  InfisicalSDK: function () {
    return {
      auth: () => ({
        universalAuth: { login: vi.fn().mockResolvedValue(undefined) },
      }),
      secrets: () => ({ deleteSecret: deleteSecretMock }),
    };
  },
  SecretType: { Shared: 'shared' },
}));

vi.mock('@/lib/env', () => ({
  env: {
    INFISICAL_CLIENT_ID: 'test-id',
    INFISICAL_CLIENT_SECRET: 'test-secret',
    INFISICAL_PROJECT_ID: 'test-project',
    INFISICAL_ENVIRONMENT: 'dev',
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyPlatformConnection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/cache', () => ({
  CacheKeys: { agencyConnections: (id: string) => `agency:${id}:connections` },
  deleteCache: deleteCacheMock,
  invalidateDashboardCache: invalidateDashboardCacheMock,
}));

vi.mock('@/services/token-lifecycle.service', () => ({
  ensureAgencyAccessToken: vi.fn(),
}));

describe('revokeConnection integration (Infisical best-effort delete)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revokes connection and updates DB when Infisical deleteSecret rejects', async () => {
    deleteSecretMock.mockRejectedValue(new Error('Infisical service unavailable'));

    const mockConnection = {
      id: 'conn-1',
      agencyId: 'agency-1',
      platform: 'meta',
      secretId: 'meta_agency_agency-1',
      status: 'active',
    };

    const updatedConnection = {
      ...mockConnection,
      status: 'revoked',
      revokedAt: new Date(),
      revokedBy: 'admin@agency.com',
    };

    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(mockConnection as never);
    vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue(updatedConnection as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const result = await agencyPlatformService.revokeConnection(
      'agency-1',
      'meta',
      'admin@agency.com'
    );

    expect(result.error).toBeNull();
    expect(result.data).toEqual(updatedConnection);
    expect(prisma.agencyPlatformConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: {
        status: 'revoked',
        revokedAt: expect.any(Date),
        revokedBy: 'admin@agency.com',
      },
    });
  });
});
