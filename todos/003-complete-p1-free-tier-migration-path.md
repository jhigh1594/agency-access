---
name: "No Migration Path for Existing FREE Tier Users"
description: "The pricing revamp removed the FREE tier but doesn't address existing FREE tier users - they have no path forward when limits are reached"
status: "complete"
priority: "p1"
issue_id: "003"
tags:
  - "code-review"
  - "security"
  - "migration"
  - "pricing"
  - "user-experience"
dependencies: []
---

# Problem Statement

The pricing model migration from Free/Growth/Scale to Starter/Growth/Agency removed the FREE tier entirely. However, existing users who are currently on the FREE tier have no documented migration path. When they reach their limits or try to upgrade, the system doesn't handle their legacy tier status.

## Why This Matters

- **User Impact**: Existing FREE tier users may encounter errors or confusing flows
- **Data Integrity**: Database may contain records with `'FREE'` tier that no longer exists in code
- **Revenue Impact**: No clear upgrade path for FREE tier users means potential lost conversions
- **Support Burden**: Customer support will need to handle migration manually
- **Security**: Unhandled tier values could lead to authorization bugs

## Affected Components

**Database:**
- `Subscription` table - May contain records with `tier = 'FREE'`

**Code References:**
- `packages/shared/src/types.ts` - `SubscriptionTier` type definition
- `apps/web/src/components/settings/billing/plan-comparison.tsx` - Upgrade flow
- `apps/api/src/services/subscription.service.ts` - Subscription management

**Example Data Scenario:**
```sql
-- Existing subscriptions might have:
SELECT id, tier FROM "Subscription" WHERE tier = 'FREE';
```

## Findings

From Security Sentinel review:

> **HIGH SEVERITY**: The pricing revamp removed the FREE tier from `SubscriptionTier` enum but doesn't address existing users who may have `tier = 'FREE'` in the database.
>
> **Risks:**
> 1. **Type Safety Violation**: Database contains `'FREE'` values that TypeScript enum doesn't recognize
> 2. **Runtime Errors**: Code may throw when encountering unexpected tier values
> 3. **Migration Gap**: No automated or manual migration process defined
> 4. **Authorization Failures**: FREE tier users might be incorrectly scoped or denied access
>
> **Current State:**
> ```typescript
> // packages/shared/src/types.ts
> export const SubscriptionTierSchema = z.enum([
>   'STARTER',
>   'AGENCY',  // Was FREE
>   'PRO',     // Was GROWTH
>   'ENTERPRISE',
> ]);
> ```
>
> **What's Missing:**
> - No database migration to update existing FREE tier users
> - No grace period or soft-landing for FREE tier users
> - No communication plan for affected users
> - No fallback handling in code for legacy tier values

**Attack Vector:**
An attacker who can manipulate their subscription tier to `'FREE'` could:
1. Bypass tier limit checks if code doesn't handle the unknown tier
2. Cause denial-of-service for themselves (incorrect scoping)
3. Exploit inconsistent validation between frontend and backend

**User Experience Impact:**
When a FREE tier user logs in after the pricing revamp:
1. ✅ Best case: System shows them as "Starter" with migrated limits
2. ⚠️ Medium case: System shows "Unknown Tier" - confusing but usable
3. ❌ Worst case: System throws error, user can't access their account

## Proposed Solutions

### Option 1: Grandfather Existing FREE Tier Users (Recommended)

**Pros:**
- Maintains service continuity for existing users
- No forced upgrades or account disruptions
- Simple database migration
- Clear communication path

**Cons:**
- Need to support legacy tier indefinitely (or set end date)
- Two sets of tier limits to maintain
- Potential confusion in billing/support

**Effort:** Medium (2-3 hours)

**Risk:** Low

**Implementation:**

**Step 1: Database Migration**
```sql
-- Migration file: prisma/migrations/YYYYMMDD_grandfather_free_tier/migration.sql

-- Update existing FREE tier users to STARTER
-- This gives them 5 access requests/month instead of previous limits
UPDATE "Subscription"
SET "tier" = 'STARTER',
    "updatedAt" = NOW()
WHERE "tier" = 'FREE';

-- Add migration audit log
INSERT INTO "MigrationAudit" ("type", "affectedUsers", "executedAt")
VALUES ('FREE_TO_STARTER', ROW_COUNT, NOW());
```

