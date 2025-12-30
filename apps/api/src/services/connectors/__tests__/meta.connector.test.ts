import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetaConnector } from '../meta';

// Mock env
vi.mock('../../../lib/env', () => ({
  env: {
    META_APP_ID: 'test-app-id',
    META_APP_SECRET: 'test-app-secret',
    API_URL: 'http://localhost:3001',
  },
}));

describe('MetaConnector Asset Discovery', () => {
  let connector: MetaConnector;
  const accessToken = 'test-access-token';
  const businessId = 'test-business-id';

  beforeEach(() => {
    connector = new MetaConnector();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getAdAccounts', () => {
    it('should fetch ad accounts for a business', async () => {
      const mockResponse = {
        data: [
          {
            id: 'act_123',
            name: 'Test Ad Account',
            account_status: 1,
            currency: 'USD',
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await connector.getAdAccounts(accessToken, businessId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`graph.facebook.com/v21.0/${businessId}/owned_ad_accounts`),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'act_123',
        name: 'Test Ad Account',
        accountStatus: 'ACTIVE',
        currency: 'USD',
      });
    });

    it('should return empty array when no ad accounts exist', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const result = await connector.getAdAccounts(accessToken, businessId);
      expect(result).toHaveLength(0);
    });
  });

  describe('getPages', () => {
    it('should fetch pages for a business', async () => {
      const mockResponse = {
        data: [
          {
            id: 'page_123',
            name: 'Test Page',
            category: 'Marketing',
            tasks: ['ADVERTISE', 'ANALYZE'],
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await connector.getPages(accessToken, businessId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`graph.facebook.com/v21.0/${businessId}/owned_pages`),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'page_123',
        name: 'Test Page',
        category: 'Marketing',
        tasks: ['ADVERTISE', 'ANALYZE'],
      });
    });
  });

  describe('getInstagramAccounts', () => {
    it('should fetch Instagram accounts linked to business', async () => {
      const mockResponse = {
        data: [
          {
            id: 'ig_123',
            username: 'test_ig',
            profile_picture_url: 'http://example.com/pic.jpg',
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await connector.getInstagramAccounts(accessToken, businessId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`graph.facebook.com/v21.0/${businessId}/instagram_accounts`),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'ig_123',
        username: 'test_ig',
        profilePictureUrl: 'http://example.com/pic.jpg',
      });
    });
  });

  describe('getProductCatalogs', () => {
    it('should fetch product catalogs for a business', async () => {
      const mockResponse = {
        data: [
          {
            id: 'cat_123',
            name: 'Test Catalog',
            catalog_type: 'PRODUCT_CATALOG',
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await connector.getProductCatalogs(accessToken, businessId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`graph.facebook.com/v21.0/${businessId}/owned_product_catalogs`),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'cat_123',
        name: 'Test Catalog',
        catalogType: 'PRODUCT_CATALOG',
      });
    });
  });

  describe('getAllAssets', () => {
    it('should aggregate all asset types for a business', async () => {
      // Mock business info and other endpoints
      vi.mocked(fetch).mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes(`v21.0/${businessId}?`)) {
          return { ok: true, json: async () => ({ id: businessId, name: 'Test Business' }) } as Response;
        }
        if (urlStr.includes('/owned_ad_accounts')) {
          return { ok: true, json: async () => ({ data: [{ id: 'act_1', name: 'Ad Account 1', account_status: 1, currency: 'USD' }] }) } as Response;
        }
        if (urlStr.includes('/owned_pages')) {
          return { ok: true, json: async () => ({ data: [{ id: 'page_1', name: 'Page 1', category: 'Test', tasks: [] }] }) } as Response;
        }
        if (urlStr.includes('/instagram_accounts')) {
          return { ok: true, json: async () => ({ data: [] }) } as Response;
        }
        if (urlStr.includes('/owned_product_catalogs')) {
          return { ok: true, json: async () => ({ data: [] }) } as Response;
        }
        return { ok: false, status: 404, text: async () => 'Not Found' } as Response;
      });

      const result = await connector.getAllAssets(accessToken, businessId);

      expect(result.businessId).toBe(businessId);
      expect(result.businessName).toBe('Test Business');
      expect(result.adAccounts).toHaveLength(1);
      expect(result.pages).toHaveLength(1);
      expect(result.instagramAccounts).toHaveLength(0);
      expect(result.productCatalogs).toHaveLength(0);
    });
  });
});

