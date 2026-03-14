import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InviteHeroHeader } from '../invite-hero-header';

describe('InviteHeroHeader', () => {
  it('supports compact inline stats for action-first invite layouts', () => {
    const { container } = render(
      <InviteHeroHeader
        eyebrow="Request for Jon"
        title="Share account access"
        description="Review the request and continue."
        badge="Platform-native access only"
        stats={[
          { label: 'Requested by', value: 'Demo Agency' },
          { label: 'Platforms', value: 'Google, Mailchimp' },
        ]}
        density="compact"
        statsLayout="inline"
      />
    );

    expect(container.querySelector('[data-density="compact"]')).toBeTruthy();
    expect(container.querySelector('[data-stats-layout="inline"]')).toBeTruthy();
    expect(screen.getByText('Requested by')).toBeInTheDocument();
    expect(screen.getByText('Platforms')).toBeInTheDocument();
  });

  it('can hide inline stats on mobile when the current task needs the first viewport', () => {
    const { container } = render(
      <InviteHeroHeader
        eyebrow="Request for Jon"
        title="Complete Google access"
        description="Finish Google first."
        stats={[
          { label: 'Platforms', value: 'Google, Beehiiv' },
          { label: 'Next', value: 'Complete Google' },
        ]}
        density="compact"
        statsLayout="inline"
        hideInlineStatsOnMobile
      />
    );

    const inlineStats = container.querySelector('[data-stats-layout="inline"]');
    expect(inlineStats).toHaveAttribute('data-hide-on-mobile', 'true');
    expect(inlineStats?.className).toContain('hidden');
    expect(inlineStats?.className).toContain('sm:flex');
  });
});