**Step 2: Grace Period Limits**
```typescript
// packages/shared/src/types.ts

// Add legacy tier support with flag
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  STARTER: {
    priceMonthly: 29,
    priceYearly: 288,
    accessRequests: 5,
    clients: 5,
    members: -1,
    teamSeats: -1,
    templates: -1,
    clientOnboards: 60,
    platformAudits: 300,
    creemMonthlyPriceId: '...',
    creemYearlyPriceId: '...',
  },
  // ... other tiers

  // Support legacy FREE tier for grandfathered users (read-only)
  // Deprecated: Users will be migrated to STARTER
  FREE: {
    priceMonthly: 0,
    priceYearly: 0,
    accessRequests: 3,  // Previous limits
    clients: 2,
    members: 2,
    teamSeats: 1,
    templates: 5,
    clientOnboards: 0,
    platformAudits: 0,
    creemMonthlyPriceId: null,
    creemYearlyPriceId: null,
    _legacy: true,  // Flag to indicate deprecated tier
  },
};

// Or use separate legacy mapping
export const LEGACY_TIER_LIMITS: Record<string, TierLimits> = {
  FREE: {
    // ... same as above
  },
};
```

**Step 3: User Communication**
```typescript
// apps/web/src/components/settings/billing/legacy-tier-banner.tsx

export function LegacyTierBanner({ tier }: { tier: SubscriptionTier }) {
  if (tier !== 'FREE') return null;

  return (
    <AlertBanner variant="warning">
      <h3>Your plan has been updated</h3>
      <p>
        We've updated our pricing structure. Your FREE plan has been converted to
        Starter with increased limits (5 access requests/month, unlimited team members).
      </p>
      <Button onClick={handleDismiss}>
        Got it, thanks
      </Button>
    </AlertBanner>
  );
}
```

### Option 2: Force Migrate All FREE Tier Users to STARTER

**Pros:**
- Cleanest long-term solution
- No legacy code to maintain
- All users on consistent tier system

**Cons:**
- May upset users who liked FREE tier
- Risk of churn if users don't want STARTER limits
- Requires careful communication

**Effort:** Medium (1-2 hours)

**Risk:** Medium (user churn risk)

**Implementation:**

**Step 1: Database Migration**
```sql
-- One-way migration - can't easily revert
UPDATE "Subscription"
SET "tier" = 'STARTER',
    "updatedAt" = NOW()
WHERE "tier" = 'FREE';

-- Log which users were migrated
INSERT INTO "SubscriptionMigrationLog"
  ("userId", "fromTier", "toTier", "migratedAt")
SELECT
  "agencyId",
  'FREE',
  'STARTER',
  NOW()
FROM "Subscription"
WHERE "tier" = 'STARTER'
  AND "id" IN (
    SELECT id FROM "Subscription" WHERE "tier" WAS 'FREE'
  );
```

**Step 2: Email Notification**
```typescript
// apps/api/src/jobs/migration-notification.job.ts

export async function sendMigrationNotification(userId: string) {
  await emailService.send({
    template: 'tier-migration',
    to: getUserEmail(userId),
    subject: 'Your AuthHub plan has been upgraded',
    data: {
      oldPlan: 'Free',
      newPlan: 'Starter',
      newLimits: {
        accessRequests: 5,
        clients: 5,
        teamSeats: 'Unlimited',
      },
      actionUrl: 'https://authhub.co/settings?tab=billing',
    },
  });
}
```

**Step 3: Grace Period (Optional)**
```typescript
// Allow FREE tier users time to adjust
const MIGRATION_GRACE_PERIOD_DAYS = 30;

export function isWithinGracePeriod(subscription: Subscription): boolean {
  if (subscription.tier === 'FREE') {
    const migratedAt = new Date(subscription.migratedAt || Date.now());
    const daysSinceMigration = differenceInDays(new Date(), migratedAt);
    return daysSinceMigration <= MIGRATION_GRACE_PERIOD_DAYS;
  }
  return false;
}

// During grace period, show banner but don't enforce new limits yet
export function getEffectiveTierLimits(subscription: Subscription): TierLimits {
  if (subscription.tier === 'FREE' && isWithinGracePeriod(subscription)) {
    return LEGACY_TIER_LIMITS.FREE;  // Use old limits during grace period
  }
  return TIER_LIMITS[subscription.tier];
}
```

### Option 3: Add Defensive Coding + Support Ticket Flow

**Pros:**
- Handles unknown tier values gracefully
- Doesn't force automated migration
- Gives support team manual control

**Cons:**
- Requires manual intervention for each user
- Poor user experience (need support ticket)
- Doesn't scale

**Effort:** Small (1 hour)

