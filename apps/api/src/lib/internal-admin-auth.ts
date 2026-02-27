import { env } from './env.js';

export interface InternalAdminUser {
  userId: string;
  email?: string;
}

export interface InternalAdminAuthError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  message: string;
}

export interface InternalAdminAuthResult {
  data: InternalAdminUser | null;
  error: InternalAdminAuthError | null;
}

interface AuthUserClaims {
  sub?: string;
  email?: string;
  email_address?: string;
  emailAddress?: string;
  email_addresses?: Array<{ email_address?: string; emailAddress?: string }>;
}

interface InternalAdminAllowlist {
  userIds: string[];
  emails: string[];
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

export function resolveInternalAdminUser(
  user: AuthUserClaims | undefined,
  allowlist: InternalAdminAllowlist = {
    userIds: env.INTERNAL_ADMIN_USER_IDS,
    emails: env.INTERNAL_ADMIN_EMAILS,
  },
): InternalAdminAuthResult {
  const userId = user?.sub;
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated user context is required',
      },
    };
  }

  const normalizedEmails = allowlist.emails.map(normalizeEmail);
  const email = resolveUserEmail(user);
  const allowedById = allowlist.userIds.includes(userId);
  const allowedByEmail = email ? normalizedEmails.includes(email) : false;

  if (!allowedById && !allowedByEmail) {
    return {
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'Internal admin access is required',
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
