import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/infisical.js', () => ({
  infisical: {
    getOAuthTokens: vi.fn(),
  },
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    platformAuthorization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clientConnection: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../audit.service.js', () => ({
  auditService: {
    createAuditLog: vi.fn(),
  },
}));

vi.mock('../connectors/meta.js', () => ({
  metaConnector: {
    getUserPages: vi.fn(),
    createBusiness: vi.fn(),
    createAdAccount: vi.fn(),
    createProductCatalog: vi.fn(),
  },
}));

import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import { auditService } from '../audit.service.js';
import { metaConnector } from '../connectors/meta.js';
import { metaAssetCreationService } from '../meta-asset-creation.service.js';

const connectionId = 'conn-1';
const userEmail = 'client@acme.com';
const agencyId = 'agency-1';

function activePlatformAuth(metadata: unknown = {}) {
  return {
    id: 'auth-1',
    secretId: 'secret-1',
    platform: 'meta',
    status: 'active',
    expiresAt: null,
    metadata,
  };
}

describe('MetaAssetCreationService.createBusiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'client-token',
      refreshToken: null,
      expiresAt: null,
    } as never);
  });

  it('creates the business, persists selection with source "created", merges discovery, appends grantedAssets, and audits', async () => {
    const existingMetadata = {
      other: 'preserved',
      meta: {
        discovery: {
          availableBusinesses: [{ id: 'biz-existing', name: 'Existing Business' }],
          discoveredAt: '2026-09-01T00:00:00.000Z',
        },
        selection: {
          clientBusinessId: 'biz-existing',
          clientBusinessName: 'Existing Business',
          selectedAt: '2026-09-01T00:00:00.000Z',
          source: 'user_selection',
        },
      },
    };
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth(existingMetadata) as never
    );
    vi.mocked(metaConnector.createBusiness).mockResolvedValue({
      id: 'biz-new',
      name: 'Acme Business',
      timezoneId: '25',
    });
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      id: connectionId,
      grantedAssets: { meta: { createdAdAccounts: [{ id: 'act-1' }] } },
    } as never);
    vi.mocked(prisma.platformAuthorization.update).mockResolvedValue({} as never);
    vi.mocked(prisma.clientConnection.update).mockResolvedValue({} as never);

    const result = await metaAssetCreationService.createBusiness(
      connectionId,
      { name: 'Acme Business', vertical: 'OTHER', primaryPageId: 'page-1', timezoneId: '25' },
      userEmail,
      agencyId
    );

    expect(result.data).toEqual({ id: 'biz-new', name: 'Acme Business', timezoneId: '25' });
    expect(result.error).toBeNull();
    expect(metaConnector.createBusiness).toHaveBeenCalledWith('client-token', {
      name: 'Acme Business',
      vertical: 'OTHER',
      primaryPageId: 'page-1',
      timezoneId: '25',
    });

    // PlatformAuthorization.metadata: selection points at the created business
    const authUpdate = vi.mocked(prisma.platformAuthorization.update).mock.calls[0][0];
    expect(authUpdate.where).toEqual({ id: 'auth-1' });
    const nextMeta = (authUpdate.data as { metadata: Record<string, unknown> }).metadata.meta as {
      discovery: { availableBusinesses: Array<{ id: string }> };
      selection: { clientBusinessId: string; clientBusinessName: string; source: string; selectedAt: string };
    };
    expect(nextMeta.selection.clientBusinessId).toBe('biz-new');
    expect(nextMeta.selection.clientBusinessName).toBe('Acme Business');
    expect(nextMeta.selection.source).toBe('created');
    expect(typeof nextMeta.selection.selectedAt).toBe('string');

    // discovery merge: existing business preserved, created business appended
    expect(nextMeta.discovery.availableBusinesses.map((b) => b.id)).toEqual([
      'biz-existing',
      'biz-new',
    ]);

    // unrelated root metadata preserved
    expect((authUpdate.data as { metadata: Record<string, unknown> }).metadata.other).toBe('preserved');

    // ClientConnection.grantedAssets append
    const connectionUpdate = vi.mocked(prisma.clientConnection.update).mock.calls[0][0];
    const grantedMeta = (connectionUpdate.data as { grantedAssets: Record<string, any> })
      .grantedAssets.meta;
    expect(grantedMeta.createdAdAccounts).toEqual([{ id: 'act-1' }]);
    expect(grantedMeta.createdBusinesses).toHaveLength(1);
    expect(grantedMeta.createdBusinesses[0]).toMatchObject({
      id: 'biz-new',
      name: 'Acme Business',
      timezoneId: '25',
      vertical: 'OTHER',
      primaryPageId: 'page-1',
    });

    expect(auditService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyId,
        userEmail,
        action: 'META_BUSINESS_CREATED',
        resourceId: connectionId,
        metadata: expect.objectContaining({
          platform: 'meta',
          businessId: 'biz-new',
          businessName: 'Acme Business',
        }),
      })
    );
  });

  it('initializes an empty meta metadata block when none exists yet', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth(null) as never
    );
    vi.mocked(metaConnector.createBusiness).mockResolvedValue({
      id: 'biz-first',
      name: 'First Business',
      timezoneId: '45',
    });
    vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
      id: connectionId,
      grantedAssets: null,
    } as never);
    vi.mocked(prisma.platformAuthorization.update).mockResolvedValue({} as never);
    vi.mocked(prisma.clientConnection.update).mockResolvedValue({} as never);

    const result = await metaAssetCreationService.createBusiness(
      connectionId,
      { name: 'First Business', vertical: 'OTHER', primaryPageId: 'page-1', timezoneId: '45' },
      userEmail,
      agencyId
    );

    expect(result.error).toBeNull();
    const authUpdate = vi.mocked(prisma.platformAuthorization.update).mock.calls[0][0];
    const metadata = (authUpdate.data as { metadata: Record<string, any> }).metadata;
    expect(metadata.meta.discovery.availableBusinesses).toEqual([
      expect.objectContaining({ id: 'biz-first' }),
    ]);
    expect(metadata.meta.selection.clientBusinessId).toBe('biz-first');
  });

  it.each([
    ['AUTHORIZATION_NOT_FOUND', () => vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(null as never)],
    [
      'AUTHORIZATION_INACTIVE',
      () =>
        vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue({
          ...activePlatformAuth(),
          status: 'expired',
        } as never),
    ],
  ])('returns %s before touching Meta', async (code, setup) => {
    setup();
    const result = await metaAssetCreationService.createBusiness(
      connectionId,
      { name: 'Acme', vertical: 'OTHER', primaryPageId: 'page-1', timezoneId: '25' },
      userEmail,
      agencyId
    );
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(code);
    expect(metaConnector.createBusiness).not.toHaveBeenCalled();
  });

  it('returns TOKEN_NOT_FOUND when Infisical retrieval fails', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth() as never
    );
    vi.mocked(infisical.getOAuthTokens).mockRejectedValue(new Error('boom'));

    const result = await metaAssetCreationService.createBusiness(
      connectionId,
      { name: 'Acme', vertical: 'OTHER', primaryPageId: 'page-1', timezoneId: '25' },
      userEmail,
      agencyId
    );

    expect(result.error?.code).toBe('TOKEN_NOT_FOUND');
  });

  it('returns TOKEN_EXPIRED when the token expiry is in the past', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth() as never
    );
    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'client-token',
      refreshToken: null,
      expiresAt: new Date('2020-01-01T00:00:00Z'),
    } as never);

    const result = await metaAssetCreationService.createBusiness(
      connectionId,
      { name: 'Acme', vertical: 'OTHER', primaryPageId: 'page-1', timezoneId: '25' },
      userEmail,
      agencyId
    );

    expect(result.error?.code).toBe('TOKEN_EXPIRED');
  });

  it.each([
    [
      'Meta business creation failed: You have reached the limit of businesses you can create',
      'LIMIT_EXCEEDED',
    ],
    [
      'Meta business creation failed: (#100) Invalid parameter: primary_page is not a Page you administer',
      'INVALID_PRIMARY_PAGE',
    ],
    [
      'Meta business creation failed: (#200) Permissions error',
      'INSUFFICIENT_PERMISSIONS',
    ],
  ])('maps a Meta error to the right code', async (message, code) => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth() as never
    );
    vi.mocked(metaConnector.createBusiness).mockRejectedValue(new Error(message));

    const result = await metaAssetCreationService.createBusiness(
      connectionId,
      { name: 'Acme', vertical: 'OTHER', primaryPageId: 'page-1', timezoneId: '25' },
      userEmail,
      agencyId
    );

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(code);
  });
});

