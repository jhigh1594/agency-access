# Sprint: Affiliate Program MVP

- Date: 2026-03-08
- Status: In Progress
- Owners: Web + API
- Scope: Build a first-party affiliate program with lightweight partner management, attribution, commission tracking, and internal payout operations.
- Discovery input: [`docs/brainstorms/2026-03-08-affiliate-program-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-08-affiliate-program-brainstorm.md)

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native
- Applicable baseline used for this sprint:
  - Next.js App Router
  - Fastify + Prisma
  - Clerk auth
  - React Query
  - Tailwind tokenized UI + shared React primitives
  - Creem billing webhooks
  - PostHog client analytics

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” map here to reusable React primitives for partner/admin surfaces.
- Token-system work is enforced through semantic token usage and existing authenticated shell patterns.

## External Research Decision

External research is required for this sprint because:
- affiliate economics, attribution windows, and portal expectations are not repo-local knowledge
- OSS build-vs-buy tradeoffs materially affect architecture
- billing provider capabilities influence the commission design

Decision-complete conclusions from research:
- Long cookie windows and materially generous economics are common in successful SaaS programs
- Partner enablement assets are as important as raw commission rate
- Creem can help with monetization events, but should not become the only affiliate source of truth
- A first-party partner ledger with OSS-friendly link/analytics components is the best fit for this repo

## Product Decision Log (Recommended Defaults)

1. Launch as an **approval-based** affiliate program.
2. Phase 1 uses **manual payout execution**, not automated payout rails.
3. Attribution uses **first-party redirect links + first-party cookie** with a `90-day` window.
4. Default economics:
   - `30% recurring for 12 months`
   - `30-day` hold before payout approval
   - monthly payout batches
5. Commission is earned on **collected revenue**, not raw signup creation.
6. Self-referrals and suspicious duplicate referrals are blocked or forced into manual review.
7. Partner auth uses **Clerk** in a dedicated partner route group, not custom auth.
8. Source of truth for partners, clicks, referrals, commissions, and payouts lives in this product database.
9. Phase 1 launches as an **invite-only pilot** operationally, even if the public affiliate page and application form are live.
10. Phase 1 attribution is **links-first**; coupon-code attribution is explicitly out of scope.
11. Phase 1 supports **one default commission plan plus manual partner-level overrides** only.

## Architecture Approach

1. Add shared affiliate DTOs, enums, and validation schemas in `packages/shared`.
2. Add new Prisma models for partner, link, click, referral, commission, and payout batch.
3. Implement public redirect-based attribution:
   - web route handler at `/r/[code]`
   - public API contract for click resolution / logging
   - first-party cookie with secure claim path into signup + checkout
4. Attach affiliate attribution to agency and billing lifecycle:
   - claim referral at signup/onboarding
   - include referral metadata on Creem checkout
   - create/update commission records from `invoice.paid` and related events
   - treat affiliate accounting as a derived sidecar ledger, not the owner of subscription state
5. Add partner portal routes in web for approved affiliates only.
6. Add internal admin affiliate operations surfaces alongside current admin patterns.
7. Add lightweight promo-kit support so approved affiliates get links + copy, not just stats.
8. Keep payout execution manual in-app:
   - generate payout batches
   - approve/void commissions
   - export partner payout totals
9. Add baseline fraud controls and auditability before launch.
10. Build shared affiliate React primitives for public, partner, and admin surfaces so the feature does not fork the design system.

## Billing Isolation Guardrails

1. Existing client checkout creation, billing portal, tier mapping, and agency subscription state remain owned by the current billing services and routes.
2. Affiliate commission logic is additive only:
   - it reads checkout metadata, subscription state, and invoice events
   - it writes affiliate ledger state
   - it does not decide customer entitlement, price selection, or product-tier mapping
3. The only shared runtime surface is the live Creem webhook endpoint:
   - existing `subscription.created`, `subscription.updated`, and `subscription.canceled` behavior must remain behaviorally unchanged
   - `invoice.paid` and related invoice events are added without changing the checkout contract for non-affiliate customers
4. Any affiliate-processing failure must not corrupt or roll back valid customer subscription state.
5. All new billing-touching work must be covered by regression tests for the current billing webhook behavior before affiliate portal dependencies are allowed to ship.

## Milestones

### Milestone 1: Domain Contracts + Data Foundation
- `AFIL-001`, `AFIL-010`, `AFIL-011`, `AFIL-012`, `AFIL-013`, `AFIL-014`

### Milestone 2: Public Program + Attribution Flow
- `AFIL-020`, `AFIL-021`, `AFIL-022`, `AFIL-023`, `AFIL-024`, `AFIL-025`

### Milestone 3: Partner Portal + Admin Operations
- `AFIL-030`, `AFIL-031`, `AFIL-032`, `AFIL-033`, `AFIL-034`, `AFIL-035`

### Milestone 4: Commission Accounting + Payout Ops
- `AFIL-040`, `AFIL-041`, `AFIL-042`, `AFIL-043`, `AFIL-044`

### Milestone 5: Verification, Polish, and Launch Readiness
- `AFIL-050`, `AFIL-051`, `AFIL-052`, `AFIL-053`

## Ordered Task Board

- [x] `AFIL-001` Create sprint artifact with locked defaults and architecture guardrails.
  Dependency: none
  Acceptance criteria:
  - Sprint includes architecture, milestones, tasks, verification strategy, risks, and requirement mapping references.
  - Manual-payout assumption and attribution model are explicit.

- [x] `AFIL-010` Add shared affiliate types and runtime validation.
  Dependency: `AFIL-001`
  Acceptance criteria:
  - `packages/shared/src/types.ts` includes partner status, referral status, commission status, payout status, and public/admin DTOs.
  - Shared exports are added in [`index.ts`](/Users/jhigh/agency-access-platform/packages/shared/src/index.ts).
  - Zod schemas cover public application input, partner portal responses, and admin mutation inputs.

- [x] `AFIL-011` Add Prisma affiliate domain models and migration.
  Dependency: `AFIL-010`
  Acceptance criteria:
  - Schema includes `AffiliatePartner`, `AffiliateLink`, `AffiliateClick`, `AffiliateReferral`, `AffiliateCommission`, and `AffiliatePayoutBatch`.
  - Schema includes stable foreign keys into `Agency`, `Subscription`, and `Invoice` where needed.
  - Sensitive payout details are modeled safely and not dumped in unvalidated blobs.

- [x] `AFIL-012` Extend environment and configuration for affiliate tracking.
  Dependency: `AFIL-011`
  Acceptance criteria:
  - Affiliate cookie TTL, default commission settings, and partner portal feature flag are defined in [`env.ts`](/Users/jhigh/agency-access-platform/apps/api/src/lib/env.ts) and examples.
  - Web env additions are documented where needed.

- [x] `AFIL-013` Seed-safe repository helpers for affiliate calculations and fraud rules.
  Dependency: `AFIL-011`
  Acceptance criteria:
  - Commission calculation helpers are isolated in a dedicated service/module.
  - Fraud heuristics and disqualification reasons are centrally typed.
  - Unit tests cover core commission math and rule evaluation.

- [x] `AFIL-014` Define reusable affiliate React primitives and token-system contract.
  Dependency: `AFIL-001`
  Acceptance criteria:
  - Shared primitives/variants exist for affiliate stat cards, ledger tables, status chips, and page-section shells where reuse is expected.
  - New affiliate surfaces use semantic tokens and shared variants rather than raw palette classes or one-off styling.
  - Desktop/mobile layout expectations are defined before page implementation begins.

- [x] `AFIL-020` Build public affiliate landing page and application flow.
  Dependency: `AFIL-010`, `AFIL-014`
  Acceptance criteria:
  - Public route explains program economics, fit, and application CTA.
  - Application submission persists to the affiliate domain model with approval status.
  - UI follows established marketing patterns and tokenized styling.

- [x] `AFIL-021` Implement public redirect route and click logging.
  Dependency: `AFIL-011`, `AFIL-012`
  Acceptance criteria:
  - `/r/[code]` sets a secure first-party cookie and redirects to configured destination.
  - Click records capture partner/link/referrer/utm metadata and hashed anti-fraud signals.
  - Invalid or disabled codes degrade safely.

- [x] `AFIL-022` Claim affiliate attribution during signup/onboarding.
  Dependency: `AFIL-021`
  Acceptance criteria:
  - New agency creation path can associate an affiliate referral from the cookie.
  - Attribution survives onboarding and does not require query params to persist manually.
  - Last-touch / winning-attribution rule is deterministic and documented.

- [x] `AFIL-023` Attach referral metadata to Creem checkout creation.
  Dependency: `AFIL-022`
  Acceptance criteria:
  - Checkout flow includes affiliate/referral metadata where available.
  - Subscription creation remains backward compatible for non-affiliate signups.
  - Tests confirm no contract regressions in billing checkout behavior.

- [x] `AFIL-024` Track affiliate funnel analytics in web.
  Dependency: `AFIL-020`, `AFIL-021`, `AFIL-022`
  Acceptance criteria:
  - Events cover affiliate page view, application submitted, referral click, signup claimed, and checkout started from affiliate attribution.
  - Analytics is non-blocking and consistent with existing PostHog helpers.

- [x] `AFIL-025` Add public API tests for application and redirect attribution flows.
  Dependency: `AFIL-020`, `AFIL-021`, `AFIL-022`, `AFIL-023`
  Acceptance criteria:
  - Tests cover input validation, disabled codes, cookie-setting behavior, and attribution claim edge cases.
  - Tests cover basic fraud scenarios such as duplicate/self-referral disqualification.

- [x] `AFIL-030` Implement partner auth model and route isolation.
  Dependency: `AFIL-010`, `AFIL-011`
  Acceptance criteria:
  - Approved partners can authenticate without being routed through agency onboarding.
  - Partner-only route group is separated cleanly from agency app assumptions.
  - Unauthorized users cannot access partner portal data.

- [x] `AFIL-031` Build partner portal overview + link management.
  Dependency: `AFIL-030`, `AFIL-021`, `AFIL-014`
  Acceptance criteria:
  - Partner portal shows core metrics: clicks, signups, paid customers, pending commissions, paid commissions.
  - Partner can copy their primary link and create lightweight campaign variants if enabled.
  - Empty states are clear for newly approved partners.

- [x] `AFIL-032` Build partner commission history and payout status pages.
  Dependency: `AFIL-031`, `AFIL-040`, `AFIL-014`
  Acceptance criteria:
  - Partner can see pending, approved, paid, and voided commissions with simple explanations.
  - Partner can see payout batch status and amount history.
  - Portal does not expose internal-only fraud or review metadata.

- [x] `AFIL-033` Add promo kit / swipe-copy surface for partner enablement.
  Dependency: `AFIL-031`
  Acceptance criteria:
  - Portal includes lightweight launch assets: messaging, CTAs, objection handling, and product positioning snippets.
  - Content source is phase-1 simple and repo-owned:
    - config/module-backed content is acceptable
    - no CMS dependency is introduced in this sprint
  - Partners can copy at least:
    - primary positioning paragraph
    - short CTA set
    - email/social swipe copy
    - launch checklist or “how to pitch AuthHub” bullets
  - Surface uses existing affiliate primitives and tokenized styling.
  - Rendering and copy interactions are covered by focused web tests.

- [x] `AFIL-034` Implement internal admin affiliate overview and review queue.
  Dependency: `AFIL-011`, `AFIL-014`
  Acceptance criteria:
  - Internal admin can view partners by status and review pending applications.
  - Approval/rejection actions are available with notes.
  - List/detail patterns match current internal-admin implementation style.

- [x] `AFIL-035` Implement internal admin partner detail and manual controls.
  Dependency: `AFIL-034`, `AFIL-040`
  Acceptance criteria:
  - Admin can inspect clicks, referrals, commissions, overrides, and fraud flags for a partner.
  - Admin can disable links, disqualify referrals, and adjust commission records with audit notes.
  - All admin mutations are authz-protected and tested.

- [x] `AFIL-040` Implement commission generation from billing lifecycle.
  Dependency: `AFIL-011`, `AFIL-023`
  Acceptance criteria:
  - The live Creem webhook route is the single canonical runtime ingress for affiliate-relevant billing events; legacy invoice-only handling is either removed or reduced to shared internal helpers only.
  - `invoice.paid` first upserts the invoice record idempotently, then creates or updates commission records for qualifying affiliate referrals.
  - Refund/failure/cancelation lifecycle updates pending/approved commissions correctly.
  - Commissions are tied to collected revenue and maintain idempotency across repeated webhook delivery.
  - Existing customer billing behavior for checkout creation, subscription tier sync, and non-affiliate agencies remains unchanged.

- [x] `AFIL-041` Implement payout hold, approval, and payout batch generation.
  Dependency: `AFIL-040`
  Acceptance criteria:
  - Commissions become eligible only after hold window passes.
  - Admin can generate monthly payout batches from eligible commissions.
  - Batch totals are deterministic and reproducible.

- [x] `AFIL-042` Add export workflow for manual payouts.
  Dependency: `AFIL-041`
  Acceptance criteria:
  - Admin can export partner totals for a payout batch in a deterministic CSV format.
  - Export is generated from commissions already assigned to the batch:
    - no off-batch commissions are included
    - no recomputation from current partner state is allowed during export
 - CSV includes at minimum:
    - payout batch ID
    - partner ID
    - partner name
    - partner email
    - payout method
    - approved amount
    - commission count
    - notes / operator column
  - First export stamps `exportedAt` and repeated exports for the same batch are idempotent and auditable.
  - Internal-admin UI exposes a clear “Export CSV” action from the payout-batch surface.
  - Route, service, and CSV-shape tests are added.

- [x] `AFIL-043` Implement fraud review and disqualification workflows.
  Dependency: `AFIL-040`
  Acceptance criteria:
  - System fraud heuristics explicitly support three outcomes:
    - clear
    - review_required
    - disqualified
  - Self-referral and duplicate-account rules can mark referrals/commissions as `review_required` or `void` without waiting for manual admin cleanup.
  - Internal admin gets a review-required queue or filtered view for:
    - flagged referrals
    - flagged commissions
  - Admin can explicitly resolve fraud cases with an auditable reason:
    - approve / clear for payout flow
    - keep review-required
    - disqualify / void
  - Partner-facing portal hides internal anti-fraud reasons and only shows partner-safe status language.
  - Service and route tests cover auto-flagging plus manual override paths.

- [x] `AFIL-044` Add automated tests for commission idempotency and payout integrity.
  Dependency: `AFIL-040`, `AFIL-041`, `AFIL-042`, `AFIL-043`
  Acceptance criteria:
  - Tests cover repeated webhook delivery, refund reversals, duplicate invoices, payout batch regeneration, and export determinism.
  - Ledger totals reconcile from invoices to commissions to payout batch totals and exported payout rows.
  - Test matrix includes:
    - duplicate `invoice.paid` delivery does not duplicate commissions
    - failed/refunded/voided invoices do not leave payout-eligible commissions behind
    - batch generation for the same period is deterministic and non-duplicating
    - exported CSV rows match batch-linked commissions exactly
    - fraud-reviewed referrals do not leak into payout totals incorrectly
  - Reconciliation tests assert both counts and summed cents, not just record presence.

- [ ] `AFIL-050` Run quality gates for touched workspaces.
  Dependency: `AFIL-025`, `AFIL-035`, `AFIL-044`
  Acceptance criteria:
  - `npm run test --workspace=apps/api` passes
  - `npm run test --workspace=apps/web` passes
  - `npm run typecheck` passes
  - `npm run lint` passes

- [x] `AFIL-051` Execute screenshot polish pass for public, partner, and admin surfaces.
  Dependency: `AFIL-020`, `AFIL-031`, `AFIL-034`
  Acceptance criteria:
  - Capture desktop + mobile evidence for:
    - affiliate landing page
    - partner portal overview
    - admin partner review/detail
  - Save artifacts under `docs/images/affiliate-program/2026-03-08`
  - Validate tokenized visual consistency with existing product shells

- [x] `AFIL-052` Refresh docs and requirement mapping.
  Dependency: `AFIL-001`
  Acceptance criteria:
  - This sprint is referenced in [`mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md)
  - Public launch rules and partner ops runbook expectations are documented

