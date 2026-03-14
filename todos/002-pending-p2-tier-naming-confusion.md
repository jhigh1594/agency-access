---
name: "Dual-Tier System Creates Naming Confusion for Agents"
description: "Backend SubscriptionTier names don't match PricingDisplayTier names, creating confusion for AI agents about which tier maps to which"
status: "pending"
priority: "p2"
issue_id: "002"
tags:
  - "code-review"
  - "architecture"
  - "typescript"
  - "pricing"
  - "agent-native"
dependencies: []
---

# Problem Statement

The dual-tier system uses `SubscriptionTier` (backend/internal) and `PricingDisplayTier` (frontend/marketing), but the naming creates confusion. The `AGENCY` subscription tier displays as "Growth" to users, while the `PRO` subscription tier displays as "Agency" - this mismatch makes it difficult for AI agents to understand which tier is being referenced.

## Why This Matters

- **Agent Confusion**: AI agents struggle to map between internal tier names and display names
- **Maintenance Burden**: Developers must remember complex mapping rules
- **Debugging Difficulty**: Tracing issues requires constantly translating between tier systems
- **Documentation Confusion**: External docs show one naming, internal code uses another

## Affected Components

**Files:**
- `packages/shared/src/types.ts` - Tier definitions and mappings
- `apps/web/src/components/settings/billing/current-plan-card.tsx` - Uses SUBSCRIPTION_TIER_NAMES
- `apps/web/src/components/settings/billing/plan-comparison.tsx` - Uses PRICING_DISPLAY_TIER_ORDER

**Affected Code:**
```typescript
// Backend/internal tier names
export type SubscriptionTier = 'STARTER' | 'AGENCY' | 'PRO' | 'ENTERPRISE';

// What users see
export const SUBSCRIPTION_TIER_NAMES: Record<SubscriptionTier, string> = {
  STARTER: 'Starter',
  AGENCY: 'Growth',   // ❌ AGENCY displays as "Growth"
  PRO: 'Agency',      // ❌ PRO displays as "Agency"
  ENTERPRISE: 'Enterprise',
};

// Frontend/marketing tier names
export type PricingDisplayTier = 'STARTER' | 'GROWTH' | 'AGENCY';

export const PRICING_DISPLAY_TIER_TO_SUBSCRIPTION_TIER = {
  STARTER: 'STARTER',
  GROWTH: 'AGENCY',  // ❌ Growth display → AGENCY internal
  AGENCY: 'PRO',     // ❌ Agency display → PRO internal
};
```

## Findings

From Agent-Native Reviewer analysis:

> The naming mismatch between `SubscriptionTier` and `PricingDisplayTier` creates cognitive overhead for agents. When an agent sees "Agency" in the UI, it must remember this maps to the `PRO` subscription tier, not the `AGENCY` tier. Similarly, "Growth" in the UI maps to the `AGENCY` subscription tier.
>
> **Confusion Matrix:**
> - User sees: "Starter" → Internal: `STARTER` ✅ (matches)
> - User sees: "Growth" → Internal: `AGENCY` ❌ (mismatch)
> - User sees: "Agency" → Internal: `PRO` ❌ (mismatch)
>
> This makes it difficult for agents to:
> 1. Write accurate documentation about tier features
> 2. Troubleshoot tier-specific issues
> 3. Generate correct checkout flows
> 4. Explain pricing to customers

**Example Confusion:**

When an AI agent reads `SUBSCRIPTION_TIER_NAMES['AGENCY'] = 'Growth'`, it sees:
- Internal name: `AGENCY`
- Display name: `'Growth'`

But `PRICING_DISPLAY_TIER_TO_SUBSCRIPTION_TIER['GROWTH']` = `'AGENCY'`

So the agent must reason: "The user selects Growth, which is a PricingDisplayTier, which maps to the AGENCY SubscriptionTier, which displays as 'Growth' in SUBSCRIPTION_TIER_NAMES."

**From the code:**
```typescript
// In current-plan-card.tsx:
const tierName = currentTier ? SUBSCRIPTION_TIER_NAMES[currentTier] : 'Free';
// If currentTier is 'AGENCY', tierName becomes 'Growth'
```

## Proposed Solutions

### Option 1: Unify Tier Names (Recommended)

**Pros:**
- Eliminates confusion entirely
- Easier for agents and developers to reason about
- Simpler code with fewer mapping layers

**Cons:**
- Requires database migration to update existing subscription records
- Breaking change for any integrations referencing old tier names
- More work upfront

**Effort:** Medium (2-3 hours)

**Risk:** Medium (database migration required)

**Implementation:**
```typescript
// Backend/internal tier names - rename to match display
export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'AGENCY' | 'ENTERPRISE';

// Update all references:
// AGENCY → GROWTH
// PRO → AGENCY

export const SUBSCRIPTION_TIER_NAMES: Record<SubscriptionTier, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',   // ✅ Now matches
  AGENCY: 'Agency',   // ✅ Now matches
  ENTERPRISE: 'Enterprise',
};

export const PRICING_DISPLAY_TIER_TO_SUBSCRIPTION_TIER = {
  STARTER: 'STARTER', // ✅ Identity mapping
  GROWTH: 'GROWTH',   // ✅ Identity mapping
  AGENCY: 'AGENCY',   // ✅ Identity mapping
};
```

**Migration Required:**
```sql
-- Update existing subscriptions
UPDATE subscriptions
SET tier = 'GROWTH' WHERE tier = 'AGENCY';
UPDATE subscriptions
SET tier = 'AGENCY' WHERE tier = 'PRO';
```

