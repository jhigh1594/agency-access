import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InviteStickyRail } from '../invite-sticky-rail';

describe('InviteStickyRail', () => {
  it('renders completion summary and disabled reason', () => {
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

    expect(screen.getByText('Connect remaining platforms')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 complete')).toBeInTheDocument();
    expect(screen.getByText('Complete current step first')).toBeInTheDocument();
  });
});
