import { FastifyInstance } from 'fastify';
import { auditService } from '../../services/audit.service.js';
import { oauthStateService } from '../../services/oauth-state.service.js';
import { getConnector } from '../../services/connectors/factory.js';
import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../lib/env.js';
import type { Platform } from '@agency-platform/shared';
import { oauthExchangeSchema } from './schemas.js';

export async function registerOAuthExchangeRoutes(fastify: FastifyInstance) {
  // Exchange OAuth code for temporary session (token in path)
  fastify.post('/client/:token/oauth-exchange', async (request, reply) => {
    const { token } = request.params as { token: string };
    void token;

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
    const platform = stateData.platform;

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
      const connector = getConnector(platform as Platform);
      const redirectUri = `${env.FRONTEND_URL}/invite/oauth-callback`;
      let tokens = await connector.exchangeCode(code, redirectUri);

      if ((platform === 'meta' || platform === 'meta_ads') && connector.getLongLivedToken) {
        tokens = await connector.getLongLivedToken(tokens.accessToken);
      }

      const userInfo = await connector.getUserInfo(tokens.accessToken);

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

      return reply.send({
        data: {
          connectionId: clientConnection.id,
          platform,
          token: stateData.accessRequestToken || accessRequest.uniqueToken,
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

  // Static OAuth exchange endpoint (token extracted from state)
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
    const platform = stateData.platform;

    if (platformFromRequest && platformFromRequest !== platform) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'PLATFORM_MISMATCH',
          message: 'Platform does not match OAuth state',
        },
      });
    }

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
      const connector = getConnector(platform as Platform);
      const redirectUri = `${env.FRONTEND_URL}/invite/oauth-callback`;
      let tokens = await connector.exchangeCode(code, redirectUri);

      if ((platform === 'meta' || platform === 'meta_ads') && connector.getLongLivedToken) {
        tokens = await connector.getLongLivedToken(tokens.accessToken);
      }

      const userInfo = await connector.getUserInfo(tokens.accessToken);

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

      return reply.send({
        data: {
          connectionId: clientConnection.id,
          platform,
          token: stateData.accessRequestToken,
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
}
