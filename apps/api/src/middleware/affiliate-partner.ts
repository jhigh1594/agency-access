import type { FastifyReply, FastifyRequest } from 'fastify';

import { affiliateService } from '@/services/affiliate.service.js';

export function requireAffiliatePartner() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await affiliateService.resolveAuthenticatedPartner((request as any).user);

    if (result.error) {
      const statusCode = result.error.code === 'UNAUTHORIZED' ? 401 : 403;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    (request as any).affiliatePartner = result.data;
  };
}
