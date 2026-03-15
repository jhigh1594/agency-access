# MVP Requirement Mapping: Client Request Workflow

## Connections Manage Assets Modal Revamp (2026-03-15)

### Requirement 1: Connections `Manage Assets` modals must share a coherent brutalist shell
- Meta and Google should feel like part of the same product system through a shared header, summary, scroll, and footer contract without flattening their internal workflows.
- Mapped tasks: `MAMR-010`, `MAMR-011`, `MAMR-020`, `MAMR-021`, `MAMR-022`

### Requirement 2: The modal revamp must improve scanability and lightweight task flow without changing core behavior
- Users should be able to understand current configuration state faster through clearer hierarchy, summary framing, warnings, and stable footer affordances while existing autosave and selection logic remain intact.
- Mapped tasks: `MAMR-010`, `MAMR-021`, `MAMR-030`, `MAMR-031`, `MAMR-032`, `MAMR-033`

### Requirement 3: Meta and Google must keep platform-specific internal structure inside the shared shell
- Meta should foreground the stored Business Portfolio and asset permission controls, while Google should retain a readable product/account matrix with upgraded utility controls and warning states.
- Mapped tasks: `MAMR-030`, `MAMR-031`, `MAMR-032`, `MAMR-033`

### Requirement 4: Nested Meta permissions treatment must align with the parent modal system
- The child permissions modal should feel visually related to the new shell and token system without changing permission-selection semantics.
- Mapped tasks: `MAMR-040`, `MAMR-041`

### Requirement 5: Delivery requires enforceable design coverage and screenshot-backed verification
- Touched modal surfaces must remain on semantic tokens, pass focused design and behavior tests, and ship with desktop/mobile browser evidence for parent and nested modal states.
- Mapped tasks: `MAMR-002`, `MAMR-020`, `MAMR-022`, `MAMR-042`, `MAMR-043`

## Meta OBO Client Access Refactor (2026-03-11)

### Requirement 1: Agency owners must see all client-relevant Meta Business Portfolios during setup and invite fulfillment
- Agency-side and client-side Meta selection flows must surface directly accessible, business-user, and OBO-managed portfolios truthfully instead of relying on incomplete cached or `/me/*`-only results.
- Mapped tasks: `MOBO-010`, `MOBO-020`, `MOBO-021`, `MOBO-041`

### Requirement 2: Meta client access fulfillment must follow Meta’s OBO relationship model
- The product should establish the partner/client `managed_businesses` relationship and obtain a client-BM system-user token before attempting asset assignment.
- Mapped tasks: `MOBO-011`, `MOBO-030`, `MOBO-031`, `MOBO-034`, `MOBO-050`

### Requirement 3: Meta asset fulfillment must support a truthful hybrid model
- Facebook Pages should use verified automatic assignment where supported, while Meta ad accounts use a guided manual partner-assignment path with verification and unsupported cases stay unresolved rather than silently passing.
- Mapped tasks: `MOBO-032`, `MOBO-033`, `MOBO-034`, `MOBO-035`, `MOBO-042`, `MOBO-050`

### Requirement 4: Client-facing Meta invite UX must be truthful about grant progress and unresolved work
- The Meta invite flow should expose selected Business Portfolio, automatic page-grant progress, manual ad-account partner-assignment guidance, verified outcomes, and unresolved states without relying on self-attested completion.
- Mapped tasks: `MOBO-040`, `MOBO-041`, `MOBO-042`, `MOBO-051`

### Requirement 5: OBO work must preserve security, auditability, and rollout safety
- OAuth tokens remain in Infisical, token reads are audited, residual unsupported cases such as Instagram and datasets are documented, and rollout evidence includes targeted tests plus desktop/mobile screenshots.
- Mapped tasks: `MOBO-010`, `MOBO-031`, `MOBO-034`, `MOBO-050`, `MOBO-051`, `MOBO-052`

## Dashboard Post-Login Latency (2026-03-11)

### Requirement 1: The first authenticated dashboard render must complete under the `<500ms` budget
- The success metric is the cold post-login dashboard path, not warm in-app navigation.
- Mapped tasks: `DPLT-010`, `DPLT-011`, `DPLT-032`, `DPLT-033`, `DPLT-040`, `DPLT-041`, `DPLT-050`, `DPLT-051`, `DPLT-053`

