# Trial Expiration & Conversion Flow Implementation Plan

**Goal:** Show a trial expiration banner when ≤3 days remain, auto-downgrade expired trials to FREE, and fix the `trialing` status gaps across the stack.

**Architecture:** The backend gets a new BullMQ cron job (`trial-expiration`) that runs daily, finds expired trials, and downgrades them. The subscription API is extended to return `trialEnd` so the frontend can render a countdown banner. The authenticated layout renders a `<TrialBanner>` when the user's subscription is `trialing` with ≤3 days left. The billing card gets a `trialing` status badge and explicit "Subscribe Now" CTA.

**Tech Stack:** Fastify, Prisma, BullMQ (existing queue infra), React, TanStack Query, Tailwind, Clerk metadata sync, Creem webhooks

**Testing Approach:** TDD with deterministic unit tests for complex logic (Tasks 1, 2). UI components and simple wiring are verified via typecheck only.

---

### Task 1: Add trial expiration cron job (backend)

**Why:** No server-side process exists to catch expired trials. If a Creem webhook is missed or delayed, users stay on `trialing` forever with full paid-tier access.

**Files:**
- Create: `apps/api/src/jobs/trial-expiration.ts`
- Modify: `apps/api/src/lib/queue.ts` (add queue + worker + schedule)
- Modify: `apps/api/src/services/subscription.service.ts` (add `expireTrials` method)
- Test: `apps/api/src/jobs/__tests__/trial-expiration.test.ts`

**Step 1: Write the failing test**

Create `apps/api/src/jobs/__tests__/trial-expiration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    agency: {
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { expireTrials } from '../trial-expiration';

describe('expireTrials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should downgrade expired trialing subscriptions to FREE', async () => {
    const expiredSub = {
      id: 'sub-1',
      agencyId: 'agency-1',
      tier: 'STARTER',
      status: 'trialing',
      trialEnd: new Date('2026-02-20T00:00:00Z'), // In the past
    };

    vi.mocked(prisma.subscription.findMany).mockResolvedValue([expiredSub] as any);
    vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);
    vi.mocked(prisma.agency.update).mockResolvedValue({} as any);

    const result = await expireTrials();

    expect(result.expired).toBe(1);
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        status: 'expired',
        tier: 'STARTER',
      },
    });
    expect(prisma.agency.update).toHaveBeenCalledWith({
      where: { id: 'agency-1' },
      data: { subscriptionTier: null },
    });
  });

  it('should skip subscriptions with trialEnd in the future', async () => {
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([]);

    const result = await expireTrials();

    expect(result.expired).toBe(0);
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it('should handle multiple expired subscriptions', async () => {
    const subs = [
      { id: 'sub-1', agencyId: 'agency-1', tier: 'STARTER', status: 'trialing', trialEnd: new Date('2026-02-20') },
      { id: 'sub-2', agencyId: 'agency-2', tier: 'AGENCY', status: 'trialing', trialEnd: new Date('2026-02-21') },
    ];

    vi.mocked(prisma.subscription.findMany).mockResolvedValue(subs as any);
    vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);
    vi.mocked(prisma.agency.update).mockResolvedValue({} as any);

    const result = await expireTrials();

    expect(result.expired).toBe(2);
    expect(prisma.subscription.update).toHaveBeenCalledTimes(2);
    expect(prisma.agency.update).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test src/jobs/__tests__/trial-expiration.test.ts`
Expected: FAIL — `expireTrials` does not exist yet.

**Step 3: Implement `expireTrials` function**

Create `apps/api/src/jobs/trial-expiration.ts`:

