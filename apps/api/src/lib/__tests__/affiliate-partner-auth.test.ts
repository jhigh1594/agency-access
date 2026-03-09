import { describe, expect, it } from 'vitest';

import { resolveAffiliatePartnerPrincipal } from '../affiliate-partner-auth.js';

describe('resolveAffiliatePartnerPrincipal', () => {
  it('returns UNAUTHORIZED when user context is missing', () => {
    const result = resolveAffiliatePartnerPrincipal(undefined);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns UNAUTHORIZED when authenticated claims do not include an email', () => {
    const result = resolveAffiliatePartnerPrincipal({
      sub: 'user_1',
    });

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('normalizes the user email and returns the partner principal', () => {
    const result = resolveAffiliatePartnerPrincipal({
      sub: 'user_1',
      email: 'Partner@Example.com',
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      userId: 'user_1',
      email: 'partner@example.com',
    });
  });
});