### Requirement 2: The first dashboard path must not depend on redundant authenticated fetch fan-out
- Layout and dashboard first-load queries should collapse toward one bootstrap payload rather than multiple self-agency, onboarding, and billing round trips.
- Mapped tasks: `DPLT-030`, `DPLT-031`, `DPLT-040`, `DPLT-041`

### Requirement 3: Backend miss-path work must use bounded query counts and avoid duplicate auth/agency resolution
- Principal agency resolution, onboarding status, dashboard stats, and authenticated rate limiting should avoid repeated DB and JWT work on the first request.
- Mapped tasks: `DPLT-020`, `DPLT-021`, `DPLT-022`, `DPLT-023`, `DPLT-030`, `DPLT-031`, `DPLT-032`, `DPLT-033`, `DPLT-050`

### Requirement 4: Performance work must ship with enforceable automated verification
- API and browser perf harnesses must become budget gates so the cold dashboard path cannot regress silently.
- Mapped tasks: `DPLT-042`, `DPLT-051`, `DPLT-053`

### Requirement 5: First-paint dashboard UX must remain visually coherent while perf changes land
- Loading, error, and ready states should remain semantically consistent and screenshot-reviewable across desktop and mobile.
- Mapped tasks: `DPLT-041`, `DPLT-042`, `DPLT-052`, `DPLT-053`

## PRD Workflow 1: Agency Creates Access Request

Requirements:
- Multi-step creator flow
- Clear platform/access selection
- Branding + review + link generation

Mapped tasks:
- `ARWF-100`, `ARWF-110`, `ARWF-111`, `ARWF-120`, `ARWF-300`, `ARWF-301`

## PRD Workflow 2: Client Authorizes Access

Requirements:
- Token-based invite page with clear error handling
- Per-platform authorization progression
- Completion confirmation and continuity across redirects

Mapped tasks:
- `ARWF-020`, `ARWF-200`, `ARWF-201`, `ARWF-202`, `ARWF-210`, `ARWF-211`, `ARWF-220`, `ARWF-300`

## PRD Workflow 3: Reliability + Security of Contract

Requirements:
- Non-breaking API evolution
- Explicit not-found/expired behavior
- No schema migration for this iteration

Mapped tasks:
- `ARWF-010`, `ARWF-020`, `ARWF-021`, `ARWF-500`

## Invite UX Conversion (All 5 Recommendations)

### Recommendation 1: Phase-based Screen Real Estate
- Setup remains focused width; connect/manual flows use wider split desktop layout and stacked mobile layout.
- Mapped tasks: `INVUX-010`, `INVUX-011`, `INVUX-024`

### Recommendation 2: Progressive Manual Checklist UX
- Replace long static manuals with step-by-step checklist model and explicit completion confirmation.
- Mapped tasks: `INVUX-020`, `INVUX-021`, `INVUX-022`, `INVUX-023`

### Recommendation 3: Progress Hierarchy Simplification
- Keep one primary progress hierarchy per page and isolate manual step progress inside manual flows.
- Mapped tasks: `INVUX-012`, `INVUX-040`

### Recommendation 4: Reliability and Recovery States
- Add delayed-loading guidance, timeout recovery, retry orchestration, and cancellation handling.
- Mapped tasks: `INVUX-030`, `INVUX-031`, `INVUX-032`, `INVUX-040`, `INVUX-042`

### Recommendation 5: Evidence + Traceability
- Refresh tests, design compliance coverage, visual evidence, and requirement mapping references.
- Mapped tasks: `INVUX-041`, `INVUX-042`, `INVUX-043`

## Client Invite UI/UX Refresh (2026-03-09)

### Requirement 1: Client-facing invite surfaces must feel trustworthy and clearly branded
- The invite flow should clearly communicate who is requesting access, for whom, and what is being approved without feeling like an internal admin tool.
- Mapped tasks: `CIUX-012`, `CIUX-020`, `CIUX-032`, `CIUX-033`

### Requirement 2: Mobile invite UX must be action-first and readable
- On small screens, the active task must appear before contextual rail content, and sticky action affordances must not interrupt reading order.
- Mapped tasks: `CIUX-012`, `CIUX-021`, `CIUX-031`, `CIUX-042`

### Requirement 3: Progress, CTA, and security copy must be explicit and truthful
- Clients should not need to interpret generic labels or over-broad security language; progress should feel earned and step-specific.
- Mapped tasks: `CIUX-020`, `CIUX-023`, `CIUX-030`, `CIUX-031`