```typescript
/**
 * Trial Expiration Job
 *
 * Runs daily to find subscriptions with status='trialing' and trialEnd <= now.
 * Downgrades them: sets subscription status to 'expired' and clears the
 * agency's subscriptionTier (reverts to free).
 */

import { prisma } from '@/lib/prisma';

/**
 * Find and expire all overdue trials.
 *
 * For each expired trial:
 * 1. Set subscription.status = 'expired' (keeps tier for history)
 * 2. Set agency.subscriptionTier = null (reverts to free-tier limits)
 */
export async function expireTrials(): Promise<{ expired: number }> {
  const now = new Date();

  // Find all trialing subscriptions whose trial has ended
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'trialing',
      trialEnd: { lte: now },
    },
    select: {
      id: true,
      agencyId: true,
      tier: true,
    },
  });

  let expired = 0;

  for (const sub of expiredSubscriptions) {
    // Mark subscription as expired (preserve tier for audit/history)
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'expired',
        tier: sub.tier,
      },
    });

    // Revert agency to free tier
    await prisma.agency.update({
      where: { id: sub.agencyId },
      data: { subscriptionTier: null },
    });

    expired++;
  }

  return { expired };
}

// Standalone script support
if (require.main === module) {
  expireTrials()
    .then((result) => {
      console.log(`Trial expiration complete: ${result.expired} subscriptions expired`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Trial expiration failed:', error);
      process.exit(1);
    });
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && npm test src/jobs/__tests__/trial-expiration.test.ts`
Expected: PASS (3 tests)

**Step 5: Wire into BullMQ scheduler**

Modify `apps/api/src/lib/queue.ts`. Add to the top-level queue declarations (after line 46):

```typescript
export const trialExpirationQueue = new Queue('trial-expiration', {
  connection: connectionOptions,
});
```

Add a new worker function (after `startNotificationWorker`):

```typescript
/**
 * Trial Expiration Worker
 *
 * Checks for and expires overdue trials daily.
 */
export async function startTrialExpirationWorker() {
  const worker = new Worker(
    'trial-expiration',
    async (job) => {
      const { expireTrials } = await import('../jobs/trial-expiration.js');
      const result = await expireTrials();
      console.log(`Trial expiration job completed: ${result.expired} expired`);
      return result;
    },
    {
      connection: connectionOptions,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Trial expiration job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Trial expiration job failed: ${job?.id}`, err);
  });

  return worker;
}
```

Add to the `scheduleJobs()` function (after the cleanup queue block, before `console.log('Recurring jobs scheduled successfully')`):

```typescript
  // Trial expiration check - runs daily at 3 AM UTC
  const trialExpQueue = new Queue('trial-expiration', {
    connection: connectionOptions,
  });

  await trialExpQueue.add(
    'check-expired-trials',
    { type: 'check-expired-trials' },
    {
      repeat: {
        pattern: '0 3 * * *', // Daily at 3 AM UTC
        tz: 'UTC',
      },
    }
  );
```

**Step 6: Verify with typecheck**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add apps/api/src/jobs/trial-expiration.ts apps/api/src/jobs/__tests__/trial-expiration.test.ts apps/api/src/lib/queue.ts
git commit -m "feat: add trial expiration cron job - daily check downgrades expired trials to free"
```

---

### Task 2: Expose `trialEnd` in subscription API response

**Why:** The frontend needs `trialEnd` to calculate days remaining and show the banner. Currently `getSubscription()` does not return it.

**Files:**
- Modify: `apps/api/src/services/subscription.service.ts:178-211` (add `trialEnd` to return shape)
- Modify: `apps/web/src/lib/query/billing.ts:22-29` (add `trialEnd` to `SubscriptionData` type)
- Modify: `apps/web/src/components/settings/billing-card.tsx:29-36` (add `trialEnd` to local type)

**Step 1: Update `getSubscription` return type and data**

In `apps/api/src/services/subscription.service.ts`, replace the `getSubscription` method (lines 178–211):

```typescript
  async getSubscription(agencyId: string): Promise<
    ServiceResult<{
      id: string;
      tier: SubscriptionTier;
      status: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd: boolean;
      creemCustomerId?: string;
      creemSubscriptionId?: string;
      trialEnd?: Date;
    }>
  > {
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
    });

    if (!subscription) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: subscription.id,
        tier: subscription.tier as SubscriptionTier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart || undefined,
        currentPeriodEnd: subscription.currentPeriodEnd || undefined,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        creemCustomerId: subscription.creemCustomerId || undefined,
        creemSubscriptionId: subscription.creemSubscriptionId || undefined,
        trialEnd: subscription.trialEnd || undefined,
      },
      error: null,
    };
  }
```

