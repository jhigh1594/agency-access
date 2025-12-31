import { agencyPlatformService } from './agency-platform.service.js';
import { MetaConnector } from './connectors/meta.js';
import type { MetaAssetSelection, MetaAllAssets, MetaAssetSettings } from '@agency-platform/shared';

/**
 * Meta Assets Service
 *
 * Handles discovery and selection of Meta assets (ad accounts, pages, etc.)
 */
export const metaAssetsService = {
  /**
   * Save selected Business Portfolio for a Meta connection
   * 
   * Stores the Business Manager ID in both:
   * 1. AgencyPlatformConnection.businessId (for client access granting)
   * 2. metadata.selectedBusinessId (for UI display)
   */
  async saveBusinessPortfolio(
    agencyId: string,
    businessId: string,
    businessName: string
  ): Promise<{
    data: any;
    error: any;
  }> {
    // First, update metadata
    const metadataResult = await agencyPlatformService.updateConnectionMetadata(agencyId, 'meta', {
      selectedBusinessId: businessId,
      selectedBusinessName: businessName,
    });

    if (metadataResult.error) {
      return metadataResult;
    }

    // Also update the businessId field on the connection record
    // This is needed for client access granting
    try {
      const connection = await agencyPlatformService.getConnection(agencyId, 'meta');
      
      if (connection.error || !connection.data) {
        return {
          data: null,
          error: {
            code: 'CONNECTION_NOT_FOUND',
            message: 'Meta connection not found',
          },
        };
      }

      const { prisma } = await import('@/lib/prisma');
      const updatedConnection = await prisma.agencyPlatformConnection.update({
        where: { id: connection.data.id },
        data: {
          businessId: businessId,
        },
      });

      // After business ID is set, create/retrieve system user
      // We do this even if systemUserId is already present in case they switched business managers
      try {
        // Get access token for system user creation
        const tokenResult = await agencyPlatformService.getValidToken(agencyId, 'meta');
        if (!tokenResult.error && tokenResult.data) {
          // @ts-ignore - Dynamic import, module exists at runtime
          const { metaSystemUserService } = await import('./meta-system-user.service.js');
          
          const systemUserResult = await metaSystemUserService.getOrCreateSystemUser(
            businessId,
            tokenResult.data
          );

          if (!systemUserResult.error && systemUserResult.data) {
            // Update metadata with system user ID
            const latestMetadata = (updatedConnection.metadata as any) || {};
            await prisma.agencyPlatformConnection.update({
              where: { id: connection.data.id },
              data: {
                metadata: {
                  ...latestMetadata,
                  systemUserId: systemUserResult.data,
                },
              },
            });
          }
        }
      } catch (error) {
        // Log but don't fail - system user can be created later
        console.error('Failed to create system user when setting business ID:', error);
      }

      return { data: updatedConnection, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update Business Manager ID',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
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
    const connectionResult = await agencyPlatformService.getConnection(agencyId, 'meta');

    if (connectionResult.error || !connectionResult.data) {
      return {
        data: null,
        error: connectionResult.error || {
          code: 'NOT_FOUND',
          message: 'Meta connection not found',
        },
      };
    }

    const metadata = connectionResult.data.metadata as any;
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