### Requirement 4: Platform capability handling must be canonical across creator and runtime UX
- Manual, OAuth, and hybrid platform behavior must come from one source of truth so client routing, completion, and copy do not contradict each other.
- Mapped tasks: `CIUX-010`, `CIUX-011`, `CIUX-040`

### Requirement 5: Recovery and support entry points must be real, public, and verified
- Invalid-link, timeout, and manual invite states need concrete public support paths with route-allowlist coverage and regression tests when applicable.
- Mapped tasks: `CIUX-022`, `CIUX-040`, `CIUX-042`, `CIUX-043`

## Progressive Platform Auth Flow (2026-03-09)

### Requirement 1: The connect phase must present one active platform at a time
- Multi-platform requests should feel like a guided sequence, not a stacked dashboard of equal-weight tasks.
- Mapped tasks: `PPAF-010`, `PPAF-011`, `PPAF-020`, `PPAF-022`

### Requirement 2: Platform completion must hand the client into the next requested platform explicitly
- Success states should compress completed platforms and move the client forward with a clear next action instead of dropping them back into a list.
- Mapped tasks: `PPAF-020`, `PPAF-021`, `PPAF-030`, `PPAF-040`

### Requirement 3: OAuth and manual platforms must share the same sequencing model
- Manual checklist routes can keep their specialized content engine, but they still need to feel like part of the same ordered queue.
- Mapped tasks: `PPAF-010`, `PPAF-011`, `PPAF-031`, `PPAF-040`, `PPAF-042`

### Requirement 4: The progressive flow must preserve trust, visibility, and callback continuity
- The active CTA must be visibly rendered on first paint, callback returns must restore the correct active platform, and the queue must keep remaining requested scope understandable.
- Mapped tasks: `PPAF-010`, `PPAF-022`, `PPAF-023`, `PPAF-032`, `PPAF-040`

### Requirement 5: Delivery requires focused design, screenshot, and rollout verification
- The new interaction architecture must ship with design-compliance coverage, desktop/mobile screenshot evidence, and rollout notes that explicitly supersede the stacked-connect baseline.
- Mapped tasks: `PPAF-041`, `PPAF-042`, `PPAF-043`

## Invite Action-First Hierarchy (2026-03-10)

### Requirement 1: Setup and connect phases must expose the primary action immediately
- Clients should not need to scroll past orientation chrome before they can continue setup or connect the active platform.
- Mapped tasks: `IAFH-010`, `IAFH-020`, `IAFH-030`, `IAFH-042`

### Requirement 2: Invite hierarchy must use progressive disclosure instead of equal-weight context blocks
- Trust, request details, queue context, and support should remain available without competing visually with the active task.
- Mapped tasks: `IAFH-011`, `IAFH-021`, `IAFH-031`, `IAFH-032`

### Requirement 3: The connect phase must keep one coherent orientation model
- The page should present a single “now / next / remaining” framing rather than multiple stacked queue and summary wrappers above the platform action.
- Mapped tasks: `IAFH-010`, `IAFH-030`, `IAFH-031`, `IAFH-040`

### Requirement 4: Hierarchy changes must preserve trust, auditability, and manual-platform usability
- Requested access levels remain reviewable, trust copy remains clear, and manual-platform identity details remain accessible where needed.
- Mapped tasks: `IAFH-020`, `IAFH-021`, `IAFH-032`, `IAFH-042`

### Requirement 5: Delivery requires hierarchy-specific regression, design, and rollout validation
- The redesigned invite surfaces must ship with focused tests, design compliance coverage, first-paint screenshot evidence, and rollout notes tied to the progressive-flow baseline.
- Mapped tasks: `IAFH-040`, `IAFH-041`, `IAFH-042`, `IAFH-043`

## Client Detail Platform Status (2026-03-10)

### Requirement 1: Agency owners must be able to scan requested platform groups quickly
- The client detail page should answer the operational question first: which platform groups have been requested, what is their current state, and where does follow-up belong.
- Mapped tasks: `CDPS-010`, `CDPS-011`, `CDPS-031`, `CDPS-040`, `CDPS-041`

### Requirement 2: Platform-group progress must expose product-level truth without overwhelming the page
- The primary scan unit is the platform group, but users must be able to expand a group and inspect exact product-level statuses when needed.
- Mapped tasks: `CDPS-010`, `CDPS-021`, `CDPS-022`, `CDPS-031`, `CDPS-040`, `CDPS-042`

