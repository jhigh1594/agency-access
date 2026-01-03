import { describe, it, expect, vi, beforeEach } from 'vitest';
import { beehiivConnector } from '../beehiiv.js';

// Mock env
vi.mock('../../../lib/env', () => ({
  env: {
    BEEHIIV_API_KEY: 'test-agency-api-key',
  },
}));

// Mock infisical
vi.mock('../../../lib/infisical.js', () => ({
  infisical: {
    storeOAuthTokens: vi.fn().mockResolvedValue('secret-id'),
    getOAuthTokens: vi.fn().mockResolvedValue({ accessToken: 'stored-api-key' }),
  },
}));

describe('BeehiivConnector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('verifyToken', () => {
    it('should validate API key', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'pub123' }] }),
      } as Response);

      const isValid = await beehiivConnector.verifyToken('valid-api-key');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.beehiiv.com/v2/publications',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer valid-api-key',
          },
        })
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid key', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const isValid = await beehiivConnector.verifyToken('invalid-api-key');

      expect(isValid).toBe(false);
    });

    it('should return false on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const isValid = await beehiivConnector.verifyToken('api-key');

      expect(isValid).toBe(false);
    });
  });

  describe('getPublication', () => {
    it('should fetch publication details', async () => {
      const mockPublication = {
        id: 'pub123',
        name: 'Test Publication',
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPublication,
      } as Response);

      const pub = await beehiivConnector.getPublication('api-key', 'pub123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.beehiiv.com/v2/publications/pub123',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer api-key',
          },
        })
      );

      expect(pub).toEqual(mockPublication);
    });

    it('should throw error when publication not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response);

      await expect(beehiivConnector.getPublication('api-key', 'pub123')).rejects.toThrow('Publication not found');
    });
  });

  describe('verifyTeamAccess', () => {
    it('should verify agency has access to client publication', async () => {
      const mockPublication = {
        id: 'pub123',
        name: 'Client Publication',
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPublication,
      } as Response);

      const result = await beehiivConnector.verifyTeamAccess('agency-api-key', 'pub123');

      expect(result.hasAccess).toBe(true);
      expect(result.publication).toEqual(mockPublication);
    });

    it('should return hasAccess false when agency cannot access publication', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      } as Response);

      const result = await beehiivConnector.verifyTeamAccess('agency-api-key', 'pub123');

      expect(result.hasAccess).toBe(false);
      expect(result.error).toBe('Failed to fetch publication: Forbidden');
    });

    it('should return hasAccess false on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await beehiivConnector.verifyTeamAccess('agency-api-key', 'pub123');

      expect(result.hasAccess).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('storeAgencyApiKey', () => {
    it('should store agency API key in Infisical', async () => {
      // The mock at the top of the file returns 'secret-id'
      const secretId = await beehiivConnector.storeAgencyApiKey('agency-123', 'api-key');

      expect(secretId).toBe('secret-id');
    });
  });

  describe('getAgencyApiKey', () => {
    it('should retrieve agency API key from Infisical', async () => {
      // The mock at the top of the file returns { accessToken: 'stored-api-key' }
      const apiKey = await beehiivConnector.getAgencyApiKey('agency-123');

      expect(apiKey).toBe('stored-api-key');
    });
  });
});
