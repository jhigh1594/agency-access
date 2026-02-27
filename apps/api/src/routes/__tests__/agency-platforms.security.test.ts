import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { agencyPlatformsRoutes } from '../agency-platforms';
import * as authorization from '../../lib/authorization.js';
import { agencyPlatformService } from '../../services/agency-platform.service.js';
import { metaAssetsService } from '../../services/meta-assets.service.js';
import { identityVerificationService } from '../../services/identity-verification.service.js';
import { prisma } from '../../lib/prisma.js';

vi.mock('../../lib/authorization.js');
vi.mock('../../services/agency-platform.service.js', () => ({
  agencyPlatformService: {
    getConnections: vi.fn(),
  },
}));
vi.mock('../../services/meta-assets.service.js', () => ({
  metaAssetsService: {
    saveBusinessPortfolio: vi.fn(),
  },
}));
vi.mock('../../services/identity-verification.service.js', () => ({
  identityVerificationService: {
    updateVerificationStatus: vi.fn(),
  },
}));
vi.mock('../../services/connectors/meta.js', () => ({
  MetaConnector: vi.fn(),
}));
vi.mock('../../services/connectors/google.js', () => ({
  GoogleConnector: vi.fn(),
}));
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    agencyPlatformConnection: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('../../middleware/auth.js', () => ({
  authenticate: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' },
      });
    }
    request.user = { sub: 'user_123' };
  },
}));

describe('Agency Platforms Routes - Security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(agencyPlatformsRoutes);
    vi.clearAllMocks();
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-owner', principalId: 'user_123' },
      error: null,
    } as any);
    vi.mocked(authorization.assertAgencyAccess).mockImplementation((requested, principal) => {
      if (requested !== principal) {
        return {
          code: 'FORBIDDEN',
          message: 'You do not have access to this agency resource',
        };
      }
      return null;
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/agency-platforms?agencyId=agency-1',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 when requested agency differs from principal agency', async () => {
    vi.mocked(authorization.assertAgencyAccess).mockReturnValueOnce({
      code: 'FORBIDDEN',
      message: 'You do not have access to this agency resource',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/agency-platforms?agencyId=agency-other',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
    expect(agencyPlatformService.getConnections).not.toHaveBeenCalled();
  });

  it('returns 404 for meta complete-oauth when connectionId is not owned by agency', async () => {
    vi.mocked(metaAssetsService.saveBusinessPortfolio).mockResolvedValue({
      data: { success: true },
      error: null,
    } as any);

    vi.mocked(prisma.agencyPlatformConnection.findUnique).mockResolvedValue({
      id: 'conn-1',
      agencyId: 'agency-other',
      platform: 'meta',
      secretId: 'secret-other',
    } as any);
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(null as any);

    const response = await app.inject({
      method: 'POST',
      url: '/agency-platforms/meta/complete-oauth',
      headers: { authorization: 'Bearer token' },
      payload: {
        agencyId: 'agency-owner',
        businessId: 'biz-1',
        businessName: 'Biz',
        connectionId: 'conn-1',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('CONNECTION_NOT_FOUND');
  });

  it('returns 403 for identity verify when connection does not belong to principal agency', async () => {
    vi.mocked(prisma.agencyPlatformConnection.findUnique).mockResolvedValue({
      id: 'conn-1',
      agencyId: 'agency-other',
      platform: 'meta',
    } as any);
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue({
      id: 'conn-1',
      agencyId: 'agency-other',
      platform: 'meta',
    } as any);
    vi.mocked(identityVerificationService.updateVerificationStatus).mockResolvedValue({
      data: { id: 'conn-1', verificationStatus: 'verified' },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'PUT',
      url: '/agency-platforms/conn-1/verify',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
    expect(identityVerificationService.updateVerificationStatus).not.toHaveBeenCalled();
  });
});
