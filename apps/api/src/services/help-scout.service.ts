import { createHmac } from 'node:crypto';
import { ClerkClient, createClerkClient } from '@clerk/backend';
import { env } from '@/lib/env';

interface HelpScoutBeaconIdentity {
  name: string;
  email: string;
  signature: string;
}

interface HelpScoutServiceResult {
  data: HelpScoutBeaconIdentity | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}

let clerkClient: ClerkClient | null = null;

function getClerkClient(): ClerkClient {
  if (!clerkClient) {
    clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  }

  return clerkClient;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveEmail(user: {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }> | null;
}): string | undefined {
  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  if (primaryEmail) {
    return normalizeEmail(primaryEmail);
  }

  const fallbackEmail = user.emailAddresses?.find(address => address.emailAddress)?.emailAddress;
  return fallbackEmail ? normalizeEmail(fallbackEmail) : undefined;
}

function resolveName(
  user: {
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
  email: string
): string {
  if (user.fullName?.trim()) {
    return user.fullName.trim();
  }

  const fallbackName = [user.firstName, user.lastName]
    .filter((part): part is string => !!part?.trim())
    .join(' ')
    .trim();

  return fallbackName || email;
}

async function getBeaconIdentity(clerkUserId: string): Promise<HelpScoutServiceResult> {
  if (!env.HELPSCOUT_BEACON_SECRET) {
    return {
      data: null,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Help Scout Beacon secure mode is not configured',
      },
    };
  }

  if (!clerkUserId) {
    return {
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated user context is required',
      },
    };
  }

  try {
    const user = await getClerkClient().users.getUser(clerkUserId);
    const email = resolveEmail(user);

    if (!email) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Authenticated user email not available for Help Scout Beacon',
        },
      };
    }

    return {
      data: {
        name: resolveName(user, email),
        email,
        signature: createHmac('sha256', env.HELPSCOUT_BEACON_SECRET).update(email).digest('hex'),
      },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        code: 'CLERK_FETCH_FAILED',
        message: 'Failed to fetch authenticated user for Help Scout Beacon',
        details: error?.message,
      },
    };
  }
}

export const helpScoutService = {
  getBeaconIdentity,
};
