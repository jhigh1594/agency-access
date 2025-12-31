import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agencyPlatformService } from '../agency-platform.service.js';
import { MetaConnector } from '../connectors/meta.js';
import { metaAssetsService } from '../meta-assets.service.js';

// Mock dependencies
vi.mock('../agency-platform.service');
vi.mock('../connectors/meta');

describe('MetaAssetsService', () => {
  const agencyId = 'agency-1';
  const businessId = 'biz-1';
  const accessToken = 'token-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAssetsForBusiness', () => {
    it('should retrieve assets using valid token', async () => {
      const mockAssets = {
        businessId,
        businessName: 'Test Biz',
        adAccounts: [],
        pages: [],
        instagramAccounts: [],
        productCatalogs: [],
      };

      vi.mocked(agencyPlatformService.getValidToken).mockResolvedValue({ data: accessToken, error: null });
      
      // Use spyOn on the prototype
      const getAllAssetsSpy = vi.spyOn(MetaConnector.prototype, 'getAllAssets').mockResolvedValue(mockAssets);

      const result = await metaAssetsService.getAssetsForBusiness(agencyId, businessId);

      expect(agencyPlatformService.getValidToken).toHaveBeenCalledWith(agencyId, 'meta');
      expect(getAllAssetsSpy).toHaveBeenCalledWith(accessToken, businessId);
      expect(result.data).toEqual(mockAssets);
    });

    it('should return error if token retrieval fails', async () => {
      vi.mocked(agencyPlatformService.getValidToken).mockResolvedValue({
        data: null,
        error: { code: 'CONNECTION_NOT_FOUND', message: 'Not found' } as any,
      });

      const result = await metaAssetsService.getAssetsForBusiness(agencyId, businessId);

      expect(result.error?.code).toBe('CONNECTION_NOT_FOUND');
    });
  });

  describe('saveAssetSelections', () => {
    it('should store selections in connection metadata', async () => {
      const selections = [
        { assetType: 'ad_account', assetId: 'act_1', permissionLevel: 'advertise', selected: true },
      ] as any;

      vi.mocked(agencyPlatformService.updateConnectionMetadata).mockResolvedValue({ data: {}, error: null } as any);

      const result = await metaAssetsService.saveAssetSelections(agencyId, selections);

      expect(agencyPlatformService.updateConnectionMetadata).toHaveBeenCalledWith(
        agencyId,
        'meta',
        { assetSelections: selections }
      );
      expect(result.error).toBeNull();
    });
  });
});
