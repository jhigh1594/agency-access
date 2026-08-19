import { resolveUserEmail, type AuthUserClaims } from './authorization.js';

export interface AffiliatePartnerPrincipal {
  userId: string;
  email: string;
}

export interface AffiliatePartnerAuthError {
  code: 'UNAUTHORIZED';
  message: string;
}

export interface AffiliatePartnerAuthResult {
  data: AffiliatePartnerPrincipal | null;
  error: AffiliatePartnerAuthError | null;
}

export function resolveAffiliatePartnerPrincipal(
  user: AuthUserClaims | undefined,
): AffiliatePartnerAuthResult {
  const userId = user?.sub;
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated affiliate partner context is required',
      },
    };
  }

  const email = user ? resolveUserEmail(user) : undefined;
  if (!email) {
    return {
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated affiliate partner email is required',
      },
    };
  }

  return {
    data: {
      userId,
      email,
    },
    error: null,
  };
}
