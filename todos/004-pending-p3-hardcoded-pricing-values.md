---
name: "Hardcoded Pricing Values in Components Instead of Using Shared Types"
description: "Several components duplicate pricing values from shared types instead of importing them, creating maintenance burden and inconsistency risk"
status: "pending"
priority: "p3"
issue_id: "004"
tags:
  - "code-review"
  - "typescript"
  - "maintenance"
  - "pricing"
  - "dry"
dependencies: []
---

# Problem Statement

Multiple React components contain hardcoded pricing values that duplicate the configuration in `packages/shared/src/types.ts`. This violates DRY principles and creates maintenance burden when prices change.

## Why This Matters

- **Maintenance Burden**: Price changes require updating multiple files instead of one
- **Inconsistency Risk**: Values can drift between components and shared types
- **Code Quality**: Duplicates data that should be single source of truth
- **Type Safety**: Hardcoded numbers aren't type-checked against pricing schema

## Affected Components

**Files with Hardcoded Values:**

1. **`apps/web/src/components/marketing/pricing/pricing-tier-card.tsx`**
   ```typescript
   // Hardcoded discount calculation
   const yearlyMonthlyEquivalent = Math.round(pricing.yearly / 12);
   const displayPrice = isYearly ? yearlyMonthlyEquivalent : monthlyDisplayPrice;
   const alternatePrice = isYearly
     ? `$${pricing.yearly} billed yearly`
     : 'billed monthly';
   ```

2. **`apps/web/src/components/marketing/pricing/pricing-tiers.tsx`**
   ```typescript
   // Hardcoded pricing values in tierFeatures
   const tierFeatures: Record<PricingDisplayTier, Feature[]> = {
     STARTER: [
       { name: '5 clients/month', included: true, value: '60 onboards/year' },
       { name: 'All platform integrations', included: true },
       // ... more features
     ],
   };
   ```

3. **`apps/web/src/components/settings/billing/plan-comparison.tsx`**
   ```typescript
   // Hardcoded pricing in tierPricing
   const tierPricing: Record<PricingDisplayTier, { yearly: number; monthly: number }> = {
     STARTER: {
       yearly: PRICING_DISPLAY_TIER_DETAILS.STARTER.yearlyPrice,
       monthly: PRICING_DISPLAY_TIER_DETAILS.STARTER.monthlyPrice,
     },
     // ... duplicates structure from shared types
   };
   ```

4. **`apps/web/src/components/settings/billing/current-plan-card.tsx`**
   ```typescript
   // Local price formatting function instead of using shared helper
   function formatMonthlyPrice(tier: SubscriptionTier | null): string {
     if (!tier) return 'Free';
     const limits = TIER_LIMITS[tier];
     if (!limits) return 'Free';
     return `$${limits.priceMonthly}`;
   }
   ```

## Findings

From Kieran TypeScript Reviewer (Score: 8/10):

> **Finding: Hardcoded pricing values in components**
>
> Several pricing-related components duplicate pricing values that are already defined in `packages/shared/src/types.ts`. This creates a maintenance burden and risk of inconsistency.
>
> **Examples:**
> - `pricing-tier-card.tsx`: Calculates yearly/monthly price equivalents locally
> - `plan-comparison.tsx`: Creates local `tierPricing` object mirroring shared types
> - `current-plan-card.tsx`: Has local `formatMonthlyPrice` function
> - `pricing-tiers.tsx`: Hardcodes feature descriptions and limits
>
> **Impact:**
> - When prices change, multiple files must be updated
> - Risk of inconsistencies between marketing site and settings pages
> - Violates single source of truth principle
>
> **Recommendation:**
> Create shared utility functions and use shared pricing constants throughout.

**Severity Assessment:**
This is a P3 (Nice-to-Have) issue because:
- Current code works correctly (no functional bugs)
- Shared types already exist as source of truth
- Hardcoded values are currently in sync with shared types
- Fix is low-risk and improves maintainability

**Maintenance Scenarios:**

When prices need to change, currently requires:
1. Update `packages/shared/src/types.ts` (primary source)
2. Update `pricing-tier-card.tsx` (if hardcoded)
3. Update `plan-comparison.tsx` (if hardcoded)
4. Update `pricing-tiers.tsx` (if hardcoded)
5. Update `current-plan-card.tsx` (if hardcoded)
6. Update `comparison-data.ts` (competitor pricing)
7. Test all pricing pages for consistency

**Ideal State:** Update only `packages/shared/src/types.ts` and all components reflect changes automatically.

## Proposed Solutions

### Option 1: Create Shared Pricing Utilities (Recommended)

**Pros:**
- Single source of truth for all pricing logic
- Reusable across components
- Type-safe and testable
- Clear separation of concerns

**Cons:**
- Requires refactoring existing components
- Some upfront effort

**Effort:** Medium (1-2 hours)