### Requirement 3: Request history and activity must remain available as secondary context
- The new grouped board should not replace request chronology or auditability; it should reorder the page so operational summary comes first and historical context stays accessible.
- Mapped tasks: `CDPS-011`, `CDPS-022`, `CDPS-041`

### Requirement 4: Client detail contracts must evolve additively and deterministically
- Shared and API contracts should add grouped status data without breaking existing consumers, and aggregation rules must stay explicit for mixed historical request scenarios.
- Mapped tasks: `CDPS-020`, `CDPS-021`, `CDPS-030`, `CDPS-031`, `CDPS-052`

### Requirement 5: Delivery requires tokenized UI quality and screenshot-backed verification
- The new authenticated surface must use existing semantic tokens, pass focused design-system checks, and ship with desktop/mobile screenshot evidence plus verification notes.
- Mapped tasks: `CDPS-022`, `CDPS-050`, `CDPS-051`, `CDPS-052`, `CDPS-053`

## Client Detail Browser Harness (2026-03-10)

### Requirement 1: Client-detail UI verification must run against deterministic data
- Browser evidence for the client detail page should not depend on live Clerk auth or live API responses; the harness should render typed fixture states directly.
- Mapped tasks: `CDBH-010`, `CDBH-020`, `CDBH-030`, `CDBH-031`

### Requirement 2: The harness must remain development-only and operationally safe
- The route should be gated to development usage, with proxy/public-route changes only if bypass-only access is insufficient.
- Mapped tasks: `CDBH-011`, `CDBH-020`, `CDBH-022`, `CDBH-031`

### Requirement 3: The harness must exercise the real client-detail components
- The page should compose the production client-detail building blocks and support preset-driven expansion states instead of rendering a parallel mock UI.
- Mapped tasks: `CDBH-021`, `CDBH-031`, `CDBH-032`, `CDBH-050`

### Requirement 4: Screenshot capture must become one-command repeatable
- A dedicated evidence script should capture desktop/mobile screenshots for the required presets and write them to a stable docs/images path.
- Mapped tasks: `CDBH-040`, `CDBH-041`, `CDBH-051`

### Requirement 5: The harness must be documented for future client-detail work
- The sprint doc should explain how to use the harness, what states it covers, and any residual limitations such as bypass dependency.
- Mapped tasks: `CDBH-001`, `CDBH-002`, `CDBH-041`, `CDBH-052`

## Google Post-OAuth Account Selection (2026-03-10)

### Requirement 1: Google OAuth must not count as fulfilled until requested assets are selected
- Connecting Google should not mark the request complete by itself; requested Google products need explicit asset fulfillment.
- Mapped tasks: `GPAS-010`, `GPAS-020`, `GPAS-030`, `GPAS-040`

### Requirement 2: Google product fulfillment must support multi-select and truthful unresolved states
- Each requested Google product should support multi-select where available, and zero-assets cases must remain unresolved rather than silently passing.
- Mapped tasks: `GPAS-020`, `GPAS-022`, `GPAS-032`, `GPAS-040`, `GPAS-042`

### Requirement 3: Final request status must distinguish completed from partial fulfillment
- Requests should finalize as `completed` only when all requested products are fulfilled, otherwise `partial` when the client finished but some requested Google products remain unresolved.
- Mapped tasks: `GPAS-021`, `GPAS-030`, `GPAS-031`

### Requirement 4: Agency/admin payloads must expose unresolved requested products truthfully
- Agency-facing views and downstream consumers need additive request-progress detail for unresolved Google products without breaking existing consumers.
- Mapped tasks: `GPAS-010`, `GPAS-030`, `GPAS-041`, `GPAS-051`

### Requirement 5: Delivery requires focused test, review, and rollout verification
- The Google fulfillment change must ship with TDD coverage, targeted review, verification logs, and durable notes if the pattern is reusable.
- Mapped tasks: `GPAS-002`, `GPAS-050`, `GPAS-051`, `GPAS-052`

## Google Account Discovery Hardening (2026-03-10)

### Requirement 1: Each requested Google product must use the correct discovery path
- Post-OAuth discovery should fetch the requested Google product directly instead of relying on a grouped all-products fanout for every selector load.
- Mapped tasks: `GADH-010`, `GADH-020`, `GADH-030`