- [x] `AFIL-053` Final launch readiness checklist.
  Dependency: `AFIL-050`, `AFIL-051`, `AFIL-052`
  Acceptance criteria:
  - Economics, partner approval rules, fraud policy, and payout ops checklist are explicitly signed off
  - Remaining post-MVP items are moved to follow-up backlog
  - Launch blockers are reduced to zero or clearly called out

## Verification Strategy

1. Domain correctness:
   - unit tests for commission calculation, attribution resolution, fraud rule evaluation
   - schema-level tests for status transitions and payout eligibility

2. Public flow verification:
   - application route tests
   - redirect cookie + click logging tests
   - signup attribution claim tests

3. Billing reconciliation:
   - webhook tests for idempotent commission creation
   - invoice/refund/retry edge case coverage

4. Portal/admin verification:
   - partner portal authz and rendering tests
   - internal-admin authz and mutation tests

5. Design-system verification:
   - semantic token usage in new surfaces
   - screenshot polish for public + authenticated shells

## Remaining Execution Sequence

1. `AFIL-033` partner enablement surface
   - Build the content source first as a repo-owned config/module, not an admin CMS.
   - Mount the promo kit inside the existing `/partners` portal shell using current affiliate primitives.
   - Keep the MVP narrow: high-leverage copy assets and copy-to-clipboard actions only.

