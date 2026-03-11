import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../../services/access-request.service.js';
import { auditService } from '../../services/audit.service.js';
import { clientAssetsService } from '../../services/client-assets.service.js';
import {
  mapAccessLevelToTikTokRole,
  tiktokPartnerService,
  type TikTokPartnerShareResultItem,
} from '@/services/tiktok-partner.service';
import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import type { Platform } from '@agency-platform/shared';
import type { GoogleProduct } from '../../services/connectors/google.js';
import {
  adAccountsSharedSchema,
  grantPagesAccessSchema,
  saveAssetsSchema,
  tiktokPartnerShareSchema,
  tiktokPartnerVerifySchema,
} from './schemas.js';

type ShareResultWithVerification = TikTokPartnerShareResultItem & { verified?: boolean };

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

      const currentGrantedAssets = (connection.grantedAssets as any) || {};
      const updatedGrantedAssets = {
        ...currentGrantedAssets,
        [platform]: selectedAssets,
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
                  selectedAssets.selectedAdvertiserIds ||
                  selectedAssets.adAccounts ||
                  selectedAssets.advertisers ||
                  [],
                selectedBusinessCenterId: selectedAssets.selectedBusinessCenterId || null,
                discoverySnapshot: {
                  advertisers: selectedAssets.availableAdvertisers || [],
                  businessCenters: selectedAssets.availableBusinessCenters || [],
                },
              }
            : undefined;

        const updatedMetadata = {
          ...existingMetadata,
          selectedAssets: {
            ...(existingMetadata.selectedAssets || {}),
            [platform]: selectedAssets,
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
          selectedAssets,
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

  // Grant Pages access automatically via API
  fastify.post('/client/:token/grant-pages-access', async (request, reply) => {
    const { token } = request.params as { token: string };

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

  // Mark ad account sharing as complete
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
    const { connectionId } = request.query as { connectionId?: string };

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

      let assets;
      const platformStr = String(platform);

      if (platform === 'meta_ads') {
        assets = await clientAssetsService.fetchMetaAssets(tokens.accessToken);
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
