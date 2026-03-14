import type { FastifyRequest } from 'fastify';

export function buildAuthenticatedRateLimitAllowList() {
  return async (request: FastifyRequest): Promise<boolean> => {
    return Boolean((request as any).user);
  };
}
