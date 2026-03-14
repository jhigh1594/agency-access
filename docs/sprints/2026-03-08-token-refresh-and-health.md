# Sprint: Token Refresh and Health Reliability

- Date: 2026-03-08
- Status: Planned
- Owners: API + Web + Product Marketing
- Scope: Make token refresh and token health production-functional for supported connectors, remove false-positive behavior, and align platform capability handling with truthful product claims.
- Discovery input:
  - Local OAuth connector review completed on 2026-03-08
  - Existing token lifecycle code in `apps/api/src/services/connectors`, `apps/api/src/services/agency-platform.service.ts`, `apps/api/src/services/connection.service.ts`, `apps/api/src/lib/queue.ts`, and `apps/api/src/routes/token-health.ts`

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router + React Query (web)
  - Fastify + Prisma (api)
  - Clerk auth and agency-scoped authorization
  - Redis-backed jobs and OAuth state
  - Infisical token storage
  - Shared types from `@agency-platform/shared`
  - Tailwind semantic-token UI system and shared React primitives

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” are implemented here as reusable React token-health primitives, platform-state badges, and operator actions.
- Token-system work is enforced via shared web status/health primitives and API capability models that drive UI state instead of ad hoc platform branching.

## External Research Decision

No additional external research is required for this planning pass.

Reasoning:
- The critical blockers are internal implementation gaps, not unknown third-party behavior.
- The existing code already encodes the decisive platform constraints:
  - Meta is non-refreshable and requires re-authorization.
  - Klaviyo is to be treated as manual for this sprint.
  - Several connectors are manual or non-expiring and should not be presented as auto-refreshable.

If execution reveals provider-contract ambiguity for a specific connector, that connector should be validated against primary docs during implementation before enabling the claim for that platform.

## Product Decision Log (Locked)

1. “Automatic token refresh” is a capability claim for refreshable OAuth connectors only.
2. “Token health” is a broader capability and must cover all connected platforms via accurate status, live verification where supported, and proactive re-auth states where refresh is impossible.
3. Klaviyo is manual-only for this sprint and must be removed from any OAuth refresh/health automation scope.
4. Meta remains non-refreshable by provider design; the correct behavior is proactive expiry monitoring plus reconnect guidance, not false auto-refresh promises.
5. Marketing and in-app copy must use platform-capability-aware language until every surfaced platform state is truthful.
6. Agency-side and client-side token lifecycle logic must converge on one backend capability model; duplicate refresh logic is not acceptable long-term.

## Requirement Definition

### Requirement 1: Refresh must run automatically for supported OAuth connectors
- Supported refreshable connectors must be refreshed in background before expiry.
- Manual refresh endpoints must reuse the same refresh path as background automation.
- Refresh failures must update observable state and trigger operator-visible remediation.

### Requirement 2: Token health must represent real operability, not only stored expiry
- Health should combine persisted expiry, recent refresh history, platform capability, and live verification where supported.
- Non-refreshable but valid tokens must surface as healthy/expiring with explicit reconnect semantics.
- Invalid or revoked tokens must not remain “healthy” because their stored expiry is still in the future.

### Requirement 3: Platform capability handling must be canonical
- Every connector/platform must declare whether it is:
  - manual,
  - API-key based,
  - OAuth refreshable,
  - OAuth non-refreshable,
  - non-expiring.
- Klaviyo must be marked manual in all user-facing and backend capability registries.
- Unsupported or manual connectors must not appear as refreshable in routes, jobs, or UI.

### Requirement 4: Token access and lifecycle events must be auditable
- Secret reads, refreshes, refresh failures, verification failures, reconnect-required transitions, and revocations must produce structured audit events.
- Audit logging must include user identity when request-scoped and system actor metadata when background-scoped.

### Requirement 5: Delivery must include test coverage, rollout evidence, and claim alignment
- API/web tests must cover the new lifecycle behavior and capability matrix.
- Token-health UI and operator actions must be verified on desktop and mobile.
- Marketing copy and comparison claims must be updated to match actual support scope before broad rollout.

## Architecture Approach

1. Establish a canonical platform token capability model.
   - Add a single capability registry that describes auth mode, token lifecycle, refresh strategy, health-check strategy, and reconnect behavior.
   - Make all routes, jobs, services, and UI derive behavior from this registry.
   - Explicitly classify Klaviyo as manual and remove it from automated token lifecycle paths.

