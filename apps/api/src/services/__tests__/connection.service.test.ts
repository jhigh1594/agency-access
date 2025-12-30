/**
 * Connection Service Unit Tests
 *
 * Tests for client connection and platform authorization management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as connectionService from '@/services/connection.service';
import { infisical } from '@/lib/infisical';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    clientConnection: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    platformAuthorization: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    accessRequest: {
      findUnique: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock Infisical
vi.mock('@/lib/infisical', () => ({
  infisical: {
    generateSecretName: vi.fn((platform, connectionId) => `oauth_${platform}_${connectionId}`),
    storeOAuthTokens: vi.fn(),
    retrieveOAuthTokens: vi.fn(),
    updateOAuthTokens: vi.fn(),
    deleteSecret: vi.fn(),
  },
}));

describe('ConnectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClientConnection', () => {
    it('should create a new client connection with platform authorizations', async () => {
      const mockRequest = {
        id: 'request-1',
        agencyId: 'agency-1',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        platforms: ['meta_ads', 'google_ads'],
        intakeFields: [],
        branding: {},
      };

      const mockConnection = {
        id: 'connection-1',
        requestId: 'request-1',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        createdAt: new Date(),
      };

      vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback({
          clientConnection: {
            create: vi.fn().mockResolvedValue(mockConnection),
          },
          platformAuthorization: {
            create: vi.fn(),
          },
        } as any);
      });

      const mockTokens = {
        meta_ads: {
          accessToken: 'meta-access-token',
          refreshToken: 'meta-refresh-token',
          expiresAt: new Date(Date.now() + 3600000 * 24 * 60),
        },
        google_ads: {
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
          expiresAt: new Date(Date.now() + 3600000 * 24 * 60),
        },
      };

      const result = await connectionService.createClientConnection({
        requestId: 'request-1',
        platforms: mockTokens,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(infisical.storeOAuthTokens).toHaveBeenCalledTimes(2);
    });

    it('should return error if access request not found', async () => {
      vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue(null);

      const result = await connectionService.createClientConnection({
        requestId: 'non-existent',
        platforms: {},
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('REQUEST_NOT_FOUND');
    });

    it('should store tokens in Infisical and only save secretId in database', async () => {
      const mockRequest = {
        id: 'request-1',
        clientName: 'Test Client',
        platforms: ['meta_ads'],
      };

      vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const prismaMock = {
          clientConnection: {
            create: vi.fn().mockResolvedValue({ id: 'connection-1' }),
          },
          platformAuthorization: {
            create: vi.fn().mockImplementation((data) => {
              // Verify only secretId is stored, not actual tokens
              expect(data.data.secretId).toContain('oauth_meta_ads_');
              expect(data.data.accessToken).toBeUndefined();
              expect(data.data.refreshToken).toBeUndefined();
              return { id: 'auth-1', ...data.data };
            }),
          },
        };
        return callback(prismaMock as any);
      });

      await connectionService.createClientConnection({
        requestId: 'request-1',
        platforms: {
          meta_ads: {
            accessToken: 'secret-token',
            refreshToken: 'secret-refresh',
            expiresAt: new Date(),
          },
        },
      });

      expect(infisical.storeOAuthTokens).toHaveBeenCalledWith(
        expect.stringContaining('oauth_meta_ads_'),
        expect.objectContaining({
          accessToken: 'secret-token',
          refreshToken: 'secret-refresh',
        })
      );
    });
  });

  describe('getConnection', () => {
    it('should return connection by id', async () => {
      const mockConnection = {
        id: 'connection-1',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
      };

      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue(mockConnection as any);

      const result = await connectionService.getConnection('connection-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockConnection);
    });

    it('should return error if connection not found', async () => {
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue(null);

      const result = await connectionService.getConnection('non-existent');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('CONNECTION_NOT_FOUND');
    });
  });

  describe('getConnectionAuthorizations', () => {
    it('should return all platform authorizations for a connection', async () => {
      const mockAuthorizations = [
        {
          id: 'auth-1',
          connectionId: 'connection-1',
          platform: 'meta_ads',
          status: 'active',
          secretId: 'oauth_meta_ads_connection-1',
          expiresAt: new Date(Date.now() + 3600000 * 24 * 60),
        },
        {
          id: 'auth-2',
          connectionId: 'connection-1',
          platform: 'google_ads',
          status: 'active',
          secretId: 'oauth_google_ads_connection-1',
          expiresAt: new Date(Date.now() + 3600000 * 24 * 60),
        },
      ];

      vi.mocked(prisma.platformAuthorization.findMany).mockResolvedValue(mockAuthorizations as any);

      const result = await connectionService.getConnectionAuthorizations('connection-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAuthorizations);
    });
  });

  describe('getPlatformTokens', () => {
    it('should retrieve tokens from Infisical for a platform authorization', async () => {
      const mockAuth = {
        id: 'auth-1',
        platform: 'meta_ads',
        secretId: 'oauth_meta_ads_connection-1',
        expiresAt: new Date(Date.now() + 3600000 * 24 * 60),
      };

      vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue(mockAuth as any);
      vi.mocked(infisical.retrieveOAuthTokens).mockResolvedValue({
        accessToken: 'meta-access-token',
        refreshToken: 'meta-refresh-token',
        expiresAt: new Date(Date.now() + 3600000 * 24 * 60),
      });

      const result = await connectionService.getPlatformTokens('connection-1', 'meta_ads');

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        accessToken: 'meta-access-token',
        refreshToken: 'meta-refresh-token',
        expiresAt: expect.any(Date),
      });
      expect(infisical.retrieveOAuthTokens).toHaveBeenCalledWith('oauth_meta_ads_connection-1');
    });

    it('should return error if authorization not found', async () => {
      vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue(null);

      const result = await connectionService.getPlatformTokens('connection-1', 'meta_ads');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('AUTHORIZATION_NOT_FOUND');
    });

    it('should return error if tokens not found in Infisical', async () => {
      vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue({
        secretId: 'missing-secret',
      } as any);
      vi.mocked(infisical.retrieveOAuthTokens).mockResolvedValue(null);

      const result = await connectionService.getPlatformTokens('connection-1', 'meta_ads');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('TOKENS_NOT_FOUND');
    });
  });

  describe('updatePlatformTokens', () => {
    it('should update tokens in Infisical and database', async () => {
      const mockAuth = {
        id: 'auth-1',
        secretId: 'oauth_meta_ads_connection-1',
      };

      vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue(mockAuth as any);
      vi.mocked(prisma.platformAuthorization.update).mockResolvedValue({
        id: 'auth-1',
        expiresAt: new Date(Date.now() + 3600000 * 24 * 60),
      } as any);
      vi.mocked(infisical.updateOAuthTokens).mockResolvedValue(undefined);

      const newExpiresAt = new Date(Date.now() + 3600000 * 24 * 60);

      const result = await connectionService.updatePlatformTokens('connection-1', 'meta_ads', {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: newExpiresAt,
      });

      expect(result.error).toBeNull();
      expect(infisical.updateOAuthTokens).toHaveBeenCalledWith(
        'oauth_meta_ads_connection-1',
        expect.objectContaining({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        })
      );
    });
  });

  describe('revokeConnection', () => {
    it('should revoke connection and delete all tokens from Infisical', async () => {
      const mockConnection = {
        id: 'connection-1',
      };

      const mockAuthorizations = [
        { secretId: 'oauth_meta_ads_connection-1' },
        { secretId: 'oauth_google_ads_connection-1' },
      ];

      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue(mockConnection as any);
      vi.mocked(prisma.clientConnection.update).mockResolvedValue(mockConnection as any);
      vi.mocked(prisma.platformAuthorization.findMany).mockResolvedValue(mockAuthorizations as any);
      vi.mocked(prisma.platformAuthorization.updateMany).mockResolvedValue({});
      vi.mocked(infisical.deleteSecret).mockResolvedValue(undefined);

      const result = await connectionService.revokeConnection('connection-1');

      expect(result.error).toBeNull();
      expect(infisical.deleteSecret).toHaveBeenCalledTimes(2);
      expect(infisical.deleteSecret).toHaveBeenCalledWith('oauth_meta_ads_connection-1');
      expect(infisical.deleteSecret).toHaveBeenCalledWith('oauth_google_ads_connection-1');
    });
  });
});
