import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/prisma';
import { webhookService } from '../webhook.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: vi.fn(),
    },
    invoice: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    affiliateReferral: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    affiliateCommission: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('webhookService invoice processing', () => {
  const paidAt = new Date(1767225600 * 1000);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: 'subscription-1',
      agencyId: 'agency-1',
      status: 'active',
    } as any);

    vi.mocked(prisma.invoice.upsert).mockResolvedValue({
      id: 'invoice-1',
      subscriptionId: 'subscription-1',
      creemInvoiceId: 'creem-invoice-1',
    } as any);

    vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue({
      id: 'referral-1',
      partnerId: 'partner-1',
      status: 'attributed',
      commissionBps: 3000,
      commissionDurationMonths: 12,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      qualifiedAt: null,
      metadata: null,
    } as any);

    vi.mocked(prisma.affiliateReferral.update).mockResolvedValue({
      id: 'referral-1',
      status: 'qualified',
      qualifiedAt: new Date('2026-02-01T00:00:00.000Z'),
    } as any);

    vi.mocked(prisma.affiliateCommission.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.affiliateCommission.create).mockResolvedValue({
      id: 'commission-1',
    } as any);
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);
  });

  it('upserts a paid invoice and creates a pending commission for a qualifying referral', async () => {
    vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue({
      id: 'referral-1',
      partnerId: 'partner-1',
      status: 'attributed',
      commissionBps: 5000,
      commissionDurationMonths: 12,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      qualifiedAt: null,
      metadata: {
        commissionSchedule: [
          { commissionBps: 5000, durationMonths: 6 },
          { commissionBps: 3000, durationMonths: 6 },
        ],
      },
    } as any);

    await webhookService.processInvoicePaid({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_paid: 10000,
      currency: 'usd',
      status: 'paid',
      created: 1767225600,
    });

    expect(prisma.invoice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { creemInvoiceId: 'creem-invoice-1' },
      })
    );
    expect(prisma.affiliateReferral.update).toHaveBeenCalledWith({
      where: { id: 'referral-1' },
      data: {
        status: 'qualified',
        qualifiedAt: paidAt,
      },
    });
    expect(prisma.affiliateCommission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        partnerId: 'partner-1',
        referralId: 'referral-1',
        subscriptionId: 'subscription-1',
        invoiceId: 'invoice-1',
        status: 'pending',
        currency: 'usd',
        revenueAmount: 10000,
        amount: 5000,
        commissionBps: 5000,
        holdUntil: expect.any(Date),
      }),
    });
  });

  it('uses the trailing commission tier after the first six months of a stepped schedule', async () => {
    vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue({
      id: 'referral-1',
      partnerId: 'partner-1',
      status: 'qualified',
      commissionBps: 5000,
      commissionDurationMonths: 12,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      qualifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      metadata: {
        commissionSchedule: [
          { commissionBps: 5000, durationMonths: 6 },
          { commissionBps: 3000, durationMonths: 6 },
        ],
      },
    } as any);

    await webhookService.processInvoicePaid({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_paid: 10000,
      currency: 'usd',
      status: 'paid',
      created: '2026-07-01T00:00:00.000Z',
      paid_at: '2026-07-01T00:00:00.000Z',
    });

    expect(prisma.affiliateCommission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 3000,
        commissionBps: 3000,
      }),
    });
  });

  it('does not create a duplicate commission when the invoice is already linked', async () => {
    vi.mocked(prisma.affiliateCommission.findUnique).mockResolvedValue({
      id: 'commission-existing',
      invoiceId: 'invoice-1',
    } as any);

    await webhookService.processInvoicePaid({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_paid: 10000,
      currency: 'usd',
      status: 'paid',
      created: 1767225600,
    });

    expect(prisma.affiliateCommission.create).not.toHaveBeenCalled();
  });

  it('skips commission creation for disqualified referrals', async () => {
    vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue({
      id: 'referral-1',
      partnerId: 'partner-1',
      status: 'disqualified',
      commissionBps: 3000,
      commissionDurationMonths: 12,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      qualifiedAt: null,
      metadata: null,
    } as any);

    await webhookService.processInvoicePaid({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_paid: 10000,
      currency: 'usd',
      status: 'paid',
      created: 1767225600,
    });

    expect(prisma.affiliateReferral.update).not.toHaveBeenCalled();
    expect(prisma.affiliateCommission.create).not.toHaveBeenCalled();
  });

  it('skips commission creation when the referral is outside its commission window', async () => {
    vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue({
      id: 'referral-1',
      partnerId: 'partner-1',
      status: 'qualified',
      commissionBps: 3000,
      commissionDurationMonths: 1,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      qualifiedAt: new Date('2025-01-01T00:00:00.000Z'),
      metadata: null,
    } as any);

    await webhookService.processInvoicePaid({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_paid: 10000,
      currency: 'usd',
      status: 'paid',
      created: 1767225600,
    });

    expect(prisma.affiliateCommission.create).not.toHaveBeenCalled();
  });

  it('preserves review_required referrals and creates review_required commissions without auto-qualifying them', async () => {
    vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue({
      id: 'referral-1',
      partnerId: 'partner-1',
      status: 'review_required',
      commissionBps: 3000,
      commissionDurationMonths: 12,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      qualifiedAt: null,
      metadata: { riskReasons: ['same_company_domain'] },
    } as any);

    await webhookService.processInvoicePaid({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_paid: 10000,
      currency: 'usd',
      status: 'paid',
      created: 1767225600,
    });

    expect(prisma.affiliateReferral.update).not.toHaveBeenCalled();
    expect(prisma.affiliateCommission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        referralId: 'referral-1',
        status: 'review_required',
        notes: 'Commission requires review because the referral includes risk signals.',
      }),
    });
  });

  it('voids pending or approved commissions when invoice payment fails', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: 'invoice-1',
      affiliateCommission: {
        id: 'commission-1',
        status: 'approved',
        paidAt: null,
      },
    } as any);

    await webhookService.processInvoicePaymentFailed({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_due: 10000,
      currency: 'usd',
      status: 'open',
      created: 1767225600,
    });

    expect(prisma.invoice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { creemInvoiceId: 'creem-invoice-1' },
      })
    );
    expect(prisma.affiliateCommission.update).toHaveBeenCalledWith({
      where: { id: 'commission-1' },
      data: expect.objectContaining({
        status: 'void',
        voidedAt: expect.any(Date),
      }),
    });
  });

  it('voids review_required commissions when an invoice reversal event arrives', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: 'invoice-1',
      affiliateCommission: {
        id: 'commission-1',
        status: 'review_required',
        paidAt: null,
      },
    } as any);

    await webhookService.processInvoicePaymentFailed({
      id: 'creem-invoice-1',
      customer: 'cus-1',
      subscription: 'sub-1',
      amount_due: 10000,
      currency: 'usd',
      status: 'void',
      created: 1767225600,
    });

    expect(prisma.affiliateCommission.update).toHaveBeenCalledWith({
      where: { id: 'commission-1' },
      data: expect.objectContaining({
        status: 'void',
        voidedAt: expect.any(Date),
      }),
    });
  });
});