2. `AFIL-042` payout export from batch-linked commissions
   - Extend the existing payout-batch model and internal-admin services rather than creating a second payout abstraction.
   - Treat the batch as the frozen export boundary.
   - Export should read batch-linked commissions, group by partner, and emit a deterministic CSV ordered by partner name then partner ID.

3. `AFIL-043` fraud workflow hardening
   - Reuse the existing affiliate risk evaluation path as the canonical heuristic source.
   - Add explicit review queues/filters to admin instead of inventing a separate fraud console.
   - Keep partner-facing messaging generic so internal heuristics and reasons never leak externally.

4. `AFIL-044` reconciliation and idempotency proof
   - Add this after the export and fraud flows exist so tests can cover the final ledger shape, not an intermediate one.
   - Make invoice, commission, payout batch, and export assertions line up in the same fixtures to prove end-to-end integrity.

## Remaining Task Breakdown

### AFIL-033 Plan

1. Add a repo-owned promo-kit content module for:
   - positioning summary
   - email swipe copy
   - social copy
   - CTA variants
   - objection/rebuttal bullets
2. Add a partner-portal section with copy cards and copy actions.
3. Add focused web tests for rendering and copy affordances.

### AFIL-042 Plan

1. Add backend export service logic on payout-batch detail/export path.
2. Define the CSV header contract and deterministic row ordering.
3. Add internal-admin route(s) for export and audit logging.
4. Expose export action in admin UI.
5. Add tests for CSV content, exported timestamp behavior, and repeated export safety.

