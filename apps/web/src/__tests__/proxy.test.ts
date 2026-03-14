import { beforeEach, describe, expect, it, vi } from 'vitest';

const protectMock = vi.fn();

vi.mock('@clerk/nextjs/server', () => {
  const createRouteMatcher = (patterns: string[]) => {
    const regexes = patterns.map((pattern) => {
      const wildcardToken = '__WILDCARD__';
      const withToken = pattern.replace(/\(\.\*\)/g, wildcardToken);
      const escaped = withToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const source = `^${escaped.replace(wildcardToken, '.*')}$`;
      return new RegExp(source);
    });

    return (request: Request) => {
      const pathname = new URL(request.url).pathname;
      return regexes.some((regex) => regex.test(pathname));
    };
  };

  return {
    clerkMiddleware: (handler: any) => handler,
    createRouteMatcher,
  };
});

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => ({ redirectedTo: url.toString() }),
  },
}));

describe('proxy public route handling', () => {
  beforeEach(() => {
    protectMock.mockReset();
    delete process.env.NEXT_PUBLIC_BYPASS_AUTH;
    process.env.NODE_ENV = 'test';
  });

  it('does not protect the public affiliate page', async () => {
    const { default: proxy } = await import('../proxy');

    await proxy(
      { protect: protectMock },
      new Request('https://authhub.test/affiliate'),
    );

    expect(protectMock).not.toHaveBeenCalled();
  });

  it('does not protect referral redirect routes', async () => {
    const { default: proxy } = await import('../proxy');

    await proxy(
      { protect: protectMock },
      new Request('https://authhub.test/r/partner-code'),
    );

    expect(protectMock).not.toHaveBeenCalled();
  });

  it('does not protect sitemap.xml (required for Google Search Console)', async () => {
    const { default: proxy } = await import('../proxy');

    await proxy(
      { protect: protectMock },
      new Request('https://authhub.test/sitemap.xml'),
    );

    expect(protectMock).not.toHaveBeenCalled();
  });

  it('does not protect robots.txt (required for crawler discovery)', async () => {
    const { default: proxy } = await import('../proxy');

    await proxy(
      { protect: protectMock },
      new Request('https://authhub.test/robots.txt'),
    );

    expect(protectMock).not.toHaveBeenCalled();
  });

  it('still protects partner portal routes', async () => {
    const { default: proxy } = await import('../proxy');

    await proxy(
      { protect: protectMock },
      new Request('https://authhub.test/partners'),
    );

    expect(protectMock).toHaveBeenCalledTimes(1);
  });

  it('does not protect dashboard routes for the local perf harness in development', async () => {
    process.env.NODE_ENV = 'development';
    const { default: proxy } = await import('../proxy');

    await proxy(
      { protect: protectMock },
      new Request('https://authhub.test/dashboard', {
        headers: {
          'x-perf-harness': '1',
        },
      }),
    );

    expect(protectMock).not.toHaveBeenCalled();
  });
});
