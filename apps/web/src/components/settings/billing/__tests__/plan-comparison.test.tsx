import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PlanComparison } from '../plan-comparison';

const mockUseSubscription = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('@/lib/query/billing', () => ({
  useSubscription: () => mockUseSubscription(),
  useCreateCheckout: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('PlanComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks Growth as current plan for STARTER subscriptions', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub_123',
        tier: 'STARTER',
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
    });

    render(<PlanComparison />);

    const growthCard = screen.getByRole('heading', { name: 'Growth' }).closest('div.relative');
    expect(growthCard).toBeTruthy();
    expect(within(growthCard as HTMLElement).getByText('Current Plan')).toBeInTheDocument();
  });

  it('marks Scale as current plan for AGENCY subscriptions', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub_456',
        tier: 'AGENCY',
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
    });

    render(<PlanComparison />);

    const scaleCard = screen.getByRole('heading', { name: 'Scale' }).closest('div.relative');
    expect(scaleCard).toBeTruthy();
    expect(within(scaleCard as HTMLElement).getByText('Current Plan')).toBeInTheDocument();
  });

  it('maps PRO subscriptions to Scale current plan display', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        id: 'sub_789',
        tier: 'PRO',
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
    });

    render(<PlanComparison />);

    const scaleCard = screen.getByRole('heading', { name: 'Scale' }).closest('div.relative');
    expect(scaleCard).toBeTruthy();
    expect(within(scaleCard as HTMLElement).getByText('Current Plan')).toBeInTheDocument();
  });
});
