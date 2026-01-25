import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../../services/access-request.service.js';
import { auditService } from '../../services/audit.service.js';
import { clientAssetsService } from '../../services/client-assets.service.js';
import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import type { Platform } from '@agency-platform/shared';
import { adAccountsSharedSchema, grantPagesAccessSchema, saveAssetsSchema } from './schemas.js';

export async function registerAssetRoutes(fastify: FastifyInstance) {
  // Save selected assets for a platform
  fastify.post('/client/:token/save-assets', async (request, reply) => {
    const { token } = request.params as { token: string };
    void token;

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
      const connection = await prisma.clientConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        return reply.code(404).send({
          data: null,
          error: { code: 'NOT_FOUND', message: 'Connection not found' },
        });
      }

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
        instagram: 'meta',
        mailchimp: 'mailchimp',
        pinterest: 'pinterest',
        klaviyo: 'klaviyo',
        shopify: 'shopify',
        tiktok: 'tiktok',
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
        const updatedMetadata = {
          ...existingMetadata,
          selectedAssets: {
            ...(existingMetadata.selectedAssets || {}),
            [platform]: selectedAssets,
          },
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

      const connection = await prisma.clientConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'CONNECTION_NOT_FOUND',
            message: 'Client connection not found',
          },
        });
      }

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
            agencyId: accessRequest.data.agencyId,
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
        agencyId: accessRequest.data.agencyId,
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

      const connection = await prisma.clientConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'CONNECTION_NOT_FOUND',
            message: 'Client connection not found',
          },
        });
      }

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
        agencyId: accessRequest.data.agencyId,
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

  // Fetch client assets using connection (for display purposes only)
  fastify.get('/client-assets/:connectionId/:platform', async (request, reply) => {
    const { connectionId, platform: platformParam } = request.params as {
      connectionId: string;
      platform: string;
    };

    const platformMap: Record<string, Platform> = {
      google_ads: 'google',
      ga4: 'google',
      google_business_profile: 'google',
      google_tag_manager: 'google',
      google_search_console: 'google',
      google_merchant_center: 'google',
      meta_ads: 'meta',
      instagram: 'meta',
      mailchimp: 'mailchimp',
      pinterest: 'pinterest',
      klaviyo: 'klaviyo',
      shopify: 'shopify',
      tiktok: 'tiktok',
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

      let assets;
      const platformStr = String(platform);

      if (platform === 'meta_ads') {
        assets = await clientAssetsService.fetchMetaAssets(tokens.accessToken);
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
      } else if (platform === 'tiktok') {
        assets = await clientAssetsService.fetchTikTokAssets(tokens.accessToken);
      } else if (platform === 'google' || platformStr.startsWith('google_') || platform === 'ga4') {
        const { GoogleConnector } = await import('../../services/connectors/google.js');
        const googleConnector = new GoogleConnector();
        const allAccounts = await googleConnector.getAllGoogleAccounts(tokens.accessToken);

        if (platformStr === 'google_ads') {
          assets = allAccounts.adsAccounts;
        } else if (platformStr === 'ga4') {
          assets = allAccounts.analyticsProperties;
        } else if (platformStr === 'google_business_profile') {
          assets = allAccounts.businessAccounts;
        } else if (platformStr === 'google_tag_manager') {
          assets = allAccounts.tagManagerContainers;
        } else if (platformStr === 'google_search_console') {
          assets = allAccounts.searchConsoleSites;
        } else if (platformStr === 'google_merchant_center') {
          assets = allAccounts.merchantCenterAccounts;
        } else {
          assets = {
            adsAccounts: allAccounts.adsAccounts,
            analyticsProperties: allAccounts.analyticsProperties,
            businessAccounts: allAccounts.businessAccounts,
            tagManagerContainers: allAccounts.tagManagerContainers,
            searchConsoleSites: allAccounts.searchConsoleSites,
            merchantCenterAccounts: allAccounts.merchantCenterAccounts,
          };
        }
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
