import type { FastifyReply, FastifyRequest } from 'fastify';
import { resolveInternalAdminUser } from '@/lib/internal-admin-auth.js';

interface InternalAdminAllowlist {
  userIds: string[];
  emails: string[];
}

export function requireInternalAdmin(allowlist?: InternalAdminAllowlist) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = resolveInternalAdminUser((request as any).user, allowlist);

    if (result.error) {
      const statusCode = result.error.code === 'UNAUTHORIZED' ? 401 : 403;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    (request as any).internalAdmin = result.data;
  };
}
