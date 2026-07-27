import { FastifyInstance } from 'fastify';
import { auditService } from '../../services/audit.service.js';
import { oauthStateService } from '../../services/oauth-state.service.js';
import { infisical } from '../../lib/infisical.js';
import { prisma } from '../../lib/prisma.js';
import type { Platform } from '@agency-platform/shared';
import { metaClientFinalizeSchema } from './schemas.js';
import { MetaConnector } from '../../services/connectors/meta.js';
import { randomUUID } from 'node:crypto';

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
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Meta finalize payload',
          details: validated.error.errors,
        },
      });
    }

    const { state, accessToken, userId, expiresIn, signedRequest, dataAccessExpirationTime } =
      validated.data;

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
    const platform = stateData.platform as Platform;

    if (platform !== 'meta' && platform !== 'meta_ads') {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'PLATFORM_MISMATCH',
          message: 'Meta finalize only supports meta or meta_ads platform',
        },
      });
    }

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

    if (accessRequest.uniqueToken !== token) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'TOKEN_MISMATCH',
          message: 'Invite token does not match access request',
        },
      });
    }

    const connector = new MetaConnector();
    const isValidToken = await connector.verifyToken(accessToken);
    if (!isValidToken) {
      return reply.code(401).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Meta login token is invalid. Please try logging in again.',
        },
      });
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

      const existingAuthorization = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId: clientConnection.id,
            platform,
          },
        },
      });
      const existingMetadata = existingAuthorization?.metadata &&
        typeof existingAuthorization.metadata === 'object' &&
        !Array.isArray(existingAuthorization.metadata)
        ? existingAuthorization.metadata as Record<string, any>
        : {};
      const existingIdentityId = existingMetadata.metaClientPopup?.userId || existingMetadata.id;
      const incomingIdentityId = userId || tokenMetadata.userId || userInfo.id;
      const replacingIdentity = Boolean(
        existingAuthorization && existingIdentityId && incomingIdentityId !== existingIdentityId
      );
      const priorSecretId = existingAuthorization?.secretId;
      const secretName = replacingIdentity
        ? infisical.generateSecretName(platform, `${clientConnection.id}_${randomUUID()}`)
        : priorSecretId || infisical.generateSecretName(platform, clientConnection.id);

      await infisical.storeOAuthTokens(secretName, {
        accessToken: longLivedTokens.accessToken,
        expiresAt: longLivedTokens.expiresAt,
      });

      const priorMeta = existingMetadata.meta && typeof existingMetadata.meta === 'object'
        ? existingMetadata.meta as Record<string, any>
        : {};
      const verifiedLegacyGrants = Array.isArray(priorMeta.obo?.assetGrantResults)
        ? priorMeta.obo.assetGrantResults.filter((grant: any) => grant?.status === 'verified')
        : [];
      const metadata = {
        ...existingMetadata,
        ...userInfo,
        ...(replacingIdentity ? {
          meta: verifiedLegacyGrants.length > 0
            ? { obo: { assetGrantResults: verifiedLegacyGrants, lastVerifiedAt: priorMeta.obo?.lastVerifiedAt } }
            : {},
        } : {}),
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

      try {
        await prisma.platformAuthorization.upsert({
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
      } catch (error) {
        if (replacingIdentity) await infisical.deleteOAuthTokens(secretName);
        throw error;
      }

      if (replacingIdentity && priorSecretId && priorSecretId !== secretName) {
        await infisical.deleteOAuthTokens(priorSecretId);
        await auditService.createAuditLog({
          agencyId: accessRequest.agencyId,
          action: 'META_IDENTITY_REPLACED',
          userEmail: stateData.clientEmail!,
          resourceType: 'client_connection',
          resourceId: clientConnection.id,
          metadata: {
            platform,
            accessRequestId: stateData.accessRequestId!,
            preservedVerifiedGrantCount: verifiedLegacyGrants.length,
          },
          request,
        });
      }

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
      return reply.code(500).send({
        data: null,
        error: {
          code: 'FINALIZE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to finalize Meta connection',
        },
      });
    }
  });
}
