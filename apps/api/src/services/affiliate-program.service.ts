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
