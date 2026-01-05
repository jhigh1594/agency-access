/**
 * Client Authorization Routes
 *
 * API endpoints for client OAuth authorization flow with standard token storage.
 * Some endpoints are public (no auth) since clients don't have accounts.
 *
 * Simplified Flow:
 * 1. Client OAuth → Exchange code for tokens
 * 2. Store tokens in Infisical → Create ClientConnection + PlatformAuthorization
 * 3. Return connectionId → Client sees success screen
 */

import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../services/access-request.service.js';
import { auditService } from '../services/audit.service.js';
import { oauthStateService } from '../services/oauth-state.service.js';
import { notificationService } from '../services/notification.service.js';
import { clientAssetsService } from '../services/client-assets.service.js';
import { getConnector } from '../services/connectors/factory.js';
import { infisical } from '../lib/infisical.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import type { Platform } from '@agency-platform/shared';
import { z } from 'zod';

// Validation schemas
const submitIntakeSchema = z.object({
  intakeResponses: z.record(z.any()),
});

const createOAuthStateSchema = z.object({
  platform: z.enum(['google', 'meta', 'meta_ads', 'google_ads', 'ga4', 'linkedin', 'instagram', 'tiktok', 'snapchat', 'mailchimp', 'pinterest', 'klaviyo', 'shopify']),
});

const oauthExchangeSchema = z.object({
  code: z.string(),
  state: z.string(),
  platform: z.enum(['google', 'meta', 'meta_ads', 'google_ads', 'ga4', 'linkedin', 'instagram', 'tiktok', 'snapchat', 'mailchimp', 'pinterest', 'klaviyo', 'shopify']).optional(), // Optional - will be extracted from state
});

const saveAssetsSchema = z.object({
  connectionId: z.string(),
  platform: z.string(), // Allow any platform string (including Google product IDs)
  selectedAssets: z.object({
    adAccounts: z.array(z.string()).optional(),
    pages: z.array(z.string()).optional(),
    instagramAccounts: z.array(z.string()).optional(),
    properties: z.array(z.string()).optional(),
    businessAccounts: z.array(z.string()).optional(),
    containers: z.array(z.string()).optional(),
    sites: z.array(z.string()).optional(),
    merchantAccounts: z.array(z.string()).optional(),
  }),
});

