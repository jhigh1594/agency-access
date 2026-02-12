/**
 * Development Authentication Bypass
 *
 * When NEXT_PUBLIC_BYPASS_AUTH=true, this provides mock authentication
 * for browser automation and testing without requiring actual Clerk sign-in.
 */

export const DEV_USER_ID = 'dev_user_test_123456789';
const DEV_ORG_ID = 'dev_org_test_987654321';

export interface DevAuthState {
  userId: string | null;
  orgId: string | null;
  isLoaded: boolean;
  isDevelopmentBypass: boolean;
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
  const isDevelopmentBypass =
    process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' &&
    process.env.NODE_ENV === 'development';

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