**Step 2: Update frontend `SubscriptionData` type in billing query hooks**

In `apps/web/src/lib/query/billing.ts`, update the `SubscriptionData` interface (lines 22–29):

```typescript
export interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'expired';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}
```

**Step 3: Update billing card local type**

In `apps/web/src/components/settings/billing-card.tsx`, update the `SubscriptionData` interface (lines 29–36):

```typescript
interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'expired';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}
```

**Step 4: Verify with typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/api/src/services/subscription.service.ts apps/web/src/lib/query/billing.ts apps/web/src/components/settings/billing-card.tsx
git commit -m "feat: expose trialEnd in subscription API response and frontend types"
```

---

### Task 3: Fix webhook to pass through `trialing` status

**Why:** `handleCheckoutCompleted` in `webhook.service.ts` hardcodes `status: 'active'` (line 96). When Creem returns `trialing`, this overwrites it, so trials never get tracked properly.

**Files:**
- Modify: `apps/api/src/services/webhook.service.ts:86-97`

**Step 1: Fix `handleCheckoutCompleted` to use Creem's actual status**

In `apps/api/src/services/webhook.service.ts`, replace `handleCheckoutCompleted` (lines 86–97):

```typescript
  private async handleCheckoutCompleted(session: any): Promise<void> {
    if (!session.subscription) {
      return; // One-time payment, not a subscription
    }

    await subscriptionService.syncSubscription({
      creemSubscriptionId: session.subscription,
      creemCustomerId: session.customer,
      productId: session.product_id,
      status: session.status || 'active', // Pass through Creem's actual status (may be 'trialing')
    });
  }
```

**Step 2: Verify with typecheck**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/services/webhook.service.ts
git commit -m "fix: pass through Creem's actual subscription status instead of hardcoding 'active'"
```

---

### Task 4: Add `trialing` status badge to billing card

**Why:** `getStatusBadge()` only handles `active`, `past_due`, `canceled`. Trialing users see either no badge or a raw string.

**Files:**
- Modify: `apps/web/src/components/settings/billing-card.tsx:197-229`

**Step 1: Add `trialing` and `expired` cases to `getStatusBadge`**

In `apps/web/src/components/settings/billing-card.tsx`, add these cases inside `getStatusBadge()` after the `case 'active':` block (after line 207):

```typescript
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            <AlertCircle className="h-3 w-3" />
            Trial
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <X className="h-3 w-3" />
            Expired
          </span>
        );
```

**Step 2: Verify with typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/settings/billing-card.tsx
git commit -m "feat: add trialing and expired status badges to billing card"
```

---

### Task 5: Create `TrialBanner` component

**Why:** Users on a trial with ≤3 days remaining have no visual indicator anywhere in the app. This banner appears at the top of the authenticated layout.

**Files:**
- Create: `apps/web/src/components/trial-banner.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/trial-banner.tsx`:

```typescript
'use client';

/**
 * TrialBanner
 *
 * Renders a dismissible warning banner when the user's trial has ≤3 days left.
 * Shown at the top of the authenticated layout, above page content.
 *
 * Props come from the parent layout which fetches subscription data.
 */

import { useState, useMemo } from 'react';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TrialBannerProps {
  trialEnd: string; // ISO date string
  tierName: string; // e.g., "Growth" or "Scale"
}

