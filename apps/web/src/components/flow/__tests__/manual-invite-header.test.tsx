import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ManualInviteHeader } from '../manual-invite-header';

describe('ManualInviteHeader', () => {
  it('uses the compact invite hero pattern and hides secondary stats on mobile', () => {
    const { container } = render(
      <ManualInviteHeader
        agencyName="Sable Studio"
        platformName="Beehiiv"
        clientName="Jon"
        clientEmail="jon@example.com"
        securityNote="Use only Beehiiv-native invite screens."
      />
    );

    expect(container.querySelector('[data-density="compact"]')).toBeTruthy();
    const inlineStats = container.querySelector('[data-stats-layout="inline"]');
    expect(inlineStats).toHaveAttribute('data-hide-on-mobile', 'true');
    expect(screen.getByText(/manual invite/i)).toBeInTheDocument();
  });
});