2. Replace split refresh logic with a unified token lifecycle service.
   - Consolidate refresh behavior currently split between `agency-platform.service` and `connection.service`.
   - Expose one internal contract for:
     - `refreshIfNeeded`
     - `refreshNow`
     - `computeHealth`
     - `verifyHealth`
     - `markReconnectRequired`
   - Support both agency platform connections and client platform authorizations without duplicating connector logic.

3. Make background refresh real and observable.
   - Start the token refresh worker during API startup.
   - Schedule recurring scan jobs during startup or worker bootstrap.
   - Separate “scan expiring tokens” jobs from “refresh this token” jobs so the worker payload shape is unambiguous.
   - Add structured logs and audit events for queued, refreshed, skipped, invalid, reconnect-required, and failed states.

4. Build a truthful health pipeline.
   - Persist derived token lifecycle states (`healthy`, `expiring`, `expired`, `invalid`, `reconnect_required`, `manual`, `non_expiring`) or compute them deterministically at read time.
   - Use live connector verification where the platform supports it.
   - Cache live verification results for a short window to avoid excessive provider traffic.
   - Fall back to expiry-only health only when live verification is impossible and the capability registry says that is expected.

5. Re-enable and harden token-health operator surfaces.
   - Restore secure token-health API routes with correct agency scoping.
   - Replace the current route/service mismatch.
   - Update the web token-health page so manual refresh/reconnect actions are platform-aware.
   - Do not offer “Refresh” for manual, non-refreshable, or non-expiring connectors.

6. Align claim surfaces before rollout.
   - Update product copy from blanket “automatic token refresh” to “automatic refresh for supported OAuth connectors” unless and until every surfaced connector truly qualifies.
   - Keep “token health monitoring” as the broader message across all connectors once health states are real.

## Milestones

### Milestone 1: Capability Model + Product Scope Lock
- `TRH-001`, `TRH-010`, `TRH-011`, `TRH-012`, `TRH-013`

### Milestone 2: Unified Backend Lifecycle Engine
- `TRH-020`, `TRH-021`, `TRH-022`, `TRH-023`, `TRH-024`, `TRH-025`

### Milestone 3: Truthful Health APIs + Operator UI
- `TRH-030`, `TRH-031`, `TRH-032`, `TRH-033`, `TRH-034`

### Milestone 4: Verification, Evidence, and Rollout
- `TRH-040`, `TRH-041`, `TRH-042`, `TRH-043`, `TRH-044`

## Ordered Task Board

- [ ] `TRH-001` Create sprint artifact with locked product scope, connector assumptions, and rollout constraints.
  Dependency: none
  Acceptance criteria:
  - Sprint file documents architecture, milestones, verification strategy, risks, and requirement mapping.
  - Scope explicitly states that Klaviyo is manual-only and Meta is non-refreshable.

- [ ] `TRH-010` Create canonical token capability model for all surfaced connectors.
  Dependency: `TRH-001`
  Acceptance criteria:
  - Shared/backend model expresses auth mode, refresh strategy, health-check mode, expiry semantics, and reconnect behavior per platform.
  - Model includes at minimum: `oauth_refreshable`, `oauth_non_refreshable`, `manual`, `api_key`, `non_expiring`.
  - Klaviyo, Beehiiv, Kit, Pinterest, Shopify, Zapier, Mailchimp, TikTok, Meta, Google, and LinkedIn are all explicitly classified.

- [ ] `TRH-011` Align platform registries, routes, and UI lists to the canonical capability model.
  Dependency: `TRH-010`
  Acceptance criteria:
  - Shared types, connector registry, agency-platform constants, and token-health UI all derive from the same capability definitions.
  - No connector appears as OAuth-capable in one registry and manual in another.
  - Klaviyo is removed from OAuth initiation/automation paths.

- [ ] `TRH-012` Lock product-copy support scope for refresh and health claims.
  Dependency: `TRH-010`
  Acceptance criteria:
  - Internal copy matrix defines approved language for:
    - refreshable OAuth connectors,
    - non-refreshable OAuth connectors,
    - manual/API-key connectors.
  - Marketing and in-app copy owners have a clear gate for launch readiness.

- [ ] `TRH-013` Add connector-matrix tests for capability classification.
  Dependency: `TRH-010`, `TRH-011`
  Acceptance criteria:
  - Tests fail if a platform is exposed inconsistently across registries.
  - Tests assert Klaviyo is manual-only for this sprint.

- [ ] `TRH-020` Design and implement a unified token lifecycle service.
  Dependency: `TRH-010`
  Acceptance criteria:
  - One service handles both agency and client token lifecycle behavior.
  - Existing refresh logic in `agency-platform.service` and `connection.service` is routed through the same lifecycle contract.
  - Service returns typed lifecycle outcomes (`refreshed`, `still_valid`, `reconnect_required`, `not_supported`, `invalid`, `manual`).

