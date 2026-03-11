import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAuthOrBypass, DEV_USER_ID } from '@/lib/dev-auth';

describe('useAuthOrBypass', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH;
  const storage = new Map<string, string>();

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_BYPASS_AUTH = 'false';
    sessionStorage.clear();
    storage.clear();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.NEXT_PUBLIC_BYPASS_AUTH = originalBypass;
    sessionStorage.clear();
    storage.clear();
  });

  it('returns Clerk auth when bypass is disabled', () => {
    const result = useAuthOrBypass({
      userId: 'user_real',
      orgId: 'org_real',
      isLoaded: true,
    });

    expect(result).toEqual({
      userId: 'user_real',
      orgId: 'org_real',
      isLoaded: true,
      isDevelopmentBypass: false,
    });
  });

  it('returns bypass auth when bypass is enabled and no Clerk user is present', () => {
    process.env.NEXT_PUBLIC_BYPASS_AUTH = 'true';

    const result = useAuthOrBypass({
      userId: null,
      orgId: null,
      isLoaded: true,
    });

    expect(result.userId).toBe(DEV_USER_ID);
    expect(result.orgId).toBe('dev_org_test_987654321');
    expect(result.isDevelopmentBypass).toBe(true);
  });

  it('prefers real Clerk auth over bypass when the user is signed in', () => {
    process.env.NEXT_PUBLIC_BYPASS_AUTH = 'true';

    const result = useAuthOrBypass({
      userId: 'user_real',
      orgId: 'org_real',
      isLoaded: true,
    });

    expect(result).toEqual({
      userId: 'user_real',
      orgId: 'org_real',
      isLoaded: true,
      isDevelopmentBypass: false,
    });
  });

  it('does not enable bypass before Clerk finishes loading', () => {
    process.env.NEXT_PUBLIC_BYPASS_AUTH = 'true';

    const result = useAuthOrBypass({
      userId: undefined,
      orgId: undefined,
      isLoaded: false,
    });

    expect(result).toEqual({
      userId: null,
      orgId: null,
      isLoaded: false,
      isDevelopmentBypass: false,
    });
  });

  it('enables bypass before Clerk finishes loading when the perf harness token is present', () => {
    process.env.NEXT_PUBLIC_BYPASS_AUTH = 'true';
    localStorage.setItem('__perf_auth_token', 'token_123');
    localStorage.setItem('__perf_principal_id', 'user_perf');

    const result = useAuthOrBypass({
      userId: undefined,
      orgId: undefined,
      isLoaded: false,
    });

    expect(result).toEqual({
      userId: DEV_USER_ID,
      orgId: 'dev_org_test_987654321',
      isLoaded: true,
      isDevelopmentBypass: true,
    });
  });
});
