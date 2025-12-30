import { agencyPlatformService } from './agency-platform.service';
import { MetaConnector } from './connectors/meta';
import type { MetaAssetSelection, MetaAllAssets, MetaAssetSettings } from '@agency-platform/shared';

/**
 * Meta Assets Service
 *
 * Handles discovery and selection of Meta assets (ad accounts, pages, etc.)
 */
export const metaAssetsService = {
  /**
   * Save selected Business Portfolio for a Meta connection
   */
  async saveBusinessPortfolio(
    agencyId: string,
    businessId: string,
    businessName: string
  ): Promise<{
    data: any;
    error: any;
  }> {
    return agencyPlatformService.updateConnectionMetadata(agencyId, 'meta', {
      selectedBusinessId: businessId,
      selectedBusinessName: businessName,
    });
  },

  /**
   * Save asset settings for a Meta connection
   */
  async saveAssetSettings(
    agencyId: string,
    settings: MetaAssetSettings
  ): Promise<{
    data: any;
    error: any;
  }> {
    return agencyPlatformService.updateConnectionMetadata(agencyId, 'meta', {
      assetSettings: settings,
    });
  },

  /**
   * Get current asset settings for a Meta connection
   */
  async getAssetSettings(agencyId: string): Promise<{
    data: MetaAssetSettings | null;
    error: any;
  }> {
    const connectionResult = await agencyPlatformService.getConnections(agencyId, {
      platform: 'meta',
    });

    if (connectionResult.error || !connectionResult.data || connectionResult.data.length === 0) {
      return {
        data: null,
        error: connectionResult.error || {
          code: 'NOT_FOUND',
          message: 'Meta connection not found',
        },
      };
    }

    const metadata = connectionResult.data[0].metadata as any;
    const settings = metadata?.assetSettings;

    // Return default settings if none exist
    if (!settings) {
      return {
        data: {
          adAccount: { enabled: true, permissionLevel: 'analyze' },
          page: { enabled: true, permissionLevel: 'analyze', limitPermissions: false },
          catalog: { enabled: true, permissionLevel: 'analyze' },
          dataset: { enabled: true, requestFullAccess: false },
          instagramAccount: { enabled: true, requestFullAccess: false },
        },
        error: null,
      };
    }

    return { data: settings, error: null };
  },

  /**
   * Get all assets for a Meta business
   */
  async getAssetsForBusiness(agencyId: string, businessId: string): Promise<{
    data: MetaAllAssets | null;
    error: any;
  }> {
    try {
      const tokenResult = await agencyPlatformService.getValidToken(agencyId, 'meta');

      if (tokenResult.error || !tokenResult.data) {
        return { data: null, error: tokenResult.error };
      }

      const connector = new MetaConnector();
      const assets = await connector.getAllAssets(tokenResult.data, businessId);

      return { data: assets, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch assets from Meta',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },

  /**
   * Save granular asset selections for a Meta connection
   */
  async saveAssetSelections(agencyId: string, selections: MetaAssetSelection[]): Promise<{
    data: any;
    error: any;
  }> {
    return agencyPlatformService.updateConnectionMetadata(agencyId, 'meta', {
      assetSelections: selections,
    });
  },
};
