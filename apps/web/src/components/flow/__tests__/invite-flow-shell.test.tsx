import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InviteFlowShell } from '../invite-flow-shell';

describe('InviteFlowShell', () => {
  it('renders the main task before the mobile rail and exposes a collapsible rail summary', () => {
    const { container } = render(
      <InviteFlowShell
        title="Share account access"
        description="Review and continue"
        layoutMode="split"
        rail={<div>Rail content</div>}
      >
        <div>Main content</div>
      </InviteFlowShell>
    );

    expect(container.innerHTML.indexOf('Main content')).toBeLessThan(container.innerHTML.indexOf('Rail content'));
    expect(screen.getByText(/request details and support/i)).toBeInTheDocument();
  });

  it('can hide step chips on mobile while keeping the compact progress summary', () => {
    const { container } = render(
      <InviteFlowShell
        title="Complete Google access"
        description="Finish the current platform"
        density="compact"
        hideStepChipsOnMobile
      >
        <div>Main content</div>
      </InviteFlowShell>
    );

    const steps = container.querySelector('[data-hide-on-mobile="true"]');
    expect(steps).toBeTruthy();
    expect(steps?.className).toContain('hidden');
    expect(steps?.className).toContain('sm:grid');
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });
});
