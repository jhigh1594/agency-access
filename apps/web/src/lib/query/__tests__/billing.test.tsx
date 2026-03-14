import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();
const useMutationMock = vi.fn();
const trackAffiliateEventMock = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: (options: any) => useMutationMock(options),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock('@/lib/analytics/affiliate', () => ({
  trackAffiliateEvent: (...args: any[]) => trackAffiliateEventMock(...args),
}));

import { useCreateCheckout } from '../billing';

describe('useCreateCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      orgId: 'org_123',
      userId: 'user_123',
      getToken: vi.fn().mockResolvedValue('token_123'),
    });
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          checkoutUrl: 'https://checkout.example.com/session',
        },
      }),
    });
    document.cookie = 'ah_aff_click=; Max-Age=0; Path=/';
  });

  it('tracks affiliate checkout starts when an affiliate click cookie is present', async () => {
    document.cookie = 'ah_aff_click=click_123; path=/';

    const { result } = renderHook(() => useCreateCheckout());

    await act(async () => {
      await result.current.mutateAsync({
        tier: 'STARTER',
        billingInterval: 'monthly',
        successUrl: 'https://app.example.com/success',
        cancelUrl: 'https://app.example.com/cancel',
      });
    });

    expect(trackAffiliateEventMock).toHaveBeenCalledWith('affiliate_checkout_started', {
      source: 'affiliate_cookie',
      surface: 'billing_checkout',
      targetTier: 'STARTER',
      interval: 'monthly',
    });
  });
});
