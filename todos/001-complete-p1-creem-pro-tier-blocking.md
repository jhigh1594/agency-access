---
name: "Creem PRO Tier Configuration Blocking Agency Tier Checkout"
description: "Creem payment provider has placeholder product IDs for PRO tier, blocking Agency tier subscription checkout flow"
status: "complete"
priority: "p1"
issue_id: "001"
tags:
  - "code-review"
  - "payments"
  - "creem"
  - "pricing"
  - "security"
dependencies: []
---

# Problem Statement

The Creem payment provider configuration contains placeholder product IDs (`prod_tbd`) for the PRO subscription tier. Since the Agency pricing display tier maps to the PRO subscription tier, this blocks users from successfully checking out for the Agency tier plan.

## Why This Matters

- **Revenue Impact**: Users cannot subscribe to the highest-tier paid plan ($149/month)
- **User Experience**: Checkout flow will fail with payment errors
- **Business Logic**: Agency tier is the most popular/recommended tier but is non-functional

## Affected Components

**Files:**
- `packages/shared/src/types.ts` - TIER_LIMITS configuration
- `apps/api/src/services/subscription.service.ts` - Creem integration
- `apps/web/src/components/settings/billing/plan-comparison.tsx` - Checkout UI

**Database:** None (configuration only)

## Findings

From Architecture Strategist review:

> The Creem configuration for PRO tier product IDs contains placeholder values (`prod_tbd`). This is a **critical blocker** for the Agency tier checkout flow.
>
> **Current State:**
> ```typescript
> TIER_LIMITS: {
>   PRO: {
>     creemMonthlyPriceId: 'prod_tbd',  // ❌ Placeholder
>     creemYearlyPriceId: 'prod_tbd',   // ❌ Placeholder
>   }
> }
> ```
>
> **Impact:** When users click "Start Free Trial" on Agency tier ($149/mo), the checkout fails because Creem doesn't recognize the product ID.

**Evidence:**
- Pricing display tier `AGENCY` maps to subscription tier `PRO`
- Agency tier is recommended as "Most Popular" in UI
- No valid Creem product IDs configured for PRO tier

## Proposed Solutions

### Option 1: Configure Actual Creem Product IDs (Recommended)

**Pros:**
- Fixes the blocking issue immediately
- Enables revenue from Agency tier subscriptions
- Minimal code change required

**Cons:**
- Requires Creem dashboard access to create products
- Need to create 2 products (monthly/yearly)

**Effort:** Small (15 minutes)

**Risk:** Low

**Steps:**
1. Log into Creem dashboard
2. Create products for PRO tier: `$149/month` and `$124/month` (yearly)
3. Copy product IDs
4. Update `TIER_LIMITS.PRO.creemMonthlyPriceId` and `creemYearlyPriceId`
5. Test checkout flow end-to-end

### Option 2: Use AGENCY Tier Product IDs for PRO

**Pros:**
- Quick workaround using existing products
- No Creem dashboard work needed

**Cons:**
- Creates pricing discrepancy (Agency tier users billed at AGENCY prices)
- Confusing for accounting/reconciliation
- Technical debt - need to fix later anyway

**Effort:** Small (5 minutes)

**Risk:** Medium (billing mismatch)

**Steps:**
1. Copy existing `AGENCY.creemMonthlyPriceId` to `PRO.creemMonthlyPriceId`
2. Copy `AGENCY.creemYearlyPriceId` to `PRO.creemYearlyPriceId`
3. Document as temporary workaround in code comments
4. Create follow-up task to create proper PRO products

### Option 3: Disable Agency Tier Until Products Created

**Pros:**
- Prevents failed checkout attempts
- Maintains system integrity

**Cons:**
- Blocks revenue from highest-tier plan
- Removes "Most Popular" option from pricing page
- Poor user experience

**Effort:** Small (10 minutes)

**Risk:** Low

**Steps:**
1. Remove `AGENCY` from `PRICING_DISPLAY_TIER_ORDER`
2. Hide Agency tier from pricing pages
3. Add re-enable task to sprint backlog

## Recommended Action

**Option 1** - Configure actual Creem product IDs for PRO tier.

**Rationale:**
- This is a production-blocking issue that prevents revenue
- The fix is straightforward and low-risk
- No reason to ship incomplete pricing configuration
- Agency tier is featured as "Most Popular" - must be functional

## Technical Details

**Files to Modify:**
```
packages/shared/src/types.ts
```

**Configuration Changes:**
```typescript
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  // ... other tiers
  PRO: {
    // Existing config
    priceMonthly: 149,
    priceYearly: 1488,
    accessRequests: 50,
    clients: 25,
    members: -1,
    teamSeats: -1,
    templates: -1,
    clientOnboards: 600,
    platformAudits: 3000,

    // UPDATE THESE WITH REAL CREEM PRODUCT IDs
    creemMonthlyPriceId: 'prod_replace_with_actual_id', // ❌ Currently 'prod_tbd'
    creemYearlyPriceId: 'prod_replace_with_actual_id',  // ❌ Currently 'prod_tbd'
  },
};
```

## Acceptance Criteria

- [x] Creem products created for PRO tier (monthly $149, yearly $1490)
- [x] Product IDs configured in `apps/api/src/config/creem.config.ts`
- [x] PRO added to `CREEM_CHECKOUT_TIERS` in `packages/shared/src/types.ts`
- [x] TypeScript typecheck passes
- [ ] Agency tier checkout completes successfully (needs integration testing)
- [ ] Test subscription created in Creem dashboard (needs integration testing)
- [ ] No payment errors in checkout flow (needs integration testing)

## Work Log

### 2026-03-14 - Code Review Finding
- **Finding Source:** Architecture Strategist review agent
- **Severity:** P1 (Blocks Revenue)
- **Status:** Pending triage
- **Evidence:** Placeholder `prod_tbd` values in production code

### 2026-03-14 - Resolution Completed
- **Action:** Created Creem products via CLI
- **Products Created:**
  - Agency (Monthly): `prod_5FEs6qBlwvbMWHHun95wkk` @ $149.00/month
  - Agency (Annual): `prod_6w78r7ZbTUjkJl7mTkNfFr` @ $1490.00/year
- **Files Updated:**
  - `apps/api/src/config/creem.config.ts` - Replaced prod_tbd with actual IDs
  - `packages/shared/src/types.ts` - Added PRO to CREEM_CHECKOUT_TIERS
- **Typecheck:** ✅ Passed
- **Status:** Complete - pending integration testing

---

## Resources

**Related Documentation:**
- Pricing revamp PR: feature/pricing-revamp-3-tier-paid
- Creem dashboard: https://dashboard.creem.com (if applicable)
- Subscription service: `apps/api/src/services/subscription.service.ts`

**Similar Issues:**
- None identified

**Related Tasks:**
- #002 - Tier naming confusion (dual-tier system)
- #003 - FREE tier migration path missing