describe('MetaAssetCreationService.getUserPages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the pages the client user administers', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth() as never
    );
    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'client-token',
      refreshToken: null,
      expiresAt: null,
    } as never);
    vi.mocked(metaConnector.getUserPages).mockResolvedValue([
      { id: 'page-1', name: 'Acme Main', category: 'Retail' },
    ]);

    const result = await metaAssetCreationService.getUserPages(connectionId);

    expect(result.data).toEqual([{ id: 'page-1', name: 'Acme Main', category: 'Retail' }]);
    expect(result.error).toBeNull();
    expect(metaConnector.getUserPages).toHaveBeenCalledWith('client-token');
  });

  it('returns an empty list when the user owns no pages (valid state for the guided check)', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth() as never
    );
    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'client-token',
      refreshToken: null,
      expiresAt: null,
    } as never);
    vi.mocked(metaConnector.getUserPages).mockResolvedValue([]);

    const result = await metaAssetCreationService.getUserPages(connectionId);

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns an error when the Graph call fails (distinct from owning no pages)', async () => {
    vi.mocked(prisma.platformAuthorization.findUnique).mockResolvedValue(
      activePlatformAuth() as never
    );
    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'client-token',
      refreshToken: null,
      expiresAt: null,
    } as never);
    vi.mocked(metaConnector.getUserPages).mockRejectedValue(
      new Error('Failed to fetch user pages: token expired')
    );

    const result = await metaAssetCreationService.getUserPages(connectionId);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('USER_PAGES_FETCH_FAILED');
  });
});
