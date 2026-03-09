import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import InternalAdminAffiliatesPage from '../page';

const useInternalAdminAffiliatePartnersMock = vi.fn();
const useInternalAdminAffiliatePartnerDetailMock = vi.fn();
const useInternalAdminAffiliatePayoutBatchesMock = vi.fn();
const useInternalAdminAffiliateFraudQueueMock = vi.fn();
const updatePartnerMutationMock = vi.fn();
const disableLinkMutationMock = vi.fn();
const disqualifyReferralMutationMock = vi.fn();
const adjustCommissionMutationMock = vi.fn();
const generatePayoutBatchMutationMock = vi.fn();
const exportPayoutBatchMutationMock = vi.fn();
const resolveReferralReviewMutationMock = vi.fn();
const createObjectUrlMock = vi.fn();
const revokeObjectUrlMock = vi.fn();
const anchorClickMock = vi.fn();
let exportPayoutBatchMutationValue: { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };
let resolveReferralReviewMutationValue: { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };

vi.mock('@/lib/query/internal-admin', () => ({
  useInternalAdminAffiliatePartners: () => useInternalAdminAffiliatePartnersMock(),
  useInternalAdminAffiliatePartnerDetail: () => useInternalAdminAffiliatePartnerDetailMock(),
  useInternalAdminAffiliatePayoutBatches: () => useInternalAdminAffiliatePayoutBatchesMock(),
  useInternalAdminAffiliateFraudQueue: () => useInternalAdminAffiliateFraudQueueMock(),
  useInternalAdminUpdateAffiliatePartner: () => updatePartnerMutationMock(),
  useInternalAdminDisableAffiliateLink: () => disableLinkMutationMock(),
  useInternalAdminDisqualifyAffiliateReferral: () => disqualifyReferralMutationMock(),
  useInternalAdminAdjustAffiliateCommission: () => adjustCommissionMutationMock(),
  useInternalAdminGenerateAffiliatePayoutBatch: () => generatePayoutBatchMutationMock(),
  useInternalAdminExportAffiliatePayoutBatch: () => exportPayoutBatchMutationMock(),
  useInternalAdminResolveAffiliateReferralReview: () => resolveReferralReviewMutationMock(),
}));