### Option 2: Add Explicit Mapping Comments

**Pros:**
- No database changes required
- Quick documentation fix
- Low risk

**Cons:**
- Doesn't solve the underlying confusion
- Still requires complex mental mapping
- Agents may not parse comments correctly

**Effort:** Small (30 minutes)

**Risk:** Low

**Implementation:**
```typescript
/**
 * MAPPING BETWEEN INTERNAL AND DISPLAY TIERS:
 *
 * Internal (SubscriptionTier) → Display (User Sees)
 * ─────────────────────────────────────────────
 * STARTER                  → "Starter"
 * AGENCY                   → "Growth" ⚠️ MISMATCH
 * PRO                      → "Agency" ⚠️ MISMATCH
 * ENTERPRISE               → "Enterprise"
 *
 * Display (PricingDisplayTier) → Internal (SubscriptionTier)
 * ─────────────────────────────────────────────
 * STARTER                       → STARTER
 * GROWTH                        → AGENCY ⚠️ MISMATCH
 * AGENCY                        → PRO ⚠️ MISMATCH
 *
 * TODO: Unify naming to eliminate confusion
 */

export const SUBSCRIPTION_TIER_NAMES: Record<SubscriptionTier, string> = {
  STARTER: 'Starter',
  AGENCY: 'Growth',   // ⚠️ Internal "AGENCY" displays as "Growth"
  PRO: 'Agency',      // ⚠️ Internal "PRO" displays as "Agency"
  ENTERPRISE: 'Enterprise',
};
```

### Option 3: Create Helper Functions with Clear Names

**Pros:**
- Encapsulates mapping logic
- Provides self-documenting API
- No database changes

**Cons:**
- Adds another abstraction layer
- Doesn't eliminate the root confusion
- More code to maintain

**Effort:** Medium (1-2 hours)

**Risk:** Low

**Implementation:**
```typescript
/**
 * Convert display tier (what user sees) to subscription tier (internal)
 */
export function getSubscriptionTierForDisplay(
  displayTier: PricingDisplayTier
): SubscriptionTier {
  const mapping = {
    STARTER: 'STARTER',
    GROWTH: 'AGENCY',   // Growth plan uses AGENCY subscription tier
    AGENCY: 'PRO',      // Agency plan uses PRO subscription tier
  } as const;
  return mapping[displayTier];
}

/**
 * Get user-facing name for a subscription tier
 */
export function getDisplayNameForSubscriptionTier(
  subscriptionTier: SubscriptionTier
): string {
  const displayNames = {
    STARTER: 'Starter',
    AGENCY: 'Growth',   // AGENCY tier displays as "Growth" to users
    PRO: 'Agency',      // PRO tier displays as "Agency" to users
    ENTERPRISE: 'Enterprise',
  };
  return displayNames[subscriptionTier];
}
```

## Recommended Action

**Option 1** - Unify tier names to eliminate the dual-tier system confusion.

**Rationale:**
- This is a design flaw that creates ongoing cognitive overhead
- The confusion affects both AI agents and human developers
- Fixing it now prevents future bugs and misunderstandings
- The database migration is straightforward (2 update statements)
- Long-term clarity outweighs short-term migration effort

**If Option 1 is blocked**, implement **Option 3** (helper functions) as an interim solution, and schedule Option 1 for the next available migration window.

## Technical Details

**Migration Steps for Option 1:**

1. **Update shared types:**
   - Rename `SubscriptionTier` enum values
   - Update `TIER_LIMITS` keys
   - Update `SUBSCRIPTION_TIER_NAMES`
   - Update mapping functions

2. **Database migration:**
   ```sql
   -- Prisma migration file
   -- Update subscription records
   UPDATE "Subscription" SET "tier" = 'GROWTH' WHERE "tier" = 'AGENCY';
   UPDATE "Subscription" SET "tier" = 'AGENCY' WHERE "tier" = 'PRO';
   ```

3. **Update references in code:**
   - Search for all uses of `'AGENCY'` and `'PRO'` tier strings
   - Replace with `'GROWTH'` and `'AGENCY'` respectively
   - Update Creem product ID mappings

4. **Test:**
   - Verify existing subscriptions display correctly
   - Test checkout flow for all tiers
   - Verify upgrade/downgrade paths work

## Acceptance Criteria

- [ ] SubscriptionTier names match PricingDisplayTier names
- [ ] `SUBSCRIPTION_TIER_NAMES[tier] === tier` for all tiers
- [ ] `PRICING_DISPLAY_TIER_TO_SUBSCRIPTION_TIER[display] === display` for all tiers
- [ ] Database migration executed successfully
- [ ] All existing subscriptions display with correct names
- [ ] Checkout flow works for all tiers
- [ ] No references to old tier names remain in codebase
- [ ] Agent-native reviewer confirms no confusion

## Work Log

### 2026-03-14 - Code Review Finding
- **Finding Source:** Agent-Native Reviewer
- **Severity:** P2 (Important - Should Fix)
- **Status:** Pending triage
- **Root Cause:** Historical naming from previous pricing model wasn't updated when pricing changed

---

## Resources

**Related Documentation:**
- Pricing revamp PR: feature/pricing-revamp-3-tier-paid
- Shared types: `packages/shared/src/types.ts`
- Tier naming issue: Affects all tier-based logic

**Similar Patterns:**
- None identified - this is unique to the pricing system

**Related Tasks:**
- #001 - Creem PRO tier blocking
- #003 - FREE tier migration path missing