### AFIL-043 Plan

1. Canonicalize which heuristics trigger `review_required` vs immediate disqualification.
2. Add admin filtering and mutation paths for fraud-reviewed referrals/commissions.
3. Add override actions with required operator notes.
4. Ensure partner portal copy maps internal review states to safe external language.
5. Add focused service/route/web tests for the review workflow.

### AFIL-044 Plan

1. Add webhook/idempotency tests around repeated invoice delivery.
2. Add refund/void/failure reversal tests against payout eligibility.
3. Add payout-batch determinism tests including repeated generation for the same period.
4. Add export reconciliation tests from batch commissions to CSV rows.
5. Add fraud-resolution reconciliation tests to ensure reviewed/disqualified items do not drift into payout totals.

## AFIL-040 Execution Plan

1. Canonicalize webhook ownership before adding commission logic.
   - Keep [`apps/api/src/routes/webhooks.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/webhooks.ts) as the only runtime Creem ingress.
   - Fold invoice handling from [`apps/api/src/services/webhook.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/webhook.service.ts) into shared processors or retire that path entirely.
   - Preserve current subscription lifecycle behavior and tests before adding invoice events.

2. Normalize invoice event ingestion.
   - Expand the live route to accept `invoice.paid` and `invoice.payment_failed` payloads with explicit type guards or schemas.
   - Introduce a billing-event processor that performs invoice upsert by `creemInvoiceId`.
   - Ensure invoice persistence is safe under retries and out-of-order redelivery.

