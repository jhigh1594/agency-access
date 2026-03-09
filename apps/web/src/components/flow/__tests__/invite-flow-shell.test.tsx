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
});