export function TrialBanner({ trialEnd, tierName }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  const daysRemaining = useMemo(() => {
    const end = new Date(trialEnd);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [trialEnd]);

  // Only show when 3 or fewer days remain
  if (dismissed || daysRemaining > 3) {
    return null;
  }

  const isExpired = daysRemaining === 0;

  const message = isExpired
    ? `Your ${tierName} trial has expired. Subscribe to keep your features.`
    : daysRemaining === 1
      ? `Your ${tierName} trial ends tomorrow. Subscribe now to avoid losing access.`
      : `Your ${tierName} trial ends in ${daysRemaining} days. Subscribe to keep your features.`;

  return (
    <div className={`relative flex items-center justify-between gap-4 px-4 py-3 text-sm ${
      isExpired
        ? 'bg-red-600 text-white'
        : 'bg-amber-500 text-white'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium truncate">{message}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => router.push('/settings')}
          className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors"
        >
          Subscribe Now
          <ArrowRight className="h-3 w-3" />
        </button>
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify with typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/trial-banner.tsx
git commit -m "feat: add TrialBanner component for trial expiration countdown"
```

---

### Task 6: Wire `TrialBanner` into authenticated layout

**Why:** The banner must appear globally across all authenticated pages, above the main content area.

**Files:**
- Modify: `apps/web/src/app/(authenticated)/layout.tsx:1-7` (add imports)
- Modify: `apps/web/src/app/(authenticated)/layout.tsx:265-268` (add banner above children)

**Step 1: Add imports**

At the top of `apps/web/src/app/(authenticated)/layout.tsx`, add these imports (after the existing imports around line 7):

```typescript
import { TrialBanner } from '@/components/trial-banner';
import { useSubscription } from '@/lib/query/billing';
import { SUBSCRIPTION_TIER_NAMES } from '@agency-platform/shared';
```

**Step 2: Add subscription query inside the component**

Inside the `AuthenticatedLayout` component, after the `const [open, setOpen] = useState(true);` line (around line 31), add:

```typescript
  const { data: subscription } = useSubscription();
```

**Step 3: Render the banner above page content**

Replace the main content section (lines 265–268):

```typescript
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-auto bg-background">
        {subscription?.status === 'trialing' && subscription.trialEnd && (
          <TrialBanner
            trialEnd={subscription.trialEnd}
            tierName={subscription.tier ? SUBSCRIPTION_TIER_NAMES[subscription.tier] : 'your'}
          />
        )}
        {children}
      </div>
```

**Step 4: Verify with typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/app/(authenticated)/layout.tsx
git commit -m "feat: wire TrialBanner into authenticated layout for global visibility"
```

---

### Task 7: Add "Subscribe Now" CTA to billing card for trialing users

**Why:** Trialing users currently only see "Manage Subscription" (Creem portal). They need a direct "Subscribe Now" button that takes them to Creem checkout to add payment and convert.

**Files:**
- Modify: `apps/web/src/components/settings/billing-card.tsx:326-357` (actions section)

**Step 1: Add trial-specific CTA**

In `apps/web/src/components/settings/billing-card.tsx`, replace the Actions section (lines 326–357) with:

```typescript
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {subscription?.status === 'trialing' ? (
          <>
            <button
              onClick={() => handleUpgrade(currentTier || 'STARTER')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Subscribe Now
            </button>
            <button
              onClick={handleOpenPortal}
              disabled={isOpeningPortal || !subscription}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {isOpeningPortal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleOpenPortal}
              disabled={isOpeningPortal || !subscription}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isOpeningPortal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </button>

            {currentTier !== 'ENTERPRISE' && (
              <button
                onClick={() =>
                  handleUpgrade(isFree ? 'STARTER' : currentTier === 'STARTER' ? 'PRO' : 'ENTERPRISE')
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Upgrade to {isFree ? 'Growth' : currentTier === 'STARTER' ? 'Pro' : 'Enterprise'}
              </button>
            )}
          </>
        )}
      </div>
```

**Step 2: Add trial info callout above actions (after the Current Plan section)**

In the same file, add a trial info callout after the `cancelAtPeriodEnd` warning div (after line 302), inside the current plan `<div>`:

```typescript
        {subscription?.status === 'trialing' && subscription.trialEnd && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Your trial ends on{' '}
              {new Date(subscription.trialEnd).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              . Subscribe to keep your {tierName} features.
            </p>
          </div>
        )}
```

**Step 3: Verify with typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/components/settings/billing-card.tsx
git commit -m "feat: add Subscribe Now CTA and trial info callout to billing card"
```

---

### Task 8: Final verification

**Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: No errors across all workspaces

**Step 2: Run all tests**

Run: `npm run test`
Expected: All tests pass, including the new `trial-expiration.test.ts`

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit all remaining changes (if any)**

```bash
git add -p  # Review each change
git commit -m "chore: final cleanup for trial expiration flow"
```
