import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../agency-platform.service.js', () => ({
  agencyPlatformService: {
    getConnection: vi.fn(),
    updateConnectionMetadata: vi.fn(),
  },
}));

import { agencyPlatformService } from '../agency-platform.service.js';
import { googleAssetsService } from '../google-assets.service.js';

describe('GoogleAssetsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default Google settings with user-invite mode seeded from the connected agency email', async () => {
    vi.mocked(agencyPlatformService.getConnection).mockResolvedValue({
      data: {
        id: 'conn-1',
        connectedBy: 'owner@agency.test',
        agencyEmail: 'jon.highmu@gmail.com',
        metadata: null,
      } as any,
      error: null,
    });

    const result = await googleAssetsService.getAssetSettings('agency-1');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      googleAdsManagement: {
        preferredGrantMode: 'user_invite',
        inviteEmail: 'jon.highmu@gmail.com',
      },
      googleAds: { enabled: true, requestManageUsers: false },
      googleAnalytics: { enabled: true, requestManageUsers: false },
      googleBusinessProfile: { enabled: true, requestManageUsers: false },
      googleTagManager: { enabled: true, requestManageUsers: false },
      googleSearchConsole: { enabled: true, requestManageUsers: false },
      googleMerchantCenter: { enabled: true, requestManageUsers: false },
    });
  });

  it('normalizes the MCC customer id and stores the discovered manager account label', async () => {
    vi.mocked(agencyPlatformService.getConnection).mockResolvedValue({
      data: {
        id: 'conn-1',
        connectedBy: 'owner@agency.test',
        metadata: {
          googleAccounts: {
            adsAccounts: [
              {
                id: '6449142979',
                name: 'Pillar AI Agency MCC',
                formattedId: '644-914-2979',
                isManager: true,
                type: 'google_ads',
                status: 'active',
              },
            ],
          },
        },
      } as any,
      error: null,
    });
    vi.mocked(agencyPlatformService.updateConnectionMetadata).mockResolvedValue({
      data: { success: true } as any,
      error: null,
    });

    const result = await googleAssetsService.saveAssetSettings('agency-1', {
      googleAdsManagement: {
        preferredGrantMode: 'manager_link',
        managerCustomerId: '644-914-2979',
        inviteEmail: 'jon.highmu@gmail.com',
      },
      googleAds: { enabled: true, requestManageUsers: false },
      googleAnalytics: { enabled: true, requestManageUsers: false },
      googleBusinessProfile: { enabled: true, requestManageUsers: false },
      googleTagManager: { enabled: true, requestManageUsers: false },
      googleSearchConsole: { enabled: true, requestManageUsers: false },
      googleMerchantCenter: { enabled: true, requestManageUsers: false },
    });

    expect(result.error).toBeNull();
    expect(agencyPlatformService.updateConnectionMetadata).toHaveBeenCalledWith('agency-1', 'google', {
      googleAssetSettings: expect.objectContaining({
        googleAdsManagement: {
          preferredGrantMode: 'manager_link',
          managerCustomerId: '6449142979',
          managerAccountLabel: 'Pillar AI Agency MCC',
          inviteEmail: 'jon.highmu@gmail.com',
        },
      }),
    });
  });

  it('rejects a manager-link default when the chosen account is not an eligible manager account', async () => {
    vi.mocked(agencyPlatformService.getConnection).mockResolvedValue({
      data: {
        id: 'conn-1',
        connectedBy: 'owner@agency.test',
        metadata: {
          googleAccounts: {
            adsAccounts: [
              {
                id: '5497559774',
                name: 'Client Ads Account',
                formattedId: '549-755-9774',
                isManager: false,
                type: 'google_ads',
                status: 'active',
              },
            ],
          },
        },
      } as any,
      error: null,
    });

    const result = await googleAssetsService.saveAssetSettings('agency-1', {
      googleAdsManagement: {
        preferredGrantMode: 'manager_link',
        managerCustomerId: '549-755-9774',
        inviteEmail: 'jon.highmu@gmail.com',
      },
      googleAds: { enabled: true, requestManageUsers: false },
      googleAnalytics: { enabled: true, requestManageUsers: false },
      googleBusinessProfile: { enabled: true, requestManageUsers: false },
      googleTagManager: { enabled: true, requestManageUsers: false },
      googleSearchConsole: { enabled: true, requestManageUsers: false },
      googleMerchantCenter: { enabled: true, requestManageUsers: false },
    });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Select an eligible Google Ads manager account before defaulting to MCC linking.',
    });
    expect(agencyPlatformService.updateConnectionMetadata).not.toHaveBeenCalled();
  });
});