- [ ] `TRH-021` Repair background refresh architecture and queue semantics.
  Dependency: `TRH-020`
  Acceptance criteria:
  - Refresh worker starts in production startup path.
  - Recurring scheduler is started intentionally and documented.
  - “scan expiring tokens” and “refresh token” jobs use distinct names/payload shapes or distinct queues.
  - Scan jobs actually fan out refresh jobs for supported refreshable connectors only.

- [ ] `TRH-022` Implement deterministic token-state transitions and persistence policy.
  Dependency: `TRH-020`
  Acceptance criteria:
  - Backend updates connection/authorization status when tokens become expired, invalid, revoked, or reconnect-required.
  - Status is not left perpetually `active` after hard invalidation.
  - Transition behavior is documented for agency connections and client authorizations.

- [ ] `TRH-023` Add live verification and short-window health caching.
  Dependency: `TRH-020`
  Acceptance criteria:
  - Platforms with reliable `verifyToken` support are checked live on health reads or reconciliation jobs.
  - Verification results are cached with a bounded TTL to avoid provider spam.
  - Health computation degrades safely when verification is unsupported or transiently unavailable.

- [ ] `TRH-024` Add audit logging at secret-read and lifecycle-event boundaries.
  Dependency: `TRH-020`
  Acceptance criteria:
  - Secret reads used for verification, refresh, or API execution emit audit events.
  - Background jobs log system actor metadata rather than fake user context.
  - Refresh success/failure, verification success/failure, and reconnect-required transitions are auditable.

- [ ] `TRH-025` Refactor manual refresh endpoints to use unified lifecycle service.
  Dependency: `TRH-020`, `TRH-021`
  Acceptance criteria:
  - Manual refresh routes do not implement connector-specific refresh logic inline.
  - Manual actions behave consistently with background refresh support.
  - Non-refreshable/manual connectors return reconnect/help guidance instead of generic refresh failure.

- [ ] `TRH-030` Rebuild token-health API routes on top of the unified lifecycle service.
  Dependency: `TRH-022`, `TRH-023`, `TRH-025`
  Acceptance criteria:
  - Token-health routes are re-enabled with correct agency scoping and authz.
  - Route/service parameter mismatch is removed.
  - Response model includes platform capability, health state, refresh support, reconnect requirement, and last verified/refreshed timestamps.

- [ ] `TRH-031` Add agency-level token health aggregation and filtering.
  Dependency: `TRH-030`
  Acceptance criteria:
  - API supports listing health across an agency’s relevant connections.
  - Aggregations distinguish `healthy`, `expiring`, `expired`, `invalid`, `reconnect_required`, `manual`, and `non_expiring`.
  - The API contract remains `{ data, error }`.

- [ ] `TRH-032` Update token-health web page to use truthful capability-aware actions.
  Dependency: `TRH-030`, `TRH-031`
  Acceptance criteria:
  - Web page renders health states from API rather than computing them locally from `expiresAt`.
  - Refresh buttons appear only for refreshable OAuth connectors.
  - Manual and reconnect-required states have explicit CTAs and copy.

- [ ] `TRH-033` Add reusable token-health UI primitives and token-system compliance updates.
  Dependency: `TRH-032`
  Acceptance criteria:
  - Shared components support all lifecycle states without page-local status logic.
  - New UI uses semantic token classes and shared badges/cards.
  - Existing touched platform surfaces remain visually consistent on desktop and mobile.

- [ ] `TRH-034` Align marketing/comparison copy and in-app claim surfaces with final support matrix.
  Dependency: `TRH-012`, `TRH-032`
  Acceptance criteria:
  - Comparison pages, marketing snippets, and in-app copy no longer imply blanket refresh coverage where it is false.
  - Claim language distinguishes auto-refresh from health monitoring where required.
  - Klaviyo is not advertised as auto-refreshable.

- [ ] `TRH-040` Add backend tests for lifecycle engine, queueing, and status transitions.
  Dependency: `TRH-021`, `TRH-022`, `TRH-023`, `TRH-025`
  Acceptance criteria:
  - Tests cover recurring scan -> fan-out -> refresh flow.
  - Tests cover refreshable, non-refreshable, manual, invalid, and reconnect-required paths.
  - Tests cover route authz and route/service parameter correctness.

