# 2026-03-10 Cross-Platform Post-OAuth Selection Brainstorm

## Objective
Review the recent Google client access request flow changes and determine whether LinkedIn, Meta, and TikTok need the same treatment in the access request wizard.

## Repo Context (Observed)
- The recent Google changes are concentrated in the shared wizard and Google-specific selector logic:
  - [`apps/web/src/components/client-auth/PlatformAuthWizard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/PlatformAuthWizard.tsx)
  - [`apps/web/src/components/client-auth/GoogleAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/GoogleAssetSelector.tsx)
  - [`apps/api/src/routes/client-auth/assets.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/assets.routes.ts)
- Those changes added two distinct behaviors for Google:
  - product-level asset selection after OAuth
  - a zero-assets follow-up path that lets the client continue without falsely implying the product was fulfilled
- The shared backend completion model is still coarse:
  - [`apps/api/src/services/access-request.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/access-request.service.ts) still marks a platform group complete when any non-revoked authorization exists
  - [`apps/api/src/routes/client-auth/completion.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/completion.routes.ts) still finalizes the request by calling `markRequestAuthorized()`, which unconditionally sets `completed`
- LinkedIn currently has a selector component on disk, but it is not wired into the wizard and the asset fetch route does not support LinkedIn products:
  - [`apps/web/src/components/client-auth/LinkedInAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/LinkedInAssetSelector.tsx)
  - [`apps/web/src/components/client-auth/PlatformAuthWizard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/PlatformAuthWizard.tsx)
  - [`apps/api/src/routes/client-auth/assets.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/assets.routes.ts)
- Meta already has post-OAuth asset selection and a grant-access phase:
  - [`apps/web/src/components/client-auth/MetaAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/MetaAssetSelector.tsx)
- TikTok already has post-OAuth asset selection plus a partial-failure/manual-follow-up path for Business Center sharing:
  - [`apps/web/src/components/client-auth/TikTokAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/TikTokAssetSelector.tsx)
  - [`apps/web/src/components/client-auth/PlatformAuthWizard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/PlatformAuthWizard.tsx)

## Default Architecture Baseline Check
The default `workflow-discovery` baseline does not apply.

Applicable baseline for this repository:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared contracts in `@agency-platform/shared`
- Progressive invite UX centered on `PlatformAuthWizard`

## User, Job, and Success Criteria
### Primary user
The client completing the agency’s access request.

### Secondary user
The agency operator who expects the request to represent actual usable platform access, not just successful OAuth.

### Success criteria
- Platforms that require account-level selection should not be treated as fulfilled on OAuth alone.
- Zero-assets cases should not trap the client in a dead end.
- Partial or unresolved states should be explicit where the platform workflow supports partial completion.
- Cross-platform behavior should stay coherent enough that agencies can trust the resulting request status.

## What The Google Change Actually Solved
The recent Google work solved three separate problems:

1. Better asset discovery after OAuth.
2. A truthful zero-assets path in the wizard.
3. Agency-side visibility for unresolved Google products.

That matters because the answer is different depending on which of those three concerns we are comparing against.

## Platform Assessment
### LinkedIn
Verdict: **Yes, LinkedIn needs the same class of change as pre-fix Google.**

Why:
- The wizard does not treat `linkedin_ads` as asset-selecting. `supportsAssetSelection()` includes Meta, Google, and TikTok, but not LinkedIn in [`apps/web/src/components/client-auth/PlatformAuthWizard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/PlatformAuthWizard.tsx).
- There is an explicit test asserting LinkedIn should skip asset selection and go straight from “authorization received” to confirmation in [`apps/web/src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx).
- A `LinkedInAssetSelector` already exists, which strongly suggests the product direction was heading toward post-OAuth account selection, but it is currently orphaned in [`apps/web/src/components/client-auth/LinkedInAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/LinkedInAssetSelector.tsx).
- The asset fetch route does not map or fetch LinkedIn assets, so wiring the selector today would still fail with `UNSUPPORTED_PLATFORM` in [`apps/api/src/routes/client-auth/assets.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/assets.routes.ts).

Implication:
- LinkedIn is still operating with the same misleading semantics Google had before this work: OAuth success is effectively treated as “done,” even though the client may have multiple or zero Campaign Manager accounts.

### Meta
Verdict: **No, Meta does not need the same wizard change right now.**

Why:
- Meta already has a real post-OAuth asset selection surface in [`apps/web/src/components/client-auth/MetaAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/MetaAssetSelector.tsx).
- Meta already has a second “grant access” phase in the wizard after selection in [`apps/web/src/components/client-auth/PlatformAuthWizard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/PlatformAuthWizard.tsx).
- Meta also offers in-flow remediation for empty states, including ad account creation and page creation guidance, which is materially different from Google’s zero-assets follow-up problem.

What still exists:
- Meta is still exposed to the broader shared-status problem because backend `authorizationProgress` and final completion are not actually selection-aware.
- That is a shared fulfillment-model issue, not a Meta-specific need to copy the new Google UI behavior.

Implication:
- Do not clone the Google zero-assets/follow-up UX onto Meta right now.
- Do include Meta when the backend fulfillment semantics are generalized beyond OAuth-only completion.

### TikTok
Verdict: **TikTok does not need the full Google treatment, but it does need a targeted empty-selection fix.**

Why:
- TikTok already has an asset selector and a manual-follow-up path when partner sharing partially fails.
- Unlike Google, the main TikTok gap is not “no follow-up state exists.” It does exist.
- The specific problem is that `canContinueFromAssetSelection()` returns `true` for TikTok unconditionally in [`apps/web/src/components/client-auth/PlatformAuthWizard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/PlatformAuthWizard.tsx).
- When no advertisers are selected, the share endpoint rejects the request with a validation error, and that behavior is covered in [`apps/api/src/routes/client-auth/__tests__/assets.tiktok.test.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/__tests__/assets.tiktok.test.ts).
- `TikTokAssetSelector` can render a real zero-assets empty state in [`apps/web/src/components/client-auth/TikTokAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/TikTokAssetSelector.tsx), but the wizard does not currently model that as either blocked or follow-up-required.

