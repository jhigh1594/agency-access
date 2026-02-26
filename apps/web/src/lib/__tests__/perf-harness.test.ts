import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readPerfHarnessContext, startPerfTimer } from '../perf-harness';

describe('readPerfHarnessContext', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const storage = new Map<string, string>();

  beforeEach(() => {
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
    storage.clear();
  });

  it('returns null when no perf token is present', () => {
    process.env.NODE_ENV = 'development';

    expect(readPerfHarnessContext()).toBeNull();
  });

  it('returns token and principal id when present', () => {
    process.env.NODE_ENV = 'development';
    window.localStorage.setItem('__perf_auth_token', 'token_123');
    window.localStorage.setItem('__perf_principal_id', 'user_123');

    expect(readPerfHarnessContext()).toEqual({
      token: 'token_123',
      principalId: 'user_123',
    });
  });

  it('returns null in production mode even with token', () => {
    process.env.NODE_ENV = 'production';
    window.localStorage.setItem('__perf_auth_token', 'token_123');

    expect(readPerfHarnessContext()).toBeNull();
  });
});

describe('startPerfTimer', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns null in production', () => {
    process.env.NODE_ENV = 'production';

    expect(startPerfTimer('dashboard:test')).toBeNull();
  });

  it('starts and ends a unique console timer in development', () => {
    process.env.NODE_ENV = 'development';
    const startSpy = vi.spyOn(console, 'time').mockImplementation(() => {});
    const endSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => {});

    const stopA = startPerfTimer('dashboard:test');
    const stopB = startPerfTimer('dashboard:test');

    stopA?.();
    stopB?.();

    expect(startSpy).toHaveBeenCalledTimes(2);
    expect(endSpy).toHaveBeenCalledTimes(2);
    expect(startSpy.mock.calls[0][0]).not.toEqual(startSpy.mock.calls[1][0]);

    startSpy.mockRestore();
    endSpy.mockRestore();
  });
});
