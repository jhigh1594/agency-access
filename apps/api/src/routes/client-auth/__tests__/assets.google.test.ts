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
    },
    platformAuthorization: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Client Auth Asset Routes - Google', () => {
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
            platformGroup: 'google',
            products: [{ product: 'google_business_profile', accessLevel: 'standard' }],
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
      platform: 'google',
      secretId: 'secret-1',
      status: 'active',
      metadata: {},
    } as any);

    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'google-access-token',
    } as any);

    global.fetch = vi.fn(async (input: any) => {
      const url = String(input);

      if (url.includes('https://mybusinessaccountmanagement.googleapis.com/v1/accounts')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            accounts: [
              {
                name: 'accounts/123',
                accountName: 'Agency Test Business',
              },
            ],
          }),
          text: async () => '',
        } as any;
      }

      if (url.includes('https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            locations: [
              {
                name: 'accounts/123/locations/456',
                title: 'Main Street Store',
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

  it('returns business profile locations without fetching unrelated Google product inventories', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/client/token-a/assets/google_business_profile?connectionId=conn-1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual([
      {
        id: '456',
        name: 'Main Street Store',
        type: 'google_business',
        accountName: 'Agency Test Business',
      },
    ]);

    const requestedUrls = vi.mocked(fetch).mock.calls.map(([input]) => String(input));
    expect(
      requestedUrls.some((url) => url.includes('googleads.googleapis.com'))
    ).toBe(false);
    expect(
      requestedUrls.some((url) => url.includes('analyticsadmin.googleapis.com'))
    ).toBe(false);
    expect(
      requestedUrls.some((url) => url.includes('www.googleapis.com/tagmanager'))
    ).toBe(false);
    expect(
      requestedUrls.some((url) => url.includes('www.googleapis.com/webmasters'))
    ).toBe(false);
    expect(
      requestedUrls.some((url) => url.includes('shoppingcontent.googleapis.com'))
    ).toBe(false);
  });

  it('logs Google token reads during client asset discovery', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/client/token-a/assets/google_business_profile?connectionId=conn-1',
    });

    expect(response.statusCode).toBe(200);
    expect(auditService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyId: 'agency-a',
        action: 'GOOGLE_TOKEN_READ',
        userEmail: 'client@example.com',
        resourceType: 'client_connection',
        resourceId: 'conn-1',
        metadata: expect.objectContaining({
          platform: 'google_business_profile',
          source: 'client_assets_fetch',
        }),
        request: expect.anything(),
      })
    );
  });
});
