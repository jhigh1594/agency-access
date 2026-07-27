# Client Invite Flow Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix conversion-killing UX (done→back trap, intake re-gate), harden trust signals, surface errors above success, and deduplicate platform maps.

**Architecture:** Four independent tasks touching different files. No new dependencies. No new files except one extracted shared utility. TDD where logic exists, copy-driven where it's UI copy.

**Tech Stack:** React/Next.js, TypeScript, Tailwind, `@agency-platform/shared`

---

## Task 1: Conversion Clarity — Kill "done but also go back"

**Problem:** Complete phase shows "Back to connect" button that sends users back into the platform flow after they finished. Also, returning visitors with intake fields get re-gated through intake even if they already completed platforms.

**Files:**
- Modify: `apps/web/src/app/invite/[token]/client-invite-page.tsx:249-258` (intake re-gate logic)
- Modify: `apps/web/src/app/invite/[token]/client-invite-page.tsx:749-796` (complete phase JSX)

### Step 1: Fix intake re-gate for returning visitors

In `client-invite-page.tsx`, find the phase resolution logic (line ~258):

```typescript
// BEFORE — re-gates returning visitors through intake
setPhase(hasIntakeFields || !hasStartedConnecting ? 'intake' : 'platforms');
```

Replace with:

```typescript
// Returning visitors who already connected skip intake re-gate
setPhase(hasStartedConnecting ? 'platforms' : hasIntakeFields ? 'intake' : 'platforms');
```

### Step 2: Remove "Back to connect" button from complete phase

In the complete phase JSX (line ~783-794), replace:

```tsx
{/* BEFORE */}
<div className="mt-6 flex flex-col items-center gap-3">
  <Button
    variant="secondary"
    onClick={() => {
      setIsReviewingConnectStatus(true);
      setPhase('platforms');
    }}
  >
    Back to connect
  </Button>
  <p className="text-xs text-muted-foreground">You can now close this window.</p>
</div>
```

With:

```tsx
{/* AFTER — no back button, clear done signal */}
<p className="mt-6 text-sm text-muted-foreground">You can safely close this window.</p>
```

### Step 3: Strengthen completion copy

Replace the weak "You can now close this window" with definitive language:

```tsx
<h2 className="text-2xl font-semibold text-ink font-display">All set — you're done</h2>
<p className="mt-2 text-sm text-muted-foreground">
  {data.agencyName} now has access to the accounts you approved. Nothing else is needed from you.
</p>
```

### Step 4: Commit

```bash
git add apps/web/src/app/invite/[token]/client-invite-page.tsx
git commit -m "fix(invite): kill done-but-also-go-back, skip intake re-gate for returning visitors"
```

---

## Task 2: Trust Signals — Replace jargon badges with plain language

**Problem:** Badge text "Platform-native access only", "OAuth only", "Platform-native invite only" is developer jargon. Users don't know what OAuth or "platform-native" means. "Passwords are never requested" is good — keep it.

**Files:**
- Modify: `apps/web/src/lib/client-invite-platforms.ts:54-88` (security summary)

### Step 1: Rewrite badge and detail strings

In `client-invite-platforms.ts`, replace the `getInviteSecuritySummary` function body:

```typescript
// BEFORE
if (usesOAuthFlow && usesManualFlow) {
    return {
      badge: 'Platform-native access only',
      detail: 'Some platforms use OAuth and others use platform-native invite steps. Passwords are never requested.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  if (usesManualFlow) {
    return {
      badge: 'Platform-native invite only',
      detail: 'This request uses platform-native invite steps only. Passwords are never requested.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  return {
    badge: 'OAuth only',
    detail: 'This request uses official OAuth connections only. Passwords are never requested.',
    usesOAuthFlow,
    usesManualFlow,
  };
```

With:

```typescript
if (usesOAuthFlow && usesManualFlow) {
    return {
      badge: 'Secure — passwords never requested',
      detail: 'You will connect some accounts directly and authorize others through official login screens.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  if (usesManualFlow) {
    return {
      badge: 'Secure — passwords never requested',
      detail: 'You will invite your agency through each platform\'s own settings. No login credentials are shared.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  return {
    badge: 'Secure — passwords never requested',
    detail: 'You will authorize access through each platform\'s official login screen. Your credentials stay with the platform.',
    usesOAuthFlow,
    usesManualFlow,
  };
```

### Step 2: Update test that references old badge text

Find and update `apps/web/src/components/flow/__tests__/invite-hero-header.test.tsx:12`:

```typescript
// BEFORE
badge="Platform-native access only"

// AFTER
badge="Secure — passwords never requested"
```

### Step 3: Run tests

```bash
npm run test --workspace=apps/web -- --run src/components/flow/__tests__/invite-hero-header.test.tsx
```

Expected: PASS

### Step 4: Commit

```bash
git add apps/web/src/lib/client-invite-platforms.ts apps/web/src/components/flow/__tests__/invite-hero-header.test.tsx
git commit -m "fix(invite): replace OAuth/platform-native jargon with plain-language trust signals"
```

---