3. Project billing events into the affiliate ledger.
   - Resolve `Subscription` from Creem customer + subscription identifiers.
   - Resolve `AffiliateReferral` from the referred agency tied to that subscription.
   - Only generate a commission when the referral is qualified, not disqualified, and still inside `commissionDurationMonths`.
   - Use `AffiliateCommission.invoiceId` uniqueness as the hard idempotency boundary for one commission per qualifying invoice.

4. Handle negative lifecycle paths explicitly.
   - `invoice.payment_failed` should never create a commission.
   - Refund/void/cancel paths should void or prevent payout of affected pending/approved commissions instead of mutating customer entitlement logic.
   - Manual admin overrides remain in `AFIL-043` and `AFIL-035`, but the system path must record auditable default outcomes first.

5. Protect client-focused billing while shipping.
   - Do not change checkout request payloads except for already-additive affiliate metadata.
   - Do not move tier mapping ownership out of existing subscription sync.
   - Keep affiliate ledger writes isolated from customer-facing billing reads and portal flows.
   - If needed, gate commission projection behind a server-side affiliate flag while leaving invoice ingestion on.

6. Sequence the work so portal/admin tasks can safely depend on real ledger state.
   - Step 1: webhook route regression coverage for current subscription events.
   - Step 2: invoice upsert coverage for `invoice.paid` and duplicate delivery.
   - Step 3: commission creation coverage for qualifying and non-qualifying referrals.
   - Step 4: reversal coverage for failed/refunded invoices.
   - Step 5: unblock `AFIL-032`, `AFIL-035`, `AFIL-041`, and `AFIL-044` once ledger state is trustworthy.

