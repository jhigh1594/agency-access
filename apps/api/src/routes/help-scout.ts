import { FastifyInstance } from 'fastify';
import { sendError, sendSuccess } from '@/lib/response.js';
import { authenticate } from '@/middleware/auth.js';
import { helpScoutService } from '@/services/help-scout.service.js';

function getErrorStatus(code: string): number {
  if (code === 'UNAUTHORIZED') return 401;
  if (code === 'NOT_FOUND') return 404;
  if (code === 'NOT_CONFIGURED') return 503;
  return 500;
}

export async function helpScoutRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate());

  fastify.get('/help-scout/beacon', async (request, reply) => {
    const clerkUserId = ((request as any).user as { sub?: string } | undefined)?.sub;

    if (!clerkUserId) {
      return sendError(reply, 'UNAUTHORIZED', 'Authenticated user context is required', 401);
    }

    const result = await helpScoutService.getBeaconIdentity(clerkUserId);

    if (result.error || !result.data) {
      return sendError(
        reply,
        result.error?.code || 'INTERNAL_ERROR',
        result.error?.message || 'Failed to load Help Scout Beacon identity',
        getErrorStatus(result.error?.code || 'INTERNAL_ERROR'),
        result.error?.details
      );
    }

    return sendSuccess(reply, result.data);
  });
}
