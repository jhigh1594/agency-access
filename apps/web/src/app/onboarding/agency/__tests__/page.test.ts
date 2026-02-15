import { describe, expect, it, vi } from 'vitest';
import AgencyOnboardingRedirect from '../page';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

describe('AgencyOnboardingRedirect', () => {
  it('redirects to unified onboarding with tier passthrough', () => {
    AgencyOnboardingRedirect({
      searchParams: { tier: 'AGENCY' },
    });

    expect(redirectMock).toHaveBeenCalledWith('/onboarding/unified?tier=AGENCY');
  });

  it('redirects to unified onboarding without query when tier is missing', () => {
    AgencyOnboardingRedirect({});

    expect(redirectMock).toHaveBeenCalledWith('/onboarding/unified');
  });
});
