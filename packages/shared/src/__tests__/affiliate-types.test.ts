import { describe, expect, it } from '@jest/globals';
import {
  AffiliateAdminFraudQueueSchema,
  AffiliateAdminPayoutBatchExportSchema,
  AffiliateAdminPayoutBatchListSchema,
  AffiliateAdminPartnerListSchema,
  AffiliateAdminPartnerMutationSchema,
  AffiliateAdminReferralReviewResolutionSchema,
  AffiliateApplicationInputSchema,
  AffiliateCommissionStatusSchema,
  AffiliatePartnerPortalOverviewSchema,
  AffiliatePartnerStatusSchema,
  AffiliatePayoutStatusSchema,
  AffiliateReferralStatusSchema,
} from '../types';

describe('Affiliate shared contracts', () => {
  it('accepts the expected affiliate partner statuses', () => {
    expect(AffiliatePartnerStatusSchema.parse('applied')).toBe('applied');
    expect(AffiliatePartnerStatusSchema.parse('approved')).toBe('approved');
    expect(AffiliatePartnerStatusSchema.parse('rejected')).toBe('rejected');
    expect(AffiliatePartnerStatusSchema.parse('disabled')).toBe('disabled');
  });

  it('accepts the expected affiliate referral statuses', () => {
    expect(AffiliateReferralStatusSchema.parse('attributed')).toBe('attributed');
    expect(AffiliateReferralStatusSchema.parse('qualified')).toBe('qualified');
    expect(AffiliateReferralStatusSchema.parse('review_required')).toBe('review_required');
    expect(AffiliateReferralStatusSchema.parse('disqualified')).toBe('disqualified');
  });

  it('accepts the expected affiliate commission statuses', () => {
    expect(AffiliateCommissionStatusSchema.parse('pending')).toBe('pending');
    expect(AffiliateCommissionStatusSchema.parse('approved')).toBe('approved');
    expect(AffiliateCommissionStatusSchema.parse('paid')).toBe('paid');
    expect(AffiliateCommissionStatusSchema.parse('void')).toBe('void');
    expect(AffiliateCommissionStatusSchema.parse('review_required')).toBe('review_required');
  });

  it('accepts the expected affiliate payout statuses', () => {
    expect(AffiliatePayoutStatusSchema.parse('draft')).toBe('draft');
    expect(AffiliatePayoutStatusSchema.parse('approved')).toBe('approved');
    expect(AffiliatePayoutStatusSchema.parse('exported')).toBe('exported');
    expect(AffiliatePayoutStatusSchema.parse('paid')).toBe('paid');
    expect(AffiliatePayoutStatusSchema.parse('canceled')).toBe('canceled');
  });

  it('validates a public affiliate application payload', () => {
    const payload = AffiliateApplicationInputSchema.parse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      companyName: 'Growth Studio',
      websiteUrl: 'https://growth.example.com',
      audienceSize: '1k_to_10k',
      promotionPlan: 'Email list + LinkedIn posts',
      termsAccepted: true,
    });

    expect(payload.email).toBe('jane@example.com');
    expect(payload.termsAccepted).toBe(true);
  });

  it('rejects affiliate applications without terms acceptance', () => {
    const result = AffiliateApplicationInputSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      promotionPlan: 'Newsletter',
      termsAccepted: false,
    });

    expect(result.success).toBe(false);
  });

  it('validates partner portal overview payloads', () => {
    const payload = AffiliatePartnerPortalOverviewSchema.parse({
      partner: {
        id: 'partner_123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        status: 'approved',
        defaultCommissionBps: 3000,
        commissionDurationMonths: 12,
      },
      metrics: {
        clicks: 120,
        referrals: 12,
        customers: 4,
        pendingCommissionCents: 4500,
        paidCommissionCents: 9000,
      },
      primaryLink: {
        id: 'link_123',
        code: 'janedoe',
        status: 'active',
        destinationPath: '/pricing',
      },
    });

    expect(payload.metrics.clicks).toBe(120);
    expect(payload.primaryLink?.code).toBe('janedoe');
  });

  it('validates internal admin partner mutations', () => {
    const payload = AffiliateAdminPartnerMutationSchema.parse({
      status: 'approved',
      defaultCommissionBps: 3500,
      commissionDurationMonths: 12,
      internalNotes: 'Strong fit for pilot cohort',
    });

    expect(payload.status).toBe('approved');
    expect(payload.defaultCommissionBps).toBe(3500);
  });

  it('validates internal admin partner list payloads', () => {
    const payload = AffiliateAdminPartnerListSchema.parse({
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
    });

    expect(payload.items[0].status).toBe('applied');
    expect(payload.items[0].linkCount).toBe(0);
  });

  it('validates internal admin payout batch payloads', () => {
    const payload = AffiliateAdminPayoutBatchListSchema.parse({
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
      limit: 20,
    });

    expect(payload.items[0].commissionCount).toBe(3);
  });

  it('validates internal admin payout batch export payloads', () => {
    const payload = AffiliateAdminPayoutBatchExportSchema.parse({
      batchId: 'batch_1',
      fileName: 'affiliate-payout-batch-batch_1.csv',
      exportedAt: '2026-03-08T12:00:00.000Z',
      rowCount: 2,
      csv: 'partner_id,partner_name\npartner_1,Alpha Partner',
    });

    expect(payload.fileName).toContain('batch_1');
    expect(payload.rowCount).toBe(2);
  });

  it('validates internal admin fraud queue payloads', () => {
    const payload = AffiliateAdminFraudQueueSchema.parse({
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
      commissions: [
        {
          id: 'commission_1',
          referralId: 'referral_1',
          partnerId: 'partner_1',
          partnerName: 'Partner One',
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
    });

    expect(payload.counts.flaggedCommissions).toBe(1);
    expect(payload.referrals[0].status).toBe('review_required');
  });

  it('validates affiliate fraud review resolution payloads', () => {
    const payload = AffiliateAdminReferralReviewResolutionSchema.parse({
      resolution: 'clear',
      reason: 'validated billing owner match after manual review',
      internalNotes: 'Matched purchaser identity and allowed payout flow to continue.',
    });

    expect(payload.resolution).toBe('clear');
  });
});