### Requirement 2: Returned Google entities must match what the client is asked to select
- Business Profile should expose locations, Merchant Center should resolve accessible merchant accounts correctly, and selector-facing labels must stay truthful.
- Mapped tasks: `GADH-010`, `GADH-021`, `GADH-031`, `GADH-032`, `GADH-041`

### Requirement 3: Zero-assets states must be derived from loaded discovery results, not only interaction
- The invite runtime must persist `availableAssetCount` as soon as discovery completes so follow-up-needed states are truthful without extra clicks.
- Mapped tasks: `GADH-022`, `GADH-040`, `GADH-041`

### Requirement 4: Discovery hardening must preserve secure and non-breaking contracts
- OAuth secrets remain in Infisical, current ownership checks stay intact, and existing grouped callers remain safe during refactor.
- Mapped tasks: `GADH-020`, `GADH-030`, `GADH-050`, `GADH-051`

### Requirement 5: Delivery requires focused verification against official Google contracts
- The hardening pass must ship with connector/route/UI tests, relevant typechecks, and residual environment prerequisites documented clearly.
- Mapped tasks: `GADH-002`, `GADH-050`, `GADH-051`, `GADH-052`

## Cross-Platform Post-OAuth Fulfillment Truthfulness (2026-03-10)

### Requirement 1: LinkedIn Ads must adopt post-OAuth asset selection instead of OAuth-only completion
- LinkedIn should no longer skip directly from authorization receipt to final confirmation; the client must be able to select Campaign Manager ad accounts in the shared Step 2 flow.
- Mapped tasks: `CPAF-010`, `CPAF-020`, `CPAF-022`, `CPAF-030`, `CPAF-031`

### Requirement 2: TikTok zero-advertiser cases must be truthful and non-blocking
- When TikTok returns zero discoverable advertisers, the client should not hit a validation dead end; the product should move into a follow-up-needed unresolved state that can still finalize the broader request as `partial`.
- Mapped tasks: `CPAF-011`, `CPAF-021`, `CPAF-032`, `CPAF-042`

### Requirement 3: Asset-selecting OAuth platforms must resolve fulfillment from selected assets, not authorization presence
- Google, Meta Ads, LinkedIn Ads, and TikTok Ads should use a shared evaluator so request progress and completion distinguish `selection_required`, `no_assets`, `partial`, and `completed` truthfully.
- Mapped tasks: `CPAF-010`, `CPAF-011`, `CPAF-020`, `CPAF-040`, `CPAF-041`

### Requirement 4: Invite and agency surfaces must expose unresolved products without breaking existing consumers
- Additive `authorizationProgress` fields should support truthful unresolved-product rendering on invite summary states and agency request details while preserving `completedPlatforms` and `isComplete`.
- Mapped tasks: `CPAF-032`, `CPAF-040`, `CPAF-043`, `CPAF-053`

### Requirement 5: Delivery must include design-token polish, screenshot evidence, and focused regression verification
- Changed surfaces must stay within the existing semantic token system and ship with desktop/mobile evidence plus focused API/web/typecheck validation.
- Mapped tasks: `CPAF-002`, `CPAF-050`, `CPAF-051`, `CPAF-052`, `CPAF-053`

## LinkedIn Page Support (2026-03-10)

### Requirement 1: LinkedIn Pages must be requestable as a distinct product
- Agencies should be able to request LinkedIn Page access explicitly instead of treating it as implied by LinkedIn Ads.
- Mapped tasks: `LIPS-010`, `LIPS-020`, `LIPS-030`

### Requirement 2: LinkedIn OAuth scopes must match the requested LinkedIn products
- Ads-only requests should keep ads/reporting scopes, while requests including LinkedIn Pages should add the organization-admin scope(s) required for page discovery.
- Mapped tasks: `LIPS-011`, `LIPS-020`, `LIPS-031`, `LIPS-052`

### Requirement 3: Clients must be able to select LinkedIn Pages post-OAuth with truthful zero-page handling
- The invite wizard should discover administered LinkedIn Pages, allow selection, and surface follow-up-needed states when no pages are available.
- Mapped tasks: `LIPS-021`, `LIPS-022`, `LIPS-040`, `LIPS-041`, `LIPS-042`

### Requirement 4: Fulfillment and agency status surfaces must treat `linkedin_pages` like other asset-selecting products
- OAuth alone should not fulfill LinkedIn Pages, and unresolved LinkedIn Page requests should remain visible on invite summary and agency request detail surfaces.
- Mapped tasks: `LIPS-030`, `LIPS-042`, `LIPS-043`, `LIPS-053`

