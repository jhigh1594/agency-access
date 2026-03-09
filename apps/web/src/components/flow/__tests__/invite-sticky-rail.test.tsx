import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InviteStickyRail } from '../invite-sticky-rail';

describe('InviteStickyRail', () => {
  it('renders a compact request summary instead of multiple same-weight cards', () => {
    render(
      <InviteStickyRail
        objective="Connect remaining platforms"
        securityNote="OAuth only, no password sharing"
        identities={[{ label: 'Invite email', value: 'ops@example.com' }]}
        completedCount={1}
        totalCount={3}
        actionStatus={{ label: 'Continue', disabledReason: 'Complete current step first' }}
      />
    );

    expect(screen.getByText('Request details')).toBeInTheDocument();
    expect(screen.getByText('Connect remaining platforms')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 complete')).toBeInTheDocument();
    expect(screen.getByText('Complete current step first')).toBeInTheDocument();
    expect(screen.queryByText('Objective')).not.toBeInTheDocument();
    expect(screen.queryByText('Security')).not.toBeInTheDocument();
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /visit support/i })).toHaveAttribute('href', '/contact');
  });
});
