import { afterEach, describe, expect, it } from 'vitest';
import { buildAuthorizeUrl, buildInviteUrl, getCanonicalAppUrl } from '@/lib/app-url';

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

describe('app-url', () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
  });

  it('uses NEXT_PUBLIC_APP_URL as the canonical app origin', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://authhub.co';

    expect(getCanonicalAppUrl()).toBe('https://authhub.co');
    expect(buildInviteUrl('token-123')).toBe('https://authhub.co/invite/token-123');
    expect(buildAuthorizeUrl('token-123')).toBe('https://authhub.co/authorize/token-123');
  });

  it('falls back to authhub.co when NEXT_PUBLIC_APP_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(getCanonicalAppUrl()).toBe('https://authhub.co');
  });

  it('trims trailing slashes from NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://authhub.co/';

    expect(buildInviteUrl('token-123')).toBe('https://authhub.co/invite/token-123');
  });
});
