import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  delete process.env.NEXT_PUBLIC_DOCS_URL;
});

describe('docs url helpers', () => {
  it('defaults to the production docs hostname when env is unset', async () => {
    const { getDocsUrl } = await import('../docs-url');

    expect(getDocsUrl()).toBe('https://docs.authhub.com');
    expect(getDocsUrl('/getting-started/create-your-first-request')).toBe(
      'https://docs.authhub.com/getting-started/create-your-first-request',
    );
  });

  it('uses NEXT_PUBLIC_DOCS_URL when provided', async () => {
    process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs-preview.authhub.com/base/';

    const { getDocsUrl } = await import('../docs-url');

    expect(getDocsUrl()).toBe('https://docs-preview.authhub.com/base');
    expect(getDocsUrl('troubleshooting/common-client-blockers')).toBe(
      'https://docs-preview.authhub.com/base/troubleshooting/common-client-blockers',
    );
  });
});