Implication:
- TikTok needs cleanup around the zero-advertiser path.
- It does not need a copy of Google’s per-product multi-surface selector work.

## Shared Cross-Platform Finding
Even after the Google UI changes, the backend lifecycle model is still broader than the platform-specific fixes.

Evidence:
- `authorizationProgress.completedPlatforms` is still derived from authorizations first, not fulfillment, in [`apps/api/src/services/access-request.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/access-request.service.ts).
- The `grantedAssets.platform` check in that same service is not aligned with the current saved shape, which is keyed by product/platform name rather than a top-level `platform` field.
- Final completion still calls `markRequestAuthorized()` and sets `completed` unconditionally in [`apps/api/src/routes/client-auth/completion.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/completion.routes.ts) and [`apps/api/src/services/access-request.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/access-request.service.ts).

This means:
- Google’s new wizard behavior improves the immediate UX.
- But the underlying fulfillment/status semantics are still not generalized across Google, Meta, or TikTok.

## Approaches
### 1) Treat Google as a one-off and leave the rest unchanged
Pros:
- Lowest short-term effort.
- No new connector or status-model work.

Cons:
- Leaves LinkedIn clearly inconsistent.
- Leaves TikTok’s zero-advertiser path brittle.
- Preserves a shared backend truthfulness problem across asset-selecting platforms.

### 2) Bring LinkedIn to Google parity, leave Meta and TikTok otherwise as-is
Pros:
- Fixes the most obvious remaining gap.
- Uses the existing dormant LinkedIn selector as a starting point.
- Keeps scope tighter than a full fulfillment-model rewrite.

Cons:
- Still leaves TikTok’s empty-selection edge case unresolved.
- Still leaves Meta/TikTok/Google sharing the same coarse backend completion semantics.

### 3) Generalize fulfillment semantics for all asset-selecting OAuth platforms, with platform-specific UI changes only where needed (Recommended)
Scope:
- Add LinkedIn post-OAuth asset selection and backend asset fetch support.
- Tighten TikTok’s zero-advertiser behavior so the wizard does not allow a dead-end submit.
- Keep Meta’s current UI flow.
- Move Google, Meta, TikTok, and LinkedIn onto a shared fulfillment-aware completion model.

Pros:
- Fixes the real consistency problem instead of only the most visible symptom.
- Keeps platform-specific UI changes proportionate to actual need.
- Gives agencies a trustworthy status model across platforms.

Cons:
- Larger scope than a LinkedIn-only patch.
- Requires coordinated shared/api/web changes.

## Recommendation
Adopt **Approach 3**, but stage it in this order:

1. LinkedIn parity work first.
2. TikTok zero-advertiser guard or follow-up handling second.
3. Shared fulfillment/status model for Google, Meta, TikTok, and LinkedIn.

## Concrete Recommendation By Platform
- **LinkedIn:** Yes. Add Google-style post-OAuth asset selection semantics.
- **Meta:** No direct copy of the Google wizard change. Keep current selector/grant flow, but include Meta in the later shared fulfillment-status generalization.
- **TikTok:** No full Google-style change. Add a targeted fix for zero advertisers and keep the existing partial-share/manual-follow-up pattern.

## Scope Boundaries
### In scope
- Determining cross-platform applicability of the new Google access-request behavior
- Identifying where parity is required versus where a different fix is better
- Recommending the next planning scope

### Out of scope
- Implementing the LinkedIn, Meta, or TikTok changes
- Rewriting the full invite lifecycle in this discovery pass
- Solving non-OAuth/manual platforms

## Open Questions
1. Should TikTok zero-advertiser cases be treated like Google `follow-up needed`, or should TikTok remain hard-blocked until at least one advertiser is selected?
2. Do we want LinkedIn’s first slice to support only ad account selection, or also future organization/page-level selection if product asks for it later?

## Validation Checklist
- The recommendation distinguishes platform-specific UI needs from shared backend lifecycle issues.
- LinkedIn, Meta, and TikTok are each evaluated against the actual Google changes, not a vague notion of “consistency.”
- The conclusion stays grounded in current code paths and tests.
- The scope recommendation is staged and implementable.

## Handoff to Workflow Plan
Next skill: `workflow-plan`

Planning should focus on:
- LinkedIn post-OAuth asset discovery and selector wiring
- TikTok zero-advertiser UX and validation behavior
- fulfillment-aware `authorizationProgress` and final completion semantics for all asset-selecting OAuth platforms
