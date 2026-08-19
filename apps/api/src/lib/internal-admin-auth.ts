import { env } from './env.js';
import { normalizeEmail, resolveUserEmail, type AuthUserClaims } from './authorization.js';

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

export interface InternalAdminAllowlist {
  userIds: string[];
  emails: string[];
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
