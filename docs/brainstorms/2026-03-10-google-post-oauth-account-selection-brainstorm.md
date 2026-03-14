# 2026-03-10 Google Post-OAuth Account Selection Brainstorm

## Objective
Define the missing post-OAuth account-selection step for client access requests, with Google as the primary target surface. The goal is to ensure a client does not finish a Google authorization request until they have selected the specific Google accounts, properties, locations, or containers they want to share with the agency.

## Repo Context (Observed)
- The client invite flow already uses a progressive one-platform-at-a-time model in [`apps/web/src/app/invite/[token]/page.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/app/invite/[token]/page.tsx).
- OAuth platforms already route through the shared wizard in [`apps/web/src/components/client-auth/PlatformAuthWizard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/PlatformAuthWizard.tsx).
- Google product-specific selectors already exist and already support multi-select behavior through checkbox-style asset groups in [`apps/web/src/components/client-auth/GoogleAssetSelector.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-auth/GoogleAssetSelector.tsx).
- Selected assets are already persisted via [`apps/api/src/routes/client-auth/assets.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/assets.routes.ts) into `clientConnection.grantedAssets` and `platformAuthorization.metadata.selectedAssets`.
- OAuth exchange already creates or reuses a `clientConnection` and stores tokens securely in Infisical in [`apps/api/src/routes/client-auth/oauth-exchange.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/oauth-exchange.routes.ts).
- Current completion/progress semantics are too coarse:
  - `authorizationProgress.completedPlatforms` currently treats a platform group as complete when a non-revoked authorization exists, even before asset selection for Google.
  - Final completion in [`apps/api/src/routes/client-auth/completion.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/completion.routes.ts) does not validate whether requested Google products were actually fulfilled.

## Default Architecture Baseline Check
The default `workflow-discovery` baseline does not apply.

Applicable baseline for this repository:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared contracts in `@agency-platform/shared`
- Tailwind and existing invite flow tokens/components
- Existing progressive invite UX from the March 9, 2026 sprint remains the interaction baseline

## User, Job, and Success Criteria
### Primary user
The client recipient completing an access request after clicking the agency’s invite link.

### Secondary user
The agency operator who expects the request to mean “we have access to the requested accounts,” not merely “the client passed OAuth.”

### Core jobs to be done
- Let the client connect Google once, then choose the exact Google assets to share for each requested product.
- Make it obvious which requested Google products still need a selection.
- Prevent the request from being marked complete when nothing useful was granted.
- Avoid trapping the client in an unrecoverable dead end when no assets are available for a requested product.

### Success criteria
- A requested Google product is not considered fulfilled until the client selects at least one asset for that product.
- Google supports multi-select asset picking wherever the upstream asset list supports it.
- A request with missing Google selections is not marked `completed`.
- A zero-assets scenario can still move the client through the broader invite flow without falsely signaling success.
- Agency views, notifications, and webhook semantics distinguish fully completed requests from partially fulfilled ones.

## Product Inputs Confirmed In Discovery
- The reference interaction from Leadsie is the intended pattern: OAuth first, then explicit account selection.
- Google should support multi-select account selection, not single-select dropdown behavior.
- Product direction agreed in discovery:
  - When assets exist, a requested Google product remains incomplete until at least one asset is selected.
  - When zero assets are discoverable for a requested Google product, do not mark the request `completed`; allow flow continuation and treat the request as `partial` / needs follow-up.