export async function clientAuthRoutes(fastify: FastifyInstance) {
  // Create OAuth state token for CSRF protection
  fastify.post('/client/:token/oauth-state', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequest.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const validated = createOAuthStateSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid platform',
          details: validated.error.errors,
        },
      });
    }

    const { platform } = validated.data;

    const stateResult = await oauthStateService.createState({
      agencyId: accessRequest.data.agencyId,
      platform,
      userEmail: accessRequest.data.clientEmail,
      accessRequestId: accessRequest.data.id,
      clientEmail: accessRequest.data.clientEmail,
      timestamp: Date.now(),
    });

    if (stateResult.error || !stateResult.data) {
      return reply.code(500).send({
        data: null,
        error: stateResult.error || {
          code: 'STATE_CREATION_FAILED',
          message: 'Failed to create OAuth state token',
        },
      });
    }

    return reply.send({
      data: { state: stateResult.data },
      error: null,
    });
  });

  // NEW: Generate OAuth URL for a specific platform
  fastify.post('/client/:token/oauth-url', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequest.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const validated = createOAuthStateSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid platform',
          details: validated.error.errors,
        },
      });
    }

    const { platform } = validated.data;

    // Create OAuth state token (include token for redirect after OAuth)
    const stateResult = await oauthStateService.createState({
      agencyId: accessRequest.data.agencyId,
      platform,
      userEmail: accessRequest.data.clientEmail,
      accessRequestId: accessRequest.data.id,
      accessRequestToken: token, // Store token in state for redirect
      clientEmail: accessRequest.data.clientEmail,
      timestamp: Date.now(),
    });

    if (stateResult.error || !stateResult.data) {
      return reply.code(500).send({
        data: null,
        error: stateResult.error || {
          code: 'STATE_CREATION_FAILED',
          message: 'Failed to create OAuth state token',
        },
      });
    }

    const state = stateResult.data;

    // Get connector and generate URL
    // Use static redirect URI (must match what's registered in OAuth app settings)
    try {
      const connector = getConnector(platform as Platform);
      const redirectUri = `${env.FRONTEND_URL}/invite/oauth-callback`;

      // For Google platform group, determine scopes based on requested products
      let scopes: string[] | undefined;
      if (platform === 'google') {
        const platforms = accessRequest.data.platforms as any[];
        const googleProducts = platforms
          .filter((p: any) => p.platformGroup === 'google')
          .flatMap((p: any) => p.products || []);

        // Extract product IDs from product objects
        const productIds = googleProducts.map((p: any) => 
          typeof p === 'string' ? p : p.product
        );

        scopes = [];
        if (productIds.includes('google_ads')) {
          scopes.push('https://www.googleapis.com/auth/adwords');
        }
        if (productIds.includes('ga4')) {
          scopes.push('https://www.googleapis.com/auth/analytics.readonly');
        }
        if (productIds.includes('google_business_profile')) {
          scopes.push('https://www.googleapis.com/auth/business.manage');
        }
        if (productIds.includes('google_tag_manager')) {
          scopes.push('https://www.googleapis.com/auth/tagmanager.readonly');
        }
        if (productIds.includes('google_merchant_center')) {
          scopes.push('https://www.googleapis.com/auth/content');
        }
        if (productIds.includes('google_search_console')) {
          // Use full webmasters scope - readonly may not be sufficient for listing sites
          scopes.push('https://www.googleapis.com/auth/webmasters');
        }
        // Add basic profile scope for user info
        scopes.push('https://www.googleapis.com/auth/userinfo.email');
      }

      if (platform === 'meta' || platform === 'meta_ads') {
        // Meta client authorization scopes
        // Instagram Business accounts are accessed through Facebook Pages via business_management
        // No Instagram-specific OAuth scopes needed
        scopes = [
          'ads_management', // Manage ad accounts
          'ads_read', // Read ads data
          'business_management', // Access Business Manager (includes Pages and Instagram)
          'pages_read_engagement', // Read pages engagement data
        ];
      }

      const authUrl = connector.getAuthUrl(state, scopes, redirectUri);

      return reply.send({
        data: { authUrl, state },
        error: null,
      });
    } catch (error) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'CONNECTOR_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate OAuth URL',
        },
      });
    }
  });

  // NEW: Exchange OAuth code for temporary session
  fastify.post('/client/:token/oauth-exchange', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = oauthExchangeSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid OAuth exchange data',
          details: validated.error.errors,
        },
      });
    }

    const { code, state, platform: platformFromRequest } = validated.data;

    // Validate OAuth state (contains platform)
    const stateResult = await oauthStateService.validateState(state);
    if (stateResult.error || !stateResult.data) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'INVALID_STATE',
          message: 'Invalid or expired OAuth state token',
        },
      });
    }

    const stateData = stateResult.data;

    // Extract platform from state (source of truth)
    const platform = stateData.platform;

    // If platform was provided in request, verify it matches state
    if (platformFromRequest && platformFromRequest !== platform) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'PLATFORM_MISMATCH',
          message: 'Platform does not match OAuth state',
        },
      });
    }

    try {
      // Get connector and exchange code for tokens
      // Use static redirect URI (must match what's registered in OAuth app settings)
      const connector = getConnector(platform as Platform);
      const redirectUri = `${env.FRONTEND_URL}/invite/oauth-callback`;
      let tokens = await connector.exchangeCode(code, redirectUri);

      // For Meta (group-level or product-level), get long-lived token (60-day)
      if ((platform === 'meta' || platform === 'meta_ads') && connector.getLongLivedToken) {
        tokens = await connector.getLongLivedToken(tokens.accessToken);
      }

      // Get user info from platform for metadata
      const userInfo = await connector.getUserInfo(tokens.accessToken);

      // Get access request to find agency
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: stateData.accessRequestId! },
      });

      if (!accessRequest) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'ACCESS_REQUEST_NOT_FOUND',
            message: 'Access request not found',
          },
        });
      }

      // Create or get existing client connection
      let clientConnection = await prisma.clientConnection.findFirst({
        where: {
          accessRequestId: stateData.accessRequestId!,
        },
      });

      if (!clientConnection) {
        clientConnection = await prisma.clientConnection.create({
          data: {
            accessRequestId: stateData.accessRequestId!,
            agencyId: accessRequest.agencyId,
            clientEmail: stateData.clientEmail!,
            status: 'active',
          },
        });
      }

      // Store tokens in Infisical
      const secretName = infisical.generateSecretName(
        platform as Platform,
        clientConnection.id
      );

      await infisical.storeOAuthTokens(secretName, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });

      // Create or update platform authorization record (upsert)
      const platformAuth = await prisma.platformAuthorization.upsert({
        where: {
          connectionId_platform: {
            connectionId: clientConnection.id,
            platform: platform as Platform,
          },
        },
        update: {
          secretId: secretName,
          expiresAt: tokens.expiresAt,
          status: 'active',
          metadata: userInfo,
        },
        create: {
          connectionId: clientConnection.id,
          platform: platform as Platform,
          secretId: secretName,
          expiresAt: tokens.expiresAt,
          status: 'active',
          metadata: userInfo,
        },
      });

      // Log authorization in audit trail
      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'CLIENT_AUTHORIZED',
        userEmail: stateData.clientEmail!,
        resourceType: 'client_connection',
        resourceId: clientConnection.id,
        metadata: {
          platform,
          accessRequestId: stateData.accessRequestId!,
          platformAuthId: platformAuth.id,
        },
      });

      // Return connectionId, platform, and token for redirect
      return reply.send({
        data: { 
          connectionId: clientConnection.id, 
          platform,
          token: stateData.accessRequestToken || accessRequest.uniqueToken, // Return token for redirect
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'OAUTH_ERROR',
          message: `Failed to exchange OAuth code: ${error}`,
        },
      });
    }
  });

  // NEW: Static OAuth exchange endpoint (token extracted from state)
  fastify.post('/client/oauth-exchange', async (request, reply) => {
    const validated = oauthExchangeSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid OAuth exchange data',
          details: validated.error.errors,
        },
      });
    }

    const { code, state, platform: platformFromRequest } = validated.data;

    // Validate OAuth state (this contains the token and platform)
    const stateResult = await oauthStateService.validateState(state);
    if (stateResult.error || !stateResult.data) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'INVALID_STATE',
          message: 'Invalid or expired OAuth state token',
        },
      });
    }

    const stateData = stateResult.data;

    // Extract platform from state (source of truth)
    const platform = stateData.platform;

    // If platform was provided in request, verify it matches state
    if (platformFromRequest && platformFromRequest !== platform) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'PLATFORM_MISMATCH',
          message: 'Platform does not match OAuth state',
        },
      });
    }

    // Get token from state (required for redirect)
    if (!stateData.accessRequestToken) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access request token not found in OAuth state',
        },
      });
    }

    try {
      // Get connector and exchange code for tokens
      // Use static redirect URI (must match what's registered in OAuth app settings)
      const connector = getConnector(platform as Platform);
      const redirectUri = `${env.FRONTEND_URL}/invite/oauth-callback`;
      let tokens = await connector.exchangeCode(code, redirectUri);

      // For Meta (group-level or product-level), get long-lived token (60-day)
      if ((platform === 'meta' || platform === 'meta_ads') && connector.getLongLivedToken) {
        tokens = await connector.getLongLivedToken(tokens.accessToken);
      }

      // Get user info from platform for metadata
      const userInfo = await connector.getUserInfo(tokens.accessToken);

      // Get access request to find agency
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: stateData.accessRequestId! },
      });

      if (!accessRequest) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'ACCESS_REQUEST_NOT_FOUND',
            message: 'Access request not found',
          },
        });
      }

      // Create or get existing client connection
      let clientConnection = await prisma.clientConnection.findFirst({
        where: {
          accessRequestId: stateData.accessRequestId!,
        },
      });

      if (!clientConnection) {
        clientConnection = await prisma.clientConnection.create({
          data: {
            accessRequestId: stateData.accessRequestId!,
            agencyId: accessRequest.agencyId,
            clientEmail: stateData.clientEmail!,
            status: 'active',
          },
        });
      }

      // Store tokens in Infisical
      const secretName = infisical.generateSecretName(
        platform as Platform,
        clientConnection.id
      );

      await infisical.storeOAuthTokens(secretName, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });

      // Create or update platform authorization record (upsert)
      const platformAuth = await prisma.platformAuthorization.upsert({
        where: {
          connectionId_platform: {
            connectionId: clientConnection.id,
            platform: platform as Platform,
          },
        },
        update: {
          secretId: secretName,
          expiresAt: tokens.expiresAt,
          status: 'active',
          metadata: userInfo,
        },
        create: {
          connectionId: clientConnection.id,
          platform: platform as Platform,
          secretId: secretName,
          expiresAt: tokens.expiresAt,
          status: 'active',
          metadata: userInfo,
        },
      });

      // Log authorization in audit trail
      await auditService.createAuditLog({
        agencyId: accessRequest.agencyId,
        action: 'CLIENT_AUTHORIZED',
        userEmail: stateData.clientEmail!,
        resourceType: 'client_connection',
        resourceId: clientConnection.id,
        metadata: {
          platform,
          accessRequestId: stateData.accessRequestId!,
          platformAuthId: platformAuth.id,
        },
      });

      // Return connectionId, platform, and token for redirect
      return reply.send({
        data: { 
          connectionId: clientConnection.id, 
          platform,
          token: stateData.accessRequestToken, // Return token from state for redirect
        },
        error: null,
      });
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'OAUTH_ERROR',
          message: `Failed to exchange OAuth code: ${error}`,
        },
      });
    }
  });

  // NEW: Save selected assets for a platform
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
      // 1. Get current ClientConnection
      const connection = await prisma.clientConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        return reply.code(404).send({
          data: null,
          error: { code: 'NOT_FOUND', message: 'Connection not found' },
        });
      }

      // 2. Update grantedAssets in ClientConnection
      const currentGrantedAssets = (connection.grantedAssets as any) || {};
      const updatedGrantedAssets = {
        ...currentGrantedAssets,
        [platform]: selectedAssets,
      };

      await prisma.clientConnection.update({
        where: { id: connectionId },
        data: { grantedAssets: updatedGrantedAssets },
      });

      // 3. Update PlatformAuthorization metadata with specific assets for this platform
      // Map product to group for authorization lookup
      const platformStr = String(platform);
      const platformMap: Record<string, Platform> = {
        'google_ads': 'google',
        'ga4': 'google',
        'google_business_profile': 'google',
        'google_tag_manager': 'google',
        'google_search_console': 'google',
        'google_merchant_center': 'google',
        'meta_ads': 'meta',
        'instagram': 'meta',
        'mailchimp': 'mailchimp',
        'pinterest': 'pinterest',
        'klaviyo': 'klaviyo',
        'shopify': 'shopify',
        'tiktok': 'tiktok',
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
            [platform]: selectedAssets, // Nest selections by product ID
          },
        };

        await prisma.platformAuthorization.update({
          where: { id: existingAuth.id },
          data: { metadata: updatedMetadata },
        });
      }

      // 4. Log in audit trail
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

    const validated = z.object({
      connectionId: z.string(),
      pageIds: z.array(z.string()),
    }).safeParse(request.body);

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
      // Get access request to find agency
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

      // Get client connection
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

      // Get platform authorization to retrieve token
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

      // Get client's OAuth token from Infisical
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

      // Check if token is expired
      if (tokens.expiresAt && new Date(tokens.expiresAt) < new Date()) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Your authorization has expired. Please reconnect.',
          },
        });
      }

      // Get agency's Business Manager ID
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

      // Get agency's System User ID from metadata
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

      // Import meta-partner service
      // @ts-ignore - Dynamic import, module exists at runtime
      const { metaPartnerService } = await import('../services/meta-partner.service.js');

      // Grant access to each page
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

      // Update connection grantedAssets with grant results
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

      // Create audit log
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

      // Get Business Manager ID from businessId field (preferred) or metadata.selectedBusinessId (fallback)
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

    const validated = z.object({
      connectionId: z.string(),
      sharedAdAccountIds: z.array(z.string()).optional(),
    }).safeParse(request.body);

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

      // Update connection grantedAssets with ad account sharing status
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

      // Create audit log
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
    const { connectionId, platform: platformParam } = request.params as { connectionId: string; platform: string };

    // Map product-level platforms to group-level authorizations if needed
    const platformMap: Record<string, Platform> = {
      'google_ads': 'google',
      'ga4': 'google',
      'google_business_profile': 'google',
      'google_tag_manager': 'google',
      'google_search_console': 'google',
      'google_merchant_center': 'google',
      'meta_ads': 'meta',
      'instagram': 'meta',
      'mailchimp': 'mailchimp',
      'pinterest': 'pinterest',
      'klaviyo': 'klaviyo',
      'shopify': 'shopify',
      'tiktok': 'tiktok',
    };

    const platform = platformParam as Platform;
    const authPlatform = platformMap[platformParam] || platform;

    // Get platform authorization
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

    // Check if authorization is active
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
      // Get token from Infisical
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

      // Fetch assets based on platform
      let assets;
      const platformStr = String(platform);

      if (platform === 'meta_ads') {
        assets = await clientAssetsService.fetchMetaAssets(tokens.accessToken);
      } else if (platform === 'mailchimp') {
        // Mailchimp requires dc (data center) prefix from metadata
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
        // Shopify requires shop name from metadata
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
        // For Google products, use the GoogleConnector to fetch all accounts
        const { GoogleConnector } = await import('../services/connectors/google.js');
        const googleConnector = new GoogleConnector();
        const allAccounts = await googleConnector.getAllGoogleAccounts(tokens.accessToken);
        
        // Return the appropriate subset based on the specific product
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
          // For group-level 'google' or unknown products, return all accounts
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

  // Submit intake form responses
  fastify.post('/client/:token/intake', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequest.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const validated = submitIntakeSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid intake responses',
          details: validated.error.errors,
        },
      });
    }

    // TODO: Store intake responses temporarily
    // They'll be saved to ClientConnection when connection is created

    return reply.send({
      data: { success: true, message: 'Intake responses saved' },
      error: null,
    });
  });

  // Complete client authorization
  fastify.post('/client/:token/complete', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequestResult = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequestResult.error || !accessRequestResult.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequestResult.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const accessRequest = accessRequestResult.data;

    const result = await accessRequestService.markRequestAuthorized(accessRequest.id);

    if (result.error) {
      return reply.code(404).send({
        data: null,
        error: result.error,
      });
    }

    // Get connection to check granted assets
    const connection = await prisma.clientConnection.findFirst({
      where: { accessRequestId: accessRequest.id },
    });

    // Queue notification to agency
    await notificationService.queueNotification({
      agencyId: accessRequest.agencyId,
      accessRequestId: accessRequest.id,
      clientEmail: accessRequest.clientEmail,
      clientName: accessRequest.clientEmail.split('@')[0],
      platforms: connection?.grantedAssets ? Object.keys(connection.grantedAssets as any) : [],
      completedAt: new Date(),
    });

    return reply.send({
      data: {
        success: true,
        message: 'Authorization complete',
      },
      error: null,
    });
  });

  // ========================================================================
  // MANUAL FLOW ENDPOINTS (Beehiiv-style team invitation)
  // ========================================================================

  // Manual connection endpoint for platforms that don't use OAuth (e.g., Beehiiv)
  // Creates a pending ClientConnection that will be verified when the agency accepts the invite
  fastify.post('/client/:token/beehiiv/manual-connect', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Validation schema for manual connection
    const manualConnectSchema = z.object({
      agencyEmail: z.string().email(),
      clientEmail: z.string().email().optional(),
      platform: z.literal('beehiiv'),
    });

    const validated = manualConnectSchema.safeParse(request.body);
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

    const { agencyEmail, clientEmail } = validated.data;

    // Get access request
    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Access request not found or expired',
        },
      });
    }

    try {
      // Create ClientConnection in "pending_verification" state
      // This status indicates the client has initiated the manual invite flow
      // and we're waiting for the agency to accept the team invitation
      const connection = await prisma.clientConnection.create({
        data: {
          accessRequestId: accessRequest.data.id,
          agencyId: accessRequest.data.agencyId,
          clientEmail: clientEmail || accessRequest.data.clientEmail || 'unknown',
          status: 'pending_verification', // Special status for manual flows
          grantedAssets: {
            platform: 'beehiiv',
            agencyEmail, // Email that was invited to Beehiiv workspace
            clientEmail: clientEmail || accessRequest.data.clientEmail,
            invitationSentAt: new Date().toISOString(),
            authMethod: 'manual_team_invitation',
          },
        },
      });

      // Log audit trail
      await auditService.createAuditLog({
        agencyId: accessRequest.data.agencyId,
        action: 'MANUAL_INVITATION_INITIATED',
        resourceType: 'ClientConnection',
        resourceId: connection.id,
        platform: 'beehiiv',
        metadata: {
          connectionId: connection.id,
          clientEmail: clientEmail || accessRequest.data.clientEmail,
          agencyEmail,
          accessRequestId: accessRequest.data.id,
        },
      });

      return reply.send({
        data: {
          connectionId: connection.id,
          status: connection.status,
          agencyEmail,
          message: 'Manual invitation initiated. Waiting for agency to accept Beehiiv team invite.',
        },
        error: null,
      });
    } catch (error) {
      fastify.log.error({
        error,
        context: 'Failed to create Beehiiv manual connection',
        token,
        agencyEmail,
      });

      return reply.code(500).send({
        data: null,
        error: {
          code: 'CONNECTION_CREATION_FAILED',
          message: 'Failed to create connection. Please try again.',
        },
      });
    }
  });

  // Kit manual connection endpoint (team invitation flow)
  fastify.post('/client/:token/kit/manual-connect', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Validation schema for manual connection
    const manualConnectSchema = z.object({
      agencyEmail: z.string().email(),
      clientEmail: z.string().email().optional(),
      platform: z.literal('kit'),
    });

    const validated = manualConnectSchema.safeParse(request.body);
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

    const { agencyEmail, clientEmail } = validated.data;

    // Get access request
    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Access request not found or expired',
        },
      });
    }

    try {
      // Create ClientConnection in "pending_verification" state
      const connection = await prisma.clientConnection.create({
        data: {
          accessRequestId: accessRequest.data.id,
          agencyId: accessRequest.data.agencyId,
          clientEmail: clientEmail || accessRequest.data.clientEmail || 'unknown',
          status: 'pending_verification',
          grantedAssets: {
            platform: 'kit',
            agencyEmail,
            clientEmail: clientEmail || accessRequest.data.clientEmail,
            invitationSentAt: new Date().toISOString(),
            authMethod: 'manual_team_invitation',
          },
        },
      });

      // Log audit trail
      await auditService.createAuditLog({
        agencyId: accessRequest.data.agencyId,
        action: 'MANUAL_INVITATION_INITIATED',
        resourceType: 'ClientConnection',
        resourceId: connection.id,
        platform: 'kit',
        metadata: {
          connectionId: connection.id,
          clientEmail: clientEmail || accessRequest.data.clientEmail,
          agencyEmail,
          accessRequestId: accessRequest.data.id,
        },
      });

      return reply.send({
        data: {
          connectionId: connection.id,
          status: connection.status,
          agencyEmail,
          message: 'Manual invitation initiated. Waiting for agency to accept Kit team invite.',
        },
        error: null,
      });
    } catch (error) {
      fastify.log.error({
        error,
        context: 'Failed to create Kit manual connection',
        token,
        agencyEmail,
      });

      return reply.code(500).send({
        data: null,
        error: {
          code: 'CONNECTION_CREATION_FAILED',
          message: 'Failed to create connection. Please try again.',
        },
      });
    }
  });
}
