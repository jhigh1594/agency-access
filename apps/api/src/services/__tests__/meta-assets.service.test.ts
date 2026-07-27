import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../agency-platform.service.js', () => ({
  agencyPlatformService: {
    getValidToken: vi.fn(),
    updateConnectionMetadata: vi.fn(),
    getConnection: vi.fn(),
  },
}));

vi.mock('../connectors/meta.js', () => ({
  MetaConnector: vi.fn(),
}));

vi.mock('../meta-system-user.service.js', () => ({
  metaSystemUserService: {
    getOrCreateSystemUser: vi.fn(),
    createSystemUserAccessToken: vi.fn(),
    getDefaultPartnerAdminSystemUserName: vi
      .fn()
      .mockReturnValue('Agency Platform Admin System User'),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyPlatformConnection: {
      update: vi.fn(),
    },
    metaAgencyDestination: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/services/audit.service', () => ({
  createAuditLog: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/services/audit.service';
import { agencyPlatformService } from '../agency-platform.service.js';
import { MetaConnector } from '../connectors/meta.js';
import { metaAssetsService } from '../meta-assets.service.js';
import { metaSystemUserService } from '../meta-system-user.service.js';

const mockMetaConnectorInstance = {
  getAllAssets: vi.fn(),
};

describe('MetaAssetsService', () => {
  const agencyId = 'agency-1';
  const businessId = 'biz-1';
  const accessToken = 'token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));
  });

  describe('receiving destinations', () => {
    it('lazily seeds the legacy selected portfolio without rewriting metadata', async () => {
      vi.mocked(agencyPlatformService.getConnection).mockResolvedValue({
        data: {
          id: 'conn-1',
          status: 'active',
          metadata: {
            selectedBusinessId: 'biz-legacy',
            selectedBusinessName: 'Legacy Portfolio',
          },
        },
        error: null,
      } as any);
      vi.mocked(prisma.metaAgencyDestination.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'destination-1', businessId: 'biz-legacy', isDefault: true }] as any);
      vi.mocked(prisma.metaAgencyDestination.upsert).mockResolvedValue({ id: 'destination-1' } as any);

      const result = await metaAssetsService.listDestinations(agencyId);

      expect(result.error).toBeNull();
      expect(prisma.metaAgencyDestination.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agencyId_businessId: { agencyId, businessId: 'biz-legacy' } },
          create: expect.objectContaining({ isDefault: true }),
        })
      );
      expect(agencyPlatformService.updateConnectionMetadata).not.toHaveBeenCalled();
    });

    it('registers a second portfolio and changes the default transactionally', async () => {
      vi.mocked(agencyPlatformService.getConnection).mockResolvedValue({
        data: { id: 'conn-1', status: 'active', metadata: {} },
        error: null,
      } as any);
      vi.mocked(prisma.metaAgencyDestination.count).mockResolvedValue(1);
      vi.mocked(prisma.metaAgencyDestination.upsert).mockResolvedValue({
        id: 'destination-2',
        agencyId,
        businessId: 'biz-2',
        isDefault: true,
      } as any);

      const result = await metaAssetsService.registerDestination(agencyId, {
        businessId: 'biz-2',
        name: 'Second Portfolio',
        makeDefault: true,
      });

      expect(result.error).toBeNull();
      expect(prisma.metaAgencyDestination.updateMany).toHaveBeenCalledWith({
        where: { agencyId, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.metaAgencyDestination.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isDefault: true }),
          update: expect.objectContaining({ isDefault: true }),
        })
      );
    });

    it('does not allow another agency to select a destination', async () => {
      vi.mocked(prisma.metaAgencyDestination.findFirst).mockResolvedValue(null);

      const result = await metaAssetsService.setDefaultDestination('agency-2', 'destination-1');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('DESTINATION_NOT_FOUND');
      expect(prisma.metaAgencyDestination.updateMany).not.toHaveBeenCalled();
    });
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
      vi.mocked(MetaConnector).mockImplementation(function () {
        return mockMetaConnectorInstance as any;
      });
      mockMetaConnectorInstance.getAllAssets.mockResolvedValue(mockAssets);

      const result = await metaAssetsService.getAssetsForBusiness(agencyId, businessId);

      expect(agencyPlatformService.getValidToken).toHaveBeenCalledWith(agencyId, 'meta');
      expect(mockMetaConnectorInstance.getAllAssets).toHaveBeenCalledWith(accessToken, businessId);
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

  describe('saveAssetSettings', () => {
    it('fails closed for catalog and dataset controls that are not fulfilled end to end', async () => {
      vi.mocked(agencyPlatformService.updateConnectionMetadata).mockResolvedValue({ data: {}, error: null } as any);

      await metaAssetsService.saveAssetSettings(agencyId, {
        adAccount: { enabled: true, permissionLevel: 'analyze' },
        page: { enabled: true, permissionLevel: 'analyze' },
        catalog: { enabled: true, permissionLevel: 'manage' },
        dataset: { enabled: true, requestFullAccess: true },
        instagramAccount: { enabled: true, requestFullAccess: false },
      });

      expect(agencyPlatformService.updateConnectionMetadata).toHaveBeenCalledWith(
        agencyId,
        'meta',
        {
          assetSettings: expect.objectContaining({
            catalog: expect.objectContaining({ enabled: false }),
            dataset: { enabled: false, requestFullAccess: false },
          }),
        }
      );
    });
  });

  describe('saveBusinessPortfolio', () => {
    it('persists the partner admin system-user token reference when Meta setup succeeds', async () => {
      vi.mocked(agencyPlatformService.updateConnectionMetadata).mockResolvedValue({
        data: {},
        error: null,
      } as any);
      vi.mocked(agencyPlatformService.getConnection).mockResolvedValue({
        data: {
          id: 'conn-1',
          metadata: {
            tokenType: 'bearer',
          },
          connectedBy: 'owner@agency.test',
        },
        error: null,
      } as any);
      vi.mocked(prisma.agencyPlatformConnection.update)
        .mockResolvedValueOnce({
          id: 'conn-1',
          metadata: {
            tokenType: 'bearer',
          },
        } as any)
        .mockResolvedValueOnce({
          id: 'conn-1',
          metadata: {
            tokenType: 'bearer',
            systemUserId: 'sys-admin-1',
            partnerAdminSystemUserStatus: 'ready',
            partnerAdminSystemUserTokenSecretId:
              'meta_partner_admin_system_user_agency-1_biz-1',
          },
        } as any);
      vi.mocked(agencyPlatformService.getValidToken).mockResolvedValue({
        data: accessToken,
        error: null,
      } as any);
      vi.mocked(metaSystemUserService.getOrCreateSystemUser).mockResolvedValue({
        data: 'sys-admin-1',
        error: null,
      });
      vi.mocked(metaSystemUserService.createSystemUserAccessToken).mockResolvedValue({
        data: {
          tokenSecretId: 'meta_partner_admin_system_user_agency-1_biz-1',
          scopes: ['ads_management', 'ads_read', 'business_management'],
        },
        error: null,
      });
      vi.mocked(createAuditLog).mockResolvedValue({ data: {}, error: null } as any);

      const result = await metaAssetsService.saveBusinessPortfolio(
        agencyId,
        businessId,
        'Agency Business'
      );

      expect(result.error).toBeNull();
      expect(agencyPlatformService.updateConnectionMetadata).toHaveBeenCalledWith(
        agencyId,
        'meta',
        {
          selectedBusinessId: businessId,
          selectedBusinessName: 'Agency Business',
        }
      );
      expect(metaSystemUserService.getOrCreateSystemUser).toHaveBeenCalledWith(
        businessId,
        accessToken,
        {
          name: 'Agency Platform Admin System User',
          role: 'ADMIN',
        }
      );
      expect(metaSystemUserService.createSystemUserAccessToken).toHaveBeenCalledWith({
        businessId,
        systemUserId: 'sys-admin-1',
        accessToken,
        secretName: 'meta_partner_admin_system_user_agency-1_biz-1',
      });
      expect(prisma.agencyPlatformConnection.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'conn-1' },
        data: {
          metadata: {
            tokenType: 'bearer',
            systemUserId: 'sys-admin-1',
            partnerAdminSystemUserStatus: 'ready',
            partnerAdminSystemUserTokenSecretId:
              'meta_partner_admin_system_user_agency-1_biz-1',
            partnerAdminSystemUserScopes: [
              'ads_management',
              'ads_read',
              'business_management',
            ],
            partnerAdminSystemUserProvisionedAt: expect.any(String),
          },
        },
      });
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          agencyId,
          agencyConnectionId: 'conn-1',
          action: 'META_PARTNER_SYSTEM_USER_TOKEN_PROVISIONED',
          userEmail: 'owner@agency.test',
          metadata: expect.objectContaining({
            businessId,
            systemUserId: 'sys-admin-1',
            tokenSecretId: 'meta_partner_admin_system_user_agency-1_biz-1',
          }),
        })
      );
    });

    it('persists a failed partner admin system-user token state without failing the business save', async () => {
      vi.mocked(agencyPlatformService.updateConnectionMetadata).mockResolvedValue({
        data: {},
        error: null,
      } as any);
      vi.mocked(agencyPlatformService.getConnection).mockResolvedValue({
        data: {
          id: 'conn-1',
          metadata: {
            tokenType: 'bearer',
            previous: true,
          },
          connectedBy: 'owner@agency.test',
        },
        error: null,
      } as any);
      vi.mocked(prisma.agencyPlatformConnection.update)
        .mockResolvedValueOnce({
          id: 'conn-1',
          metadata: {
            tokenType: 'bearer',
            previous: true,
          },
        } as any)
        .mockResolvedValueOnce({
          id: 'conn-1',
          metadata: {
            tokenType: 'bearer',
            previous: true,
            systemUserId: 'sys-admin-1',
            partnerAdminSystemUserStatus: 'failed',
          },
        } as any);
      vi.mocked(agencyPlatformService.getValidToken).mockResolvedValue({
        data: accessToken,
        error: null,
      } as any);
      vi.mocked(metaSystemUserService.getOrCreateSystemUser).mockResolvedValue({
        data: 'sys-admin-1',
        error: null,
      });
      vi.mocked(metaSystemUserService.createSystemUserAccessToken).mockResolvedValue({
        data: null,
        error: {
          code: 'SYSTEM_USER_TOKEN_CREATE_FAILED_200',
          message: 'Permission denied',
        },
      });
      vi.mocked(createAuditLog).mockResolvedValue({ data: {}, error: null } as any);

      const result = await metaAssetsService.saveBusinessPortfolio(
        agencyId,
        businessId,
        'Agency Business'
      );

      expect(result.error).toBeNull();
      expect(prisma.agencyPlatformConnection.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'conn-1' },
        data: {
          metadata: {
            tokenType: 'bearer',
            previous: true,
            systemUserId: 'sys-admin-1',
            partnerAdminSystemUserStatus: 'failed',
            partnerAdminSystemUserLastErrorCode: 'SYSTEM_USER_TOKEN_CREATE_FAILED_200',
            partnerAdminSystemUserLastErrorMessage: 'Permission denied',
            partnerAdminSystemUserLastAttemptAt: expect.any(String),
          },
        },
      });
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          agencyId,
          agencyConnectionId: 'conn-1',
          action: 'META_PARTNER_SYSTEM_USER_TOKEN_PROVISION_FAILED',
          userEmail: 'owner@agency.test',
          metadata: expect.objectContaining({
            businessId,
            systemUserId: 'sys-admin-1',
            errorCode: 'SYSTEM_USER_TOKEN_CREATE_FAILED_200',
          }),
        })
      );
    });
  });
});
