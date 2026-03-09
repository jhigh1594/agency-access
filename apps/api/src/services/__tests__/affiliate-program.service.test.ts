import { describe, expect, it } from 'vitest';
import {
  buildDefaultAffiliateCommissionSchedule,
  calculateAffiliateCommissionCents,
  calculateCommissionHoldUntil,
  evaluateAffiliateReferralRisk,
  resolveAffiliateCommissionTermsForDate,
} from '../affiliate-program.service';

describe('affiliate-program.service', () => {
  it('calculates commission cents from revenue cents and basis points', () => {
    expect(calculateAffiliateCommissionCents({
      revenueCents: 10000,
      commissionBps: 3000,
    })).toBe(3000);
  });

  it('rounds commission cents down to an integer amount', () => {
    expect(calculateAffiliateCommissionCents({
      revenueCents: 999,
      commissionBps: 3333,
    })).toBe(332);
  });

  it('builds the stepped default affiliate commission schedule', () => {
    expect(buildDefaultAffiliateCommissionSchedule({
      primaryCommissionBps: 5000,
      primaryDurationMonths: 6,
      trailingCommissionBps: 3000,
      trailingDurationMonths: 6,
    })).toEqual([
      { commissionBps: 5000, durationMonths: 6 },
      { commissionBps: 3000, durationMonths: 6 },
    ]);
  });

  it('resolves the trailing commission tier after the first six months', () => {
    const result = resolveAffiliateCommissionTermsForDate({
      qualifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      collectedAt: new Date('2026-07-01T00:00:00.000Z'),
      fallbackCommissionBps: 5000,
      fallbackDurationMonths: 12,
      commissionSchedule: [
        { commissionBps: 5000, durationMonths: 6 },
        { commissionBps: 3000, durationMonths: 6 },
      ],
    });

    expect(result).toEqual({
      withinWindow: true,
      commissionBps: 3000,
    });
  });

  it('applies a hold window from the collected date', () => {
    const holdUntil = calculateCommissionHoldUntil(new Date('2026-03-08T00:00:00.000Z'), 30);
    expect(holdUntil.toISOString()).toBe('2026-04-07T00:00:00.000Z');
  });

  it('disqualifies obvious self-referrals by email', () => {
    const result = evaluateAffiliateReferralRisk({
      partnerEmail: 'owner@example.com',
      referredCustomerEmail: 'owner@example.com',
    });

    expect(result.outcome).toBe('disqualified');
    expect(result.reasons).toContain('self_referral_email');
  });

  it('flags likely duplicate or synthetic referrals for review', () => {
    const result = evaluateAffiliateReferralRisk({
      hasExistingReferralForAgency: true,
      ipHashMatchesPartner: true,
    });

    expect(result.outcome).toBe('review_required');
    expect(result.reasons).toContain('duplicate_referred_agency');
  });

  it('passes clean referrals with no signals', () => {
    const result = evaluateAffiliateReferralRisk({
      partnerEmail: 'partner@example.com',
      referredCustomerEmail: 'customer@example.com',
    });

    expect(result.outcome).toBe('clear');
    expect(result.reasons).toEqual([]);
  });
});