## Release Sequencing

1. Internal foundation:
   - ship domain model, attribution plumbing, and commission ledger behind feature flags
   - use synthetic/test partner records to validate the first full commission cycle

2. Pilot cohort:
   - manually approve a small invite-only set of partners
   - run one complete payout batch before broad recruitment

3. Controlled scale-up:
   - open the application page more broadly
   - keep approvals manual while fraud heuristics and economics are tuned

## Risks and Mitigations

1. Risk: affiliate fraud expands scope unexpectedly.
   Mitigation: baseline self-referral and duplicate-account rules are non-optional tasks (`AFIL-013`, `AFIL-043`, `AFIL-044`).

2. Risk: partner auth collides with current agency onboarding assumptions.
   Mitigation: isolate partner route group and claims model early (`AFIL-030`).

3. Risk: attribution breaks between marketing site, signup, and checkout.
   Mitigation: use first-party redirect + cookie + explicit checkout metadata handoff (`AFIL-021`, `AFIL-022`, `AFIL-023`).

4. Risk: changes to the live Creem webhook regress current client billing behavior.
   Mitigation: keep subscription tier sync as the owned path, add invoice handling additively, and require route-level regression tests for existing subscription events before merging `AFIL-040`.

5. Risk: commissions become untrustworthy under webhook retries or refunds.
   Mitigation: canonical webhook ownership, idempotent invoice upsert, and ledger reconciliation tests (`AFIL-040`, `AFIL-044`).

6. Risk: OSS tool choice adds integration drag without enough payoff.
   Mitigation: keep OSS tools optional/replaceable and preserve first-party source-of-truth design.

## Review Findings Queue

