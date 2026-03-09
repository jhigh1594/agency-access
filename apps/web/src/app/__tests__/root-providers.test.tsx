import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RootProviders } from '../root-providers';

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

vi.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

const trackAffiliateEventMock = vi.fn();
vi.mock('@/lib/analytics/affiliate', () => ({
  trackAffiliateEvent: (...args: any[]) => trackAffiliateEventMock(...args),
}));

describe('RootProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    });
    document.cookie = 'ah_aff_click=; Max-Age=0; Path=/';
    document.cookie = 'ah_aff_click_pending=; Max-Age=0; Path=/';
  });

  it('keeps the root shell limited to Clerk so marketing routes avoid app-only hydration work', () => {
    render(
      <RootProviders>
        <div>Child</div>
      </RootProviders>
    );

    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
    expect(screen.queryByTestId('query-provider')).not.toBeInTheDocument();
    expect(screen.queryByTestId('theme-provider')).not.toBeInTheDocument();
  });

  it('tracks a pending affiliate referral click once on load', () => {
    document.cookie = 'ah_aff_click=click_123; path=/';
    document.cookie = 'ah_aff_click_pending=1; path=/';

    render(
      <RootProviders>
        <div>Child</div>
      </RootProviders>
    );

    expect(trackAffiliateEventMock).toHaveBeenCalledWith('affiliate_referral_clicked', {
      source: 'first_party_redirect',
    });
    expect(document.cookie).not.toContain('ah_aff_click_pending=1');
  });
});
