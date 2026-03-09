import { env } from '@/lib/env.js';

export type AffiliateReferralRiskOutcome = 'clear' | 'review_required' | 'disqualified';

export type AffiliateReferralRiskReason =
  | 'self_referral_email'
  | 'same_company_domain'
  | 'duplicate_referred_agency'
  | 'shared_fingerprint';

export interface CalculateAffiliateCommissionInput {
  revenueCents: number;
  commissionBps: number;
}

export interface AffiliateCommissionScheduleTier {
  commissionBps: number;
  durationMonths: number;
}

interface BuildDefaultAffiliateCommissionScheduleInput {
  primaryCommissionBps: number;
  primaryDurationMonths: number;
  trailingCommissionBps: number;
  trailingDurationMonths: number;
}

interface ResolveAffiliateCommissionTermsForDateInput {
  qualifiedAt: Date;
  collectedAt: Date;
  fallbackCommissionBps: number;
  fallbackDurationMonths: number;
  commissionSchedule?: AffiliateCommissionScheduleTier[] | null;
}

interface ResolveAffiliateCommissionTermsForDateResult {
  withinWindow: boolean;
  commissionBps: number | null;
}

export interface EvaluateAffiliateReferralRiskInput {
  partnerEmail?: string | null;
  referredCustomerEmail?: string | null;
  hasExistingReferralForAgency?: boolean;
  ipHashMatchesPartner?: boolean;
  userAgentHashMatchesPartner?: boolean;
  sameCompanyDomain?: boolean;
}

export interface AffiliateReferralRiskResult {
  outcome: AffiliateReferralRiskOutcome;
  reasons: AffiliateReferralRiskReason[];
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + Math.max(0, months));
  return next;
}

function normalizeAffiliateCommissionSchedule(
  schedule?: AffiliateCommissionScheduleTier[] | null,
): AffiliateCommissionScheduleTier[] {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return [];
  }

  return schedule
    .filter((tier) => tier.durationMonths > 0 && tier.commissionBps > 0)
    .map((tier) => ({
      commissionBps: Math.max(0, Math.min(10000, Math.trunc(tier.commissionBps))),
      durationMonths: Math.max(1, Math.min(60, Math.trunc(tier.durationMonths))),
    }));
}

function normalizeEmail(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function calculateAffiliateCommissionCents({
  revenueCents,
  commissionBps,
}: CalculateAffiliateCommissionInput): number {
  if (revenueCents <= 0 || commissionBps <= 0) return 0;
  return Math.floor((revenueCents * commissionBps) / 10000);
}

export function buildDefaultAffiliateCommissionSchedule({
  primaryCommissionBps,
  primaryDurationMonths,
  trailingCommissionBps,
  trailingDurationMonths,
}: BuildDefaultAffiliateCommissionScheduleInput): AffiliateCommissionScheduleTier[] {
  const tiers: AffiliateCommissionScheduleTier[] = [];

  if (primaryCommissionBps > 0 && primaryDurationMonths > 0) {
    tiers.push({
      commissionBps: primaryCommissionBps,
      durationMonths: primaryDurationMonths,
    });
  }

  if (trailingCommissionBps > 0 && trailingDurationMonths > 0) {
    tiers.push({
      commissionBps: trailingCommissionBps,
      durationMonths: trailingDurationMonths,
    });
  }

  return tiers;
}

export function buildDefaultAffiliateCommissionScheduleFromEnv(): AffiliateCommissionScheduleTier[] {
  const trailingDurationMonths = Math.min(
    env.AFFILIATE_DEFAULT_TRAILING_COMMISSION_MONTHS,
    env.AFFILIATE_DEFAULT_COMMISSION_MONTHS,
  );
  const primaryDurationMonths = Math.max(
    env.AFFILIATE_DEFAULT_COMMISSION_MONTHS - trailingDurationMonths,
    0,
  );

  return buildDefaultAffiliateCommissionSchedule({
    primaryCommissionBps: env.AFFILIATE_DEFAULT_COMMISSION_BPS,
    primaryDurationMonths,
    trailingCommissionBps: env.AFFILIATE_DEFAULT_TRAILING_COMMISSION_BPS,
    trailingDurationMonths,
  });
}

export function resolveAffiliateCommissionTermsForDate({
  qualifiedAt,
  collectedAt,
  fallbackCommissionBps,
  fallbackDurationMonths,
  commissionSchedule,
}: ResolveAffiliateCommissionTermsForDateInput): ResolveAffiliateCommissionTermsForDateResult {
  const normalizedSchedule = normalizeAffiliateCommissionSchedule(commissionSchedule);
  const schedule =
    normalizedSchedule.length > 0
      ? normalizedSchedule
      : [{ commissionBps: fallbackCommissionBps, durationMonths: fallbackDurationMonths }];

  let cumulativeMonths = 0;
  for (let index = 0; index < schedule.length; index += 1) {
    const tier = schedule[index];
    cumulativeMonths += tier.durationMonths;
    const tierEnd = addMonths(qualifiedAt, cumulativeMonths);
    const isFinalTier = index === schedule.length - 1;

    if (collectedAt < tierEnd || (isFinalTier && collectedAt <= tierEnd)) {
      return {
        withinWindow: true,
        commissionBps: tier.commissionBps,
      };
    }
  }

  return {
    withinWindow: false,
    commissionBps: null,
  };
}

export function calculateCommissionHoldUntil(collectedAt: Date, holdDays: number): Date {
  const holdUntil = new Date(collectedAt);
  holdUntil.setUTCDate(holdUntil.getUTCDate() + Math.max(0, holdDays));
  return holdUntil;
}

export function evaluateAffiliateReferralRisk(
  input: EvaluateAffiliateReferralRiskInput
): AffiliateReferralRiskResult {
  const reasons: AffiliateReferralRiskReason[] = [];

  const partnerEmail = normalizeEmail(input.partnerEmail);
  const referredEmail = normalizeEmail(input.referredCustomerEmail);

  if (partnerEmail && referredEmail && partnerEmail === referredEmail) {
    reasons.push('self_referral_email');
    return { outcome: 'disqualified', reasons };
  }

  if (input.sameCompanyDomain) {
    reasons.push('same_company_domain');
  }

  if (input.hasExistingReferralForAgency) {
    reasons.push('duplicate_referred_agency');
  }

  if (input.ipHashMatchesPartner && input.userAgentHashMatchesPartner) {
    reasons.push('shared_fingerprint');
  }

  if (reasons.length === 0) {
    return { outcome: 'clear', reasons };
  }

  return { outcome: 'review_required', reasons };
}
