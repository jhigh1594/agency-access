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
import { accessRequestService } from '../services/access-request.service';
import { auditService } from '../services/audit.service';
import { oauthStateService } from '../services/oauth-state.service';
import { notificationService } from '../services/notification.service';
import { clientAssetsService } from '../services/client-assets.service';
import { getConnector } from '../services/connectors/factory';
import { infisical } from '../lib/infisical';
import { prisma } from '../lib/prisma';
import type { Platform } from '@agency-platform/shared';
import { z } from 'zod';

// Validation schemas
const submitIntakeSchema = z.object({
  intakeResponses: z.record(z.any()),
});

const createOAuthStateSchema = z.object({
  platform: z.enum(['meta_ads', 'google_ads', 'ga4', 'linkedin', 'instagram', 'tiktok', 'snapchat']),
});

const oauthExchangeSchema = z.object({
  code: z.string(),
  state: z.string(),
  platform: z.enum(['meta_ads', 'google_ads', 'ga4', 'linkedin', 'instagram', 'tiktok', 'snapchat']),
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

    const { code, state, platform } = validated.data;

    // Validate OAuth state
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

    // Verify platform matches
    if (stateData.platform !== platform) {
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
      const connector = getConnector(platform as Platform);
      let tokens = await connector.exchangeCode(code);

      // For Meta, get long-lived token (60-day)
      if (platform === 'meta_ads' && connector.getLongLivedToken) {
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

      // Create platform authorization record
      const platformAuth = await prisma.platformAuthorization.create({
        data: {
          connectionId: clientConnection.id,
          platform: platform as Platform,
          secretId: secretName,
          expiresAt: tokens.expiresAt,
          status: 'active',
          metadata: userInfo,
        },
      });

      // Log authorization in audit trail
      await auditService.log({
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

      return reply.send({
        data: { connectionId: clientConnection.id, platform },
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

  // Fetch client assets using connection (for display purposes only)
  fastify.get('/client-assets/:connectionId/:platform', async (request, reply) => {
    const { connectionId, platform } = request.params as { connectionId: string; platform: string };

    // Get platform authorization
    const platformAuth = await prisma.platformAuthorization.findUnique({
      where: {
        connectionId_platform: {
          connectionId,
          platform: platform as Platform,
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

      if (platform === 'meta_ads') {
        assets = await clientAssetsService.fetchMetaAssets(tokens.accessToken);
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
}