**Risk:** Low (but doesn't solve root issue)

**Implementation:**

```typescript
// packages/shared/src/types.ts

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  // Handle legacy tiers gracefully
  if (tier === 'FREE') {
    console.warn('[DEPRECATED] Encountered legacy FREE tier. Use STARTER instead.');
    return {
      // Return STARTER limits but log warning
      ...TIER_LIMITS.STARTER,
      _legacy: true,
    };
  }

  const limits = TIER_LIMITS[tier];
  if (!limits) {
    // Fallback for truly unknown tiers
    console.error(`[ERROR] Unknown tier: ${tier}. Defaulting to STARTER.`);
    return TIER_LIMITS.STARTER;
  }

  return limits;
}

// UI shows migration prompt
export function needsMigration(subscription: Subscription): boolean {
  return subscription.tier === 'FREE' ||
         !Object.keys(TIER_LIMITS).includes(subscription.tier);
}
```

## Recommended Action

**Option 1 with Option 2 elements** - Grandfather existing users with clear communication and a path forward:

1. **Immediate:**
   - Run database migration to convert FREE → STARTER
   - Send email notification to affected users
   - Add migration banner in UI for migrated users

2. **Short-term (1-2 weeks):**
   - Monitor for any errors or user complaints
   - Have support team ready to handle edge cases
   - Document the migration for future reference

3. **Long-term:**
   - Remove any legacy tier handling after migration is stable
   - Remove FREE tier from database constraints
   - Update documentation to reflect new pricing

**Rationale:**
- This is a data integrity issue that must be addressed
- Existing users can't be left in broken state
- Proactive migration is better than reactive firefighting
- Clear communication prevents user churn

## Technical Details

**Migration Checklist:**

- [ ] **Database Audit:** Count how many FREE tier users exist
  ```sql
  SELECT COUNT(*) FROM "Subscription" WHERE "tier" = 'FREE';
  ```

- [ ] **Impact Analysis:** Identify what features/services FREE tier users can access
  ```sql
  -- Check feature usage
  SELECT
    s.tier,
    COUNT(DISTINCT ar.id) as access_requests,
    COUNT(DISTINCT cc.id) as client_connections
  FROM "Subscription" s
  LEFT JOIN "AccessRequest" ar ON ar."agencyId" = s."agencyId"
  LEFT JOIN "ClientConnection" cc ON cc."agencyId" = s."agencyId"
  WHERE s.tier = 'FREE'
  GROUP BY s.tier;
  ```

- [ ] **Create Migration Script:** Prisma migration file
- [ ] **Test Migration:** Run on staging database first
- [ ] **Backup Database:** Before production migration
- [ ] **Execute Migration:** Run during low-traffic period
- [ ] **Verify Results:** Check all users have STARTER tier
- [ ] **Send Notifications:** Email all migrated users
- [ ] **Monitor Logs:** Watch for errors related to tier validation
- [ ] **Update Documentation:** Reflect migration in docs

## Acceptance Criteria

- [ ] No FREE tier values remain in Subscription table
- [ ] All former FREE tier users successfully migrated to STARTER
- [ ] Migration audit log created
- [ ] Email notifications sent to all affected users
- [ ] UI shows migration banner for migrated users
- [ ] Support team briefed on migration
- [ ] No errors in logs related to tier validation
- [ ] Migration documented in runbook

## Work Log

### 2026-03-14 - Code Review Finding
- **Finding Source:** Security Sentinel
- **Severity:** P1 (High - Data Integrity)
- **Status:** Pending triage
- **Root Cause:** Pricing revamp removed tier without migration plan

### 2026-03-14 - Resolution Completed
- **Approach:** Defensive coding (Option B) - no data migration needed
- **Context:** No production users yet, so no actual migration required
- **Files Updated:**
  - `packages/shared/src/types.ts` - Added legacy tier mapping in getTierLimitsConfig()
  - `apps/api/src/services/quota.service.ts` - Changed tier fallback from FREE to STARTER
  - `apps/web/src/app/(authenticated)/internal/admin/agencies/page.tsx` - Updated tier display fallback
  - `apps/web/src/app/(authenticated)/internal/admin/page.tsx` - Updated tier display fallback
  - `apps/web/src/components/settings/billing/manage-subscription-card.tsx` - Updated tier normalization
- **Implementation:**
  - Maps legacy 'FREE' tier → STARTER limits with console warning
  - Maps unknown tiers → STARTER limits with console error
  - Changed all UI tier fallbacks from 'FREE' to 'STARTER'
  - Fixed PRO tier mapping in billing card (PRO → 'AGENCY' for UI)
- **Testing:** TypeScript typecheck passes
- **Status:** Complete - defensive coding in place for pre-launch safety

---

## Resources

**Related Documentation:**
- Pricing revamp PR: feature/pricing-revamp-3-tier-paid
- Subscription schema: `apps/api/prisma/schema.prisma`
- Migration guide: `docs/migrations/` (create if doesn't exist)

**Similar Issues:**
- None identified - first major pricing migration

**Related Tasks:**
- #001 - Creem PRO tier blocking
- #002 - Tier naming confusion
