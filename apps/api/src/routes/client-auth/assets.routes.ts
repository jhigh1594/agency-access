import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../../services/access-request.service.js';
import { auditService } from '../../services/audit.service.js';
import {
  clientAssetsService,
  MetaBusinessPortfolioUnavailableError,
} from '../../services/client-assets.service.js';
import { googleNativeAccessService } from '@/services/google-native-access.service';
import {
  mapAccessLevelToTikTokRole,
  tiktokPartnerService,
  type TikTokPartnerShareResultItem,
} from '@/services/tiktok-partner.service';
import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import {
  type MetaAssetKind,
  MetaClientAuthorizationMetadataSchema,
  type MetaAssetGrantResult,
  type MetaClientAuthorizationMetadata,
  type GooglePlatformProductId,
  type Platform,
} from '@agency-platform/shared';
import type { GoogleProduct } from '../../services/connectors/google.js';
import {
  adAccountsSharedSchema,
  grantMetaAccessSchema,
  grantPagesAccessSchema,
  manualMetaAdAccountShareSchema,
  saveAssetsSchema,
  tiktokPartnerShareSchema,
  tiktokPartnerVerifySchema,
} from './schemas.js';
import { metaOBOService } from '@/services/meta-obo.service';
import { metaPartnerService } from '@/services/meta-partner.service';
import { MetaConnector } from '@/services/connectors/meta';

type ShareResultWithVerification = TikTokPartnerShareResultItem & { verified?: boolean };

const GOOGLE_NATIVE_ACCESS_PRODUCTS = new Set<GoogleProduct>([
  'google_ads',
  'ga4',
  'google_business_profile',
  'google_tag_manager',
  'google_search_console',
  'google_merchant_center',
]);

function resolveAgencyTikTokBusinessCenterId(connection: {
  businessId?: string | null;
  metadata?: unknown;
} | null): string | null {
  if (!connection) return null;
  const metadata = (connection.metadata as Record<string, unknown> | null) || {};
  const tiktokMetadata =
    (metadata.tiktok as Record<string, unknown> | undefined) || {};

  const fromMetadata =
    tiktokMetadata.businessCenterId ??
    tiktokMetadata.selectedBusinessCenterId ??
    tiktokMetadata.bcId ??
    metadata.businessCenterId ??
    metadata.selectedBusinessCenterId ??
    metadata.bcId;

  const resolved = connection.businessId || (typeof fromMetadata === 'string' ? fromMetadata : null);
  return resolved ? String(resolved) : null;
}

function resolveRequestedTikTokAccessLevel(accessRequest: any): string {
  const platforms = Array.isArray(accessRequest?.platforms) ? accessRequest.platforms : [];

  for (const group of platforms) {
    if (group?.platformGroup !== 'tiktok' || !Array.isArray(group.products)) continue;
    const productLevels = group.products
      .map((product: any) => product?.accessLevel)
      .filter((value: unknown): value is string => typeof value === 'string');

    if (productLevels.includes('admin')) return 'admin';
    if (productLevels.includes('standard')) return 'standard';
    if (productLevels.includes('read_only')) return 'read_only';
    if (productLevels.includes('email_only')) return 'email_only';
  }

  for (const platform of platforms) {
    const platformName = platform?.platform;
    if (platformName !== 'tiktok' && platformName !== 'tiktok_ads') continue;
    if (platform?.accessLevel === 'manage') return 'admin';
    if (platform?.accessLevel === 'view_only') return 'read_only';
  }

  return 'standard';
}

function mergeTikTokShareResults(
  previous: unknown,
  current: ShareResultWithVerification[]
): ShareResultWithVerification[] {
  const map = new Map<string, ShareResultWithVerification>();

  if (Array.isArray(previous)) {
    for (const item of previous) {
      if (!item || typeof item !== 'object') continue;
      const advertiserId = String((item as any).advertiserId || '');
      if (!advertiserId) continue;
      map.set(advertiserId, {
        advertiserId,
        status: (item as any).status,
        error: (item as any).error,
        verified: (item as any).verified,
      });
    }
  }

  for (const item of current) {
    map.set(item.advertiserId, item);
  }

  return Array.from(map.values());
}

function normalizeStringIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function getSelectedMetaAssets(selectedAssets: unknown): Record<string, unknown> {
  if (!selectedAssets || typeof selectedAssets !== 'object' || Array.isArray(selectedAssets)) {
    return {};
  }

  const record = selectedAssets as Record<string, unknown>;
  const metaAdsAssets =
    record.meta_ads && typeof record.meta_ads === 'object' && !Array.isArray(record.meta_ads)
      ? (record.meta_ads as Record<string, unknown>)
      : null;
  const metaPagesAssets =
    record.meta_pages && typeof record.meta_pages === 'object' && !Array.isArray(record.meta_pages)
      ? (record.meta_pages as Record<string, unknown>)
      : null;

  return metaAdsAssets || metaPagesAssets || {};
}

