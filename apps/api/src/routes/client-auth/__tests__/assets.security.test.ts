import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerAssetRoutes } from '../assets.routes';
import { accessRequestService } from '@/services/access-request.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/services/access-request.service', () => ({
  accessRequestService: {
    getAccessRequestByToken: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    clientConnection: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Client Auth Asset Routes - Security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerAssetRoutes(app);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 403 when saving assets for connection outside token access request', async () => {
    vi.mocked(accessRequestService.getAccessRequestByToken).mockResolvedValue({
      data: {
        id: 'request-a',
        agencyId: 'agency-a',
      } as any,
      error: null,
    });
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      id: 'conn-b',
      accessRequestId: 'request-b',
      agencyId: 'agency-b',
      clientEmail: 'client@example.com',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/client/token-a/save-assets',
      payload: {
        connectionId: 'conn-b',
        platform: 'google_ads',
        selectedAssets: { adAccounts: ['123'] },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for token-scoped asset fetch with mismatched connection ownership', async () => {
    vi.mocked(accessRequestService.getAccessRequestByToken).mockResolvedValue({
      data: {
        id: 'request-a',
        agencyId: 'agency-a',
      } as any,
      error: null,
    });
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      id: 'conn-b',
      accessRequestId: 'request-b',
      agencyId: 'agency-b',
      clientEmail: 'client@example.com',
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/client/token-a/assets/google_ads?connectionId=conn-b',
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });
});