### Requirement 5: Delivery requires tokenized UI polish, screenshot evidence, and focused regression verification
- LinkedIn Page support must stay within the existing semantic token system and ship with desktop/mobile screenshot evidence plus focused shared/api/web verification.
- Mapped tasks: `LIPS-002`, `LIPS-050`, `LIPS-051`, `LIPS-052`, `LIPS-053`

## Internal Admin Backend MVP (2026-02-27)

### Requirement 1: Internal-only access control
- All admin APIs and pages must be inaccessible to tenant users.
- Mapped tasks: `ADMN-010`, `ADMN-011`, `ADMN-012`, `ADMN-013`, `ADMN-030`, `ADMN-042`

### Requirement 2: Operational overview (MRR + subscription health)
- Admin can see current MRR and core subscription health counters in one view.
- Mapped tasks: `ADMN-020`, `ADMN-022`, `ADMN-024`, `ADMN-031`, `ADMN-032`

### Requirement 3: Cross-agency user and usage monitoring
- Admin can search agencies and inspect usage/subscription/member summaries.
- Mapped tasks: `ADMN-021`, `ADMN-022`, `ADMN-031`, `ADMN-033`, `ADMN-034`

### Requirement 4: Subscription management actions (safe subset)
- Admin can perform constrained actions (tier change, cancel-at-period-end) with confirmations.
- Mapped tasks: `ADMN-040`, `ADMN-041`, `ADMN-042`

### Requirement 5: Design-token and verification quality gates
- New admin surfaces follow tokenized UI patterns and include screenshot-based polish validation.
- Mapped tasks: `ADMN-035`, `ADMN-050`, `ADMN-051`, `ADMN-052`, `ADMN-053`

## Unified Onboarding Recovery + Re-entry (2026-03-04)

### Requirement 1: Incomplete onboarding users must be recoverable after re-login
- Users who exit before first value should return to unified onboarding instead of getting stranded in app pages.
- Mapped tasks: `UONB-011`, `UONB-012`, `UONB-020`, `UONB-021`, `UONB-022`, `UONB-040`

### Requirement 2: Onboarding progress and completion must persist reliably
- Lifecycle state and step checkpoints should survive refresh, sign-out/sign-in, and transient client errors.
- Mapped tasks: `UONB-010`, `UONB-011`, `UONB-013`, `UONB-014`, `UONB-021`

### Requirement 3: Post-activation onboarding should continue via dashboard checklist
- Users who already generated their first access request should not be hard-blocked, but should see clear remaining tasks.
- Mapped tasks: `UONB-030`, `UONB-031`, `UONB-032`, `UONB-041`

### Requirement 4: Regression safety for unified flow and adjacent surfaces
- Keep invite-flow unchanged and preserve net-new onboarding UX without empty existing-client search friction.
- Mapped tasks: `UONB-023`, `UONB-040`, `UONB-042`

## Access Request Detail + Editing Workflow (2026-03-04)

### Requirement 1: Request detail must be accessible from existing request entry points
- Agencies must be able to open an existing request from client/detail surfaces without dead-end routes.
- Mapped tasks: `ARED-020`, `ARED-021`, `ARED-022`, `ARED-035`

### Requirement 2: Edit flow must be status-aware and safe
- Only `pending` and `partial` requests are editable; completed/expired/revoked requests are read-only with replacement CTA.
- Mapped tasks: `ARED-011`, `ARED-012`, `ARED-030`, `ARED-034`, `ARED-035`

### Requirement 3: Link token behavior must be invisible and deterministic
- Token controls are invisible and request-edit keeps token stable in this sprint (recipient identity edits are handled in client profile management).
- Mapped tasks: `ARED-013`, `ARED-032`, `ARED-034`, `ARED-035`

### Requirement 4: New surfaces must conform to design system quality bars
- Implement reusable request detail/edit primitives, semantic token usage, and screenshot-based polish verification.
- Mapped tasks: `ARED-020`, `ARED-023`, `ARED-031`, `ARED-041`

### Requirement 5: Delivery must include full verification and release safety gates
- API/web tests, type/lint gates, docs refresh, and rollout checklist are required before completion.
- Mapped tasks: `ARED-040`, `ARED-042`, `ARED-043`

