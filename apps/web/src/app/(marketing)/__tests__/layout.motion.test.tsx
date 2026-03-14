import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarketingLayout from '../layout';

vi.mock('framer-motion', () => ({
  LazyMotion: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marketing-motion-provider">{children}</div>
  ),
  domAnimation: {},
}));

vi.mock('@/components/marketing/marketing-shell-effects', () => ({
  MarketingShellEffects: () => <div data-testid="marketing-shell-effects" />,
}));

vi.mock('@/components/marketing/marketing-nav', () => ({
  MarketingNav: () => <div data-testid="marketing-nav" />,
}));

vi.mock('@/components/marketing/marketing-footer', () => ({
  MarketingFooter: () => <div data-testid="marketing-footer" />,
}));

describe('MarketingLayout', () => {
  it('provides a framer-motion feature boundary for marketing sections that use `m` and viewport animations', () => {
    render(
      <MarketingLayout>
        <div>Content</div>
      </MarketingLayout>
    );

    expect(screen.getByTestId('marketing-motion-provider')).toBeInTheDocument();
    expect(screen.getByTestId('marketing-shell-effects')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
