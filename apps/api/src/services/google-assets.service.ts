import { agencyPlatformService } from './agency-platform.service.js';
import {
  GoogleAssetSettingsSchema,
  getDefaultGoogleAssetSettings,
  type GoogleAccountsResponse,
  type GoogleAssetSettings,
} from '@agency-platform/shared';

function resolveInviteEmail(connection: any): string | undefined {
  return connection?.agencyEmail || connection?.connectedBy || undefined;
}

function mergeGoogleAssetSettings(
  settings: GoogleAssetSettings | null | undefined,
  inviteEmail?: string
): GoogleAssetSettings {
  const defaults = getDefaultGoogleAssetSettings(inviteEmail);
  const mergedGoogleAdsManagement = {
    preferredGrantMode:
      settings?.googleAdsManagement?.preferredGrantMode ||
      defaults.googleAdsManagement?.preferredGrantMode ||
      'user_invite',
    ...(defaults.googleAdsManagement?.inviteEmail
      ? { inviteEmail: defaults.googleAdsManagement.inviteEmail }
      : {}),
    ...(settings?.googleAdsManagement?.inviteEmail
      ? { inviteEmail: settings.googleAdsManagement.inviteEmail }
      : {}),
    ...(settings?.googleAdsManagement?.managerCustomerId
      ? { managerCustomerId: settings.googleAdsManagement.managerCustomerId }
      : {}),
    ...(settings?.googleAdsManagement?.managerAccountLabel
      ? { managerAccountLabel: settings.googleAdsManagement.managerAccountLabel }
      : {}),
  };

  if (!settings) {
    return {
      ...defaults,
      googleAdsManagement: mergedGoogleAdsManagement,
    };
  }

  return {
    ...defaults,
    ...settings,
    googleAdsManagement: mergedGoogleAdsManagement,
    googleAds: {
      ...defaults.googleAds,
      ...settings.googleAds,
    },
    googleAnalytics: {
      ...defaults.googleAnalytics,
      ...settings.googleAnalytics,
    },
    googleBusinessProfile: {
      ...defaults.googleBusinessProfile,
      ...settings.googleBusinessProfile,
    },
    googleTagManager: {
      ...defaults.googleTagManager,
      ...settings.googleTagManager,
    },
    googleSearchConsole: {
      ...defaults.googleSearchConsole,
      ...settings.googleSearchConsole,
    },
    googleMerchantCenter: {
      ...defaults.googleMerchantCenter,
      ...settings.googleMerchantCenter,
    },
  };
}

function validateGoogleAdsManagement(
  settings: GoogleAssetSettings,
  googleAccounts?: GoogleAccountsResponse
): { data: GoogleAssetSettings | null; error: { code: string; message: string } | null } {
  const management = settings.googleAdsManagement;

  if (!management) {
    return { data: settings, error: null };
  }

  const discoveredAdsAccounts = googleAccounts?.adsAccounts || [];
  const managerAccounts = googleAccounts?.adsAccounts?.filter((account) => account.isManager) || [];

  if (management.preferredGrantMode === 'manager_link') {
    if (!management.managerCustomerId) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Enter a Google Ads manager account before defaulting to MCC linking.',
        },
      };
    }

    if (discoveredAdsAccounts.length > 0) {
      const selectedManager = managerAccounts.find(
        (account) => account.id === management.managerCustomerId
      );

      if (!selectedManager) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Select an eligible Google Ads manager account before defaulting to MCC linking.',
          },
        };
      }

      return {
        data: {
          ...settings,
          googleAdsManagement: {
            ...management,
            managerCustomerId: selectedManager.id,
            managerAccountLabel: selectedManager.name,
          },
        },
        error: null,
      };
    }
  }

  return { data: settings, error: null };
}

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

    const inviteEmail = resolveInviteEmail(connectionResult.data);
    const hydratedSettings = mergeGoogleAssetSettings(settings, inviteEmail);
    const parsedSettings = GoogleAssetSettingsSchema.safeParse(hydratedSettings);

    if (!parsedSettings.success) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsedSettings.error.issues[0]?.message || 'Invalid Google settings',
        },
      };
    }

    const metadata = connectionResult.data.metadata as Record<string, any> | undefined;
    const managerValidation = validateGoogleAdsManagement(
      parsedSettings.data,
      metadata?.googleAccounts as GoogleAccountsResponse | undefined
    );

    if (managerValidation.error || !managerValidation.data) {
      return {
        data: null,
        error: managerValidation.error,
      };
    }

    return agencyPlatformService.updateConnectionMetadata(agencyId, 'google', {
      googleAssetSettings: managerValidation.data,
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
    return {
      data: mergeGoogleAssetSettings(settings, resolveInviteEmail(connectionResult.data)),
      error: null,
    };
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
