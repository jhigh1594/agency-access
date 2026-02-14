import { FastifyInstance } from 'fastify';
import { agencyPlatformService } from '@/services/agency-platform.service';
import { PLATFORM_CONNECTORS } from './constants.js';
import { assertAgencyAccess } from '@/lib/authorization.js';

export async function registerConnectionRoutes(fastify: FastifyInstance) {
  /**
   * DELETE /agency-platforms/:platform
   * Revoke platform connection
   */
  fastify.delete('/agency-platforms/:platform', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, revokedBy } = request.body as {
      agencyId?: string;
      revokedBy?: string;
    };

    if (!agencyId || !revokedBy) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId and revokedBy are required',
        },
      });
    }

    const principalAgencyId = (request as any).principalAgencyId as string;
    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    const result = await agencyPlatformService.revokeConnection(
      agencyId,
      platform,
      revokedBy
    );

    if (result.error) {
      const statusCode = result.error.code === 'CONNECTION_NOT_FOUND' ? 404 : 500;
      return reply.code(statusCode).send(result);
    }

    return reply.send(result);
  });

  /**
   * POST /agency-platforms/:platform/refresh
   * Manually refresh platform tokens
   */
  fastify.post('/agency-platforms/:platform/refresh', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId } = request.body as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    const principalAgencyId = (request as any).principalAgencyId as string;
    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    const connectionResult = await agencyPlatformService.getConnection(agencyId, platform);

    if (connectionResult.error || !connectionResult.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Platform connection not found',
        },
      });
    }

    const ConnectorClass = PLATFORM_CONNECTORS[platform as keyof typeof PLATFORM_CONNECTORS];
    if (!ConnectorClass) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'CONNECTOR_NOT_IMPLEMENTED',
          message: `OAuth connector for "${platform}" is not implemented yet`,
        },
      });
    }

    try {
      const connector = new ConnectorClass();

      const tokenResult = await agencyPlatformService.getValidToken(agencyId, platform);

      if (tokenResult.error || !tokenResult.data) {
        return reply.code(500).send(tokenResult);
      }

      let newTokens;
      if (platform === 'meta' && 'getLongLivedToken' in connector) {
        newTokens = await (connector as any).getLongLivedToken(tokenResult.data);
      } else {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'REFRESH_NOT_SUPPORTED',
            message: 'Token refresh not supported for this platform',
          },
        });
      }

      const refreshResult = await agencyPlatformService.refreshConnection(
        agencyId,
        platform,
        {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
        }
      );

      if (refreshResult.error) {
        return reply.code(500).send(refreshResult);
      }

      return reply.send(refreshResult);
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Failed to refresh tokens',
        },
      });
    }
  });
}