## TikTok Business Center Connection (2026-03-04)

### Requirement 1: TikTok OAuth must be production-correct and secure
- Connector must use current TikTok v1.3 auth/token/revoke contracts and secure runtime secrets handling.
- Mapped tasks: `TTBC-010`, `TTBC-011`, `TTBC-012`, `TTBC-013`, `TTBC-014`

### Requirement 2: Agencies must discover authorized TikTok advertisers and BC assets
- After authorization, system must fetch and present authorized ad accounts and BC assets for selection.
- Mapped tasks: `TTBC-020`, `TTBC-021`, `TTBC-022`, `TTBC-023`, `TTBC-024`, `TTBC-025`

### Requirement 3: Platform flow must complete without TikTok dead-ends
- Invite flow step progression must support TikTok account selection and successful completion paths.
- Mapped tasks: `TTBC-023`, `TTBC-024`, `TTBC-025`, `TTBC-034`

### Requirement 4: Business Center partner-sharing automation must be reliable
- System must automate BC partner sharing for selected ad accounts and verify resulting access state.
- Mapped tasks: `TTBC-030`, `TTBC-031`, `TTBC-032`, `TTBC-033`, `TTBC-035`

### Requirement 5: Delivery must include hardening, evidence, and release controls
- Feature must pass test gates, design/token quality checks, screenshot evidence, and staged rollout readiness.
- Mapped tasks: `TTBC-040`, `TTBC-041`, `TTBC-042`, `TTBC-043`, `TTBC-044`
- Operational runbook: [`docs/features/tiktok-business-center-rollout-runbook.md`](/Users/jhigh/agency-access-platform/docs/features/tiktok-business-center-rollout-runbook.md)

## Shopify Flow Inversion (2026-03-05)

### Requirement 1: Agency Shopify connect must be enablement-only
- Agencies should only enable Shopify in Connections; they must not input client store ID or collaborator code.
- Mapped tasks: `SINV-010`, `SINV-020`, `SINV-021`, `SINV-022`

### Requirement 2: Client must provide Shopify identity details during invite flow
- Client invite flow is the source of truth for `shopDomain` + collaborator code and should reflect a clear 3-step collaborator workflow.
- Mapped tasks: `SINV-030`, `SINV-031`

### Requirement 3: Agency must see client-submitted Shopify details after submission
- Agency can view submitted Shopify details in authenticated request detail surfaces after client completion, with ownership checks and audit logs.
- Mapped tasks: `SINV-012`, `SINV-032`, `SINV-033`, `SINV-034`

### Requirement 4: Security and privacy controls must remain intact
- No plaintext collaborator code in logs/errors; authorized reads are auditable; unauthorized reads are blocked.
- Mapped tasks: `SINV-012`, `SINV-031`, `SINV-034`, `SINV-040`

### Requirement 5: Delivery requires full verification and UI quality gates
- API/web tests, tokenized UI compliance, screenshot polish, and release checklist are required for completion.
- Mapped tasks: `SINV-023`, `SINV-040`, `SINV-041`, `SINV-042`, `SINV-043`

## Affiliate Program MVP (2026-03-08)

### Requirement 1: Program ops must be first-party and internally manageable
- Internal team must be able to review applicants, approve partners, inspect referrals, and manage commission state without spreadsheets as source of truth.
- Mapped tasks: `AFIL-010`, `AFIL-011`, `AFIL-034`, `AFIL-035`

### Requirement 2: Attribution must connect clicks to signups to collected revenue
- The system must support first-party redirect tracking, signup claim, checkout handoff, and invoice-based commission creation.
- Mapped tasks: `AFIL-021`, `AFIL-022`, `AFIL-023`, `AFIL-040`, `AFIL-044`
- Implementation note: `AFIL-044` now adds explicit idempotency and reconciliation coverage for duplicate `invoice.paid` handling, reversal paths, payout-batch determinism, export math, and fraud-reviewed ledger exclusions.

### Requirement 3: Partners need a lightweight but real portal
- Approved affiliates must be able to access links, performance metrics, commission status, and enablement assets.
- Mapped tasks: `AFIL-014`, `AFIL-030`, `AFIL-031`, `AFIL-032`, `AFIL-033`
 - Remaining execution note: `AFIL-033` is the final partner-facing enablement gap and should ship as repo-owned promo-kit content inside the existing `/partners` shell, not as a new CMS-backed subsystem.

