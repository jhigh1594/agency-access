import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitePrimaryActionDock } from '../invite-primary-action-dock';

describe('InvitePrimaryActionDock', () => {
  it('renders a persistent action summary with the primary CTA', async () => {
    const onAction = vi.fn();

    render(
      <InvitePrimaryActionDock
        title="Ready to continue?"
        description="You will choose which accounts to share next."
        actionLabel="Continue to connect"
        onAction={onAction}
      />
    );

    expect(screen.getByText(/ready to continue/i)).toBeInTheDocument();
    expect(screen.getByText(/choose which accounts to share next/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continue to connect/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
