import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrialBanner } from '../trial-banner';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('TrialBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to billing tab when Subscribe Now is clicked', () => {
    render(
      <TrialBanner
        trialEnd={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
        tierName="Growth"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /subscribe now/i }));

    expect(pushMock).toHaveBeenCalledWith('/settings?tab=billing');
  });
});
