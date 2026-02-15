import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ManageSubscriptionCard } from '../manage-subscription-card';

const mockUseSubscription = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('@/lib/query/billing', () => ({
  useSubscription: () => mockUseSubscription(),
  useUpgradeSubscription: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../cancel-subscription-modal', () => ({
  CancelSubscriptionModal: () => null,
}));

describe('ManageSubscriptionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({
      tier: 'AGENCY',
      status: 'active',
    });
  });

  it('shows Growth/Scale labels in tier selector instead of Starter/Agency', async () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub_123',
        tier: 'STARTER',
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
    });

    render(<ManageSubscriptionCard />);

    fireEvent.click(screen.getByRole('button', { name: /change plan/i }));

    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getAllByText('Scale').length).toBeGreaterThan(0);
    expect(screen.queryByText('Starter')).not.toBeInTheDocument();
    expect(screen.queryByText('Agency')).not.toBeInTheDocument();
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  it('uses new tier label in success copy after plan change', async () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub_456',
        tier: 'STARTER',
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
    });

    render(<ManageSubscriptionCard />);

    fireEvent.click(screen.getByRole('button', { name: /change plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /Scale.*93\.33\/month/i }));
    fireEvent.click(screen.getByRole('button', { name: /Upgrade Now/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        newTier: 'AGENCY',
        updateBehavior: 'next-cycle',
      });
    });

    expect(screen.getByText(/Successfully upgraded to Scale/i)).toBeInTheDocument();
    expect(screen.queryByText(/Successfully upgraded to Agency/i)).not.toBeInTheDocument();
  });

  it('does not show legacy tier options when current tier is PRO', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub_789',
        tier: 'PRO',
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
    });

    render(<ManageSubscriptionCard />);
    fireEvent.click(screen.getByRole('button', { name: /change plan/i }));

    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getAllByText('Scale').length).toBeGreaterThan(0);
    expect(screen.queryByText(/legacy/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  it('treats Free as below Growth so Growth is an upgrade (not downgrade)', () => {
    mockUseSubscription.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<ManageSubscriptionCard />);

    expect(screen.queryByRole('button', { name: /cancel subscription/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /change plan/i }));

    expect(screen.getByRole('button', { name: /Growth.*Upgrade/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Growth.*Downgrade/i })).not.toBeInTheDocument();
  });

  it('does not show action buttons until a tier is selected', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub_999',
        tier: 'STARTER',
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
    });

    render(<ManageSubscriptionCard />);

    fireEvent.click(screen.getByRole('button', { name: /change plan/i }));

    expect(screen.queryByRole('button', { name: /upgrade now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /downgrade now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument();
  });
});