## Task 3: Error Recovery — Surface errors above success, fix retry hack

**Problem:** `completionError` renders below the success checkmark and "All set" heading — user thinks it worked, then sees error. Also `handleRetryComplete` uses a `setTimeout(0)` hack to toggle phase.

**Files:**
- Modify: `apps/web/src/app/invite/[token]/client-invite-page.tsx:324-330` (retry hack)
- Modify: `apps/web/src/app/invite/[token]/client-invite-page.tsx:749-796` (complete phase — restructure error positioning)

### Step 1: Fix the retry hack

Replace `handleRetryComplete`:

```typescript
// BEFORE — setTimeout hack
const handleRetryComplete = async () => {
  setCompletionError(null);
  completionSubmittedRef.current = false;
  setIsReviewingConnectStatus(false);
  setPhase('platforms');
  setTimeout(() => setPhase('complete'), 0);
};
```

With:

```typescript
// AFTER — direct retry by calling submit inline
const handleRetryComplete = async () => {
  setCompletionError(null);
  setIsReviewingConnectStatus(false);
  // Directly retry without phase toggle hack
  try {
    const response = await fetch(resolveApiUrl(`/api/client/${token}/complete`), {
      method: 'POST',
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error?.message || 'Failed to finalize authorization');
    }
    void capturePosthogEvent('client_authorization_completed', {
      access_request_token: token,
      agency_name: data?.agencyName,
      client_name: data?.clientName,
      platforms_completed: Array.from(completedPlatforms),
      total_platforms: data?.platforms?.length || 0,
    });
    sessionStorage.removeItem(storageKey);
  } catch (error) {
    setCompletionError(
      error instanceof Error
        ? error.message
        : 'Authorization was completed, but we could not finalize status. Retry below.'
    );
  }
};
```

### Step 2: Restructure complete phase — error above success

Replace the complete phase JSX block (the `{phase === 'complete' && (...)}` section) with:

```tsx
{phase === 'complete' && (
  <div className="rounded-lg border-2 border-black bg-card p-8 shadow-brutalist text-center">
    {completionError ? (
      <>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-coral bg-coral/10">
          <RefreshCw className="h-8 w-8 text-coral" />
        </div>
        <h2 className="text-2xl font-semibold text-ink font-display">Almost done — finalize failed</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          All platforms are connected, but we couldn't confirm completion with your agency.
        </p>
        <div className="mt-4 rounded-lg border border-coral/30 bg-coral/10 p-4 text-left">
          <p className="text-sm text-coral">{completionError}</p>
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRetryComplete}
          >
            Retry Finalization
          </Button>
        </div>
      </>
    ) : (
      <>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-teal bg-teal/10">
          <Check className="h-8 w-8 text-teal" />
        </div>
        <h2 className="text-2xl font-semibold text-ink font-display">All set — you're done</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.agencyName} now has access to the accounts you approved. Nothing else is needed from you.
        </p>
        <div className="mt-6 rounded-lg border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connected Platforms</p>
          <p className="mt-2 text-sm text-ink">
            {Array.from(completedPlatforms)
              .map((platform) => PLATFORM_NAMES[platform])
              .join(', ') || 'No platforms connected'}
          </p>
        </div>
      </>
    )}
    <p className="mt-6 text-sm text-muted-foreground">You can safely close this window.</p>
  </div>
)}
```

### Step 3: Commit

```bash
git add apps/web/src/app/invite/[token]/client-invite-page.tsx
git commit -m "fix(invite): surface completion errors above success, remove retry hack"
```

---

## Task 4: Code Quality — Deduplicate platform maps

**Problem:** Three files define local `PLATFORM_NAMES` maps (manual-invitation-modal, platform-connection-row, platform-connection-modal) with different subsets, while `@agency-platform/shared` already exports a canonical `PLATFORM_NAMES: Record<Platform, string>`. Also `ACCESS_LEVEL_DISPLAY` and `formatAccessLevelLabel` are duplicated locally in `client-invite-page.tsx` when `ACCESS_LEVEL_DESCRIPTIONS` exists in shared.

**Files:**
- Modify: `apps/web/src/components/manual-invitation-modal.tsx:24-33` (remove local PLATFORM_NAMES)
- Modify: `apps/web/src/components/platform-connection-row.tsx:17-24` (remove local PLATFORM_NAMES)
- Modify: `apps/web/src/components/platform-connection-modal.tsx:20-27` (remove local PLATFORM_NAMES)
- Modify: `apps/web/src/app/invite/[token]/client-invite-page.tsx:58-67` (replace local ACCESS_LEVEL_DISPLAY)

### Step 1: Deduplicate manual-invitation-modal.tsx

Remove the local PLATFORM_NAMES (lines 24-33):

```typescript
// DELETE THIS BLOCK
const PLATFORM_NAMES: Record<string, string> = {
  kit: 'Kit',
  mailchimp: 'Mailchimp',
  beehiiv: 'Beehiiv',
  klaviyo: 'Klaviyo',
  snapchat: 'Snapchat',
  pinterest: 'Pinterest',
  shopify: 'Shopify',
  zapier: 'Zapier',
};
```

