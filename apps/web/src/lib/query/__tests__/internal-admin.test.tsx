import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();
const invalidateQueries = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => useQueryMock(options),
  useMutation: (options: any) => useMutationMock(options),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

import {
  useInternalAdminAdjustAffiliateCommission,
  useInternalAdminAffiliateFraudQueue,
  useInternalAdminAffiliatePayoutBatches,
  useInternalAdminWebhookDetail,
  useInternalAdminWebhookEndpoints,
  useInternalAdminAffiliatePartnerDetail,
  useInternalAdminAffiliatePartners,
  useInternalAdminDisableAffiliateLink,
  useInternalAdminDisqualifyAffiliateReferral,
  useInternalAdminExportAffiliatePayoutBatch,
  useInternalAdminGenerateAffiliatePayoutBatch,
  useInternalAdminResolveAffiliateReferralReview,
  useInternalAdminUpdateAffiliatePartner,
} from '../internal-admin';

describe('internal admin affiliate query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      getToken: vi.fn().mockResolvedValue('admin-token'),
    });
  });

  it('fetches affiliate partners for review', async () => {
    let capturedOptions: any;
    useQueryMock.mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          items: [
            {
              id: 'partner_1',
              name: 'Partner One',
              email: 'partner@example.com',
              companyName: 'Growth Studio',
              websiteUrl: 'https://growth.example.com',
              audienceSize: '10k_to_50k',
              status: 'applied',
              applicationNotes: 'Newsletter plus LinkedIn',
              defaultCommissionBps: 3000,
              commissionDurationMonths: 12,
              appliedAt: '2026-03-01T00:00:00.000Z',
              approvedAt: null,
              rejectedAt: null,
              disabledAt: null,
              referralCount: 0,
              commissionCount: 0,
              linkCount: 0,
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        },
      }),
    });

    renderHook(() => useInternalAdminAffiliatePartners({ status: 'applied' }));

    const data = await capturedOptions.queryFn();
    expect(data.items).toHaveLength(1);
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal-admin/affiliate/partners?status=applied'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
  });

  it('fetches affiliate payout batches for admin ops', async () => {
    let capturedOptions: any;
    useQueryMock.mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          items: [
            {
              id: 'batch_1',
              status: 'draft',
              currency: 'usd',
              totalAmount: 7500,
              commissionCount: 3,
              periodStart: '2026-02-01T00:00:00.000Z',
              periodEnd: '2026-02-28T23:59:59.999Z',
              notes: 'February payout run',
              exportedAt: null,
              paidAt: null,
              createdAt: '2026-03-01T00:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      }),
    });

    renderHook(() => useInternalAdminAffiliatePayoutBatches({ status: 'draft', limit: 10 }));

    const data = await capturedOptions.queryFn();
    expect(data.items[0].id).toBe('batch_1');
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal-admin/affiliate/payout-batches?status=draft&limit=10'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
  });

  it('fetches the affiliate fraud review queue', async () => {
    let capturedOptions: any;
    useQueryMock.mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          referrals: [
            {
              id: 'referral_1',
              partnerId: 'partner_1',
              partnerName: 'Partner One',
              referredAgencyId: 'agency_1',
              referredAgencyName: 'Acme Agency',
              status: 'review_required',
              riskReasons: ['same_company_domain'],
              createdAt: '2026-03-02T00:00:00.000Z',
              qualifiedAt: null,
              commissionCount: 2,
            },
          ],
          commissions: [],
          counts: {
            flaggedReferrals: 1,
            flaggedCommissions: 0,
          },
        },
      }),
    });

    renderHook(() => useInternalAdminAffiliateFraudQueue());

    const data = await capturedOptions.queryFn();
    expect(data.counts.flaggedReferrals).toBe(1);
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal-admin/affiliate/fraud-queue'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
  });

  it('updates an affiliate partner review decision', async () => {
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          id: 'partner_1',
          status: 'approved',
        },
      }),
    });

    const { result } = renderHook(() => useInternalAdminUpdateAffiliatePartner());

    await act(async () => {
      const payload = await result.current.mutateAsync({
        partnerId: 'partner_1',
        status: 'approved',
        internalNotes: 'Strong fit for pilot cohort',
      });

      expect(payload.status).toBe('approved');
    });
  });

  it('generates an affiliate payout batch', async () => {
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          id: 'batch_1',
          status: 'draft',
          currency: 'usd',
          totalAmount: 7500,
          commissionCount: 3,
          periodStart: '2026-02-01T00:00:00.000Z',
          periodEnd: '2026-02-28T23:59:59.999Z',
          notes: 'February payout run',
          exportedAt: null,
          paidAt: null,
          createdAt: '2026-03-01T00:00:00.000Z',
        },
      }),
    });

    const { result } = renderHook(() => useInternalAdminGenerateAffiliatePayoutBatch());

    await act(async () => {
      const payload = await result.current.mutateAsync({
        periodStart: '2026-02-01T00:00:00.000Z',
        periodEnd: '2026-02-28T23:59:59.999Z',
        notes: 'February payout run',
      });

      expect(payload.id).toBe('batch_1');
    });
  });

  it('fetches affiliate partner detail', async () => {
    let capturedOptions: any;
    useQueryMock.mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          partner: {
            id: 'partner_1',
            name: 'Partner One',
            email: 'partner@example.com',
            companyName: 'Growth Studio',
            websiteUrl: 'https://growth.example.com',
            audienceSize: '10k_to_50k',
            status: 'approved',
            applicationNotes: 'Newsletter plus LinkedIn',
            defaultCommissionBps: 3000,
            commissionDurationMonths: 12,
            appliedAt: '2026-03-01T00:00:00.000Z',
            approvedAt: '2026-03-08T00:00:00.000Z',
            rejectedAt: null,
            disabledAt: null,
            referralCount: 2,
            commissionCount: 3,
            linkCount: 1,
          },
          metrics: {
            clicks: 12,
            referrals: 2,
            commissions: 3,
            pendingCommissionCents: 4500,
            paidCommissionCents: 2400,
          },
          links: [],
          referrals: [],
          commissions: [],
        },
      }),
    });

    renderHook(() => useInternalAdminAffiliatePartnerDetail('partner_1'));

    const data = await capturedOptions.queryFn();
    expect(data.partner.id).toBe('partner_1');
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal-admin/affiliate/partners/partner_1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
  });

  it('disables an affiliate link', async () => {
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          id: 'link_1',
          status: 'disabled',
        },
      }),
    });

    const { result } = renderHook(() => useInternalAdminDisableAffiliateLink());

    await act(async () => {
      const payload = await result.current.mutateAsync({
        linkId: 'link_1',
        internalNotes: 'Campaign link was misleading',
      });

      expect(payload.status).toBe('disabled');
    });
  });

  it('exports an affiliate payout batch', async () => {
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          batchId: 'batch_1',
          fileName: 'affiliate-payout-batch-batch_1.csv',
          exportedAt: '2026-03-08T12:00:00.000Z',
          rowCount: 2,
          csv: 'partner_id,partner_name\npartner_1,Alpha Partner',
        },
      }),
    });

    const { result } = renderHook(() => useInternalAdminExportAffiliatePayoutBatch());

    await act(async () => {
      const payload = await result.current.mutateAsync({
        batchId: 'batch_1',
      });

      expect(payload.fileName).toBe('affiliate-payout-batch-batch_1.csv');
      expect(payload.rowCount).toBe(2);
    });
  });

  it('resolves an affiliate referral review', async () => {
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          id: 'referral_1',
          status: 'qualified',
        },
      }),
    });

    const { result } = renderHook(() => useInternalAdminResolveAffiliateReferralReview());

    await act(async () => {
      const payload = await result.current.mutateAsync({
        referralId: 'referral_1',
        resolution: 'clear',
        reason: 'validated billing owner match after manual review',
        internalNotes: 'Matched purchaser identity and allowed payout flow to continue.',
      });

      expect(payload.status).toBe('qualified');
    });
  });

  it('adjusts an affiliate commission', async () => {
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          id: 'commission_1',
          status: 'approved',
          amount: 3200,
        },
      }),
    });

    const { result } = renderHook(() => useInternalAdminAdjustAffiliateCommission());

    await act(async () => {
      const payload = await result.current.mutateAsync({
        commissionId: 'commission_1',
        amountCents: 3200,
        status: 'approved',
        internalNotes: 'Restored amount after manual validation',
      });

      expect(payload.status).toBe('approved');
      expect(payload.amount).toBe(3200);
    });
  });

  it('disqualifies an affiliate referral', async () => {
    useMutationMock.mockImplementation((options: any) => ({
      mutateAsync: options.mutationFn,
    }));
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          id: 'referral_1',
          status: 'disqualified',
        },
      }),
    });

    const { result } = renderHook(() => useInternalAdminDisqualifyAffiliateReferral());

    await act(async () => {
      const payload = await result.current.mutateAsync({
        referralId: 'referral_1',
        reason: 'self_referral_email',
        internalNotes: 'Matched operator review evidence',
      });

      expect(payload.status).toBe('disqualified');
    });
  });

  it('fetches webhook endpoints for internal support', async () => {
    let capturedOptions: any;
    useQueryMock.mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: [
          {
            id: 'endpoint_1',
            agencyId: 'agency_1',
            url: 'https://hooks.example.com/webhooks',
            status: 'active',
            subscribedEvents: ['webhook.test'],
            failureCount: 0,
            secretLastFour: '1234',
            lastDeliveredAt: null,
            lastFailedAt: null,
            createdAt: '2026-03-08T00:00:00.000Z',
            updatedAt: '2026-03-08T00:00:00.000Z',
            agency: {
              id: 'agency_1',
              name: 'Agency One',
              email: 'agency@example.com',
            },
          },
        ],
      }),
    });

    renderHook(() => useInternalAdminWebhookEndpoints({ status: 'active', limit: 25 }));

    const data = await capturedOptions.queryFn();
    expect(data).toHaveLength(1);
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal-admin/webhooks?status=active&limit=25'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
  });

  it('fetches webhook delivery detail for a selected agency', async () => {
    let capturedOptions: any;
    useQueryMock.mockImplementation((options: any) => {
      capturedOptions = options;
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          endpoint: {
            id: 'endpoint_1',
            agencyId: 'agency_1',
            url: 'https://hooks.example.com/webhooks',
            status: 'disabled',
            subscribedEvents: ['access_request.completed'],
            failureCount: 2,
            secretLastFour: '1234',
            lastDeliveredAt: null,
            lastFailedAt: '2026-03-08T00:00:00.000Z',
            createdAt: '2026-03-08T00:00:00.000Z',
            updatedAt: '2026-03-08T00:00:00.000Z',
          },
          deliveries: [],
        },
      }),
    });

    renderHook(() => useInternalAdminWebhookDetail('agency_1', 15));

    const data = await capturedOptions.queryFn();
    expect(data.endpoint.id).toBe('endpoint_1');
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal-admin/webhooks/agency_1?limit=15'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
  });
});