## Current Behavior Gaps
1. Google asset selection exists in the UI, but completion semantics do not require it.
2. `PlatformAuthWizard` currently allows a platform to advance to its confirmation state after saving any available group selections, but invite-level request completion still depends on coarse platform-group progress.
3. `authorizationProgress` is derived from authorizations and a narrow `grantedAssets.platform` check in [`apps/api/src/services/access-request.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/access-request.service.ts), which is not sufficient for grouped Google products.
4. The system lacks a first-class concept of per-product fulfillment status within a grouped platform like Google.
5. Zero-assets scenarios are not modeled as a distinct UX state with clear downstream status semantics.

## Key UX/Domain Decision
Separate these milestones explicitly:

- `Connected`: OAuth succeeded and the platform token/session exists.
- `Selected`: the client chose one or more assets for each requested product that requires selection.
- `Completed`: all requested platforms/products are fulfilled.
- `Partial`: the client finished the flow, but one or more requested products could not be fulfilled, such as a zero-assets Google case.

This distinction is necessary because “Google OAuth worked” is not the same thing as “the agency received access to the requested Google accounts.”

## Approaches
### 1) Keep Current Semantics and Treat OAuth Success as Complete
Scope:
- Minor UI polish only.
- Preserve current backend completion logic.

Pros:
- Lowest implementation cost.
- No status-model changes.

Cons:
- Incorrect product semantics.
- Requests can be marked complete with zero selected Google assets.
- Agency notifications/webhooks overstate success.

### 2) Hard Block Entire Flow Until Every Requested Google Product Has a Selection
Scope:
- Require at least one selected asset for every requested Google product before any flow continuation or finalization.
- Zero-assets case becomes a blocking error state.

Pros:
- Strongest semantic correctness.
- Forces resolution before the client leaves the surface.

Cons:
- Creates dead ends for clients who genuinely have no accessible assets under the connected login.
- Turns an account-inventory problem into a trapped UX problem.
- Increases abandonment risk.

### 3) Product-Level Fulfillment with Partial Completion Fallback (Recommended)
Scope:
- Require at least one selected asset per requested Google product when assets exist.
- If a requested Google product returns zero assets, keep that product unfulfilled, allow the client to continue other requested platforms, and finalize the request as `partial` instead of `completed`.
- Update agency/admin surfaces to show which requested products are fulfilled versus unresolved.

Pros:
- Preserves truthful completion semantics.
- Avoids trapping the client.
- Maps cleanly to the existing `partial` lifecycle status.
- Better support and operations story.

Cons:
- Requires per-product fulfillment logic rather than group-level shortcuts.
- Requires coordinated UI, API, progress, and notification updates.

## Recommendation
Adopt **Approach 3**.

This is the strongest balance of UX clarity and domain correctness:
- It matches the Leadsie mental model.
- It avoids false-positive “completed” states.
- It respects the reality that some Google logins will not expose assets for every requested product.
- It creates a clean operational distinction between “client finished what they could” and “agency has everything requested.”

## Proposed User Experience
### Client flow for Google
1. Client clicks `Connect Google`.
2. Client completes Google OAuth.
3. On return, Step 2 shows one section per requested Google product:
   - Google Ads
   - Google Analytics
   - Google Business Profile
   - Google Tag Manager
   - Google Search Console
   - Google Merchant Center
4. Each section supports multi-select from the discovered asset list.
5. The save CTA should remain disabled until every requested Google product is in one of these states:
   - `fulfilled`: one or more assets selected
   - `empty`: no discoverable assets returned for that product
6. If any requested product is `empty`, the UI should show a clear empty-state explanation and a follow-up message that the request can continue but will stay partially complete until the missing product is resolved.

### Empty-state guidance
Per-product empty states should be explicit, for example:
- `Connected to Google, but no Google Ads accounts were found for this login.`
- `You can continue with the rest of this request, but Google Ads will stay unresolved until an eligible account is available.`

### Finalization language
- If all requested products/platforms are fulfilled: normal success, request becomes `completed`.
- If any requested Google product is unresolved because no assets were found: success copy should acknowledge partial completion and explain that the agency may need follow-up for the unresolved product.

## Backend and Data Implications
### Fulfillment model
Introduce a per-requested-product fulfillment evaluation instead of relying only on platform-group authorization presence.

For Google products, fulfillment should be based on saved selected assets:
- `google_ads` -> `adAccounts.length > 0`
- `ga4` -> `properties.length > 0`
- `google_business_profile` -> `businessAccounts.length > 0`
- `google_tag_manager` -> `containers.length > 0`
- `google_search_console` -> `sites.length > 0`
- `google_merchant_center` -> `merchantAccounts.length > 0`

### Progress model
Extend `authorizationProgress` to capture more than `completedPlatforms` and `isComplete`.

Likely additive fields:
- requested product fulfillment summary
- unresolved requested products
- partial-completion reason(s)

This can remain additive to avoid breaking current consumers.

### Request lifecycle
- `completed`: every requested platform/product is fulfilled.
- `partial`: client completed the flow, but at least one requested product remains unresolved.

### Notifications and webhooks
The outbound payload should stop implying success when only OAuth was completed. Notifications/webhooks should include which Google products were fulfilled and which were unresolved.

## UI/Frontend Implications
- `PlatformAuthWizard` needs product-level validation for Google before treating Step 2 as save-ready.
- The Google Step 2 footer should reflect product-level readiness rather than any-selection-across-the-group.
- The invite completion screen should differentiate full completion from partial completion.
- The agency-side request detail and client detail surfaces should show unresolved requested products, not only platform-group status.

## Scope Boundaries
### In scope
- Google post-OAuth selection semantics
- Multi-select Google account/product asset selection
- Completion vs partial-completion logic for unresolved Google products
- Additive progress/status updates needed for truthful UX

### Out of scope
- Reworking non-Google grouped-platform semantics unless needed for consistency later
- Replacing the existing Google selector UI with a different visual pattern
- Agency-side remediation workflows beyond status visibility and clear messaging
- Changes to OAuth provider scopes unless a concrete asset-fetching blocker appears during implementation

## Open Questions
1. Should the unresolved product list be surfaced to the agency only on detail pages, or also in dashboard/request list rows?
2. Should the client success state include a direct “tell your agency” note when a requested Google product had zero assets?
3. Do we want a first-class shared type for product-level authorization fulfillment, or keep it as additive JSON metadata in the first implementation slice?

## Validation Checklist
- Recommendation is grounded in current repo behavior, not only external inspiration.
- The scope distinguishes OAuth connection from product fulfillment.
- The doc avoids a dead-end hard block for zero-assets cases.
- The recommendation preserves trust in `completed` status semantics.
- Open questions are limited and implementation-relevant.

## Handoff to Workflow Plan
Next skill: `workflow-plan`

Planning should focus on:
- additive product-fulfillment contract changes in shared/api/web layers
- TDD-first coverage for Google fulfillment and partial completion
- invite-flow UX updates for empty-state and partial-success handling
- agency/admin visibility for unresolved requested Google products
