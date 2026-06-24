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
    next: () => ({ passedThrough: true }),
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

  it('does not protect public company and guide pages', async () => {
    const { default: proxy } = await import('../proxy');

    for (const path of ['/about', '/guides/meta-ads-access', '/guides/google-ads-access']) {
      protectMock.mockClear();

      await proxy(
        { protect: protectMock },
        new Request(`https://authhub.test${path}`),
      );

      expect(protectMock).not.toHaveBeenCalled();
    }
  });

  it('does not protect Clerk auth entry pages', async () => {
    const { default: proxy } = await import('../proxy');

    for (const path of ['/sign-in', '/sign-up']) {
      protectMock.mockClear();

      await proxy(
        { protect: protectMock },
        new Request(`https://authhub.test${path}`),
      );

      expect(protectMock).not.toHaveBeenCalled();
    }
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

  it('returns 404 for internal harness routes in production', async () => {
    process.env.NODE_ENV = 'production';
    const { default: proxy } = await import('../proxy');

    const response = await proxy(
      { protect: protectMock },
      new Request('https://authhub.test/test/access-request'),
    );

    expect(response).toMatchObject({ status: 404 });
    expect(protectMock).not.toHaveBeenCalled();
  });
});
