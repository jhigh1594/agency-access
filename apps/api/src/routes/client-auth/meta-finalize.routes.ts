import { FastifyInstance } from 'fastify';
import { auditService } from '../../services/audit.service.js';
import { oauthStateService } from '../../services/oauth-state.service.js';
import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import type { Platform } from '@agency-platform/shared';
import { metaClientFinalizeSchema } from './schemas.js';
import { MetaConnector } from '../../services/connectors/meta.js';
import { sendError } from '../../lib/response.js';

/**
 * Client invite Meta popup finalize flow.
 *
 * Accepts a frontend-obtained Meta JS SDK auth payload and state token,
 * validates the token server-side, stores in Infisical, and creates/updates
 * ClientConnection and PlatformAuthorization. Response shape matches the
 * existing code-exchange flow so the wizard can resume at Step 2.
 */
export async function registerMetaFinalizeRoutes(fastify: FastifyInstance) {
  fastify.post('/client/:token/meta/finalize', async (request, reply) => {
    const { token } = request.params as { token: string };

    const validated = metaClientFinalizeSchema.safeParse(request.body);
    if (!validated.success) {
      return sendError(reply, 'VALIDATION_ERROR', 'Invalid Meta finalize payload', 400, validated.error.errors,);
    }

    const { state, accessToken, userId, expiresIn, signedRequest, dataAccessExpirationTime } =
      validated.data;

    const stateResult = await oauthStateService.validateState(state);
    if (stateResult.error || !stateResult.data) {
      return sendError(reply, 'INVALID_STATE', 'Invalid or expired OAuth state token', 400);
    }

    const stateData = stateResult.data;
    const platform = stateData.platform as Platform;

    if (platform !== 'meta' && platform !== 'meta_ads') {
      return sendError(reply, 'PLATFORM_MISMATCH', 'Meta finalize only supports meta or meta_ads platform', 400);
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: stateData.accessRequestId! },
    });

    if (!accessRequest) {
      return sendError(reply, 'ACCESS_REQUEST_NOT_FOUND', 'Access request not found', 404);
    }

    if (accessRequest.uniqueToken !== token) {
      return sendError(reply, 'TOKEN_MISMATCH', 'Invite token does not match access request', 400);
    }

    const connector = new MetaConnector();
    const isValidToken = await connector.verifyToken(accessToken);
    if (!isValidToken) {
      return sendError(reply, 'INVALID_TOKEN', 'Meta login token is invalid. Please try logging in again.', 401);
    }

    try {
      const [userInfo, tokenMetadata, longLivedTokens] = await Promise.all([
        connector.getUserInfo(accessToken),
        connector.getTokenMetadata(accessToken),
        connector.getLongLivedToken(accessToken),
      ]);

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

      const secretName = infisical.generateSecretName(platform, clientConnection.id);

      await infisical.storeOAuthTokens(secretName, {
        accessToken: longLivedTokens.accessToken,
        expiresAt: longLivedTokens.expiresAt,
      });

      const metadata = {
        ...userInfo,
        metaClientPopup: {
          authSource: 'js_sdk',
          userId: userId || tokenMetadata.userId || userInfo.id,
          userName: userInfo.name,
          expiresIn,
          dataAccessExpirationTime,
          dataAccessExpiresAt: tokenMetadata.dataAccessExpiresAt?.toISOString(),
          grantedScopes: tokenMetadata.scopes,
          signedRequest,
        },
      };

      const platformAuth = await prisma.platformAuthorization.upsert({
        where: {
          connectionId_platform: {
            connectionId: clientConnection.id,
            platform,
          },
        },
        update: {
          secretId: secretName,
          expiresAt: longLivedTokens.expiresAt,
          status: 'active',
          metadata,
        },
        create: {
          connectionId: clientConnection.id,
          platform,
          secretId: secretName,
          expiresAt: longLivedTokens.expiresAt,
          status: 'active',
          metadata,
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
          authSource: 'meta_client_popup',
        },
        request,
      });

      return reply.send({
        data: {
          connectionId: clientConnection.id,
          platform,
          token: accessRequest.uniqueToken,
        },
        error: null,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Meta client finalize failed');
      return sendError(reply, 'FINALIZE_FAILED', error instanceof Error ? error.message : 'Failed to finalize Meta connection', 500);
    }
  });
}
