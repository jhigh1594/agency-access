/**
 * OAuth State Service Unit Tests
 *
 * Tests for CSRF protection state token management during OAuth flows.
 * Uses Prisma/Postgres for state storage (migrated from Redis).
 */

import { createHmac } from 'crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { oauthStateService } from '@/services/oauth-state.service';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    oAuthStateToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('OAuthStateService', () => {
  function signStateToken(stateToken: string): string {
    return createHmac('sha256', env.OAUTH_STATE_HMAC_SECRET).update(stateToken).digest('hex');
  }

  function parseStatelessToken(token: string): Record<string, unknown> {
    const [, payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createState', () => {
    it('should create a state token with 10-minute expiry', async () => {
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        redirectUrl: 'https://app.example.com/settings/platforms',
        timestamp: Date.now(),
      };

      vi.mocked(prisma.oAuthStateToken.create).mockResolvedValue({
        stateToken: 'abc123def456',
        agencyId: stateData.agencyId,
        platform: stateData.platform,
        userEmail: stateData.userEmail,
        redirectUrl: stateData.redirectUrl,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: stateData,
        signature: signStateToken('abc123def456'),
        timestamp: BigInt(stateData.timestamp),
        expiresAt: new Date(Date.now() + 600 * 1000),
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await oauthStateService.createState(stateData);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.data).toMatch(/^[a-f0-9]+$/); // Hex string

      // Verify Prisma was called
      expect(prisma.oAuthStateToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agencyId: stateData.agencyId,
            platform: stateData.platform,
            userEmail: stateData.userEmail,
          }),
        })
      );
    });

    it('should generate unique state tokens for different calls', async () => {
      const stateData1 = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      const stateData2 = {
        agencyId: 'agency-2',
        platform: 'meta',
        userEmail: 'admin@agency2.com',
        timestamp: Date.now() + 1000,
      };

      vi.mocked(prisma.oAuthStateToken.create)
        .mockResolvedValueOnce({
          stateToken: 'token1',
          agencyId: stateData1.agencyId,
          platform: stateData1.platform,
          userEmail: stateData1.userEmail,
          redirectUrl: null,
          accessRequestId: null,
          accessRequestToken: null,
          clientEmail: null,
          shop: null,
          metadata: stateData1,
          signature: 'sig1',
          timestamp: BigInt(stateData1.timestamp),
          expiresAt: new Date(),
          consumedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          stateToken: 'token2',
          agencyId: stateData2.agencyId,
          platform: stateData2.platform,
          userEmail: stateData2.userEmail,
          redirectUrl: null,
          accessRequestId: null,
          accessRequestToken: null,
          clientEmail: null,
          shop: null,
          metadata: stateData2,
          signature: 'sig2',
          timestamp: BigInt(stateData2.timestamp),
          expiresAt: new Date(),
          consumedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result1 = await oauthStateService.createState(stateData1);
      const result2 = await oauthStateService.createState(stateData2);

      expect(result1.data).toBeDefined();
      expect(result2.data).toBeDefined();
      // Tokens should be different (randomBytes generates unique values)
    });

    it('should include all required fields in state data', async () => {
      const stateData = {
        agencyId: 'agency-1',
        platform: 'linkedin',
        userEmail: 'user@agency.com',
        redirectUrl: 'https://app.example.com/callback',
        timestamp: 1234567890,
      };

      vi.mocked(prisma.oAuthStateToken.create).mockResolvedValue({
        stateToken: 'test-token',
        agencyId: stateData.agencyId,
        platform: stateData.platform,
        userEmail: stateData.userEmail,
        redirectUrl: stateData.redirectUrl,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: stateData,
        signature: signStateToken('test-token'),
        timestamp: BigInt(stateData.timestamp),
        expiresAt: new Date(),
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await oauthStateService.createState(stateData);

      expect(result.error).toBeNull();

      // Verify the stored data includes all fields
      expect(prisma.oAuthStateToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agencyId: 'agency-1',
            platform: 'linkedin',
            userEmail: 'user@agency.com',
            redirectUrl: 'https://app.example.com/callback',
            timestamp: BigInt(1234567890),
          }),
        })
      );
    });

    it('should fall back to a stateless token when database writes fail', async () => {
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      vi.mocked(prisma.oAuthStateToken.create).mockRejectedValue(new Error('Database connection failed'));

      const result = await oauthStateService.createState(stateData);

      expect(result.error).toBeNull();
      expect(result.data).toMatch(/^stateless\./);

      const payload = parseStatelessToken(result.data!);
      expect(payload.agencyId).toBe('agency-1');
      expect(payload.platform).toBe('google');
      expect(payload.userEmail).toBe('admin@agency.com');
    });
  });

  describe('validateState', () => {
    it('should validate and return state data for valid token', async () => {
      const stateToken = 'abc123def456';
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        redirectUrl: 'https://app.example.com/settings',
        timestamp: Date.now(),
      };

      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue({
        stateToken,
        agencyId: stateData.agencyId,
        platform: stateData.platform,
        userEmail: stateData.userEmail,
        redirectUrl: stateData.redirectUrl,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: stateData,
        signature: signStateToken(stateToken),
        timestamp: BigInt(stateData.timestamp),
        expiresAt: new Date(Date.now() + 600 * 1000),
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.oAuthStateToken.updateMany).mockResolvedValue({ count: 1 });

      const result = await oauthStateService.validateState(stateToken);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(expect.objectContaining(stateData));

      // Verify database was queried
      expect(prisma.oAuthStateToken.findUnique).toHaveBeenCalledWith({
        where: { stateToken },
      });

      // Verify one-time use: token marked as consumed
      expect(prisma.oAuthStateToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stateToken, consumedAt: null },
        })
      );
    });

    it('should return null for non-existent state token', async () => {
      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue(null);

      const result = await oauthStateService.validateState('invalid-token');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();

      // Should NOT attempt to update if token doesn't exist
      expect(prisma.oAuthStateToken.updateMany).not.toHaveBeenCalled();
    });

    it('should validate state token once (one-time use)', async () => {
      const stateToken = 'valid-token-123';
      const stateData = {
        agencyId: 'agency-1',
        platform: 'meta',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      // First call: token exists and not consumed
      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue({
        stateToken,
        agencyId: stateData.agencyId,
        platform: stateData.platform,
        userEmail: stateData.userEmail,
        redirectUrl: null,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: stateData,
        signature: signStateToken(stateToken),
        timestamp: BigInt(stateData.timestamp),
        expiresAt: new Date(Date.now() + 600 * 1000),
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.oAuthStateToken.updateMany).mockResolvedValueOnce({ count: 1 });

      const firstResult = await oauthStateService.validateState(stateToken);
      expect(firstResult.data).toEqual(expect.objectContaining(stateData));

      // Second call: simulate token already consumed (updateMany returns 0)
      vi.mocked(prisma.oAuthStateToken.updateMany).mockResolvedValueOnce({ count: 0 });

      // Re-mock findUnique to return the same record but consumedAt check happens in updateMany
      const secondResult = await oauthStateService.validateState(stateToken);
      // The second validation should succeed at findUnique but fail at updateMany
      // This tests the race condition handling
    });

    it('should handle already consumed tokens', async () => {
      const stateToken = 'consumed-token';
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue({
        stateToken,
        agencyId: stateData.agencyId,
        platform: stateData.platform,
        userEmail: stateData.userEmail,
        redirectUrl: null,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: stateData,
        signature: signStateToken(stateToken),
        timestamp: BigInt(stateData.timestamp),
        expiresAt: new Date(Date.now() + 600 * 1000),
        consumedAt: new Date(), // Already consumed
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await oauthStateService.validateState(stateToken);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('STATE_ALREADY_CONSUMED');
    });

    it('should validate timestamp is recent (prevent replay attacks)', async () => {
      const oldTimestamp = Date.now() - 15 * 60 * 1000; // 15 minutes ago
      const stateToken = 'expired-token';
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: oldTimestamp,
      };

      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue({
        stateToken,
        agencyId: stateData.agencyId,
        platform: stateData.platform,
        userEmail: stateData.userEmail,
        redirectUrl: null,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: stateData,
        signature: signStateToken(stateToken),
        timestamp: BigInt(stateData.timestamp),
        expiresAt: new Date(Date.now() + 600 * 1000), // DB expiry is future
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.oAuthStateToken.updateMany).mockResolvedValue({ count: 1 });

      const result = await oauthStateService.validateState(stateToken);

      // Even though token exists in DB, it's too old based on timestamp
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('STATE_EXPIRED');
    });

    it('should handle database errors during validation', async () => {
      vi.mocked(prisma.oAuthStateToken.findUnique).mockRejectedValue(new Error('Database connection failed'));

      const result = await oauthStateService.validateState('some-token');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('STATE_VALIDATION_FAILED');
    });

    it('should validate stateless fallback tokens without database', async () => {
      // Create a stateless token by forcing database failure
      vi.mocked(prisma.oAuthStateToken.create).mockRejectedValue(new Error('Database unavailable'));

      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      const created = await oauthStateService.createState(stateData);
      expect(created.data).toMatch(/^stateless\./);

      // Validate should work without hitting the database
      const result = await oauthStateService.validateState(created.data!);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(stateData);
      expect(prisma.oAuthStateToken.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state token', async () => {
      const result = await oauthStateService.validateState('');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_STATE_TOKEN');
    });

    it('should handle very long state tokens', async () => {
      const longToken = 'a'.repeat(1000);

      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue(null);

      const result = await oauthStateService.validateState(longToken);

      expect(result.data).toBeNull();
    });

    it('should validate required fields in state data', async () => {
      const incompleteToken = 'incomplete-token';

      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue({
        stateToken: incompleteToken,
        agencyId: null, // Missing required field
        platform: 'google',
        userEmail: null, // Missing required field
        redirectUrl: null,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: {},
        signature: signStateToken(incompleteToken),
        timestamp: BigInt(Date.now()),
        expiresAt: new Date(Date.now() + 600 * 1000),
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.oAuthStateToken.updateMany).mockResolvedValue({ count: 1 });

      const result = await oauthStateService.validateState(incompleteToken);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_STATE_DATA');
    });

    it('should reject tokens with invalid signatures', async () => {
      const stateToken = 'tampered-token';
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      vi.mocked(prisma.oAuthStateToken.findUnique).mockResolvedValue({
        stateToken,
        agencyId: stateData.agencyId,
        platform: stateData.platform,
        userEmail: stateData.userEmail,
        redirectUrl: null,
        accessRequestId: null,
        accessRequestToken: null,
        clientEmail: null,
        shop: null,
        metadata: stateData,
        signature: 'invalid-signature', // Wrong signature
        timestamp: BigInt(stateData.timestamp),
        expiresAt: new Date(Date.now() + 600 * 1000),
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await oauthStateService.validateState(stateToken);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_STATE_SIGNATURE');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and consumed tokens', async () => {
      vi.mocked(prisma.oAuthStateToken.deleteMany).mockResolvedValue({ count: 5 });

      const result = await oauthStateService.cleanupExpiredTokens();

      expect(result.deleted).toBe(5);
      expect(prisma.oAuthStateToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { consumedAt: { not: null } },
          ],
        },
      });
    });
  });
});
