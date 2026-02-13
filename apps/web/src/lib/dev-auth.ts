/**
 * Development Authentication Bypass
 *
 * When NEXT_PUBLIC_BYPASS_AUTH=true, this provides mock authentication
 * for browser automation and testing without requiring actual Clerk sign-in.
 */

export const DEV_USER_ID = 'dev_user_test_123456789';
const DEV_ORG_ID = 'dev_org_test_987654321';

const DEV_BYPASS_SIGNED_OUT_KEY = 'dev_bypass_signed_out';

export interface DevAuthState {
  userId: string | null;
  orgId: string | null;
  isLoaded: boolean;
  isDevelopmentBypass: boolean;
}

/**
 * Returns true if the user has signed out of dev bypass for this session.
 * When true, useAuthOrBypass treats the user as not in bypass (real Clerk state).
 */
export function isDevBypassSignedOut(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(DEV_BYPASS_SIGNED_OUT_KEY) === '1';
}

/**
 * Sign out of dev bypass for this session. Call before navigating away (e.g. to /).
 * Next time the app loads with bypass enabled, user will be unauthenticated until
 * they sign back in (e.g. via a "Dev sign in" link that clears this).
 */
export function signOutDevBypass(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DEV_BYPASS_SIGNED_OUT_KEY, '1');
}

/**
 * Clear the dev bypass signed-out state so bypass is active again (for "Dev sign in").
 */
export function clearDevBypassSignedOut(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DEV_BYPASS_SIGNED_OUT_KEY);
}

/**
 * Hook that returns either real Clerk auth or dev bypass auth
 *
 * Usage:
 * ```tsx
 * import { useAuthOrBypass } from '@/lib/dev-auth';
 * import { useAuth } from '@clerk/nextjs';
 *
 * function MyComponent() {
 *   const clerkAuth = useAuth();
 *   const auth = useAuthOrBypass(clerkAuth);
 *   // auth.userId will be set in bypass mode
 * }
 * ```
 */
export function useAuthOrBypass(clerkAuth: {
  userId: string | null | undefined;
  orgId: string | null | undefined;
  isLoaded: boolean;
}): DevAuthState {
  const envBypass =
    process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' &&
    process.env.NODE_ENV === 'development';

  const signedOut = envBypass && isDevBypassSignedOut();
  const isDevelopmentBypass = envBypass && !signedOut;

  if (isDevelopmentBypass) {
    return {
      userId: DEV_USER_ID,
      orgId: DEV_ORG_ID,
      isLoaded: true,
      isDevelopmentBypass: true,
    };
  }

  return {
    userId: clerkAuth.userId ?? null,
    orgId: clerkAuth.orgId ?? null,
    isLoaded: clerkAuth.isLoaded,
    isDevelopmentBypass: false,
  };
}

/**
 * Get mock user data for API calls in bypass mode
 * This matches the structure of agency creation responses
 */
export function getDevBypassAgencyData() {
  return {
    id: 'dev_agency_123456789',
    name: 'Dev Test Agency',
    slug: 'dev-test-agency',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
