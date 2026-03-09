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

interface AuthUserClaims {
  sub?: string;
  email?: string;
  email_address?: string;
  emailAddress?: string;
  email_addresses?: Array<{ email_address?: string; emailAddress?: string }>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveUserEmail(user: AuthUserClaims): string | undefined {
  const direct = user.email || user.email_address || user.emailAddress;
  if (direct) return normalizeEmail(direct);

  const firstEmail = user.email_addresses?.[0];
  if (!firstEmail) return undefined;

  const nested = firstEmail.email_address || firstEmail.emailAddress;
  if (!nested) return undefined;
  return normalizeEmail(nested);
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
