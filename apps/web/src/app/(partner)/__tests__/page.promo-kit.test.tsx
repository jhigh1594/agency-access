import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import PartnerPortalPage from '../partners/page';

const useAffiliatePortalOverviewMock = vi.fn();
const useAffiliatePortalCommissionHistoryMock = vi.fn();
const useCreateAffiliatePortalLinkMock = vi.fn();
const writeTextMock = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>,
  useAuth: () => ({
    userId: 'user_123',
    isLoaded: true,
    getToken: vi.fn(),
  }),
}));

vi.mock('@/lib/dev-auth', () => ({
  useAuthOrBypass: () => ({
    userId: 'user_123',
    orgId: null,
    isLoaded: true,
    isDevelopmentBypass: false,
  }),
}));

vi.mock('@/lib/query/affiliate', () => ({
  useAffiliatePortalOverview: () => useAffiliatePortalOverviewMock(),
  useAffiliatePortalCommissionHistory: () => useAffiliatePortalCommissionHistoryMock(),
  useCreateAffiliatePortalLink: () => useCreateAffiliatePortalLinkMock(),
}));

describe('Partner portal promo kit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    useAffiliatePortalOverviewMock.mockReturnValue({
      data: {
        partner: {
          id: 'partner_1',
          name: 'Partner One',
          email: 'partner@example.com',
          status: 'approved',
          defaultCommissionBps: 3000,
          commissionDurationMonths: 12,
        },
        metrics: {
          clicks: 42,
          referrals: 5,
          customers: 2,
          pendingCommissionCents: 12500,
          paidCommissionCents: 6400,
        },
        primaryLink: {
          id: 'link_1',
          code: 'partner-one',
          status: 'active',
          destinationPath: '/pricing',
          campaign: null,
          url: 'https://www.authhub.co/r/partner-one',
        },
        links: [],
      },
      isLoading: false,
      error: null,
    });

    useAffiliatePortalCommissionHistoryMock.mockReturnValue({
      data: {
        commissions: [],
        payouts: [],
      },
      isLoading: false,
      error: null,
    });

    useCreateAffiliatePortalLinkMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders the partner enablement promo kit content', () => {
    render(<PartnerPortalPage />);

    expect(screen.getByText('Promo kit')).toBeInTheDocument();
    expect(screen.getByText('Email outreach swipe')).toBeInTheDocument();
    expect(screen.getByText('Social post swipe')).toBeInTheDocument();
    expect(screen.getByText('How to pitch AuthHub')).toBeInTheDocument();
  });

  it('copies the email swipe to the clipboard', async () => {
    writeTextMock.mockResolvedValue(undefined);

    render(<PartnerPortalPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy email swipe' }));
    });

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Subject:'));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('AuthHub'));
  });
});