### Requirement 4: Payout operations must be launchable before payout automation exists
- Manual payout batches, approvals, exports, and hold windows must be tracked inside the product.
- Mapped tasks: `AFIL-041`, `AFIL-042`, `AFIL-044`
- Implementation note: payout batches are now the frozen export and reconciliation boundary, and CSV totals are derived from batch-linked commissions only.
- Operational runbook: [`docs/features/affiliate-program-ops-runbook.md`](/Users/jhigh/agency-access-platform/docs/features/affiliate-program-ops-runbook.md)

### Requirement 5: Fraud controls, verification, and launch quality are required
- Self-referral rules, authz coverage, quality gates, and screenshot polish are mandatory before broad launch.
- Mapped tasks: `AFIL-013`, `AFIL-014`, `AFIL-025`, `AFIL-043`, `AFIL-050`, `AFIL-051`, `AFIL-053`
- Implementation note: `AFIL-043` now ships a real fraud-review queue with auditable resolution actions and partner-safe status mapping, while `AFIL-044` proves those decisions reconcile cleanly through billing and payout export boundaries.
- Operational runbook: [`docs/features/affiliate-program-ops-runbook.md`](/Users/jhigh/agency-access-platform/docs/features/affiliate-program-ops-runbook.md)

## Token Refresh and Health Reliability (2026-03-08)

### Requirement 1: Automatic refresh must be real for supported OAuth connectors
- Background refresh must run before expiry for refreshable OAuth connectors, and manual refresh must reuse the same lifecycle path.
- Mapped tasks: `TRH-010`, `TRH-020`, `TRH-021`, `TRH-025`, `TRH-040`

### Requirement 2: Token health must reflect real operability
- Health must combine expiry semantics, provider verification where supported, and reconnect-required behavior where refresh is impossible.
- Mapped tasks: `TRH-020`, `TRH-022`, `TRH-023`, `TRH-030`, `TRH-031`, `TRH-032`

### Requirement 3: Platform capability handling must be canonical and truthful
- All registries and surfaces must agree on which connectors are refreshable, manual, non-refreshable, API-key based, or non-expiring; Klaviyo is manual-only.
- Mapped tasks: `TRH-010`, `TRH-011`, `TRH-012`, `TRH-013`, `TRH-034`

### Requirement 4: Token lifecycle operations must be auditable and secure
- Secret reads, refreshes, verification checks, and reconnect-required transitions must emit audit events without leaking secrets.
- Mapped tasks: `TRH-020`, `TRH-023`, `TRH-024`, `TRH-040`

### Requirement 5: Delivery requires verification, screenshot evidence, and claim alignment
- API/web tests, operator-facing token-health UI verification, rollout notes, and capability-scoped copy changes are required before launch.
- Mapped tasks: `TRH-032`, `TRH-033`, `TRH-041`, `TRH-042`, `TRH-043`, `TRH-044`

## Webhooks MVP (2026-03-08)

### Requirement 1: Agencies must be able to configure and verify one webhook endpoint
- Agency admins can create, update, disable, rotate, and test a single agency-level endpoint from authenticated settings.
- Mapped tasks: `WH-010`, `WH-011`, `WH-020`, `WH-030`, `WH-031`

### Requirement 2: Access-request lifecycle changes must emit stable, signed events
- Phase-1 events use a versioned envelope, include `externalReference`, and avoid unstable platform-specific payload promises.
- Mapped tasks: `WH-010`, `WH-021`, `WH-023`, `WH-024`, `WH-034`

### Requirement 3: Delivery must be async, retryable, and observable
- Delivery attempts are queue-backed, persisted, retried safely, and visible in agency/internal support surfaces.
- Mapped tasks: `WH-011`, `WH-022`, `WH-023`, `WH-025`, `WH-032`, `WH-033`

### Requirement 4: Support and self-serve diagnostics must be built in
- Agencies and internal admins can inspect delivery history, endpoint state, and failure reasons without raw database access.
- Mapped tasks: `WH-013`, `WH-025`, `WH-031`, `WH-032`, `WH-033`, `WH-042`

### Requirement 5: Launch requires tests, docs, and visual verification
- Shared/API/web tests, public docs, internal runbook, and screenshot-polish evidence are mandatory before launch.
- Mapped tasks: `WH-014`, `WH-040`, `WH-041`, `WH-042`, `WH-043`, `WH-044`