1. The targeted `packages/shared` affiliate contract test now passes, but `ts-jest` still emits `TS151002` hybrid-module warnings during execution; full package-suite cleanup remains out of scope for this sprint.
2. Affiliate Prisma schema was validated with `prisma format` and `prisma generate`, but `prisma db push` was not run in this turn because no target database migration was requested.
3. The affiliate click cookie is intentionally readable by client-side onboarding code in phase 1 (`httpOnly: false`) so signup can claim attribution without a separate server handoff. Tightening this requires moving claim resolution fully server-side.
4. Affiliate-program screenshot evidence is now captured under [`docs/images/affiliate-program/2026-03-08`](/Users/jhigh/agency-access-platform/docs/images/affiliate-program/2026-03-08) using [`capture-affiliate-program-evidence.mjs`](/Users/jhigh/agency-access-platform/apps/web/scripts/capture-affiliate-program-evidence.mjs) and the `apps/web` script `npm run evidence:affiliate-program`.
6. `AFIL-040` now treats invoice failure/refund/void as affiliate-ledger invalidation events, while `subscription.canceled` remains on the core customer billing path so customer entitlement semantics are not changed by affiliate accounting work.
7. The partner portal now supports dev-bypass evidence capture in development by using the existing bypass auth helper and a dev token fallback in affiliate query hooks, which allows scripted browser evidence without a live Clerk sign-in.
8. Playwright MCP browser capture was blocked by local Chrome profile contention (`Opening in existing browser session` against `~/Library/Caches/ms-playwright/mcp-chrome`). The durable fix for this sprint was a repo-native headless Chromium evidence script rather than depending on the shared MCP Chrome profile.
9. `AFIL-033` now ships a repo-owned partner promo kit with positioning, CTA variants, email swipe copy, social swipe copy, and pitch checklist content inside `/partners`; the affiliate evidence set was refreshed after this UI expansion.
10. `AFIL-042` now exports deterministic payout CSVs from batch-linked commissions only, stamps `exportedAt` on first export, supports idempotent re-export, and exposes the workflow in the internal admin affiliates screen with refreshed screenshot evidence.
11. `AFIL-043` now preserves `review_required` referral state through claim and invoice processing, exposes an internal fraud queue with clear / keep-under-review / disqualify actions, and shows partner-safe “Processing” copy instead of internal anti-fraud language in the partner portal.
12. `AFIL-044` now has explicit reconciliation coverage for export-row sums, reversal handling of `review_required` commissions, and live-route `invoice.voided` handling so batch/export math is proven against the affiliate ledger boundary.
13. Root `npm run typecheck` now passes because [`tools/design-os/package.json`](/Users/jhigh/agency-access-platform/tools/design-os/package.json) includes a workspace `typecheck` script; the remaining `AFIL-050` blocker is repo-wide api/web test debt outside the affiliate slice.
14. Full `apps/api` and `apps/web` test suites still fail on pre-existing non-affiliate areas such as legacy auth expectations in client/meta/usage routes, connector test drift, schema-integration DB mismatch around `access_requests.external_reference`, and older web component tests unrelated to affiliate work.

## Rollout Notes (Planned)

1. Phase 1 should launch to a small invite-only cohort even if the public application page exists.
2. Start with one default commission plan and manual overrides only.
3. Validate at least one full payout cycle internally before broadening recruitment.
4. Use the first 5-10 affiliates to tune economics, fraud rules, and portal clarity before scaling.

## Launch Readiness Checklist

- Economics sign-off: `30% recurring for 12 months` with `90-day` link attribution window, invite-only pilot, and one default commission plan plus manual overrides.
- Approval rules sign-off: all applicants remain manually reviewed; approval requires credible distribution and promotion fit; rejection/approval notes are required in admin.
- Fraud policy sign-off: `clear`, `review_required`, and `disqualified` are the only supported outcomes; partner UI hides internal fraud reasons and shows partner-safe processing language.
- Payout ops sign-off: monthly operator flow is generate batch -> export deterministic CSV -> execute payouts off-platform -> retain exported artifact; source-of-truth runbook is [`docs/features/affiliate-program-ops-runbook.md`](/Users/jhigh/agency-access-platform/docs/features/affiliate-program-ops-runbook.md).
- Verification sign-off: affiliate-focused shared/api/web tests pass, typechecks pass, and screenshot evidence is refreshed under [`docs/images/affiliate-program/2026-03-08`](/Users/jhigh/agency-access-platform/docs/images/affiliate-program/2026-03-08).
- Remaining follow-up backlog:
  - automated payout execution
  - partner self-serve payout profile management
  - coupon attribution support
  - stronger anomaly scoring
  - repo-wide test debt cleanup outside affiliate scope
- Current launch blockers:
  - `AFIL-050` remains open because full `npm run test --workspace=apps/api` and `npm run test --workspace=apps/web` fail in pre-existing non-affiliate areas.
