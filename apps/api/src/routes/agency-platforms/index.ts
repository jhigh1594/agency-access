import { FastifyInstance } from 'fastify';
import { registerListRoutes } from './list.routes.js';
import { registerOAuthRoutes } from './oauth.routes.js';
import { registerConnectionRoutes } from './connection.routes.js';
import { registerIdentityRoutes } from './identity.routes.js';
import { registerManualRoutes } from './manual.routes.js';
import { registerAssetRoutes } from './assets.routes.js';
import { pinterestRoutes } from './pinterest.routes.js';
import { authenticate } from '@/middleware/auth.js';
import { resolvePrincipalAgency } from '@/lib/authorization.js';

export async function agencyPlatformsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    // OAuth provider callbacks cannot include bearer auth, state token handles CSRF.
    if (/^\/agency-platforms\/[^/]+\/callback(?:\?|$)/.test(request.raw.url || '')) {
      return;
    }

    const authMiddleware = authenticate();
    await authMiddleware(request, reply);
    if (reply.sent) return;

    const principalResult = await resolvePrincipalAgency(request);
    if (principalResult.error || !principalResult.data) {
      const statusCode = principalResult.error?.code === 'UNAUTHORIZED' ? 401 : 403;
      return reply.code(statusCode).send({
        data: null,
        error: principalResult.error || {
          code: 'FORBIDDEN',
          message: 'Unable to resolve agency for authenticated user',
        },
      });
    }

    (request as any).principalAgencyId = principalResult.data.agencyId;
    (request as any).agencyId = principalResult.data.agencyId;
  });

  await registerListRoutes(fastify);
  await registerOAuthRoutes(fastify);
  await registerConnectionRoutes(fastify);
  await registerIdentityRoutes(fastify);
  await registerManualRoutes(fastify);
  await registerAssetRoutes(fastify);

  // Register Pinterest routes with prefix
  await fastify.register(pinterestRoutes, { prefix: '/agency-platforms/pinterest' });
}
