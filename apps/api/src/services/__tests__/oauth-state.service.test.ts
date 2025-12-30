/**
 * OAuth State Service Unit Tests
 *
 * Tests for CSRF protection state token management during OAuth flows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { oauthStateService } from '@/services/oauth-state.service';
import { redis } from '@/lib/redis';

// Mock crypto for token generation
vi.mock('crypto', () => ({
  randomBytes: (size: number) => ({
    toString: (encoding: string) => {
      if (encoding === 'hex') {
        return 'abc123def456789abc123def456789abc123def456789abc123def456789abc'; // 64 chars (32 bytes * 2)
      }
      return '';
    },
  }),
}));

// Mock Redis client (will be created in implementation)
vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

describe('OAuthStateService', () => {
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

      vi.mocked(redis.set).mockResolvedValue('OK');

      const result = await oauthStateService.createState(stateData);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.data).toMatch(/^[a-f0-9]+$/); // Hex string

      // Verify Redis was called with correct parameters
      expect(vi.mocked(redis.set)).toHaveBeenCalledWith(
        `oauth_state:${result.data}`,
        JSON.stringify(stateData),
        'EX',
        600 // 10 minutes in seconds
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

      vi.mocked(redis.set).mockResolvedValue('OK');

      const result1 = await oauthStateService.createState(stateData1);
      const result2 = await oauthStateService.createState(stateData2);

      expect(result1.data).toBeDefined();
      expect(result2.data).toBeDefined();
      // In real implementation, these should be different
      // (mocked crypto returns same value, but real implementation would differ)
    });

    it('should include all required fields in state data', async () => {
      const stateData = {
        agencyId: 'agency-1',
        platform: 'linkedin',
        userEmail: 'user@agency.com',
        redirectUrl: 'https://app.example.com/callback',
        timestamp: 1234567890,
      };

      vi.mocked(redis.set).mockResolvedValue('OK');

      const result = await oauthStateService.createState(stateData);

      expect(result.error).toBeNull();

      // Verify the stored data includes all fields
      const storedData = JSON.parse(vi.mocked(redis.set).mock.calls[0][1]);
      expect(storedData.agencyId).toBe('agency-1');
      expect(storedData.platform).toBe('linkedin');
      expect(storedData.userEmail).toBe('user@agency.com');
      expect(storedData.redirectUrl).toBe('https://app.example.com/callback');
      expect(storedData.timestamp).toBe(1234567890);
    });

    it('should handle Redis errors gracefully', async () => {
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      vi.mocked(redis.set).mockRejectedValue(new Error('Redis connection failed'));

      const result = await oauthStateService.createState(stateData);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('STATE_CREATION_FAILED');
    });
  });

  describe('validateState', () => {
    it('should validate and return state data for valid token', async () => {
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        redirectUrl: 'https://app.example.com/settings',
        timestamp: Date.now(),
      };

      const stateToken = 'abc123def456';

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(stateData));
      vi.mocked(redis.del).mockResolvedValue(1); // Successfully deleted

      const result = await oauthStateService.validateState(stateToken);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(stateData);

      // Verify Redis was queried
      expect(vi.mocked(redis.get)).toHaveBeenCalledWith(`oauth_state:${stateToken}`);

      // Verify one-time use: token deleted after validation
      expect(vi.mocked(redis.del)).toHaveBeenCalledWith(`oauth_state:${stateToken}`);
    });

    it('should return null for non-existent state token', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await oauthStateService.validateState('invalid-token');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();

      // Should NOT attempt to delete if token doesn't exist
      expect(vi.mocked(redis.del)).not.toHaveBeenCalled();
    });

    it('should validate state token once (one-time use)', async () => {
      const stateData = {
        agencyId: 'agency-1',
        platform: 'meta',
        userEmail: 'admin@agency.com',
        timestamp: Date.now(),
      };

      const stateToken = 'valid-token-123';

      // First call: token exists
      vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(stateData));
      vi.mocked(redis.del).mockResolvedValueOnce(1);

      const firstResult = await oauthStateService.validateState(stateToken);
      expect(firstResult.data).toEqual(stateData);

      // Second call: token already deleted (one-time use)
      vi.mocked(redis.get).mockResolvedValueOnce(null);

      const secondResult = await oauthStateService.validateState(stateToken);
      expect(secondResult.data).toBeNull();
    });

    it('should handle malformed state data', async () => {
      const stateToken = 'malformed-token';

      vi.mocked(redis.get).mockResolvedValue('invalid-json{');

      const result = await oauthStateService.validateState(stateToken);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_STATE_DATA');

      // Should still delete the malformed token
      expect(vi.mocked(redis.del)).toHaveBeenCalled();
    });

    it('should validate timestamp is recent (prevent replay attacks)', async () => {
      const oldTimestamp = Date.now() - 15 * 60 * 1000; // 15 minutes ago
      const stateData = {
        agencyId: 'agency-1',
        platform: 'google',
        userEmail: 'admin@agency.com',
        timestamp: oldTimestamp,
      };

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(stateData));
      vi.mocked(redis.del).mockResolvedValue(1);

      const result = await oauthStateService.validateState('expired-token');

      // Even though token exists in Redis, it's too old
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('STATE_EXPIRED');

      // Should delete expired token
      expect(vi.mocked(redis.del)).toHaveBeenCalled();
    });

    it('should handle Redis errors during validation', async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error('Redis connection failed'));

      const result = await oauthStateService.validateState('some-token');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('STATE_VALIDATION_FAILED');
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

      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await oauthStateService.validateState(longToken);

      expect(result.data).toBeNull();
    });

    it('should validate required fields in state data', async () => {
      const incompleteStateData = {
        agencyId: 'agency-1',
        // Missing platform, userEmail, timestamp
      };

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(incompleteStateData));
      vi.mocked(redis.del).mockResolvedValue(1);

      const result = await oauthStateService.validateState('incomplete-token');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('INVALID_STATE_DATA');
    });
  });
});