Add import at top:

```typescript
import { PLATFORM_NAMES } from '@agency-platform/shared';
```

Change the usage at line 64 from:

```typescript
const platformName = PLATFORM_NAMES[platform] || platform;
```

To:

```typescript
const platformName = PLATFORM_NAMES[platform as import('@agency-platform/shared').Platform] || platform;
```

### Step 2: Deduplicate platform-connection-row.tsx

Remove the local PLATFORM_NAMES (lines 17-24):

```typescript
// DELETE THIS BLOCK
const PLATFORM_NAMES: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  instagram: 'Instagram',
};
```

Add import at top:

```typescript
import { PLATFORM_NAMES, type Platform } from '@agency-platform/shared';
```

Change line 52:

```typescript
// BEFORE
const platformName = PLATFORM_NAMES[connection.platform] || connection.platform;
// AFTER
const platformName = PLATFORM_NAMES[connection.platform as Platform] || connection.platform;
```

### Step 3: Deduplicate platform-connection-modal.tsx

Remove the local PLATFORM_NAMES (lines 20-27):

```typescript
// DELETE THIS BLOCK
const PLATFORM_NAMES: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  instagram: 'Instagram',
};
```

Add import at top:

```typescript
import { PLATFORM_NAMES, type Platform } from '@agency-platform/shared';
```

Change line 335 and 444:

```typescript
// BEFORE
{connection.name || PLATFORM_NAMES[connection.platform] || connection.platform}
// AFTER
{connection.name || PLATFORM_NAMES[connection.platform as Platform] || connection.platform}

// BEFORE
<strong>{PLATFORM_NAMES[disconnectPlatform] || disconnectPlatform}</strong>?
// AFTER
<strong>{PLATFORM_NAMES[disconnectPlatform as Platform] || disconnectPlatform}</strong>?
```

### Step 4: Replace local ACCESS_LEVEL_DISPLAY in client-invite-page.tsx

Remove lines 58-67:

```typescript
// DELETE THIS BLOCK
const ACCESS_LEVEL_DISPLAY: Record<string, string> = {
  admin: 'Full access',
  standard: 'Standard access',
  read_only: 'Read only',
  email_only: 'Email only',
};

function formatAccessLevelLabel(value: string): string {
  return ACCESS_LEVEL_DISPLAY[value] ?? value.replace(/_/g, ' ');
}
```

Add to imports at top:

```typescript
import { PLATFORM_NAMES, ACCESS_LEVEL_DESCRIPTIONS } from '@agency-platform/shared';
```

Change line 601 from:

```typescript
{`${PLATFORM_NAMES[product.product as Platform] || product.product} · ${formatAccessLevelLabel(product.accessLevel)}`}
```

To:

```typescript
{`${PLATFORM_NAMES[product.product as Platform] || product.product} · ${ACCESS_LEVEL_DESCRIPTIONS[product.accessLevel as AccessLevel]?.title ?? product.accessLevel.replace(/_/g, ' ')}`}
```

Add `AccessLevel` to the shared type import:

```typescript
import type { ClientAccessRequestPayload, Platform, AccessLevel } from '@agency-platform/shared';
```

### Step 5: Run tests

```bash
npm run typecheck
npm run test --workspace=apps/web -- --run
```

Expected: PASS (typecheck confirms no broken references, tests confirm no regressions)

### Step 6: Commit

```bash
git add apps/web/src/components/manual-invitation-modal.tsx apps/web/src/components/platform-connection-row.tsx apps/web/src/components/platform-connection-modal.tsx apps/web/src/app/invite/[token]/client-invite-page.tsx
git commit -m "refactor: deduplicate PLATFORM_NAMES maps to shared, replace local ACCESS_LEVEL_DISPLAY"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ Conversion clarity: Task 1 — intake re-gate + back button + copy
- ✅ Trust signals: Task 2 — badge/detail rewrite in getInviteSecuritySummary
- ✅ Error recovery: Task 3 — error-first rendering + retry hack removal
- ✅ Code quality: Task 4 — 3 local PLATFORM_NAMES + local ACCESS_LEVEL_DISPLAY deduped

**2. Placeholder scan:**
- ✅ No TBD/TODO/fill-in
- ✅ All code shown inline
- ✅ All file paths specific

**3. Type consistency:**
- ✅ `Platform` type cast used consistently across all dedup usages
- ✅ `AccessLevel` imported for formatAccessLevelLabel replacement
- ✅ `PLATFORM_NAMES` from shared used as `Record<Platform, string>` — all call sites cast to Platform

**4. Interaction between tasks:**
- Tasks 1 and 3 both modify `client-invite-page.tsx` complete phase JSX. **Execute Task 3 after Task 1** — Task 3's restructured complete phase incorporates Task 1's changes (no back button, "you're done" copy, "safely close" text).
- Tasks 1, 3, and 4 all touch `client-invite-page.tsx`. **Execution order: Task 1 → Task 3 → Task 4** to avoid merge conflicts on the same file.
- Task 2 is independent (different file: `client-invite-platforms.ts`).
