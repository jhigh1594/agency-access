import type { FastifyRequest } from 'fastify';
import { agencyResolutionService } from '@/services/agency-resolution.service';

export interface AuthorizationError {
  code: string;
  message: string;
}

export interface PrincipalAgencyData {
  agencyId: string;
  principalId: string;
}

export async function resolvePrincipalAgency(
  request: FastifyRequest
): Promise<{ data: PrincipalAgencyData | null; error: AuthorizationError | null }> {
  const user = (request as any).user as { sub?: string; orgId?: string } | undefined;
  const principalId = user?.orgId || user?.sub;

  if (!principalId) {
    return {
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated user context is required',
      },
    };
  }

  const agencyResult = await agencyResolutionService.resolveAgency(principalId, {
    createIfMissing: false,
  });

  if (agencyResult.error || !agencyResult.data) {
    return {
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'Unable to resolve agency for authenticated user',
      },
    };
  }

  return {
    data: {
      agencyId: agencyResult.data.agencyId,
      principalId,
    },
    error: null,
  };
}

export function assertAgencyAccess(
  requestedAgencyId: string,
  principalAgencyId: string
): AuthorizationError | null {
  if (requestedAgencyId !== principalAgencyId) {
    return {
      code: 'FORBIDDEN',
      message: 'You do not have access to this agency resource',
    };
  }

  return null;
}