describe('Internal admin affiliate payout operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    updatePartnerMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    disableLinkMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    disqualifyReferralMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    adjustCommissionMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    generatePayoutBatchMutationMock.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'batch_2' }),
      isPending: false,
    });
    exportPayoutBatchMutationValue = {
      mutateAsync: vi.fn().mockResolvedValue({
        batchId: 'batch_1',
        fileName: 'affiliate-payout-batch-batch_1.csv',
        exportedAt: '2026-03-08T12:00:00.000Z',
        rowCount: 1,
        csv: 'partner_id,partner_name\npartner_1,Alpha Partner',
      }),
      isPending: false,
    };
    exportPayoutBatchMutationMock.mockReturnValue(exportPayoutBatchMutationValue);
    resolveReferralReviewMutationValue = {
      mutateAsync: vi.fn().mockResolvedValue({
        id: 'referral_1',
        status: 'qualified',
      }),
      isPending: false,
    };
    resolveReferralReviewMutationMock.mockReturnValue(resolveReferralReviewMutationValue);

    useInternalAdminAffiliatePartnersMock.mockReturnValue({
      data: {
        items: [
          {
            id: 'partner_1',
            name: 'Alpha Partner',
            email: 'alpha@example.com',
            companyName: 'Alpha Co',
            websiteUrl: 'https://alpha.example.com',
            audienceSize: '10k_to_50k',
            status: 'approved',
            applicationNotes: 'Solid fit',
            defaultCommissionBps: 3000,
            commissionDurationMonths: 12,
            appliedAt: '2026-03-01T00:00:00.000Z',
            approvedAt: '2026-03-02T00:00:00.000Z',
            rejectedAt: null,
            disabledAt: null,
            referralCount: 2,
            commissionCount: 3,
            linkCount: 1,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
      isLoading: false,
      error: null,
    });
    useInternalAdminAffiliatePartnerDetailMock.mockReturnValue({
      data: {
        partner: {
          id: 'partner_1',
          name: 'Alpha Partner',
          email: 'alpha@example.com',
          companyName: 'Alpha Co',
          websiteUrl: 'https://alpha.example.com',
          audienceSize: '10k_to_50k',
          status: 'approved',
          applicationNotes: 'Solid fit',
          defaultCommissionBps: 3000,
          commissionDurationMonths: 12,
          appliedAt: '2026-03-01T00:00:00.000Z',
          approvedAt: '2026-03-02T00:00:00.000Z',
          rejectedAt: null,
          disabledAt: null,
          referralCount: 2,
          commissionCount: 3,
          linkCount: 1,
        },
        metrics: {
          clicks: 42,
          referrals: 2,
          commissions: 3,
          pendingCommissionCents: 4500,
          paidCommissionCents: 3000,
        },
        links: [],
        referrals: [],
        commissions: [],
      },
      isLoading: false,
      error: null,
    });
    useInternalAdminAffiliatePayoutBatchesMock.mockReturnValue({
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
        limit: 8,
      },
      isLoading: false,
      error: null,
    });
    useInternalAdminAffiliateFraudQueueMock.mockReturnValue({
      data: {
        referrals: [
          {
            id: 'referral_1',
            partnerId: 'partner_1',
            partnerName: 'Alpha Partner',
            referredAgencyId: 'agency_1',
            referredAgencyName: 'Acme Agency',
            status: 'review_required',
            riskReasons: ['same_company_domain'],
            createdAt: '2026-03-02T00:00:00.000Z',
            qualifiedAt: null,
            commissionCount: 2,
          },
        ],
        commissions: [
          {
            id: 'commission_1',
            referralId: 'referral_1',
            partnerId: 'partner_1',
            partnerName: 'Alpha Partner',
            customerName: 'Acme Agency',
            status: 'review_required',
            amountCents: 3000,
            holdUntil: '2026-04-01T00:00:00.000Z',
            createdAt: '2026-03-03T00:00:00.000Z',
            riskReasons: ['same_company_domain'],
            notes: 'Needs review',
          },
        ],
        counts: {
          flaggedReferrals: 1,
          flaggedCommissions: 1,
        },
      },
      isLoading: false,
      error: null,
    });

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrlMock.mockReturnValue('blob:affiliate-payout'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrlMock,
    });
    HTMLAnchorElement.prototype.click = anchorClickMock;
    window.prompt = vi.fn()
      .mockReturnValueOnce('validated billing owner match after manual review')
      .mockReturnValueOnce('Matched purchaser identity and allowed payout flow to continue.');
  });

  it('renders payout operations with batch export controls', () => {
    render(<InternalAdminAffiliatesPage />);

    expect(screen.getByText('Payout operations')).toBeInTheDocument();
    expect(screen.getByText('Fraud review queue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate batch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
  });

  it('exports a payout batch and downloads the generated csv', async () => {
    render(<InternalAdminAffiliatesPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    });

    expect(exportPayoutBatchMutationValue.mutateAsync).toHaveBeenCalledWith({
      batchId: 'batch_1',
    });
    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(anchorClickMock).toHaveBeenCalled();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:affiliate-payout');
  });

  it('clears a flagged referral from the fraud review queue', async () => {
    render(<InternalAdminAffiliatesPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    });

    expect(resolveReferralReviewMutationValue.mutateAsync).toHaveBeenCalledWith({
      referralId: 'referral_1',
      resolution: 'clear',
      reason: 'validated billing owner match after manual review',
      internalNotes: 'Matched purchaser identity and allowed payout flow to continue.',
    });
  });
});