- [ ] `TRH-041` Add web tests for token-health rendering and actions.
  Dependency: `TRH-032`, `TRH-033`
  Acceptance criteria:
  - Tests verify capability-aware actions and state rendering.
  - Tests confirm local expiry-only health calculation is no longer the source of truth for the page.
  - Tests cover reconnect-required/manual/non-expiring states.

- [ ] `TRH-042` Capture screenshot-polish verification across required shells.
  Dependency: `TRH-033`
  Acceptance criteria:
  - Capture desktop + mobile states for:
    - healthy refreshable connector,
    - expiring refreshable connector,
    - reconnect-required non-refreshable connector,
    - manual connector.
  - Save artifacts under `docs/images/token-refresh-health/2026-03-08`.

- [ ] `TRH-043` Run quality gates and operational rollout checks.
  Dependency: `TRH-040`, `TRH-041`, `TRH-042`
  Acceptance criteria:
  - Targeted API and web suites pass.
  - Typecheck and lint outcomes are documented.
  - Rollout notes cover Redis/job startup requirements, provider rate limits, and operator playbook.

- [ ] `TRH-044` Release claim changes and operator runbook.
  Dependency: `TRH-034`, `TRH-043`
  Acceptance criteria:
  - Final approved claim matrix is published internally.
  - Operator runbook defines how to handle refresh failures, reconnect-required states, and provider outages.
  - Backout path exists for re-disabling token-health surfaces without regressing core auth flows.

## Verification Strategy

1. Backend lifecycle correctness:
   - Unit tests for capability model and lifecycle service outcomes.
   - Queue/worker tests for scan-job scheduling and refresh execution.
   - Route tests for health listing, manual refresh, reconnect-required, and authz.

2. Connector and provider-behavior safety:
   - Verify refresh support is only enabled for connectors with implemented refresh contracts.
   - Verify live health checks are exercised only where a connector has a real verification path.
   - Verify manual/non-expiring connectors never enter auto-refresh queues.

3. Security and observability:
   - Audit-log tests for token read, refresh, verify, revoke, and reconnect-required events.
   - Secret IDs/tokens must never appear in user-visible responses.

4. Web/operator experience:
   - Token-health page tests for all supported lifecycle states.
   - Regression tests for agency platform cards or connection actions affected by refresh capability changes.

5. Screenshot evidence:
   - Desktop and mobile captures of each lifecycle category.
   - Visual review confirms shared semantic token usage and clear operator affordances.

## Risks and Mitigations

1. Risk: marketing still promises blanket automatic refresh while engineering delivers capability-scoped refresh.
   Mitigation: lock copy changes in `TRH-012` and gate rollout on `TRH-034` and `TRH-044`.

2. Risk: background jobs are enabled without adequate separation between scan jobs and refresh jobs.
   Mitigation: `TRH-021` requires explicit queue semantics and tests before rollout.

3. Risk: live verification introduces provider rate-limit or latency issues.
   Mitigation: `TRH-023` requires short-window caching, capability gating, and fallback behavior.

4. Risk: status transitions break existing UI assumptions that only expect `active/expired/revoked`.
   Mitigation: update shared status contracts and UI primitives in `TRH-022`, `TRH-032`, and `TRH-033` together.

5. Risk: secret-read audit logging becomes noisy or incomplete.
   Mitigation: centralize token read access through lifecycle/Infisical wrappers and test the emitted audit shape in `TRH-024`.

6. Risk: duplicate lifecycle logic remains in legacy services.
   Mitigation: `TRH-020` and `TRH-025` explicitly require shared internal contracts and removal of route-local refresh behavior.

## Rollout Notes (To Complete During Execution)

1. Confirm which connectors are launch-approved for automatic refresh.
2. Confirm which connectors are launch-approved for live token verification.
3. Confirm Redis worker startup and recurring scheduling are enabled in the target environment.
4. Confirm token-health API routes are re-enabled and authenticated.
5. Confirm screenshot evidence exists under `docs/images/token-refresh-health/2026-03-08`.
6. Confirm marketing/comparison pages use capability-scoped copy.

## Review Findings Queue

1. `TRH-RF-001`: Background token refresh infrastructure exists but is not started from API server startup.
2. `TRH-RF-002`: Token health is currently expiry-derived rather than provider-verified.
3. `TRH-RF-003`: Token-health route and service contracts are mismatched.
4. `TRH-RF-004`: Klaviyo PKCE flow is broken in current code and Klaviyo is now manual-only by product decision.
5. `TRH-RF-005`: Platform support registries are inconsistent across shared types, connector config, routes, and UI.
