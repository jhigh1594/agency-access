import { FastifyInstance } from 'fastify';
import { registerListRoutes } from './list.routes.js';
import { registerOAuthRoutes } from './oauth.routes.js';
import { registerConnectionRoutes } from './connection.routes.js';
import { registerIdentityRoutes } from './identity.routes.js';
import { registerManualRoutes } from './manual.routes.js';
import { registerAssetRoutes } from './assets.routes.js';
import { registerPinterestRoutes } from './pinterest.routes.js';

export async function agencyPlatformsRoutes(fastify: FastifyInstance) {
  /**
   * Middleware: Auto-provision agency if it doesn't exist
   * This allows new users to connect platforms without manually creating an agency first
   *
   * NOTE: This middleware is deprecated in favor of using agencyResolutionService
   * directly in route handlers. Keeping for backward compatibility but should be removed.
   */
  fastify.addHook('onRequest', async (request, reply) => {
    const { agencyId: queryAgencyId } = request.query as { agencyId?: string };
    const body = request.body as { agencyId?: string } | undefined;
    const bodyAgencyId = body?.agencyId;
    const agencyId = queryAgencyId || bodyAgencyId;

    if (!agencyId) {
      return;
    }

    const { agencyResolutionService } = await import('../../services/agency-resolution.service.js');
    const result = await agencyResolutionService.resolveAgency(agencyId, {
      createIfMissing: true,
    });

    if (result.error) {
      fastify.log.warn({
        msg: 'Agency resolution failed in middleware',
        error: result.error,
        agencyId,
      });
    }
  });

  await registerListRoutes(fastify);
  await registerOAuthRoutes(fastify);
  await registerConnectionRoutes(fastify);
  await registerIdentityRoutes(fastify);
  await registerManualRoutes(fastify);
  await registerAssetRoutes(fastify);
  await registerPinterestRoutes(fastify);
}
