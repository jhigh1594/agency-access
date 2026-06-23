import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

import { beehiivRoutes } from '../beehiiv.js';
import { beehiivVerificationService } from '@/services/beehiiv-verification.service.js';
import * as authorization from '@/lib/authorization.js';
import { prisma } from '@/lib/prisma.js';

vi.mock('@/services/beehiiv-verification.service.js', () => ({
  beehiivVerificationService: {
    verifyAgencyAccess: vi.fn(),
    verifyConnection: vi.fn(),
  },
}));
vi.mock('@/lib/authorization.js');
vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    agencyPlatformConnection: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('@/middleware/auth.js', () => ({
  authenticate: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' },
      });
    }
    request.user = { sub: 'user_123', email: 'owner@example.com' };
  },
}));

describe('Beehiiv routes - security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(beehiivRoutes);
    vi.clearAllMocks();
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-owner', principalId: 'user_123', agency: { id: 'agency-owner', name: 'Owner', email: 'owner@example.com' } },
      error: null,
    });
    vi.mocked(beehiivVerificationService.verifyAgencyAccess).mockResolvedValue({
      success: true,
      connectionId: 'connection-1',
    } as any);
    vi.mocked(beehiivVerificationService.verifyConnection).mockResolvedValue(true);
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue({
      id: 'connection-1',
    } as any);
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects team access verification without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/beehiiv/verify-team-access',
      payload: {
        agencyId: 'agency-other',
        clientPublicationId: 'pub_1',
        agencyApiKey: 'key',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(beehiivVerificationService.verifyAgencyAccess).not.toHaveBeenCalled();
  });

  it('uses the resolved principal agency instead of caller-supplied agencyId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/beehiiv/verify-team-access',
      headers: { authorization: 'Bearer token' },
      payload: {
        agencyId: 'agency-other',
        clientPublicationId: 'pub_1',
        agencyApiKey: 'key',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(beehiivVerificationService.verifyAgencyAccess).toHaveBeenCalledWith(
      'agency-owner',
      'pub_1',
      'key'
    );
  });

  it('rejects re-verification for a Beehiiv connection outside the resolved agency', async () => {
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/beehiiv/connection/connection-other/verify',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      data: null,
      error: { code: 'CONNECTION_NOT_FOUND' },
    });
    expect(beehiivVerificationService.verifyConnection).not.toHaveBeenCalled();
    expect(prisma.agencyPlatformConnection.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'connection-other',
        agencyId: 'agency-owner',
        platform: 'beehiiv',
      },
      select: { id: true },
    });
  });
});
