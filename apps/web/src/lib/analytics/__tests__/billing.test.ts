import { describe, it, expect, beforeEach, vi } from 'vitest';

const { captureMock } = vi.hoisted(() => ({
  captureMock: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: captureMock,
  },
}));

import { trackBillingEvent } from '../billing';

describe('trackBillingEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).analytics;
  });

  it('captures billing events in PostHog', () => {
    trackBillingEvent('billing_page_viewed', {
      lifecycle: 'FREE',
      surface: 'billing_tab',
    });

    expect(captureMock).toHaveBeenCalledWith('billing_page_viewed', {
      lifecycle: 'FREE',
      surface: 'billing_tab',
    });
  });

  it('forwards billing events to legacy analytics when available', () => {
    const legacyTrack = vi.fn();
    (window as any).analytics = { track: legacyTrack };

    trackBillingEvent('billing_primary_cta_clicked', {
      lifecycle: 'TRIALING',
      surface: 'billing_hero',
    });

    expect(legacyTrack).toHaveBeenCalledWith('billing_primary_cta_clicked', {
      lifecycle: 'TRIALING',
      surface: 'billing_hero',
    });
  });
});
