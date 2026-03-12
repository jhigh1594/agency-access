import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    META_APP_ID: 'test-meta-app-id',
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformAuthorization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/infisical', () => ({
  infisical: {
    getOAuthTokens: vi.fn(),
    storeOAuthTokens: vi.fn(),
  },
}));

vi.mock('@/services/audit.service', () => ({
  createAuditLog: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { createAuditLog } from '@/services/audit.service';
import { metaOBOService } from '../meta-obo.service.js';

describe('MetaOBOService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('reads the client Meta token from Infisical and writes an OBO audit log', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'auth-1',
      connectionId: 'conn-1',
      secretId: 'meta_client_secret',
      metadata: {
        selectedAssets: {
          meta_ads: { adAccounts: ['act_1'] },
        },
      },
    } as any);
    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'client-user-token',
    });
    vi.mocked(createAuditLog).mockResolvedValue({ data: {}, error: null } as any);

    const result = await metaOBOService.getClientAccessTokenForOBO({
      authorizationId: 'auth-1',
      connectionId: 'conn-1',
      agencyId: 'agency-1',
      userEmail: 'owner@agency.test',
      ipAddress: '127.0.0.1',
      purpose: 'managed_business_link',
    });

    expect(result.error).toBeNull();
    expect(result.data?.accessToken).toBe('client-user-token');
    expect(infisical.getOAuthTokens).toHaveBeenCalledWith('meta_client_secret');
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyId: 'agency-1',
        userEmail: 'owner@agency.test',
        action: 'META_OBO_TOKEN_READ',
        resourceType: 'connection',
        resourceId: 'conn-1',
        ipAddress: '127.0.0.1',
        metadata: expect.objectContaining({
          authorizationId: 'auth-1',
          secretId: 'meta_client_secret',
          purpose: 'managed_business_link',
          platform: 'meta',
        }),
      })
    );
  });

  it('creates the managed_businesses relationship and persists linked OBO metadata', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'auth-1',
      connectionId: 'conn-1',
      secretId: 'meta_client_secret',
      metadata: {
        selectedAssets: {
          meta_ads: { adAccounts: ['act_1'] },
        },
      },
    } as any);
    vi.mocked(prisma.platformAuthorization.update).mockResolvedValue({ id: 'auth-1' } as any);
    vi.mocked(createAuditLog).mockResolvedValue({ data: {}, error: null } as any);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await metaOBOService.ensureManagedBusinessRelationship({
      authorizationId: 'auth-1',
      connectionId: 'conn-1',
      agencyId: 'agency-1',
      userEmail: 'owner@agency.test',
      ipAddress: '127.0.0.1',
      partnerBusinessId: 'partner-bm-1',
      clientBusinessId: 'client-bm-1',
      clientBusinessAdminAccessToken: 'client-user-token',
    });

    expect(result.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/partner-bm-1/managed_businesses?existing_client_business_id=client-bm-1&access_token=client-user-token'
      ),
      expect.objectContaining({ method: 'POST' })
    );
    expect(prisma.platformAuthorization.update).toHaveBeenCalledWith({
      where: { id: 'auth-1' },
      data: {
        metadata: expect.objectContaining({
          selectedAssets: {
            meta_ads: { adAccounts: ['act_1'] },
          },
          meta: expect.objectContaining({
            obo: expect.objectContaining({
              managedBusinessLink: expect.objectContaining({
                status: 'linked',
                partnerBusinessId: 'partner-bm-1',
                clientBusinessId: 'client-bm-1',
              }),
            }),
          }),
        }),
      },
    });
  });

  it('provisions a client BM system-user token, stores it in Infisical, and persists metadata', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'auth-1',
      connectionId: 'conn-1',
      secretId: 'meta_client_secret',
      metadata: {
        selectedAssets: {
          meta_ads: { adAccounts: ['act_1'] },
        },
      },
    } as any);
    vi.mocked(prisma.platformAuthorization.update).mockResolvedValue({ id: 'auth-1' } as any);
    vi.mocked(infisical.storeOAuthTokens).mockResolvedValue(
      'meta_obo_system_user_auth-1_client-bm-1'
    );
    vi.mocked(createAuditLog).mockResolvedValue({ data: {}, error: null } as any);
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'client-bm-su-token' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'system-user-42' }),
      } as Response);

    const result = await metaOBOService.provisionClientBusinessSystemUserToken({
      authorizationId: 'auth-1',
      connectionId: 'conn-1',
      agencyId: 'agency-1',
      userEmail: 'owner@agency.test',
      ipAddress: '127.0.0.1',
      clientBusinessId: 'client-bm-1',
      scopes: ['ads_management', 'pages_read_engagement'],
      partnerBusinessAdminSystemUserAccessToken: 'partner-admin-system-user-token',
    });

    expect(result.error).toBeNull();
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        '/client-bm-1/access_token?scope=ads_management%2Cpages_read_engagement&app_id=test-meta-app-id&access_token=partner-admin-system-user-token'
      ),
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/me?access_token=client-bm-su-token'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(infisical.storeOAuthTokens).toHaveBeenCalledWith(
      'meta_obo_system_user_auth-1_client-bm-1',
      { accessToken: 'client-bm-su-token' }
    );
    expect(prisma.platformAuthorization.update).toHaveBeenCalledWith({
      where: { id: 'auth-1' },
      data: {
        metadata: expect.objectContaining({
          selectedAssets: {
            meta_ads: { adAccounts: ['act_1'] },
          },
          meta: expect.objectContaining({
            obo: expect.objectContaining({
              clientSystemUser: expect.objectContaining({
                status: 'ready',
                clientBusinessId: 'client-bm-1',
                appId: 'test-meta-app-id',
                scopes: ['ads_management', 'pages_read_engagement'],
                systemUserId: 'system-user-42',
                tokenSecretId: 'meta_obo_system_user_auth-1_client-bm-1',
              }),
            }),
          }),
        }),
      },
    });
  });
});