function readMetaClientAuthorizationMetadata(metadata: unknown): {
  rootMetadata: Record<string, unknown>;
  metaMetadata: MetaClientAuthorizationMetadata;
} {
  const rootMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? ({ ...(metadata as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  const parsed = MetaClientAuthorizationMetadataSchema.safeParse(rootMetadata.meta);

  return {
    rootMetadata,
    metaMetadata: parsed.success ? parsed.data : {},
  };
}

const META_PAGE_TASKS = ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ADVERTISE'];
const META_AD_ACCOUNT_TASKS = ['MANAGE', 'ADVERTISE', 'ANALYZE'];
const META_UNSUPPORTED_INSTAGRAM_MESSAGE =
  'Instagram account automated grants are not yet supported';
const META_MANUAL_AD_ACCOUNT_PENDING_MESSAGE =
  'Ad account has not been shared to the agency business portfolio yet';

type ManualMetaAdAccountSelection = {
  id: string;
  name: string;
};

type ManualMetaAdAccountVerificationResult = {
  assetId: string;
  assetName: string;
  status: 'waiting_for_manual_share' | 'verified' | 'unresolved' | 'failed';
  verifiedAt?: string;
  errorCode?: string;
  errorMessage?: string;
};

function buildMetaGrantVerificationStatus(
  assetGrantResults: MetaAssetGrantResult[]
): 'verified' | 'partial' | 'failed' {
  const allVerified =
    assetGrantResults.length > 0 &&
    assetGrantResults.every((result) => result.status === 'verified');

  if (allVerified) {
    return 'verified';
  }

  const hasVerified = assetGrantResults.some((result) => result.status === 'verified');
  return hasVerified ? 'partial' : 'failed';
}

function extractSelectedMetaAdAccounts(selectedMetaAssets: Record<string, unknown>): ManualMetaAdAccountSelection[] {
  const selectedWithNames = Array.isArray(selectedMetaAssets.selectedAdAccountsWithNames)
    ? selectedMetaAssets.selectedAdAccountsWithNames
    : [];
  const selectedIds = normalizeStringIds(
    selectedMetaAssets.adAccounts ??
      selectedMetaAssets.selectedAdvertiserIds ??
      selectedMetaAssets.advertisers
  );

  if (selectedWithNames.length > 0) {
    return selectedWithNames
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const id = String((item as Record<string, unknown>).id || '');
        if (!id) return null;

        return {
          id,
          name: String((item as Record<string, unknown>).name || id),
        };
      })
      .filter((item): item is ManualMetaAdAccountSelection => Boolean(item));
  }

  return selectedIds.map((id) => ({ id, name: id }));
}

function mergeMetaAssetGrantResults(
  existingResults: MetaAssetGrantResult[] | undefined,
  nextResults: MetaAssetGrantResult[],
  assetType: MetaAssetKind
): MetaAssetGrantResult[] {
  const retained = (existingResults || []).filter((result) => result.assetType !== assetType);
  return [...retained, ...nextResults];
}

function sortMetaAssetGrantResults(assetGrantResults: MetaAssetGrantResult[]): MetaAssetGrantResult[] {
  const order: Partial<Record<MetaAssetKind, number>> = {
    page: 0,
    ad_account: 1,
    instagram_account: 2,
  };

  return [...assetGrantResults].sort(
    (left, right) => (order[left.assetType] ?? 99) - (order[right.assetType] ?? 99)
  );
}

function resolveAgencyMetaBusinessDetails(connection: {
  businessId?: string | null;
  metadata?: unknown;
} | null): { businessId: string | null; businessName: string | null } {
  if (!connection) {
    return {
      businessId: null,
      businessName: null,
    };
  }

  const metadata = (connection.metadata as Record<string, unknown> | null) || {};
  const businessId =
    connection.businessId ||
    (typeof metadata.selectedBusinessId === 'string' ? metadata.selectedBusinessId : null) ||
    (typeof metadata.businessId === 'string' ? metadata.businessId : null);
  const businessName =
    (typeof metadata.selectedBusinessName === 'string' ? metadata.selectedBusinessName : null) ||
    (typeof metadata.businessName === 'string' ? metadata.businessName : null);

  return {
    businessId: businessId ? String(businessId) : null,
    businessName: businessName ? String(businessName) : null,
  };
}

function toMetaAdAccountGrantResults(
  verificationResults: ManualMetaAdAccountVerificationResult[]
): MetaAssetGrantResult[] {
  return verificationResults.map((result) => ({
    assetId: result.assetId,
    assetType: 'ad_account',
    requestedTasks: META_AD_ACCOUNT_TASKS,
    status: result.status === 'waiting_for_manual_share' ? 'pending' : result.status,
    ...(result.status === 'verified' ? { grantedAt: result.verifiedAt, verifiedAt: result.verifiedAt } : {}),
    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
    ...(result.errorMessage ? { errorMessage: result.errorMessage } : {}),
  }));
}

export async function registerAssetRoutes(fastify: FastifyInstance) {
  async function resolveAuthorizedConnection(token: string, connectionId: string) {
    const accessRequest = await accessRequestService.getAccessRequestByToken(token);
    if (accessRequest.error || !accessRequest.data) {
      return {
        accessRequest: null,
        connection: null,
        error: {
          code: 'ACCESS_REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    const connection = await prisma.clientConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return {
        accessRequest: accessRequest.data,
        connection: null,
        error: {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Client connection not found',
        },
      };
    }

    const isAuthorizedConnection =
      connection.accessRequestId === accessRequest.data.id &&
      connection.agencyId === accessRequest.data.agencyId;

    if (!isAuthorizedConnection) {
      return {
        accessRequest: accessRequest.data,
        connection: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Connection does not belong to this access request',
        },
      };
    }

    return {
      accessRequest: accessRequest.data,
      connection,
      error: null,
    };
  }

  // Save selected assets for a platform
  fastify.post('/client/:token/save-assets', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = saveAssetsSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid asset selection data',
          details: validated.error.errors,
        },
      });
    }

    const { connectionId, platform, selectedAssets } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (authContext.error || !authContext.connection) {
        const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
        return reply.code(statusCode).send({
          data: null,
          error: authContext.error,
        });
      }
      const connection = authContext.connection;
      let resolvedSelectedAssets = selectedAssets;

      if (GOOGLE_NATIVE_ACCESS_PRODUCTS.has(platform as GoogleProduct) && authContext.accessRequest) {
        const orchestrationResult = await googleNativeAccessService.planGoogleNativeGrants({
          accessRequest: authContext.accessRequest as any,
          connection,
          platform: platform as GooglePlatformProductId,
          selectedAssets,
        });

        if (orchestrationResult.error) {
          return reply.code(500).send({
            data: null,
            error: {
              code: orchestrationResult.error.code,
              message: orchestrationResult.error.message,
              ...(orchestrationResult.error.details
                ? { details: orchestrationResult.error.details }
                : {}),
            },
          });
        }

        if (orchestrationResult.data?.selectedAssets) {
          resolvedSelectedAssets = orchestrationResult.data.selectedAssets as typeof selectedAssets;
        }
      }

      const currentGrantedAssets = (connection.grantedAssets as any) || {};
      const updatedGrantedAssets = {
        ...currentGrantedAssets,
        [platform]: resolvedSelectedAssets,
      };

      await prisma.clientConnection.update({
        where: { id: connectionId },
        data: { grantedAssets: updatedGrantedAssets },
      });

      const platformStr = String(platform);
      const platformMap: Record<string, Platform> = {
        google_ads: 'google',
        ga4: 'google',
        google_business_profile: 'google',
        google_tag_manager: 'google',
        google_search_console: 'google',
        google_merchant_center: 'google',
        meta_ads: 'meta',
        meta_pages: 'meta',
        linkedin_ads: 'linkedin',
        linkedin_pages: 'linkedin',
        instagram: 'meta',
        mailchimp: 'mailchimp',
        pinterest: 'pinterest',
        klaviyo: 'klaviyo',
        shopify: 'shopify',
        tiktok: 'tiktok',
        tiktok_ads: 'tiktok',
      };
      const authPlatform = platformMap[platformStr] || (platform as Platform);

      const existingAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: authPlatform,
          },
        },
      });

      if (existingAuth) {
        const existingMetadata = (existingAuth.metadata as any) || {};
        const tiktokSelection =
          authPlatform === 'tiktok'
            ? {
                selectedAdvertiserIds:
                  resolvedSelectedAssets.selectedAdvertiserIds ||
                  resolvedSelectedAssets.adAccounts ||
                  resolvedSelectedAssets.advertisers ||
                  [],
                selectedBusinessCenterId: resolvedSelectedAssets.selectedBusinessCenterId || null,
                discoverySnapshot: {
                  advertisers: resolvedSelectedAssets.availableAdvertisers || [],
                  businessCenters: resolvedSelectedAssets.availableBusinessCenters || [],
                },
              }
            : undefined;

        const updatedMetadata = {
          ...existingMetadata,
          selectedAssets: {
            ...(existingMetadata.selectedAssets || {}),
            [platform]: resolvedSelectedAssets,
          },
          ...(tiktokSelection
            ? {
                tiktok: {
                  ...(existingMetadata.tiktok || {}),
                  ...tiktokSelection,
                },
              }
            : {}),
        };

        await prisma.platformAuthorization.update({
          where: { id: existingAuth.id },
          data: { metadata: updatedMetadata },
        });
      }

      await auditService.createAuditLog({
        agencyId: connection.agencyId,
        action: 'CLIENT_ASSETS_SELECTED',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connection.id,
        metadata: {
          platform,
          selectedAssets: resolvedSelectedAssets,
        },
      });

      return reply.send({
        data: { success: true },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'SAVE_ASSETS_ERROR',
          message: `Failed to save selected assets: ${error}`,
        },
      });
    }
  });

  fastify.post('/client/:token/grant-meta-access', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = grantMetaAccessSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validated.error.errors,
        },
      });
    }

    const {
      connectionId,
      businessId: requestedBusinessId,
      assetTypes,
    } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (authContext.error || !authContext.connection || !authContext.accessRequest) {
        const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
        return reply.code(statusCode).send({
          data: null,
          error: authContext.error,
        });
      }
      const connection = authContext.connection;
      const accessRequest = authContext.accessRequest;

      const platformAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: 'meta',
          },
        },
      });

      if (!platformAuth) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: 'Meta authorization not found',
          },
        });
      }

      const requestedAssetTypes = new Set(assetTypes || ['page', 'ad_account', 'instagram_account']);
      const { rootMetadata, metaMetadata } = readMetaClientAuthorizationMetadata(platformAuth.metadata);
      const selectedMetaAssets = getSelectedMetaAssets(rootMetadata.selectedAssets);
      const selectedPageIds = requestedAssetTypes.has('page')
        ? normalizeStringIds(selectedMetaAssets.pages)
        : [];
      const selectedAdAccountIds = requestedAssetTypes.has('ad_account')
        ? normalizeStringIds(
            selectedMetaAssets.adAccounts ??
              selectedMetaAssets.selectedAdvertiserIds ??
              selectedMetaAssets.advertisers
          )
        : [];
      const selectedInstagramIds = requestedAssetTypes.has('instagram_account')
        ? normalizeStringIds(selectedMetaAssets.instagramAccounts)
        : [];

      if (
        selectedPageIds.length === 0 &&
        selectedAdAccountIds.length === 0 &&
        selectedInstagramIds.length === 0
      ) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'NO_SELECTED_ASSETS',
            message: 'No Meta assets have been selected for grant automation',
          },
        });
      }

      const selectedBusinessId = requestedBusinessId || metaMetadata.selection?.clientBusinessId;
      const selectedBusinessName = metaMetadata.selection?.clientBusinessName;

      if (!selectedBusinessId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'META_BUSINESS_SELECTION_REQUIRED',
            message: 'Client must select a Meta Business Portfolio before grants can run',
          },
        });
      }

      const agencyConnection = await prisma.agencyPlatformConnection.findUnique({
        where: {
          agencyId_platform: {
            agencyId: accessRequest.agencyId,
            platform: 'meta',
          },
        },
      });

      if (!agencyConnection) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'AGENCY_BUSINESS_ID_MISSING',
            message:
              'Agency must set up their Meta Business Manager ID before clients can grant access',
          },
        });
      }

      const agencyMetadata = (agencyConnection.metadata as Record<string, unknown> | null) || {};
      const partnerBusinessId =
        agencyConnection.businessId ||
        (typeof agencyMetadata.selectedBusinessId === 'string'
          ? agencyMetadata.selectedBusinessId
          : null);

      if (!partnerBusinessId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'AGENCY_BUSINESS_ID_MISSING',
            message:
              'Agency must set up their Meta Business Manager ID before clients can grant access',
          },
        });
      }

      const partnerAdminSystemUserTokenSecretId =
        typeof agencyMetadata.partnerAdminSystemUserTokenSecretId === 'string'
          ? agencyMetadata.partnerAdminSystemUserTokenSecretId
          : null;

      if (!partnerAdminSystemUserTokenSecretId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'AGENCY_PARTNER_SYSTEM_USER_TOKEN_MISSING',
            message:
              'Agency must complete their Meta OBO setup before automated Meta grants can run',
          },
        });
      }

      const clientAccessTokenResult = await metaOBOService.getClientAccessTokenForOBO({
        authorizationId: platformAuth.id,
        connectionId,
        agencyId: accessRequest.agencyId,
        userEmail: connection.clientEmail,
        ipAddress: request.ip,
        purpose: 'meta_asset_grant',
      });

      if (clientAccessTokenResult.error || !clientAccessTokenResult.data) {
        return reply.code(500).send({
          data: null,
          error: clientAccessTokenResult.error || {
            code: 'TOKEN_READ_FAILED',
            message: 'Failed to read client Meta token',
          },
        });
      }

      const managedBusinessLinkResult = await metaOBOService.ensureManagedBusinessRelationship({
        authorizationId: platformAuth.id,
        connectionId,
        agencyId: accessRequest.agencyId,
        userEmail: connection.clientEmail,
        ipAddress: request.ip,
        partnerBusinessId,
        clientBusinessId: selectedBusinessId,
        clientBusinessAdminAccessToken: clientAccessTokenResult.data.accessToken,
      });

      if (managedBusinessLinkResult.error || !managedBusinessLinkResult.data) {
        return reply.code(400).send({
          data: null,
          error: managedBusinessLinkResult.error || {
            code: 'META_OBO_LINK_FAILED',
            message: 'Failed to establish the Meta OBO relationship',
          },
        });
      }

      const partnerAdminSystemUserTokens = await infisical.getOAuthTokens(
        partnerAdminSystemUserTokenSecretId
      );

      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'META_OBO_TOKEN_READ',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          authorizationId: platformAuth.id,
          platform: 'meta',
          purpose: 'partner_admin_system_user_token_read',
          secretId: partnerAdminSystemUserTokenSecretId,
          source: 'agency_connection',
        },
        request,
      });

      let clientSystemUserState = metaMetadata.obo?.clientSystemUser;
      if (
        !clientSystemUserState ||
        clientSystemUserState.status !== 'ready' ||
        clientSystemUserState.clientBusinessId !== selectedBusinessId ||
        !clientSystemUserState.systemUserId ||
        !clientSystemUserState.tokenSecretId
      ) {
        const provisionResult = await metaOBOService.provisionClientBusinessSystemUserToken({
          authorizationId: platformAuth.id,
          connectionId,
          agencyId: accessRequest.agencyId,
          userEmail: connection.clientEmail,
          ipAddress: request.ip,
          clientBusinessId: selectedBusinessId,
          scopes: ['ads_management', 'ads_read', 'business_management'],
          partnerBusinessAdminSystemUserAccessToken:
            partnerAdminSystemUserTokens.accessToken,
        });

        if (provisionResult.error || !provisionResult.data) {
          return reply.code(400).send({
            data: null,
            error: provisionResult.error || {
              code: 'META_OBO_SYSTEM_USER_FAILED',
              message: 'Failed to provision the client Meta system user',
            },
          });
        }

        clientSystemUserState = provisionResult.data;
      }

      if (!clientSystemUserState.tokenSecretId || !clientSystemUserState.systemUserId) {
        return reply.code(500).send({
          data: null,
          error: {
            code: 'META_OBO_SYSTEM_USER_INCOMPLETE',
            message: 'Client Meta system-user state is missing required token metadata',
          },
        });
      }

      const clientSystemUserTokens = await infisical.getOAuthTokens(
        clientSystemUserState.tokenSecretId
      );

      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'META_OBO_TOKEN_READ',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          authorizationId: platformAuth.id,
          platform: 'meta',
          purpose: 'client_system_user_token_read',
          secretId: clientSystemUserState.tokenSecretId,
          source: 'client_system_user',
        },
        request,
      });

      const nextPageGrantResults: MetaAssetGrantResult[] = [];
      const nextAdAccountGrantResults: MetaAssetGrantResult[] = [];
      const nextInstagramGrantResults: MetaAssetGrantResult[] = [];

      for (const pageId of selectedPageIds) {
        const grantedAt = new Date().toISOString();
        try {
          await metaPartnerService.grantPageAccess(
            clientSystemUserTokens.accessToken,
            pageId,
            clientSystemUserState.systemUserId,
            META_PAGE_TASKS
          );
          const verification = await metaPartnerService.verifyPageAccess(
            clientSystemUserTokens.accessToken,
            pageId,
            clientSystemUserState.systemUserId,
            META_PAGE_TASKS
          );

          if (verification.verified) {
            nextPageGrantResults.push({
              assetId: pageId,
              assetType: 'page',
              requestedTasks: META_PAGE_TASKS,
              status: 'verified',
              grantedAt,
              verifiedAt: new Date().toISOString(),
            });
          } else {
            nextPageGrantResults.push({
              assetId: pageId,
              assetType: 'page',
              requestedTasks: META_PAGE_TASKS,
              status: 'failed',
              grantedAt,
              errorCode: 'META_ASSET_VERIFICATION_FAILED',
              errorMessage:
                'Meta did not report the expected page tasks for the assigned system user',
            });
          }
        } catch (error) {
          nextPageGrantResults.push({
            assetId: pageId,
            assetType: 'page',
            requestedTasks: META_PAGE_TASKS,
            status: 'failed',
            grantedAt,
            errorCode: 'META_ASSET_GRANT_FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown page grant error',
          });
        }
      }

      for (const adAccountId of selectedAdAccountIds) {
        const grantedAt = new Date().toISOString();
        try {
          await metaPartnerService.grantAdAccountAccess(
            clientSystemUserTokens.accessToken,
            adAccountId,
            clientSystemUserState.systemUserId,
            META_AD_ACCOUNT_TASKS
          );
          const verification = await metaPartnerService.verifyAdAccountAccess(
            clientSystemUserTokens.accessToken,
            adAccountId,
            clientSystemUserState.systemUserId,
            META_AD_ACCOUNT_TASKS
          );

          if (verification.verified) {
            nextAdAccountGrantResults.push({
              assetId: adAccountId,
              assetType: 'ad_account',
              requestedTasks: META_AD_ACCOUNT_TASKS,
              status: 'verified',
              grantedAt,
              verifiedAt: new Date().toISOString(),
            });
          } else {
            nextAdAccountGrantResults.push({
              assetId: adAccountId,
              assetType: 'ad_account',
              requestedTasks: META_AD_ACCOUNT_TASKS,
              status: 'failed',
              grantedAt,
              errorCode: 'META_ASSET_VERIFICATION_FAILED',
              errorMessage:
                'Meta did not report the expected ad account tasks for the assigned system user',
            });
          }
        } catch (error) {
          nextAdAccountGrantResults.push({
            assetId: adAccountId,
            assetType: 'ad_account',
            requestedTasks: META_AD_ACCOUNT_TASKS,
            status: 'failed',
            grantedAt,
            errorCode: 'META_ASSET_GRANT_FAILED',
            errorMessage:
              error instanceof Error ? error.message : 'Unknown ad account grant error',
          });
        }
      }

      for (const instagramId of selectedInstagramIds) {
        nextInstagramGrantResults.push({
          assetId: instagramId,
          assetType: 'instagram_account',
          requestedTasks: [],
          status: 'unresolved',
          errorCode: 'UNSUPPORTED_META_ASSET_TYPE',
          errorMessage: META_UNSUPPORTED_INSTAGRAM_MESSAGE,
        });
      }

      const requestedGrantResultsByType: Array<[MetaAssetKind, MetaAssetGrantResult[]]> = [
        ['page', nextPageGrantResults],
        ['ad_account', nextAdAccountGrantResults],
        ['instagram_account', nextInstagramGrantResults],
      ];
      const mergedAssetGrantResults = sortMetaAssetGrantResults(
        requestedGrantResultsByType.reduce(
          (acc, [assetType, nextResults]) =>
          requestedAssetTypes.has(assetType)
            ? mergeMetaAssetGrantResults(acc, nextResults, assetType)
            : acc,
          metaMetadata.obo?.assetGrantResults || []
        )
      );
      const verificationStatus = buildMetaGrantVerificationStatus(mergedAssetGrantResults);
      const verificationCompletedAt = new Date().toISOString();

      await prisma.platformAuthorization.update({
        where: { id: platformAuth.id },
        data: {
          metadata: {
            ...rootMetadata,
            meta: {
              ...metaMetadata,
              obo: {
                ...(metaMetadata.obo || {}),
                managedBusinessLink: managedBusinessLinkResult.data,
                clientSystemUser: clientSystemUserState,
                assetGrantResults: mergedAssetGrantResults,
                lastVerifiedAt: verificationCompletedAt,
              },
            },
          },
        },
      });

      const currentGrantedAssets = (connection.grantedAssets as Record<string, unknown> | null) || {};
      const currentMetaGrantedAssets =
        (currentGrantedAssets.meta as Record<string, unknown> | undefined) || {};
      const pageResults = mergedAssetGrantResults.filter((result) => result.assetType === 'page');
      const adAccountResults = mergedAssetGrantResults.filter(
        (result) => result.assetType === 'ad_account'
      );
      const pagesAccessGranted =
        pageResults.length > 0 && pageResults.every((result) => result.status === 'verified');
      const adAccountsAccessGranted =
        adAccountResults.length > 0 && adAccountResults.every((result) => result.status === 'verified');
      const pagesAccessGrantedAt =
        pagesAccessGranted
          ? requestedAssetTypes.has('page')
            ? verificationCompletedAt
            : typeof currentMetaGrantedAssets.pagesAccessGrantedAt === 'string'
              ? currentMetaGrantedAssets.pagesAccessGrantedAt
              : verificationCompletedAt
          : undefined;
      const adAccountsAccessGrantedAt =
        adAccountsAccessGranted
          ? requestedAssetTypes.has('ad_account')
            ? verificationCompletedAt
            : typeof currentMetaGrantedAssets.adAccountsAccessGrantedAt === 'string'
              ? currentMetaGrantedAssets.adAccountsAccessGrantedAt
              : verificationCompletedAt
          : undefined;

      await prisma.clientConnection.update({
        where: { id: connectionId },
        data: {
          grantedAssets: {
            ...currentGrantedAssets,
            meta: {
              ...currentMetaGrantedAssets,
              verifiedMetaAssetGrantStatus: verificationStatus,
              verifiedMetaAssetGrantResults: mergedAssetGrantResults,
              verifiedMetaAssetGrantAt: verificationCompletedAt,
              pagesAccessGranted,
              pagesAccessGrantedAt,
              adAccountsAccessGranted,
              adAccountsAccessGrantedAt,
            },
          },
        },
      });

      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'META_ASSET_ACCESS_VERIFIED',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          selectedBusinessId,
          requestedAssetTypes: Array.from(requestedAssetTypes),
          verificationStatus,
          assetGrantResults: mergedAssetGrantResults,
        },
        request,
      });

      return reply.send({
        data: {
          success: verificationStatus === 'verified',
          partial: verificationStatus === 'partial',
          selectedBusinessId,
          selectedBusinessName,
          managedBusinessLinkStatus: managedBusinessLinkResult.data.status,
          clientSystemUserStatus: clientSystemUserState.status,
          assetGrantResults: mergedAssetGrantResults,
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'META_GRANT_ACCESS_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to grant Meta asset access through OBO',
        },
      });
    }
  });

  // Legacy Meta page grant endpoint kept only to direct stale clients to the verified OBO route.
  fastify.post('/client/:token/grant-pages-access', async (request, reply) => {
    const validated = grantPagesAccessSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validated.error.errors,
        },
      });
    }

    return reply.code(410).send({
      data: null,
      error: {
        code: 'LEGACY_META_ROUTE_DISABLED',
        message:
          'Legacy Meta page grants are disabled. Use /grant-meta-access with page-only verification instead.',
      },
    });

    /*
    const { connectionId, pageIds } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (authContext.error || !authContext.connection || !authContext.accessRequest) {
        const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
        return reply.code(statusCode).send({
          data: null,
          error: authContext.error,
        });
      }
      const connection = authContext.connection;
      const accessRequest = authContext.accessRequest;

      const platformAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: 'meta',
          },
        },
      });

      if (!platformAuth) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: 'Meta authorization not found',
          },
        });
      }

      const tokens = await infisical.getOAuthTokens(platformAuth.secretId);
      if (!tokens || !tokens.accessToken) {
        return reply.code(500).send({
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        });
      }

      if (tokens.expiresAt && new Date(tokens.expiresAt) < new Date()) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Your authorization has expired. Please reconnect.',
          },
        });
      }

      const agencyConnection = await prisma.agencyPlatformConnection.findUnique({
        where: {
          agencyId_platform: {
            agencyId: accessRequest.agencyId,
            platform: 'meta',
          },
        },
      });

      if (!agencyConnection) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'AGENCY_BUSINESS_ID_MISSING',
            message: 'Agency must set up their Meta Business Manager ID before clients can grant access',
          },
        });
      }

      const metadata = (agencyConnection.metadata as any) || {};
      const agencySystemUserId = metadata.systemUserId;

      if (!agencySystemUserId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'AGENCY_SYSTEM_USER_MISSING',
            message: 'Agency must complete their Meta setup by reconnecting their account before clients can grant access',
          },
        });
      }

      // @ts-ignore - Dynamic import, module exists at runtime
      const { metaPartnerService } = await import('../../services/meta-partner.service.js');

      const grantedPages: Array<{ id: string; status: 'granted' | 'failed'; error?: string }> = [];
      const errors: string[] = [];

      fastify.log.info({
        msg: 'Starting pages access grant',
        connectionId,
        pageCount: pageIds.length,
        agencySystemUserId,
        pageIds,
      });

      for (const pageId of pageIds) {
        try {
          await metaPartnerService.grantPageAccess(
            tokens.accessToken,
            pageId,
            agencySystemUserId
          );
          grantedPages.push({ id: pageId, status: 'granted' });
          fastify.log.info({
            msg: 'Page access granted successfully',
            pageId,
            connectionId,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          grantedPages.push({ id: pageId, status: 'failed', error: errorMessage });
          errors.push(`Page ${pageId}: ${errorMessage}`);

          fastify.log.error({
            msg: 'Failed to grant page access',
            pageId,
            connectionId,
            agencySystemUserId,
            error: errorMessage,
            errorStack: error instanceof Error ? error.stack : undefined,
          });
        }
      }

      const success = grantedPages.some((p) => p.status === 'granted');

      fastify.log.info({
        msg: 'Pages access grant completed',
        connectionId,
        success,
        grantedCount: grantedPages.filter((p) => p.status === 'granted').length,
        failedCount: grantedPages.filter((p) => p.status === 'failed').length,
        errors: errors.length > 0 ? errors : undefined,
      });

      const currentGrantedAssets = (connection.grantedAssets as any) || {};
      const updatedGrantedAssets = {
        ...currentGrantedAssets,
        meta: {
          ...(currentGrantedAssets.meta || {}),
          pagesAccessGranted: success,
          pagesAccessGrantedAt: success ? new Date().toISOString() : undefined,
          pagesGrantResults: {
            success,
            grantedPages,
            errors: errors.length > 0 ? errors : undefined,
          },
        },
      };

      await prisma.clientConnection.update({
        where: { id: connectionId },
        data: { grantedAssets: updatedGrantedAssets },
      });

      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'PAGES_ACCESS_GRANTED',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          grantedPages,
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      return reply.send({
        data: {
          success,
          grantedPages,
          errors: errors.length > 0 ? errors : undefined,
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'GRANT_ACCESS_ERROR',
          message: `Failed to grant pages access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
    */
  });

  fastify.post('/client/:token/meta/manual-ad-account-share/start', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = manualMetaAdAccountShareSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validated.error.errors,
        },
      });
    }

    const { connectionId } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (!authContext.error && authContext.connection && authContext.accessRequest) {
        const connection = authContext.connection;
        const accessRequest = authContext.accessRequest;

        const platformAuth = await prisma.platformAuthorization.findUnique({
          where: {
            connectionId_platform: {
              connectionId,
              platform: 'meta',
            },
          },
        });

        if (!platformAuth) {
          return reply.code(404).send({
            data: null,
            error: {
              code: 'AUTHORIZATION_NOT_FOUND',
              message: 'Meta authorization not found',
            },
          });
        }

        const { rootMetadata } = readMetaClientAuthorizationMetadata(platformAuth.metadata);
        const selectedMetaAssets = getSelectedMetaAssets(rootMetadata.selectedAssets);
        const selectedAdAccounts = extractSelectedMetaAdAccounts(selectedMetaAssets);

        if (selectedAdAccounts.length === 0) {
          return reply.code(400).send({
            data: null,
            error: {
              code: 'NO_SELECTED_AD_ACCOUNTS',
              message: 'No Meta ad accounts have been selected for manual sharing',
            },
          });
        }

        const agencyConnection = await prisma.agencyPlatformConnection.findUnique({
          where: {
            agencyId_platform: {
              agencyId: accessRequest.agencyId,
              platform: 'meta',
            },
          },
        });

        const { businessId: partnerBusinessId, businessName: partnerBusinessName } =
          resolveAgencyMetaBusinessDetails(agencyConnection);

        if (!partnerBusinessId) {
          return reply.code(400).send({
            data: null,
            error: {
              code: 'AGENCY_BUSINESS_ID_MISSING',
              message:
                'Agency must set up their Meta Business Manager ID before clients can share ad accounts',
            },
          });
        }

        const startedAt = new Date().toISOString();
        const verificationResults: ManualMetaAdAccountVerificationResult[] = selectedAdAccounts.map(
          (account) => ({
            assetId: account.id,
            assetName: account.name,
            status: 'waiting_for_manual_share',
          })
        );
        const currentGrantedAssets = (connection.grantedAssets as Record<string, unknown> | null) || {};

        await prisma.clientConnection.update({
          where: { id: connectionId },
          data: {
            grantedAssets: {
              ...currentGrantedAssets,
              meta: {
                ...((currentGrantedAssets.meta as Record<string, unknown> | undefined) || {}),
                manualAdAccountShare: {
                  status: 'waiting_for_manual_share',
                  partnerBusinessId,
                  partnerBusinessName: partnerBusinessName || undefined,
                  selectedAdAccountIds: selectedAdAccounts.map((account) => account.id),
                  selectedAdAccounts,
                  startedAt,
                  verificationResults,
                },
              },
            },
          },
        });

        await auditService.createAuditLog({
          agencyId: accessRequest.agencyId,
          action: 'META_MANUAL_AD_ACCOUNT_SHARE_STARTED',
          userEmail: connection.clientEmail,
          resourceType: 'client_connection',
          resourceId: connectionId,
          metadata: {
            partnerBusinessId,
            partnerBusinessName: partnerBusinessName || undefined,
            selectedAdAccounts,
          },
          request,
        });

        return reply.send({
          data: {
            success: true,
            status: 'waiting_for_manual_share',
            partnerBusinessId,
            partnerBusinessName: partnerBusinessName || undefined,
            selectedAdAccounts,
            startedAt,
          },
          error: null,
        });
      }

      const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
      return reply.code(statusCode).send({
        data: null,
        error: authContext.error,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'META_MANUAL_SHARE_START_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to start manual Meta ad-account sharing',
        },
      });
    }
  });

  fastify.post('/client/:token/meta/manual-ad-account-share/verify', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = manualMetaAdAccountShareSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validated.error.errors,
        },
      });
    }

    const { connectionId } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (authContext.error || !authContext.connection || !authContext.accessRequest) {
        const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
        return reply.code(statusCode).send({
          data: null,
          error: authContext.error,
        });
      }
      const connection = authContext.connection;
      const accessRequest = authContext.accessRequest;

      const platformAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: 'meta',
          },
        },
      });

      if (!platformAuth) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: 'Meta authorization not found',
          },
        });
      }

      const agencyConnection = await prisma.agencyPlatformConnection.findUnique({
        where: {
          agencyId_platform: {
            agencyId: accessRequest.agencyId,
            platform: 'meta',
          },
        },
      });

      const { businessId: partnerBusinessId, businessName: resolvedPartnerBusinessName } =
        resolveAgencyMetaBusinessDetails(agencyConnection);

      if (!partnerBusinessId || !agencyConnection?.secretId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'AGENCY_BUSINESS_ID_MISSING',
            message:
              'Agency must set up their Meta Business Manager ID before manual ad-account sharing can be verified',
          },
        });
      }

      const { rootMetadata, metaMetadata } = readMetaClientAuthorizationMetadata(platformAuth.metadata);
      const selectedMetaAssets = getSelectedMetaAssets(rootMetadata.selectedAssets);
      const selectedAdAccounts = extractSelectedMetaAdAccounts(selectedMetaAssets);

      if (selectedAdAccounts.length === 0) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'NO_SELECTED_AD_ACCOUNTS',
            message: 'No Meta ad accounts have been selected for manual sharing',
          },
        });
      }

      const currentGrantedAssets = (connection.grantedAssets as Record<string, unknown> | null) || {};
      const currentMetaGrantedAssets =
        (currentGrantedAssets.meta as Record<string, unknown> | undefined) || {};
      const existingManualShare =
        (currentMetaGrantedAssets.manualAdAccountShare as Record<string, unknown> | undefined) || {};
      const partnerBusinessName =
        (typeof existingManualShare.partnerBusinessName === 'string'
          ? existingManualShare.partnerBusinessName
          : null) || resolvedPartnerBusinessName;

      const agencyTokens = await infisical.getOAuthTokens(agencyConnection.secretId);

      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'META_TOKEN_READ',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          platform: 'meta',
          source: 'manual_ad_account_share_verification',
          secretId: agencyConnection.secretId,
          partnerBusinessId,
        },
        request,
      });

      const metaConnector = new MetaConnector();
      const agencyAssets = await metaConnector.getAllAssets(
        agencyTokens.accessToken,
        partnerBusinessId
      );
      const visibleAdAccountIds = new Set(
        (agencyAssets.adAccounts || []).map((account) => String(account.id))
      );
      const verifiedAt = new Date().toISOString();
      const verificationResults: ManualMetaAdAccountVerificationResult[] = selectedAdAccounts.map(
        (account) =>
          visibleAdAccountIds.has(account.id)
            ? {
                assetId: account.id,
                assetName: account.name,
                status: 'verified',
                verifiedAt,
              }
            : {
                assetId: account.id,
                assetName: account.name,
                status: 'unresolved',
                errorCode: 'MANUAL_SHARE_PENDING',
                errorMessage: META_MANUAL_AD_ACCOUNT_PENDING_MESSAGE,
              }
      );

      const adAccountGrantResults = toMetaAdAccountGrantResults(verificationResults);
      const mergedGrantResults = sortMetaAssetGrantResults(
        mergeMetaAssetGrantResults(metaMetadata.obo?.assetGrantResults, adAccountGrantResults, 'ad_account')
      );
      const verificationStatus = buildMetaGrantVerificationStatus(mergedGrantResults);
      const verificationCompletedAt = new Date().toISOString();
      const pageResults = mergedGrantResults.filter((result) => result.assetType === 'page');
      const mergedAdAccountResults = mergedGrantResults.filter(
        (result) => result.assetType === 'ad_account'
      );
      const pagesAccessGranted =
        pageResults.length > 0 && pageResults.every((result) => result.status === 'verified');
      const adAccountsAccessGranted =
        mergedAdAccountResults.length > 0 &&
        mergedAdAccountResults.every((result) => result.status === 'verified');

      await prisma.platformAuthorization.update({
        where: { id: platformAuth.id },
        data: {
          metadata: {
            ...rootMetadata,
            meta: {
              ...metaMetadata,
              obo: {
                ...(metaMetadata.obo || {}),
                assetGrantResults: mergedGrantResults,
                lastVerifiedAt: verificationCompletedAt,
              },
            },
          } as any,
        },
      });

      await prisma.clientConnection.update({
        where: { id: connectionId },
        data: {
          grantedAssets: {
            ...currentGrantedAssets,
            meta: {
              ...currentMetaGrantedAssets,
              verifiedMetaAssetGrantStatus: verificationStatus,
              verifiedMetaAssetGrantResults: mergedGrantResults,
              verifiedMetaAssetGrantAt: verificationCompletedAt,
              pagesAccessGranted,
              pagesAccessGrantedAt: pagesAccessGranted ? verificationCompletedAt : undefined,
              adAccountsAccessGranted,
              adAccountsAccessGrantedAt: adAccountsAccessGranted
                ? verificationCompletedAt
                : undefined,
              manualAdAccountShare: {
                ...existingManualShare,
                status: verificationStatus,
                partnerBusinessId,
                partnerBusinessName: partnerBusinessName || undefined,
                selectedAdAccountIds: selectedAdAccounts.map((account) => account.id),
                selectedAdAccounts,
                verificationResults,
                lastVerifiedAt: verificationCompletedAt,
              },
            },
          },
        },
      });

      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'META_MANUAL_AD_ACCOUNT_SHARE_VERIFIED',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          partnerBusinessId,
          partnerBusinessName: partnerBusinessName || undefined,
          verificationStatus,
          verificationResults,
        },
        request,
      });

      return reply.send({
        data: {
          success: verificationStatus === 'verified',
          partial: verificationStatus === 'partial',
          status: verificationStatus,
          partnerBusinessId,
          partnerBusinessName: partnerBusinessName || undefined,
          verificationResults,
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'META_MANUAL_SHARE_VERIFY_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to verify manual Meta ad-account sharing',
        },
      });
    }
  });

  // Get agency Business Manager ID for manual ad account sharing
  fastify.get('/client/:token/agency-business-id', async (request, reply) => {
    const { token } = request.params as { token: string };

    try {
      const accessRequest = await accessRequestService.getAccessRequestByToken(token);
      if (accessRequest.error || !accessRequest.data) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'ACCESS_REQUEST_NOT_FOUND',
            message: 'Access request not found',
          },
        });
      }

      const agencyConnection = await prisma.agencyPlatformConnection.findUnique({
        where: {
          agencyId_platform: {
            agencyId: accessRequest.data.agencyId,
            platform: 'meta',
          },
        },
      });

      if (!agencyConnection) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AGENCY_BUSINESS_ID_MISSING',
            message: 'Agency must set up their Meta Business Manager ID before clients can grant access',
          },
        });
      }

      const metadata = (agencyConnection.metadata as any) || {};
      const businessId = agencyConnection.businessId || metadata.selectedBusinessId;
      const businessName = metadata.selectedBusinessName || metadata.businessName;

      if (!businessId) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AGENCY_BUSINESS_ID_MISSING',
            message: 'Agency must set up their Meta Business Manager ID before clients can grant access',
          },
        });
      }

      return reply.send({
        data: {
          businessId: businessId,
          businessName: businessName || undefined,
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: `Failed to fetch agency Business Manager ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  });

  // Legacy Meta ad-account self-attestation endpoint kept only to direct stale clients to manual verification.
  fastify.post('/client/:token/ad-accounts-shared', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = adAccountsSharedSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validated.error.errors,
        },
      });
    }

    return reply.code(410).send({
      data: null,
      error: {
        code: 'LEGACY_META_ROUTE_DISABLED',
        message:
          'Legacy Meta ad-account completion is disabled. Use the manual share verification flow instead.',
      },
    });

    /*
    const { connectionId, sharedAdAccountIds } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (authContext.error || !authContext.connection || !authContext.accessRequest) {
        const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
        return reply.code(statusCode).send({
          data: null,
          error: authContext.error,
        });
      }
      const connection = authContext.connection;
      const accessRequest = authContext.accessRequest;

      const currentGrantedAssets = (connection.grantedAssets as any) || {};
      const updatedGrantedAssets = {
        ...currentGrantedAssets,
        meta: {
          ...(currentGrantedAssets.meta || {}),
          adAccountsSharedManually: true,
          adAccountsSharedAt: new Date().toISOString(),
          sharedAdAccountIds: sharedAdAccountIds || [],
        },
      };

      await prisma.clientConnection.update({
        where: { id: connectionId },
        data: { grantedAssets: updatedGrantedAssets },
      });

      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'AD_ACCOUNTS_SHARED_MANUALLY',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          sharedAdAccountIds: sharedAdAccountIds || [],
        },
      });

      return reply.send({
        data: {
          success: true,
          sharedAt: updatedGrantedAssets.meta.adAccountsSharedAt,
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: `Failed to update ad account sharing status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
    */
  });

  // Run TikTok Business Center partner sharing automation for selected advertisers
  fastify.post('/client/:token/tiktok/share-partner-access', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = tiktokPartnerShareSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid TikTok partner-share payload',
          details: validated.error.errors,
        },
      });
    }

    const { connectionId, advertiserIds, selectedBusinessCenterId } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (authContext.error || !authContext.connection || !authContext.accessRequest) {
        const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
        return reply.code(statusCode).send({
          data: null,
          error: authContext.error,
        });
      }
      const connection = authContext.connection;

      const platformAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: 'tiktok',
          },
        },
      });

      if (!platformAuth) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: 'TikTok authorization not found',
          },
        });
      }

      if (platformAuth.status !== 'active') {
        return reply.code(403).send({
          data: null,
          error: {
            code: 'AUTHORIZATION_INACTIVE',
            message: 'TikTok authorization is not active',
          },
        });
      }

      const tokens = await infisical.getOAuthTokens(platformAuth.secretId);
      if (!tokens?.accessToken) {
        return reply.code(500).send({
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        });
      }

      const authMetadata = (platformAuth.metadata as Record<string, any> | null) || {};
      const tiktokMetadata = (authMetadata.tiktok as Record<string, any> | undefined) || {};

      const effectiveAdvertiserIds = Array.from(
        new Set(
          normalizeStringIds(
            advertiserIds && advertiserIds.length > 0
              ? advertiserIds
              : tiktokMetadata.selectedAdvertiserIds
          )
        )
      );
      const clientBusinessCenterId = selectedBusinessCenterId || tiktokMetadata.selectedBusinessCenterId;

      if (!clientBusinessCenterId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'selectedBusinessCenterId is required for TikTok partner sharing',
          },
        });
      }

      if (effectiveAdvertiserIds.length === 0) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one advertiser must be selected before partner sharing',
          },
        });
      }

      const agencyConnection = await prisma.agencyPlatformConnection.findFirst({
        where: {
          agencyId: connection.agencyId,
          platform: 'tiktok',
          status: 'active',
        },
      });

      const agencyBusinessCenterId = resolveAgencyTikTokBusinessCenterId(agencyConnection);
      if (!agencyBusinessCenterId) {
        const failedResults: ShareResultWithVerification[] = effectiveAdvertiserIds.map((id) => ({
          advertiserId: id,
          status: 'failed',
          error: 'Agency TikTok Business Center ID is not configured',
          verified: false,
        }));

        const mergedResults = mergeTikTokShareResults(
          tiktokMetadata.partnerSharing?.results,
          failedResults
        );

        const updatedMetadata = {
          ...authMetadata,
          tiktok: {
            ...tiktokMetadata,
            selectedAdvertiserIds: effectiveAdvertiserIds,
            selectedBusinessCenterId: clientBusinessCenterId,
            partnerSharing: {
              ...(tiktokMetadata.partnerSharing || {}),
              agencyBusinessCenterId: null,
              clientBusinessCenterId,
              lastAttemptAt: new Date().toISOString(),
              results: mergedResults,
              partialFailure: true,
            },
          },
        };

        await prisma.platformAuthorization.update({
          where: { id: platformAuth.id },
          data: {
            metadata: updatedMetadata as any,
          },
        });

        await auditService.createAuditLog({
          agencyId: connection.agencyId,
          action: 'TIKTOK_PARTNER_SHARE_ATTEMPT',
          userEmail: connection.clientEmail,
          resourceType: 'client_connection',
          resourceId: connection.id,
          metadata: {
            advertiserCount: effectiveAdvertiserIds.length,
            successCount: 0,
            failedCount: failedResults.length,
            agencyBusinessCenterId: null,
            clientBusinessCenterId,
            requestedAccessLevel: resolveRequestedTikTokAccessLevel(authContext.accessRequest),
            advertiserRole: null,
            reason: 'AGENCY_BUSINESS_CENTER_MISSING',
          },
          request,
        });

        return reply.send({
          data: {
            success: false,
            partialFailure: true,
            results: failedResults,
            manualFallback: {
              required: true,
              reason: 'AGENCY_BUSINESS_CENTER_MISSING',
              agencyBusinessCenterId: null,
            },
          },
          error: null,
        });
      }

      const requestedAccessLevel = resolveRequestedTikTokAccessLevel(authContext.accessRequest);
      const advertiserRole = mapAccessLevelToTikTokRole(requestedAccessLevel);

      const previouslyGrantedAdvertiserIds = Array.isArray(tiktokMetadata.partnerSharing?.results)
        ? tiktokMetadata.partnerSharing.results
            .filter((item: any) => item?.status === 'granted' || item?.status === 'already_granted')
            .map((item: any) => String(item.advertiserId))
        : [];

      const shareOutcome = await tiktokPartnerService.shareAdvertiserAssets({
        accessToken: tokens.accessToken,
        clientBusinessCenterId,
        agencyBusinessCenterId,
        advertiserIds: effectiveAdvertiserIds,
        advertiserRole,
        alreadyGrantedAdvertiserIds: previouslyGrantedAdvertiserIds,
      });

      const verifiedResults: ShareResultWithVerification[] = await Promise.all(
        shareOutcome.results.map(async (result) => {
          if (result.status === 'failed') {
            return { ...result, verified: false };
          }

          const verified = await tiktokPartnerService.verifyAdvertiserShare({
            accessToken: tokens.accessToken!,
            clientBusinessCenterId,
            agencyBusinessCenterId,
            advertiserId: result.advertiserId,
          });

          if (!verified) {
            return {
              advertiserId: result.advertiserId,
              status: 'failed',
              error: result.error || 'Unable to verify advertiser share',
              verified: false,
            };
          }

          return {
            ...result,
            verified: true,
          };
        })
      );

      const success = verifiedResults.every((item) => item.status !== 'failed');
      const mergedResults = mergeTikTokShareResults(
        tiktokMetadata.partnerSharing?.results,
        verifiedResults
      );

      const updatedMetadata = {
        ...authMetadata,
        tiktok: {
          ...tiktokMetadata,
          selectedAdvertiserIds: effectiveAdvertiserIds,
          selectedBusinessCenterId: clientBusinessCenterId,
          partnerSharing: {
            ...(tiktokMetadata.partnerSharing || {}),
            agencyBusinessCenterId,
            clientBusinessCenterId,
            advertiserRole,
            lastAttemptAt: new Date().toISOString(),
            results: mergedResults,
            partialFailure: !success,
          },
        },
      };

      await prisma.platformAuthorization.update({
        where: { id: platformAuth.id },
        data: {
          metadata: updatedMetadata as any,
        },
      });

      await auditService.createAuditLog({
        agencyId: connection.agencyId,
        action: 'TIKTOK_PARTNER_SHARE_ATTEMPT',
        userEmail: connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: connection.id,
        metadata: {
          advertiserCount: effectiveAdvertiserIds.length,
          successCount: verifiedResults.filter((item) => item.status !== 'failed').length,
          failedCount: verifiedResults.filter((item) => item.status === 'failed').length,
          agencyBusinessCenterId,
          clientBusinessCenterId,
          requestedAccessLevel,
          advertiserRole,
        },
        request,
      });

      return reply.send({
        data: {
          success,
          partialFailure: !success,
          results: verifiedResults,
          manualFallback: {
            required: !success,
            reason: success ? null : 'PARTIAL_FAILURE',
            agencyBusinessCenterId,
          },
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'TIKTOK_PARTNER_SHARE_ERROR',
          message: `Failed to share TikTok partner access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  });

  // Verify TikTok Business Center sharing for selected advertisers
  fastify.post('/client/:token/tiktok/verify-share', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = tiktokPartnerVerifySchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid TikTok verify payload',
          details: validated.error.errors,
        },
      });
    }

    const { connectionId, advertiserIds } = validated.data;

    try {
      const authContext = await resolveAuthorizedConnection(token, connectionId);
      if (authContext.error || !authContext.connection) {
        const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
        return reply.code(statusCode).send({
          data: null,
          error: authContext.error,
        });
      }

      const platformAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: 'tiktok',
          },
        },
      });

      if (!platformAuth) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: 'TikTok authorization not found',
          },
        });
      }

      const tokens = await infisical.getOAuthTokens(platformAuth.secretId);
      if (!tokens?.accessToken) {
        return reply.code(500).send({
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        });
      }

      const authMetadata = (platformAuth.metadata as Record<string, any> | null) || {};
      const tiktokMetadata = (authMetadata.tiktok as Record<string, any> | undefined) || {};
      const shareMetadata = (tiktokMetadata.partnerSharing as Record<string, any> | undefined) || {};

      const clientBusinessCenterId =
        tiktokMetadata.selectedBusinessCenterId || shareMetadata.clientBusinessCenterId;
      const agencyBusinessCenterId =
        shareMetadata.agencyBusinessCenterId ||
        resolveAgencyTikTokBusinessCenterId(
          await prisma.agencyPlatformConnection.findFirst({
            where: {
              agencyId: authContext.connection.agencyId,
              platform: 'tiktok',
              status: 'active',
            },
          })
        );

      if (!clientBusinessCenterId || !agencyBusinessCenterId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'TikTok business center IDs are required before verification',
          },
        });
      }

      const effectiveAdvertiserIds = Array.from(
        new Set(
          normalizeStringIds(
            advertiserIds && advertiserIds.length > 0
              ? advertiserIds
              : tiktokMetadata.selectedAdvertiserIds
          )
        )
      );

      if (effectiveAdvertiserIds.length === 0) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one advertiser must be selected before verification',
          },
        });
      }

      const results: ShareResultWithVerification[] = await Promise.all(
        effectiveAdvertiserIds.map(async (advertiserId) => {
          const verified = await tiktokPartnerService.verifyAdvertiserShare({
            accessToken: tokens.accessToken!,
            clientBusinessCenterId,
            agencyBusinessCenterId,
            advertiserId,
          });

          return {
            advertiserId,
            status: verified ? 'granted' : 'failed',
            verified,
            error: verified ? undefined : 'Advertiser is not shared with agency business center',
          };
        })
      );

      const success = results.every((item) => item.status !== 'failed');
      const mergedResults = mergeTikTokShareResults(shareMetadata.results, results);

      const updatedMetadata = {
        ...authMetadata,
        tiktok: {
          ...tiktokMetadata,
          partnerSharing: {
            ...shareMetadata,
            agencyBusinessCenterId,
            clientBusinessCenterId,
            lastVerifiedAt: new Date().toISOString(),
            results: mergedResults,
            partialFailure: !success,
          },
        },
      };

      await prisma.platformAuthorization.update({
        where: { id: platformAuth.id },
        data: {
          metadata: updatedMetadata as any,
        },
      });

      await auditService.createAuditLog({
        agencyId: authContext.connection.agencyId,
        action: 'TIKTOK_PARTNER_SHARE_VERIFIED',
        userEmail: authContext.connection.clientEmail,
        resourceType: 'client_connection',
        resourceId: authContext.connection.id,
        metadata: {
          advertiserCount: effectiveAdvertiserIds.length,
          successCount: results.filter((item) => item.status !== 'failed').length,
          failedCount: results.filter((item) => item.status === 'failed').length,
          agencyBusinessCenterId,
          clientBusinessCenterId,
        },
        request,
      });

      return reply.send({
        data: {
          success,
          partialFailure: !success,
          results,
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'TIKTOK_VERIFY_ERROR',
          message: `Failed to verify TikTok partner sharing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  });

  // Fetch client assets using token-scoped connection authorization
  fastify.get('/client/:token/assets/:platform', async (request, reply) => {
    const { token, platform: platformParam } = request.params as {
      token: string;
      platform: string;
    };
    const { connectionId, businessId } = request.query as {
      connectionId?: string;
      businessId?: string;
    };

    if (!connectionId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'connectionId query parameter is required',
        },
      });
    }

    const authContext = await resolveAuthorizedConnection(token, connectionId);
    if (authContext.error) {
      const statusCode = authContext.error.code === 'FORBIDDEN' ? 403 : 404;
      return reply.code(statusCode).send({ data: null, error: authContext.error });
    }

    const platformMap: Record<string, Platform> = {
      google_ads: 'google',
      ga4: 'google',
      google_business_profile: 'google',
      google_tag_manager: 'google',
      google_search_console: 'google',
      google_merchant_center: 'google',
      meta_ads: 'meta',
      meta_pages: 'meta',
      linkedin_ads: 'linkedin',
      linkedin_pages: 'linkedin',
      instagram: 'meta',
      mailchimp: 'mailchimp',
      pinterest: 'pinterest',
      klaviyo: 'klaviyo',
      shopify: 'shopify',
      tiktok: 'tiktok',
      tiktok_ads: 'tiktok',
    };

    const platform = platformParam as Platform;
    const authPlatform = platformMap[platformParam] || platform;

    const platformAuth = await prisma.platformAuthorization.findUnique({
      where: {
        connectionId_platform: {
          connectionId,
          platform: authPlatform,
        },
      },
    });

    if (!platformAuth) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'AUTHORIZATION_NOT_FOUND',
          message: 'Platform authorization not found for this connection',
        },
      });
    }

    if (platformAuth.status !== 'active') {
      return reply.code(403).send({
        data: null,
        error: {
          code: 'AUTHORIZATION_INACTIVE',
          message: 'Platform authorization is not active',
        },
      });
    }

    try {
      const tokens = await infisical.getOAuthTokens(platformAuth.secretId);

      if (!tokens) {
        return reply.code(500).send({
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        });
      }

      if (authPlatform === 'tiktok' && authContext.accessRequest) {
        await auditService.createAuditLog({
          agencyId: authContext.accessRequest.agencyId,
          action: 'TIKTOK_TOKEN_READ',
          userEmail: authContext.connection?.clientEmail,
          resourceType: 'client_connection',
          resourceId: connectionId,
          metadata: {
            platform: platformParam,
            source: 'client_assets_fetch',
          },
          request,
        });
      }

      if (authPlatform === 'google' && authContext.accessRequest) {
        await auditService.createAuditLog({
          agencyId: authContext.accessRequest.agencyId,
          action: 'GOOGLE_TOKEN_READ',
          userEmail: authContext.connection?.clientEmail,
          resourceType: 'client_connection',
          resourceId: connectionId,
          metadata: {
            platform: platformParam,
            source: 'client_assets_fetch',
          },
          request,
        });
      }

      if (authPlatform === 'linkedin' && authContext.accessRequest) {
        await auditService.createAuditLog({
          agencyId: authContext.accessRequest.agencyId,
          action: 'LINKEDIN_TOKEN_READ',
          userEmail: authContext.connection?.clientEmail,
          resourceType: 'client_connection',
          resourceId: connectionId,
          metadata: {
            platform: platformParam,
            source: 'client_assets_fetch',
          },
          request,
        });
      }

      if (authPlatform === 'meta' && authContext.accessRequest) {
        await auditService.createAuditLog({
          agencyId: authContext.accessRequest.agencyId,
          action: 'META_TOKEN_READ',
          userEmail: authContext.connection?.clientEmail,
          resourceType: 'client_connection',
          resourceId: connectionId,
          metadata: {
            platform: platformParam,
            source: 'client_assets_fetch',
            businessId: businessId || null,
          },
          request,
        });
      }

      let assets;
      const platformStr = String(platform);

      if (platform === 'meta_ads' || platform === 'meta_pages') {
        const { rootMetadata, metaMetadata } = readMetaClientAuthorizationMetadata(
          platformAuth.metadata
        );
        const effectiveBusinessId =
          businessId || metaMetadata.selection?.clientBusinessId;

        assets = await clientAssetsService.fetchMetaAssets(
          tokens.accessToken,
          effectiveBusinessId
        );

        const discoveryTimestamp = new Date().toISOString();
        const nextMeta: MetaClientAuthorizationMetadata = {
          ...metaMetadata,
          discovery: {
            availableBusinesses: assets.businesses || [],
            discoveredAt: discoveryTimestamp,
          },
        };

        if (assets.selectedBusinessId) {
          nextMeta.selection = {
            clientBusinessId: assets.selectedBusinessId,
            clientBusinessName: assets.selectedBusinessName,
            selectedAt: discoveryTimestamp,
            source: businessId ? 'user_selection' : metaMetadata.selection?.source || 'auto_selected',
          };
        }

        await prisma.platformAuthorization.update({
          where: { id: platformAuth.id },
          data: {
            metadata: {
              ...rootMetadata,
              meta: nextMeta,
            } as any,
          },
        });
      } else if (platform === 'linkedin_ads') {
        assets = await clientAssetsService.fetchLinkedInAdAccounts(tokens.accessToken);
      } else if (platform === 'linkedin_pages') {
        assets = await clientAssetsService.fetchLinkedInPages(tokens.accessToken);
      } else if (platform === 'mailchimp') {
        const metadata = (platformAuth.metadata as any) || {};
        const dc = metadata.dc;
        if (!dc) {
          return reply.code(400).send({
            data: null,
            error: {
              code: 'MISSING_METADATA',
              message: 'Mailchimp data center (dc) not found in authorization metadata',
            },
          });
        }
        assets = await clientAssetsService.fetchMailchimpAssets(tokens.accessToken, dc);
      } else if (platform === 'pinterest') {
        assets = await clientAssetsService.fetchPinterestAssets(tokens.accessToken);
      } else if (platform === 'klaviyo') {
        assets = await clientAssetsService.fetchKlaviyoAssets(tokens.accessToken);
      } else if (platform === 'shopify') {
        const metadata = (platformAuth.metadata as any) || {};
        const shop = metadata.shop;
        if (!shop) {
          return reply.code(400).send({
            data: null,
            error: {
              code: 'MISSING_METADATA',
              message: 'Shopify shop name not found in authorization metadata',
            },
          });
        }
        assets = await clientAssetsService.fetchShopifyAssets(tokens.accessToken, shop);
      } else if (platform === 'tiktok' || platform === 'tiktok_ads') {
        assets = await clientAssetsService.fetchTikTokAssets(tokens.accessToken);
      } else if (platform === 'google') {
        const { GoogleConnector } = await import('../../services/connectors/google.js');
        const googleConnector = new GoogleConnector();
        const allAccounts = await googleConnector.getAllGoogleAccounts(tokens.accessToken);
        assets = {
          adsAccounts: allAccounts.adsAccounts,
          analyticsProperties: allAccounts.analyticsProperties,
          businessAccounts: allAccounts.businessAccounts,
          tagManagerContainers: allAccounts.tagManagerContainers,
          searchConsoleSites: allAccounts.searchConsoleSites,
          merchantCenterAccounts: allAccounts.merchantCenterAccounts,
        };
      } else if (
        platformStr === 'google_ads' ||
        platformStr === 'ga4' ||
        platformStr === 'google_business_profile' ||
        platformStr === 'google_tag_manager' ||
        platformStr === 'google_search_console' ||
        platformStr === 'google_merchant_center'
      ) {
        const { GoogleConnector } = await import('../../services/connectors/google.js');
        const googleConnector = new GoogleConnector();
        assets = await googleConnector.getAccountsForProduct(platformStr as GoogleProduct, tokens.accessToken);
      } else {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'UNSUPPORTED_PLATFORM',
            message: `Platform ${platform} not yet supported for asset fetching`,
          },
        });
      }

      return reply.send({
        data: assets,
        error: null,
      });
    } catch (error) {
      if (error instanceof MetaBusinessPortfolioUnavailableError) {
        return reply.code(error.statusCode).send({
          data: null,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      return reply.code(500).send({
        data: null,
        error: {
          code: 'ASSET_FETCH_ERROR',
          message: `Failed to fetch assets: ${error}`,
        },
      });
    }
  });
}