**Risk:** Low (well-scoped refactoring)

**Implementation:**

**Step 1: Create shared pricing utilities**
```typescript
// packages/shared/src/pricing.ts

/**
 * Pricing utility functions for consistent price display across the app
 */

import {
  type SubscriptionTier,
  type PricingDisplayTier,
  TIER_LIMITS,
  PRICING_DISPLAY_TIER_DETAILS,
} from './types';

/**
 * Get the monthly price for a subscription tier
 */
export function getMonthlyPrice(tier: SubscriptionTier | null): number {
  if (!tier) return 0;
  return TIER_LIMITS[tier]?.priceMonthly ?? 0;
}

/**
 * Get the formatted monthly price string for display
 */
export function formatMonthlyPrice(tier: SubscriptionTier | null): string {
  if (!tier) return 'Free';
  const price = getMonthlyPrice(tier);
  return price > 0 ? `$${price}` : 'Free';
}

/**
 * Get the yearly price for a subscription tier
 */
export function getYearlyPrice(tier: SubscriptionTier | null): number {
  if (!tier) return 0;
  return TIER_LIMITS[tier]?.priceYearly ?? 0;
}

/**
 * Calculate the monthly equivalent of yearly pricing
 */
export function getYearlyMonthlyEquivalent(tier: SubscriptionTier | null): number {
  if (!tier) return 0;
  const yearlyPrice = getYearlyPrice(tier);
  return Math.round(yearlyPrice / 12);
}

/**
 * Get pricing details for a display tier
 */
export function getPricingDetails(displayTier: PricingDisplayTier) {
  return PRICING_DISPLAY_TIER_DETAILS[displayTier];
}

/**
 * Calculate discount percentage for yearly billing
 */
export function getYearlyDiscountPercentage(displayTier: PricingDisplayTier): number {
  const details = getPricingDetails(displayTier);
  const monthlyAnnual = details.monthlyPrice * 12;
  const discount = monthlyAnnual - details.yearlyPrice;
  return Math.round((discount / monthlyAnnual) * 100);
}

/**
 * Format price with billing period
 */
export function formatPriceWithBilling(
  displayTier: PricingDisplayTier,
  interval: 'monthly' | 'yearly'
): string {
  const details = getPricingDetails(displayTier);

  if (interval === 'yearly') {
    const monthlyEquivalent = Math.round(details.yearlyPrice / 12);
    return `$${monthlyEquivalent}/mo`;
  }

  return `$${details.monthlyPrice}/mo`;
}

/**
 * Get alternate billing description
 */
export function getAlternateBillingText(
  displayTier: PricingDisplayTier,
  interval: 'monthly' | 'yearly'
): string {
  const details = getPricingDetails(displayTier);

  if (interval === 'yearly') {
    return `$${details.yearlyPrice} billed yearly`;
  }

  return 'billed monthly';
}

/**
 * Get tier limits as a feature list
 */
export function getTierFeatures(
  displayTier: PricingDisplayTier
): { name: string; included: boolean; value?: string }[] {
  const details = getPricingDetails(displayTier);
  const limits = TIER_LIMITS[
    PRICING_DISPLAY_TIER_TO_SUBSCRIPTION_TIER[displayTier]
  ];

  return [
    {
      name: `${limits.clients} clients/month`,
      included: true,
      value: `${limits.clientOnboards} onboards/year`,
    },
    {
      name: 'All platform integrations',
      included: true,
      value: 'Meta, Google, LinkedIn, TikTok, more',
    },
    // ... build from shared config
  ];
}
```

**Step 2: Export from shared package**
```typescript
// packages/shared/src/index.ts

export * from './pricing';
```

**Step 3: Update components to use shared utilities**

```typescript
// apps/web/src/components/settings/billing/current-plan-card.tsx

// BEFORE: Local function
function formatMonthlyPrice(tier: SubscriptionTier | null): string {
  if (!tier) return 'Free';
  const limits = TIER_LIMITS[tier];
  if (!limits) return 'Free';
  return `$${limits.priceMonthly}`;
}

// AFTER: Import from shared
import { formatMonthlyPrice } from '@agency-platform/shared';

export function CurrentPlanCard() {
  // ... component code uses shared function
  const monthlyPrice = formatMonthlyPrice(currentTier);
}
```

```typescript
// apps/web/src/components/settings/billing/plan-comparison.tsx

// BEFORE: Local tierPricing object
const tierPricing: Record<PricingDisplayTier, { yearly: number; monthly: number }> = {
  STARTER: {
    yearly: PRICING_DISPLAY_TIER_DETAILS.STARTER.yearlyPrice,
    monthly: PRICING_DISPLAY_TIER_DETAILS.STARTER.monthlyPrice,
  },
  // ... duplicates
};

// AFTER: Use shared utilities
import { getPricingDetails, formatPriceWithBilling, getAlternateBillingText } from '@agency-platform/shared';

export function PlanComparison() {
  // Get pricing on-demand from shared types
  const getPricing = (tier: PricingDisplayTier) => ({
    yearly: getPricingDetails(tier).yearlyPrice,
    monthly: getPricingDetails(tier).monthlyPrice,
  });
}
```

