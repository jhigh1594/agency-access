import type { FastifyRequest } from 'fastify';
import { agencyResolutionService } from '@/services/agency-resolution.service';

export interface AuthorizationError {
  code: string;
  message: string;
}

export interface PrincipalAgencyData {
  agencyId: string;
  principalId: string;
  agency: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuthUserClaims {
  sub?: string;
  orgId?: string;
  email?: string;
  email_address?: string;
  emailAddress?: string;
  email_addresses?: Array<{ email_address?: string; emailAddress?: string }>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveUserEmail(user: AuthUserClaims | undefined): string | undefined {
  const direct = user?.email || user?.email_address || user?.emailAddress;
  if (direct) return normalizeEmail(direct);

  const firstEmail = user?.email_addresses?.[0];
  if (!firstEmail) return undefined;

  const nested = firstEmail.email_address || firstEmail.emailAddress;
  if (!nested) return undefined;

  return normalizeEmail(nested);
}

export async function resolvePrincipalAgency(
  request: FastifyRequest
): Promise<{ data: PrincipalAgencyData | null; error: AuthorizationError | null }> {
  const user = (request as any).user as AuthUserClaims | undefined;
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

  const userEmail = resolveUserEmail(user);
  const agencyResult = await agencyResolutionService.resolveAgency(principalId, {
    createIfMissing: true,
    userEmail,
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
      agency: {
        id: agencyResult.data.agency.id,
        name: agencyResult.data.agency.name,
        email: agencyResult.data.agency.email,
      },
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
