import { agencyPlatformService } from './agency-platform.service.js';
import type { GoogleAssetSettings } from '@agency-platform/shared';

/**
 * Google Assets Service
 *
 * Handles discovery and configuration of Google assets (Ads, Analytics, etc.)
 */
export const googleAssetsService = {
  /**
   * Save asset settings for a Google connection
   */
  async saveAssetSettings(
    agencyId: string,
    settings: GoogleAssetSettings
  ): Promise<{
    data: any;
    error: any;
  }> {
    return agencyPlatformService.updateConnectionMetadata(agencyId, 'google', {
      googleAssetSettings: settings,
    });
  },

  /**
   * Get current asset settings for a Google connection
   */
  async getAssetSettings(agencyId: string): Promise<{
    data: GoogleAssetSettings | null;
    error: any;
  }> {
    const connectionResult = await agencyPlatformService.getConnection(agencyId, 'google');

    if (connectionResult.error || !connectionResult.data) {
      return {
        data: null,
        error: connectionResult.error || {
          code: 'NOT_FOUND',
          message: 'Google connection not found',
        },
      };
    }

    const metadata = connectionResult.data.metadata as any;
    const settings = metadata?.googleAssetSettings;

    // Return default settings if none exist
    if (!settings) {
      return {
        data: {
          googleAds: { enabled: true },
          googleAnalytics: { enabled: true, requestManageUsers: false },
          googleBusinessProfile: { enabled: true, requestManageUsers: false },
          googleTagManager: { enabled: true, requestManageUsers: false },
          googleSearchConsole: { enabled: true, requestManageUsers: false },
          googleMerchantCenter: { enabled: true, requestManageUsers: false },
        },
        error: null,
      };
    }

    return { data: settings, error: null };
  },

  /**
   * Save selected account for a specific Google product
   */
  async saveAccountSelection(
    agencyId: string,
    product: string,
    accountId: string,
    accountName: string
  ): Promise<{
    data: any;
    error: any;
  }> {
    const fieldMap: Record<string, string> = {
      googleAds: 'selectedGoogleAdsAccount',
      googleAnalytics: 'selectedGoogleAnalyticsProperty',
      googleBusinessProfile: 'selectedGoogleBusinessProfileLocation',
      googleTagManager: 'selectedGoogleTagManagerContainer',
      googleSearchConsole: 'selectedGoogleSearchConsoleSite',
      googleMerchantCenter: 'selectedGoogleMerchantCenterAccount',
    };

    const field = fieldMap[product];
    if (!field) {
      return {
        data: null,
        error: {
          code: 'INVALID_PRODUCT',
          message: `Product "${product}" is not supported for account selection`,
        },
      };
    }

    return agencyPlatformService.updateConnectionMetadata(agencyId, 'google', {
      [field]: accountId,
      [`${field}Name`]: accountName,
    });
  },
};

