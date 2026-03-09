import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { getConnector } from '@/services/connectors/factory';
import {
  ensureAgencyAccessToken,
  refreshAgencyPlatformConnection,
  refreshClientPlatformAuthorization,
} from '@/services/token-lifecycle.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyPlatformConnection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    platformAuthorization: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    clientConnection: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/infisical', () => ({
  infisical: {
    getOAuthTokens: vi.fn(),
    retrieveOAuthTokens: vi.fn(),
    updateOAuthTokens: vi.fn(),
  },
}));

vi.mock('@/services/connectors/factory', () => ({
  getConnector: vi.fn(),
}));

describe('tokenLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes an agency connection for refreshable OAuth platforms', async () => {
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue({
      id: 'agency-conn-1',
      agencyId: 'agency-1',
      platform: 'google',
      secretId: 'google_agency_agency-1',
      status: 'active',
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 60_000),
    });

    vi.mocked(getConnector).mockReturnValue({
      refreshToken: vi.fn().mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3_600_000),
      }),
    } as any);

    vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue({
      id: 'agency-conn-1',
    } as any);

    const result = await refreshAgencyPlatformConnection('agency-1', 'google');

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      outcome: 'refreshed',
      accessToken: 'new-token',
    });
    expect(infisical.updateOAuthTokens).toHaveBeenCalledWith(
      'google_agency_agency-1',
      expect.objectContaining({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      })
    );
  });

  it('returns reconnect_required for expired non-refreshable OAuth platforms', async () => {
    vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue({
      id: 'agency-conn-2',
      agencyId: 'agency-1',
      platform: 'meta',
      secretId: 'meta_agency_agency-1',
      status: 'active',
      expiresAt: new Date(Date.now() - 60_000),
    } as any);

    vi.mocked(infisical.getOAuthTokens).mockResolvedValue({
      accessToken: 'expired-meta-token',
      expiresAt: new Date(Date.now() - 60_000),
    });

    const result = await ensureAgencyAccessToken('agency-1', 'meta');

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      code: 'RECONNECT_REQUIRED',
    });
    expect(getConnector).not.toHaveBeenCalled();
  });

  it('does not attempt refresh for manual-only connectors', async () => {
    vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue({
      id: 'auth-1',
      connectionId: 'connection-1',
      platform: 'klaviyo',
      secretId: 'oauth_klaviyo_connection-1',
      status: 'active',
      expiresAt: null,
    } as any);

    const result = await refreshClientPlatformAuthorization('connection-1', 'klaviyo' as any);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      code: 'MANUAL_CONNECTION',
    });
    expect(getConnector).not.toHaveBeenCalled();
  });
});
