import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { agentGrantService } from '@/services/agent-grant.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agentGrant: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    agentOperation: {
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('agent-grant.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));
  });

  it('resolves only an active grant bound to owner, OAuth client, and selected Clerk principal', async () => {
    vi.mocked(prisma.agentGrant.findFirst).mockResolvedValue({
      id: 'grant-1',
      agencyId: 'agency-1',
      ownerSubject: 'user-1',
      oauthClientId: 'oauth-client-1',
      permissions: ['workspace:read'],
      state: 'active',
    } as any);

    const grant = await agentGrantService.resolveActiveGrant({
      ownerSubject: 'user-1',
      oauthClientId: 'oauth-client-1',
      clerkPrincipalId: 'org-1',
    });

    expect(grant?.agencyId).toBe('agency-1');
    expect(prisma.agentGrant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerSubject: 'user-1',
          oauthClientId: 'oauth-client-1',
          state: 'active',
          agency: { clerkUserId: 'org-1' },
        }),
      })
    );
  });

  it('creates the owner-approved agency grant without storing bearer material', async () => {
    vi.mocked(prisma.agentGrant.upsert).mockResolvedValue({
      id: 'grant-1',
      agencyId: 'agency-1',
      ownerSubject: 'user-1',
      oauthClientId: 'oauth-client-1',
      displayName: 'Personal agent',
      permissions: ['workspace:read'],
      state: 'active',
    } as any);

    await agentGrantService.createOrReactivateGrant({
      agencyId: 'agency-1',
      ownerSubject: 'user-1',
      oauthClientId: 'oauth-client-1',
      displayName: 'Personal agent',
      permissions: ['workspace:read'],
      requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'test' },
    });

    expect(prisma.agentGrant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.not.objectContaining({
          accessToken: expect.anything(),
          refreshToken: expect.anything(),
          secretId: expect.anything(),
        }),
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        agencyId: 'agency-1',
        actorType: 'human',
        actorId: 'user-1',
        agentGrantId: 'grant-1',
        oauthClientId: 'oauth-client-1',
        action: 'AGENT_GRANT_CREATED',
      }),
    });
  });

  it('soft-revokes the grant and cancels pending non-executing operations atomically', async () => {
    vi.mocked(prisma.agentGrant.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.agentOperation.updateMany).mockResolvedValue({ count: 2 });

    const revoked = await agentGrantService.revokeGrant({
      agencyId: 'agency-1',
      grantId: 'grant-1',
      revokedBy: 'user-1',
      requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'test' },
    });

    expect(revoked).toBe(true);
    expect(prisma.agentOperation.updateMany).toHaveBeenCalledWith({
      where: {
        grantId: 'grant-1',
        agencyId: 'agency-1',
        status: { in: ['prepared', 'pending_approval', 'approved'] },
      },
      data: expect.objectContaining({ status: 'canceled' }),
    });
  });
});
