import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerMetaFinalizeRoutes } from '../meta-finalize.routes.js';
import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { auditService } from '@/services/audit.service';

const connectorMocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  getUserInfo: vi.fn(),
  getTokenMetadata: vi.fn(),
  getLongLivedToken: vi.fn(),
}));

vi.mock('@/services/oauth-state.service.js', () => ({
  oauthStateService: { validateState: vi.fn(async () => ({ data: { platform: 'meta', accessRequestId: 'request-1', clientEmail: 'client@example.com' }, error: null })) },
}));
vi.mock('@/services/connectors/meta.js', () => ({
  MetaConnector: class {
    verifyToken = connectorMocks.verifyToken;
    getUserInfo = connectorMocks.getUserInfo;
    getTokenMetadata = connectorMocks.getTokenMetadata;
    getLongLivedToken = connectorMocks.getLongLivedToken;
  },
}));
vi.mock('@/lib/infisical.js', () => ({
  infisical: {
    generateSecretName: vi.fn((_platform: string, id: string) => `meta_${id}`),
    storeOAuthTokens: vi.fn(),
    deleteOAuthTokens: vi.fn(),
  },
}));
vi.mock('@/services/audit.service.js', () => ({ auditService: { createAuditLog: vi.fn() } }));
vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    accessRequest: { findUnique: vi.fn() },
    clientConnection: { findFirst: vi.fn(), create: vi.fn() },
    platformAuthorization: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

describe('Meta finalize identity replacement safety', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerMetaFinalizeRoutes(app);
    vi.clearAllMocks();
    connectorMocks.verifyToken.mockResolvedValue(true);
    connectorMocks.getUserInfo.mockResolvedValue({ id: 'new-user', name: 'New Admin' });
    connectorMocks.getTokenMetadata.mockResolvedValue({ userId: 'new-user', scopes: ['business_management'] });
    connectorMocks.getLongLivedToken.mockResolvedValue({ accessToken: 'long-lived-token', expiresAt: new Date('2026-08-01T00:00:00.000Z') });
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({ id: 'request-1', agencyId: 'agency-1', uniqueToken: 'invite-token' } as any);
    vi.mocked(prisma.clientConnection.findFirst).mockResolvedValue({ id: 'conn-1' } as any);
  });

  afterEach(async () => app.close());

  it('replaces a different identity by switching to a new secret before retiring the prior one', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'authorization-1',
      secretId: 'meta_conn-1',
      metadata: {
        metaClientPopup: { userId: 'prior-user' },
        meta: {
          selection: { clientBusinessId: 'old-business' },
          discovery: { availableBusinesses: [] },
          obo: {
            assetGrantResults: [
              { assetId: 'page-1', assetType: 'page', requestedTasks: ['ANALYZE'], status: 'verified' },
              { assetId: 'act-1', assetType: 'ad_account', requestedTasks: ['ANALYZE'], status: 'pending' },
            ],
          },
        },
      },
    } as any);
    vi.mocked(prisma.platformAuthorization.upsert).mockResolvedValue({ id: 'authorization-1' } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/client/invite-token/meta/finalize',
      payload: { state: 'valid-state', accessToken: 'new-short-token', userId: 'new-user' },
    });

    expect(response.statusCode).toBe(200);
    const replacementSecret = vi.mocked(infisical.storeOAuthTokens).mock.calls[0][0];
    expect(replacementSecret).not.toBe('meta_conn-1');
    expect(infisical.storeOAuthTokens).toHaveBeenCalledBefore(vi.mocked(prisma.platformAuthorization.upsert));
    expect(prisma.platformAuthorization.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        secretId: replacementSecret,
        metadata: expect.objectContaining({
          meta: { obo: { assetGrantResults: [expect.objectContaining({ assetId: 'page-1', status: 'verified' })] } },
        }),
      }),
    }));
    expect(infisical.deleteOAuthTokens).toHaveBeenCalledWith('meta_conn-1');
    expect(auditService.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'META_IDENTITY_REPLACED',
      metadata: expect.objectContaining({ preservedVerifiedGrantCount: 1 }),
    }));
  });

  it('keeps the prior authorization usable when the database switch fails', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'authorization-1',
      secretId: 'meta_conn-1',
      metadata: { metaClientPopup: { userId: 'prior-user' } },
    } as any);
    vi.mocked(prisma.platformAuthorization.upsert).mockRejectedValue(new Error('database unavailable'));

    const response = await app.inject({
      method: 'POST',
      url: '/client/invite-token/meta/finalize',
      payload: { state: 'valid-state', accessToken: 'new-short-token', userId: 'new-user' },
    });

    expect(response.statusCode).toBe(500);
    const replacementSecret = vi.mocked(infisical.storeOAuthTokens).mock.calls[0][0];
    expect(infisical.deleteOAuthTokens).toHaveBeenCalledWith(replacementSecret);
    expect(infisical.deleteOAuthTokens).not.toHaveBeenCalledWith('meta_conn-1');
  });

  it('allows the same identity to refresh while preserving existing authorization metadata', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
      id: 'authorization-1',
      secretId: 'meta_conn-1',
      metadata: { metaClientPopup: { userId: 'new-user' }, meta: { selection: { clientBusinessId: 'biz-1' } } },
    } as any);
    vi.mocked(prisma.platformAuthorization.upsert).mockResolvedValue({ id: 'authorization-1' } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/client/invite-token/meta/finalize',
      payload: { state: 'valid-state', accessToken: 'new-short-token', userId: 'new-user' },
    });

    expect(response.statusCode).toBe(200);
    expect(infisical.storeOAuthTokens).toHaveBeenCalledWith('meta_conn-1', expect.any(Object));
    expect(infisical.storeOAuthTokens).toHaveBeenCalledBefore(vi.mocked(prisma.platformAuthorization.upsert));
    expect(prisma.platformAuthorization.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        metadata: expect.objectContaining({ meta: { selection: { clientBusinessId: 'biz-1' } } }),
      }),
    }));
  });
});
