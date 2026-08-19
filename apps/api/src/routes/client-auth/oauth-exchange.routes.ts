import { FastifyInstance } from 'fastify';
import { auditService } from '../../services/audit.service.js';
import { oauthStateService } from '../../services/oauth-state.service.js';
import { getConnector } from '../../services/connectors/factory.js';
import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../lib/env.js';
import type { Platform } from '@agency-platform/shared';
import { oauthExchangeSchema } from './schemas.js';
import { sanitizeOAuthError } from '../../lib/errors.js';
import { sendError } from '../../lib/response.js';

export async function registerOAuthExchangeRoutes(fastify: FastifyInstance) {
  // Exchange OAuth code for temporary session (token in path)
  fastify.post('/client/:token/oauth-exchange', async (request, reply) => {
    const { token } = request.params as { token: string };
    void token;

    const validated = oauthExchangeSchema.safeParse(request.body);
    if (!validated.success) {
      return sendError(reply, 'VALIDATION_ERROR', 'Invalid OAuth exchange data', 400, validated.error.errors,);
    }

    const { code, state, platform: platformFromRequest } = validated.data;

    const stateResult = await oauthStateService.validateState(state);
    if (stateResult.error || !stateResult.data) {
      return sendError(reply, 'INVALID_STATE', 'Invalid or expired OAuth state token', 400);
    }

    const stateData = stateResult.data;
    const platform = stateData.platform;

    if (platformFromRequest && platformFromRequest !== platform) {
      return sendError(reply, 'PLATFORM_MISMATCH', 'Platform does not match OAuth state', 400);
    }

    try {
      const connector = getConnector(platform as Platform);
      const redirectUri = stateData.redirectUrl || `${env.FRONTEND_URL}/invite/oauth-callback`;
      let tokens = await connector.exchangeCode(code, redirectUri);

      if ((platform === 'meta' || platform === 'meta_ads') && connector.getLongLivedToken) {
        tokens = await connector.getLongLivedToken(tokens.accessToken);
      }

      const userInfo = await connector.getUserInfo(tokens.accessToken);

      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: stateData.accessRequestId! },
      });

      if (!accessRequest) {
        return sendError(reply, 'ACCESS_REQUEST_NOT_FOUND', 'Access request not found', 404);
      }

      let clientConnection = await prisma.clientConnection.findFirst({
        where: { accessRequestId: stateData.accessRequestId! },
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

      const secretName = infisical.generateSecretName(
        platform as Platform,
        clientConnection.id
      );

      await infisical.storeOAuthTokens(secretName, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });

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

      if (platform === 'tiktok' || platform === 'tiktok_ads') {
        await auditService.createAuditLog({
          agencyId: accessRequest.agencyId,
          action: 'TIKTOK_TOKEN_EXCHANGED',
          userEmail: stateData.clientEmail!,
          resourceType: 'client_connection',
          resourceId: clientConnection.id,
          metadata: {
            platform,
            platformAuthId: platformAuth.id,
          },
          request,
        });
      }

      return reply.send({
        data: {
          connectionId: clientConnection.id,
          platform,
          token: stateData.accessRequestToken || accessRequest.uniqueToken,
        },
        error: null,
      });
    } catch (error) {
      const sanitized = sanitizeOAuthError(error);
      fastify.log.error({ error, sanitized }, 'OAuth exchange failed');
      return reply.code(500).send({
        data: null,
        error: sanitized,
      });
    }
  });

  // Static OAuth exchange endpoint (token extracted from state)
  fastify.post('/client/oauth-exchange', async (request, reply) => {
    const validated = oauthExchangeSchema.safeParse(request.body);
    if (!validated.success) {
      return sendError(reply, 'VALIDATION_ERROR', 'Invalid OAuth exchange data', 400, validated.error.errors,);
    }

    const { code, state, platform: platformFromRequest } = validated.data;

    const stateResult = await oauthStateService.validateState(state);
    if (stateResult.error || !stateResult.data) {
      return sendError(reply, 'INVALID_STATE', 'Invalid or expired OAuth state token', 400);
    }

    const stateData = stateResult.data;
    const platform = stateData.platform;

    if (platformFromRequest && platformFromRequest !== platform) {
      return sendError(reply, 'PLATFORM_MISMATCH', 'Platform does not match OAuth state', 400);
    }

    if (!stateData.accessRequestToken) {
      return sendError(reply, 'MISSING_TOKEN', 'Access request token not found in OAuth state', 400);
    }

    try {
      const connector = getConnector(platform as Platform);
      const redirectUri = stateData.redirectUrl || `${env.FRONTEND_URL}/invite/oauth-callback`;
      let tokens = await connector.exchangeCode(code, redirectUri);

      if ((platform === 'meta' || platform === 'meta_ads') && connector.getLongLivedToken) {
        tokens = await connector.getLongLivedToken(tokens.accessToken);
      }

      const userInfo = await connector.getUserInfo(tokens.accessToken);

      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: stateData.accessRequestId! },
      });

      if (!accessRequest) {
        return sendError(reply, 'ACCESS_REQUEST_NOT_FOUND', 'Access request not found', 404);
      }

      let clientConnection = await prisma.clientConnection.findFirst({
        where: { accessRequestId: stateData.accessRequestId! },
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

      const secretName = infisical.generateSecretName(
        platform as Platform,
        clientConnection.id
      );

      await infisical.storeOAuthTokens(secretName, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });

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

      if (platform === 'tiktok' || platform === 'tiktok_ads') {
        await auditService.createAuditLog({
          agencyId: accessRequest.agencyId,
          action: 'TIKTOK_TOKEN_EXCHANGED',
          userEmail: stateData.clientEmail!,
          resourceType: 'client_connection',
          resourceId: clientConnection.id,
          metadata: {
            platform,
            platformAuthId: platformAuth.id,
          },
          request,
        });
      }

      return reply.send({
        data: {
          connectionId: clientConnection.id,
          platform,
          token: stateData.accessRequestToken,
        },
        error: null,
      });
    } catch (error) {
      const sanitized = sanitizeOAuthError(error);
      fastify.log.error({ error, sanitized }, 'OAuth exchange failed');
      return reply.code(500).send({
        data: null,
        error: sanitized,
      });
    }
  });
}
