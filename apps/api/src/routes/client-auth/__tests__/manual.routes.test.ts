import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import { registerManualRoutes } from '../manual.routes.js';
import { accessRequestService } from '@/services/access-request.service';
import { auditService } from '@/services/audit.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/services/access-request.service', () => ({
  accessRequestService: {
    getAccessRequestByToken: vi.fn(),
  },
}));

vi.mock('@/services/audit.service', () => ({
  auditService: {
    createAuditLog: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    clientConnection: {
      create: vi.fn(),
    },
  },
}));

function hashCollaboratorCode(code: string): string {
  return createHash('sha256')
    .update(`shopify-collaborator-code:${code}`)
    .digest('hex');
}

describe('Client Auth Manual Routes - Shopify', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await registerManualRoutes(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('normalizes Shopify shop domain and stores collaborator code hash only', async () => {
    vi.mocked(accessRequestService.getAccessRequestByToken).mockResolvedValue({
      data: {
        id: 'request-1',
        agencyId: 'agency-1',
        clientEmail: 'client@example.com',
      } as any,
      error: null,
    });
    vi.mocked(prisma.clientConnection.create).mockResolvedValue({
      id: 'conn-1',
      status: 'pending_verification',
    } as any);
    vi.mocked(auditService.createAuditLog).mockResolvedValue({} as any);

    const response = await app.inject({
      method: 'POST',
      url: '/client/token-1/shopify/manual-connect',
      payload: {
        platform: 'shopify',
        shopDomain: 'HTTPS://Store-Example.MyShopify.com/',
        collaboratorCode: '1234',
      },
    });

    expect(response.statusCode).toBe(200);

    expect(prisma.clientConnection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          grantedAssets: expect.objectContaining({
            platform: 'shopify',
            shopDomain: 'store-example.myshopify.com',
            collaboratorCodeHash: hashCollaboratorCode('1234'),
          }),
        }),
      })
    );

    const createCall = vi.mocked(prisma.clientConnection.create).mock.calls[0]?.[0] as any;
    expect(createCall?.data?.grantedAssets?.collaboratorCode).toBe('1234');

    expect(auditService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          shopDomain: 'store-example.myshopify.com',
          collaboratorCodeHash: hashCollaboratorCode('1234'),
        }),
      })
    );

    const auditCall = vi.mocked(auditService.createAuditLog).mock.calls[0]?.[0] as any;
    expect(auditCall?.metadata?.collaboratorCode).toBeUndefined();

    const body = response.json() as any;
    expect(body?.data?.shopDomain).toBe('store-example.myshopify.com');
    expect(body?.data?.collaboratorCode).toBeUndefined();
  });
});
