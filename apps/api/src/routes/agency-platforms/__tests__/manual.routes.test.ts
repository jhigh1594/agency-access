import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerManualRoutes } from '../manual.routes.js';
import { CacheKeys, deleteCache, invalidateCache } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { agencyResolutionService } from '@/services/agency-resolution.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyPlatformConnection: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/services/agency-resolution.service', () => ({
  agencyResolutionService: {
    resolveAgency: vi.fn(),
  },
}));

vi.mock('@/lib/authorization', () => ({
  assertAgencyAccess: vi.fn(() => null),
}));

vi.mock('@/lib/cache', () => ({
  CacheKeys: {
    agencyConnections: (agencyId: string) => `agency:${agencyId}:connections`,
  },
  deleteCache: vi.fn(async () => true),
  invalidateCache: vi.fn(async () => ({ success: true, keysDeleted: 1 })),
}));

describe('Manual Agency Platform Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    app.addHook('preHandler', async (request) => {
      (request as any).principalAgencyId = 'agency-1';
    });
    await app.register(registerManualRoutes);
  });

  afterEach(async () => {
    await app.close();
  });

  it('invalidates platform caches after manual connect succeeds', async () => {
    vi.mocked(agencyResolutionService.resolveAgency).mockResolvedValue({
      data: { agencyId: 'agency-1' },
      error: null,
    } as any);
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.agencyPlatformConnection.create).mockResolvedValue({
      id: 'conn-1',
      platform: 'beehiiv',
      agencyEmail: 'ops@agency.com',
      status: 'active',
      connectedAt: new Date(),
    } as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const response = await app.inject({
      method: 'POST',
      url: '/agency-platforms/beehiiv/manual-connect',
      payload: {
        agencyId: 'agency-1',
        invitationEmail: 'ops@agency.com',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(deleteCache).toHaveBeenCalledWith(CacheKeys.agencyConnections('agency-1'));
    expect(invalidateCache).toHaveBeenCalledWith('dashboard:agency-1:*');
  });

  it('invalidates platform caches after manual invitation update succeeds', async () => {
    vi.mocked(agencyResolutionService.resolveAgency).mockResolvedValue({
      data: { agencyId: 'agency-1' },
      error: null,
    } as any);
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue({
      id: 'conn-1',
      agencyId: 'agency-1',
      platform: 'beehiiv',
      agencyEmail: 'old@agency.com',
      metadata: {},
    } as any);
    vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue({
      id: 'conn-1',
      platform: 'beehiiv',
      agencyEmail: 'new@agency.com',
      status: 'active',
      connectedAt: new Date(),
    } as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/agency-platforms/beehiiv/manual-invitation',
      payload: {
        agencyId: 'agency-1',
        invitationEmail: 'new@agency.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(deleteCache).toHaveBeenCalledWith(CacheKeys.agencyConnections('agency-1'));
    expect(invalidateCache).toHaveBeenCalledWith('dashboard:agency-1:*');
  });
});