### Option 2: Add JSDoc Comments Linking to Shared Types

**Pros:**
- Minimal code changes
- Documents where source of truth lives
- Quick documentation fix

**Cons:**
- Doesn't eliminate duplication
- Relies on developers reading comments
- Still requires manual updates

**Effort:** Small (30 minutes)

**Risk:** Very Low

**Implementation:**

```typescript
/**
 * @see {@link packages/shared/src/types.ts#PRICING_DISPLAY_TIER_DETAILS} for source of truth
 * TODO: Refactor to import from shared pricing utilities
 */
const tierPricing: Record<PricingDisplayTier, { yearly: number; monthly: number }> = {
  // ... existing code
};
```

### Option 3: Do Nothing (Accept Current State)

**Pros:**
- No immediate work required
- Current code works

**Cons:**
- Technical debt accumulates
- Future price changes are more error-prone
- Violates DRY principle

**Effort:** Zero

**Risk:** Medium (maintenance burden over time)

## Recommended Action

**Option 1** - Create shared pricing utilities and refactor components.

**Rationale:**
- This is low-hanging fruit for improving code quality
- The pattern is already established (shared types exist)
- Reduces risk of pricing inconsistencies
- Makes future price changes simpler
- Refactoring is well-scoped and low-risk

**Implementation Order:**
1. Create `packages/shared/src/pricing.ts` with utility functions
2. Export from `packages/shared/src/index.ts`
3. Update components one at a time, testing after each change
4. Run test suite to ensure no regressions
5. Delete local duplications after confirming imports work

## Technical Details

**Refactoring Checklist:**

- [ ] Create `packages/shared/src/pricing.ts` with utilities
- [ ] Add exports to `packages/shared/src/index.ts`
- [ ] Update `current-plan-card.tsx` to use shared utilities
- [ ] Update `plan-comparison.tsx` to use shared utilities
- [ ] Update `pricing-tier-card.tsx` to use shared utilities
- [ ] Update `pricing-tiers.tsx` to use shared utilities
- [ ] Add unit tests for pricing utilities
- [ ] Run full test suite
- [ ] Verify pricing pages display correctly
- [ ] Delete local duplicate functions
- [ ] Update documentation

**Example Test:**
```typescript
// packages/shared/src/__tests__/pricing.test.ts

import { describe, it, expect } from 'vitest';
import {
  formatMonthlyPrice,
  getYearlyMonthlyEquivalent,
  getYearlyDiscountPercentage,
} from '../pricing';

describe('Pricing Utilities', () => {
  describe('formatMonthlyPrice', () => {
    it('returns Free for null tier', () => {
      expect(formatMonthlyPrice(null)).toBe('Free');
    });

    it('returns formatted price for STARTER', () => {
      expect(formatMonthlyPrice('STARTER')).toBe('$29');
    });
  });

  describe('getYearlyMonthlyEquivalent', () => {
    it('calculates correct monthly equivalent for STARTER', () => {
      // $288 yearly / 12 = $24/month
      expect(getYearlyMonthlyEquivalent('STARTER')).toBe(24);
    });
  });

  describe('getYearlyDiscountPercentage', () => {
    it('calculates correct discount for STARTER', () => {
      // Monthly: $29 × 12 = $348
      // Yearly: $288
      // Discount: $348 - $288 = $60
      // Percentage: $60 / $348 ≈ 17%
      expect(getYearlyDiscountPercentage('STARTER')).toBe(17);
    });
  });
});
```

## Acceptance Criteria

- [ ] `packages/shared/src/pricing.ts` created with utility functions
- [ ] All pricing utilities have unit tests
- [ ] Components updated to import from shared utilities
- [ ] No duplicate pricing constants remain in components
- [ ] All pricing pages display correctly after refactoring
- [ ] Test suite passes with no regressions
- [ ] Future price changes require updating only shared types

## Work Log

### 2026-03-14 - Code Review Finding
- **Finding Source:** Kieran TypeScript Reviewer
- **Severity:** P3 (Nice-to-Have)
- **Status:** Pending triage
- **Recommendation:** Refactor to shared pricing utilities

---

## Resources

**Related Documentation:**
- Pricing revamp PR: feature/pricing-revamp-3-tier-paid
- Shared types: `packages/shared/src/types.ts`
- DRY principle: Don't Repeat Yourself

**Similar Patterns:**
- None identified - this is specific to pricing

**Related Tasks:**
- #001 - Creem PRO tier blocking
- #002 - Tier naming confusion
- #003 - FREE tier migration path
