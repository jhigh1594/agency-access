import { describe, expect, it } from 'vitest';
import {
  calculateAffiliateCommissionCents,
  calculateCommissionHoldUntil,
  evaluateAffiliateReferralRisk,
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
