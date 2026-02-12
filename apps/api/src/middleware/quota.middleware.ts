/**
 * Quota Middleware
 *
 * Fastify middleware for automatic quota checking on routes.
 *
 * Usage:
 * ```ts
 * import { quotaMiddleware } from '@/middleware/quota.middleware';
 *
 * fastify.register(quotaMiddleware({
 *   metric: 'clients',
 *   getAgencyId: (request) => request.orgId,
 * }));
 *
 * // Now all routes will check quota automatically
 * fastify.post('/api/clients', async (request, reply) => {
 *   // If quota exceeded, this won't execute
 *   // Client gets 429 with QuotaExceededError
 * });
 * ```
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { quotaService, QuotaExceededError } from '@/services/quota.service';
import { type MetricType } from '@agency-platform/shared';

export interface QuotaMiddlewareOptions {
  metric: MetricType;
  getAgencyId: (request: FastifyRequest) => string | undefined;
  requestedAmount?: number;
}

/**
 * Fastify middleware factory for quota checking
 */
export function quotaMiddleware(options: QuotaMiddlewareOptions) {
  const { metric, getAgencyId, requestedAmount = 1 } = options;

  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ) {
    try {
      // Extract agency ID from request
      const agencyId = getAgencyId(request);

      if (!agencyId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Agency ID required for quota check',
          },
        });
      }

      // For non-mutating actions (GET), skip quota check
      if (request.method === 'GET') {
        return done();
      }

      // Check quota for mutating actions (POST, PUT, PATCH, DELETE)
      const result = await quotaService.checkQuota({
        agencyId,
        metric,
        action: 'create',
        requestedAmount,
      });

      // Attach result to request for downstream use
      request.quotaResult = result;

      // If quota exceeded, return error
      if (!result.allowed) {
        const error = new QuotaExceededError(
          omit(result, ['allowed']),
        );

        return reply.code(429).send(error.toJSON());
      }

      // Quota OK, proceed to route handler
      done();
    } catch (error) {
      // Log unexpected errors
      console.error('Quota middleware error:', error);
      reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check quota',
        },
      });
    }
  };
}

// Helper to omit properties from object
function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    quotaResult?: import('@/services/quota.service').QuotaCheckResult;
  }
}
