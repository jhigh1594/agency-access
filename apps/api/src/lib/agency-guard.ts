import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  assertAgencyAccess,
  resolvePrincipalAgency,
  type PrincipalAgencyData,
} from './authorization.js';

/**
 * Shared preHandler: resolve the caller's agency, attach it to the request,
 * and reply 401/403 exactly like the per-route copies it replaced.
 * Returns the principal data (or null after replying) for routes that
 * await it inline instead of registering it as a hook.
 *
 * Lives outside authorization.ts so resolvePrincipalAgency is called
 * through the module boundary — route tests mock that module.
 */
export async function requirePrincipalAgency(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<PrincipalAgencyData | null> {
  const principalResult = await resolvePrincipalAgency(request);
  if (principalResult.error || !principalResult.data) {
    const statusCode = principalResult.error?.code === 'UNAUTHORIZED' ? 401 : 403;
    reply.code(statusCode).send({
      data: null,
      error: principalResult.error || {
        code: 'FORBIDDEN',
        message: 'Unable to resolve agency for authenticated user',
      },
    });
    return null;
  }

  (request as any).principalAgencyId = principalResult.data.agencyId;
  (request as any).agencyId = principalResult.data.agencyId;
  (request as any).principalId = principalResult.data.principalId;
  return principalResult.data;
}

/**
 * Shared route-agency guard: verify the :id (or :agencyId) route param
 * matches the principal agency. Replies 403 on mismatch and returns null;
 * returns the route agency id when access is allowed.
 */
export function enforceRouteAgency(
  request: FastifyRequest,
  reply: FastifyReply,
  paramName: 'id' | 'agencyId' = 'id'
): string | null {
  const routeAgencyId = (request.params as Record<string, string>)[paramName];
  const accessError = assertAgencyAccess(routeAgencyId, (request as any).principalAgencyId);
  if (accessError) {
    void reply.code(403).send({ data: null, error: accessError });
    return null;
  }
  return routeAgencyId;
}
