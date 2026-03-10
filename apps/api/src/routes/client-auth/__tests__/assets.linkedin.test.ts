import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerAssetRoutes } from '../assets.routes';
import { accessRequestService } from '@/services/access-request.service';
import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { auditService } from '@/services/audit.service';

vi.mock('@/services/access-request.service', () => ({
  accessRequestService: {
    getAccessRequestByToken: vi.fn(),
  },
}));

vi.mock('@/lib/infisical', () => ({
  infisical: {
    getOAuthTokens: vi.fn(),
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
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    platformAuthorization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Client Auth Asset Routes - LinkedIn', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerAssetRoutes(app);
    vi.clearAllMocks();

    vi.mocked(accessRequestService.getAccessRequestByToken).mockResolvedValue({
      data: {
        id: 'request-a',
        agencyId: 'agency-a',
        platforms: [
          {
            platformGroup: 'linkedin',
            products: [{ product: 'linkedin_ads', accessLevel: 'standard' }],
          },
        ],
      } as any,
      error: null,
    });

    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      id: 'conn-1',
      accessRequestId: 'request-a',
      agencyId: 'agency-a',
      clientEmail: 'client@example.com',
      grantedAssets: {},
    } as any);

    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'pa-1',
      connectionId: 'conn-1',
      platform: 'linkedin',
      secretId: 'secret-1',
      status: 'active',
      metadata: {},
    } as any);

    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'linkedin-access-token',
    } as any);

    global.fetch = vi.fn(async (input: any) => {
      const url = String(input);

      if (url === 'https://api.linkedin.com/rest/adAccounts') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            elements: [
              {
                id: 123,
                name: 'Acme Campaign Manager',
                reference: 'urn:li:organization:456',
                status: 'ACTIVE',
                type: 'BUSINESS',
              },
            ],
          }),
          text: async () => '',
        } as any;
      }

      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
        text: async () => 'Not Found',
      } as any;
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns selector-ready LinkedIn Campaign Manager accounts for linkedin_ads', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/client/token-a/assets/linkedin_ads?connectionId=conn-1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual([
      {
        id: '123',
        name: 'Acme Campaign Manager',
        reference: 'urn:li:organization:456',
        status: 'ACTIVE',
        type: 'BUSINESS',
      },
    ]);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.linkedin.com/rest/adAccounts',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer linkedin-access-token',
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
        }),
      })
    );
    expect(auditService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyId: 'agency-a',
        action: 'LINKEDIN_TOKEN_READ',
        userEmail: 'client@example.com',
        resourceType: 'client_connection',
        resourceId: 'conn-1',
        metadata: expect.objectContaining({
          platform: 'linkedin_ads',
          source: 'client_assets_fetch',
        }),
        request: expect.anything(),
      })
    );
  });

  it('accepts and persists availableAssetCount in save-assets payloads', async () => {
    vi.mocked(prisma.clientConnection.update).mockResolvedValue({ id: 'conn-1' } as any);
    vi.mocked(prisma.platformAuthorization.update).mockResolvedValue({ id: 'pa-1' } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/client/token-a/save-assets',
      payload: {
        connectionId: 'conn-1',
        platform: 'linkedin_ads',
        selectedAssets: {
          adAccounts: [],
          availableAssetCount: 0,
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.clientConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: {
        grantedAssets: {
          linkedin_ads: {
            adAccounts: [],
            availableAssetCount: 0,
          },
        },
      },
    });
  });
});
