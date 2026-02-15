/**
 * Agency Platform Service Unit Tests
 *
 * Tests for managing agency platform connections and OAuth tokens.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import * as agencyPlatformService from '@/services/agency-platform.service';

const { deleteCacheMock, invalidateCacheMock } = vi.hoisted(() => ({
  deleteCacheMock: vi.fn(async () => true),
  invalidateCacheMock: vi.fn(async () => ({ success: true, keysDeleted: 1 })),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyPlatformConnection: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock cache layer (used by /agency-platforms/available)
vi.mock('@/lib/cache', () => ({
  CacheKeys: {
    agencyConnections: (agencyId: string) => `agency:${agencyId}:connections`,
  },
  deleteCache: deleteCacheMock,
  invalidateCache: invalidateCacheMock,
}));

// Mock Infisical
vi.mock('@/lib/infisical', () => ({
  infisical: {
    storeOAuthTokens: vi.fn(),
    getOAuthTokens: vi.fn(),
    updateOAuthTokens: vi.fn(),
    deleteOAuthTokens: vi.fn(),
    generateSecretName: vi.fn(),
  },
}));

describe('AgencyPlatformService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConnections', () => {
    it('should return all platform connections for an agency', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          agencyId: 'agency-1',
          platform: 'google',
          secretId: 'google_agency_agency-1',
          status: 'active',
          connectedBy: 'admin@agency.com',
          connectedAt: new Date(),
        },
        {
          id: 'conn-2',
          agencyId: 'agency-1',
          platform: 'meta',
          secretId: 'meta_agency_agency-1',
          status: 'active',
          connectedBy: 'admin@agency.com',
          connectedAt: new Date(),
        },
      ];

      vi.mocked(prisma.agencyPlatformConnection.findMany).mockResolvedValue(mockConnections as any);

      const result = await agencyPlatformService.getConnections('agency-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockConnections);
      expect(prisma.agencyPlatformConnection.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency-1' },
        orderBy: { connectedAt: 'desc' },
      });
    });

    it('should filter by status if provided', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          agencyId: 'agency-1',
          platform: 'google',
          status: 'active',
        },
      ];

      vi.mocked(prisma.agencyPlatformConnection.findMany).mockResolvedValue(mockConnections as any);

      const result = await agencyPlatformService.getConnections('agency-1', { status: 'active' });

      expect(result.error).toBeNull();
      expect(prisma.agencyPlatformConnection.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency-1', status: 'active' },
        orderBy: { connectedAt: 'desc' },
      });
    });

    it('should return empty array if no connections exist', async () => {
      vi.mocked(prisma.agencyPlatformConnection.findMany).mockResolvedValue([]);

      const result = await agencyPlatformService.getConnections('agency-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe('getConnection', () => {
    it('should return a specific platform connection', async () => {
      const mockConnection = {
        id: 'conn-1',
        agencyId: 'agency-1',
        platform: 'google',
        secretId: 'google_agency_agency-1',
        status: 'active',
        connectedBy: 'admin@agency.com',
        connectedAt: new Date(),
      };

      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(mockConnection as any);

      const result = await agencyPlatformService.getConnection('agency-1', 'google');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockConnection);
      expect(prisma.agencyPlatformConnection.findFirst).toHaveBeenCalledWith({
        where: { agencyId: 'agency-1', platform: 'google' },
      });
    });

    it('should return null if connection not found', async () => {
      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(null);

      const result = await agencyPlatformService.getConnection('agency-1', 'google');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe('createConnection', () => {
    it('should create a new platform connection with token storage', async () => {
      const mockAgency = { id: 'agency-1', name: 'Test Agency' };
      const mockConnection = {
        id: 'conn-1',
        agencyId: 'agency-1',
        platform: 'google',
        secretId: 'google_agency_agency-1',
        status: 'active',
        connectedBy: 'admin@agency.com',
        connectedAt: new Date(),
      };

      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

      vi.mocked(prisma.agency.findUnique).mockResolvedValue(mockAgency as any);
      vi.mocked(infisical.generateSecretName).mockReturnValue('google_agency_agency-1');
      vi.mocked(infisical.storeOAuthTokens).mockResolvedValue('google_agency_agency-1');
      vi.mocked(prisma.agencyPlatformConnection.create).mockResolvedValue(mockConnection as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await agencyPlatformService.createConnection({
        agencyId: 'agency-1',
        platform: 'google',
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresAt,
        scope: 'ads.readonly',
        connectedBy: 'admin@agency.com',
        metadata: { businessId: '123456' },
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockConnection);

      // Verify Infisical was called to store tokens
      expect(infisical.storeOAuthTokens).toHaveBeenCalledWith('google_agency_agency-1', {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresAt,
        scope: 'ads.readonly',
      });

      // Verify database record created
      expect(prisma.agencyPlatformConnection.create).toHaveBeenCalledWith({
        data: {
          agencyId: 'agency-1',
          platform: 'google',
          secretId: 'google_agency_agency-1',
          status: 'active',
          expiresAt,
          scope: 'ads.readonly',
          metadata: { businessId: '123456' },
          connectedBy: 'admin@agency.com',
        },
      });

      // Verify audit log created
      expect(prisma.auditLog.create).toHaveBeenCalled();

      // Verify cache invalidated (so /agency-platforms/available updates immediately)
      expect(deleteCacheMock).toHaveBeenCalledWith('agency:agency-1:connections');
    });

    it('should return error if agency not found', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

      const result = await agencyPlatformService.createConnection({
        agencyId: 'non-existent',
        platform: 'google',
        accessToken: 'token',
        connectedBy: 'admin@agency.com',
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('AGENCY_NOT_FOUND');
    });

    it('should return error if platform already connected', async () => {
      const mockAgency = { id: 'agency-1' };
      const existingConnection = { id: 'existing', platform: 'google' };

      vi.mocked(prisma.agency.findUnique).mockResolvedValue(mockAgency as any);
      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(existingConnection as any);

      const result = await agencyPlatformService.createConnection({
        agencyId: 'agency-1',
        platform: 'google',
        accessToken: 'token',
        connectedBy: 'admin@agency.com',
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PLATFORM_ALREADY_CONNECTED');
    });
  });

  describe('revokeConnection', () => {
    it('should revoke connection and delete tokens from Infisical', async () => {
      const mockConnection = {
        id: 'conn-1',
        agencyId: 'agency-1',
        platform: 'google',
        secretId: 'google_agency_agency-1',
        status: 'active',
      };

      const updatedConnection = {
        ...mockConnection,
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy: 'admin@agency.com',
      };

      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(mockConnection as any);
      vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue(updatedConnection as any);
      vi.mocked(infisical.deleteOAuthTokens).mockResolvedValue();
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await agencyPlatformService.revokeConnection(
        'agency-1',
        'google',
        'admin@agency.com'
      );

      expect(result.error).toBeNull();
      expect(result.data).toEqual(updatedConnection);

      // Verify tokens deleted from Infisical
      expect(infisical.deleteOAuthTokens).toHaveBeenCalledWith('google_agency_agency-1');

      // Verify database updated
      expect(prisma.agencyPlatformConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: {
          status: 'revoked',
          revokedAt: expect.any(Date),
          revokedBy: 'admin@agency.com',
        },
      });

      // Verify audit log
      expect(prisma.auditLog.create).toHaveBeenCalled();

      // Verify cache invalidated (so /agency-platforms/available updates immediately)
      expect(deleteCacheMock).toHaveBeenCalledWith('agency:agency-1:connections');
    });

    it('should return error if connection not found', async () => {
      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(null);

      const result = await agencyPlatformService.revokeConnection(
        'agency-1',
        'google',
        'admin@agency.com'
      );

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('CONNECTION_NOT_FOUND');
    });
  });

  describe('refreshConnection', () => {
    it('should refresh expired tokens and update database', async () => {
      const mockConnection = {
        id: 'conn-1',
        agencyId: 'agency-1',
        platform: 'google',
        secretId: 'google_agency_agency-1',
        status: 'active',
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      const oldTokens = {
        accessToken: 'old_access_token',
        refreshToken: 'refresh_token',
        expiresAt: new Date(Date.now() - 1000),
      };

      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      };

      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(mockConnection as any);
      vi.mocked(infisical.getOAuthTokens).mockResolvedValue(oldTokens);

      // Mock platform connector refresh (this would be called internally)
      // For now, we'll assume the service handles this
      vi.mocked(infisical.updateOAuthTokens).mockResolvedValue();
      vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue({
        ...mockConnection,
        expiresAt: newTokens.expiresAt,
        lastRefreshedAt: new Date(),
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await agencyPlatformService.refreshConnection(
        'agency-1',
        'google',
        newTokens
      );

      expect(result.error).toBeNull();

      // Verify tokens updated in Infisical
      expect(infisical.updateOAuthTokens).toHaveBeenCalledWith(
        'google_agency_agency-1',
        newTokens
      );

      // Verify database updated with new expiry
      expect(prisma.agencyPlatformConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: {
          expiresAt: newTokens.expiresAt,
          lastRefreshedAt: expect.any(Date),
        },
      });

      // Verify audit log
      expect(prisma.auditLog.create).toHaveBeenCalled();

      // Verify cache invalidated (expiresAt affects UI)
      expect(deleteCacheMock).toHaveBeenCalledWith('agency:agency-1:connections');
    });
  });

  describe('updateConnectionMetadata', () => {
    it('should update metadata and invalidate connections cache', async () => {
      const mockConnection = {
        id: 'conn-1',
        agencyId: 'agency-1',
        platform: 'google',
        status: 'active',
        metadata: { existing: true },
      };

      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(mockConnection as any);
      vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue({
        ...mockConnection,
        metadata: { existing: true, newKey: 'newVal' },
      } as any);

      const result = await agencyPlatformService.updateConnectionMetadata('agency-1', 'google', {
        newKey: 'newVal',
      });

      expect(result.error).toBeNull();
      expect(prisma.agencyPlatformConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: {
          metadata: { existing: true, newKey: 'newVal' },
        },
      });
      expect(deleteCacheMock).toHaveBeenCalledWith('agency:agency-1:connections');
    });
  });

  describe('getValidToken', () => {
    it('should return valid access token without refresh', async () => {
      const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const mockConnection = {
        id: 'conn-1',
        agencyId: 'agency-1',
        platform: 'google',
        secretId: 'google_agency_agency-1',
        status: 'active',
        expiresAt: futureExpiry,
      };

      const mockTokens = {
        accessToken: 'valid_access_token',
        refreshToken: 'refresh_token',
        expiresAt: futureExpiry,
      };

      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(mockConnection as any);
      vi.mocked(infisical.getOAuthTokens).mockResolvedValue(mockTokens);

      const result = await agencyPlatformService.getValidToken('agency-1', 'google');

      expect(result.error).toBeNull();
      expect(result.data).toBe('valid_access_token');

      // Should NOT refresh because token is still valid for >5 days
      expect(infisical.updateOAuthTokens).not.toHaveBeenCalled();
    });

    it('should return error if connection not found', async () => {
      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(null);

      const result = await agencyPlatformService.getValidToken('agency-1', 'google');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('CONNECTION_NOT_FOUND');
    });

    it('should return error if connection is not active', async () => {
      const mockConnection = {
        id: 'conn-1',
        agencyId: 'agency-1',
        platform: 'google',
        status: 'revoked',
      };

      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(mockConnection as any);

      const result = await agencyPlatformService.getValidToken('agency-1', 'google');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('CONNECTION_NOT_ACTIVE');
    });
  });

  describe('validateConnection', () => {
    it('should return true for valid active connection', async () => {
      const mockConnection = {
        id: 'conn-1',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      vi.mocked(prisma.agencyPlatformConnection.findUnique).mockResolvedValue(mockConnection as any);

      const result = await agencyPlatformService.validateConnection('conn-1');

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
    });

    it('should return false for revoked connection', async () => {
      const mockConnection = {
        id: 'conn-1',
        status: 'revoked',
      };

      vi.mocked(prisma.agencyPlatformConnection.findUnique).mockResolvedValue(mockConnection as any);

      const result = await agencyPlatformService.validateConnection('conn-1');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return false for expired connection', async () => {
      const mockConnection = {
        id: 'conn-1',
        status: 'active',
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      vi.mocked(prisma.agencyPlatformConnection.findUnique).mockResolvedValue(mockConnection as any);

      const result = await agencyPlatformService.validateConnection('conn-1');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });

    it('should return false if connection not found', async () => {
      vi.mocked(prisma.agencyPlatformConnection.findUnique).mockResolvedValue(null);

      const result = await agencyPlatformService.validateConnection('non-existent');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });
  });
});
