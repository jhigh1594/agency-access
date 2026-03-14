# Sprint: Cross-Platform Post-OAuth Fulfillment Truthfulness

- Date: 2026-03-10
- Status: Planned
- Owners: Web + API
- Scope: Bring LinkedIn Ads into the post-OAuth account-selection model, eliminate TikTok zero-advertiser dead ends, and generalize fulfillment-aware progress/completion semantics for asset-selecting OAuth platforms without changing Meta’s existing step structure.
- Discovery input:
  - Cross-platform applicability review: [`docs/brainstorms/2026-03-10-cross-platform-post-oauth-selection-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-10-cross-platform-post-oauth-selection-brainstorm.md)
  - Google fulfillment baseline: [`docs/brainstorms/2026-03-10-google-post-oauth-account-selection-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-10-google-post-oauth-account-selection-brainstorm.md)
  - Related sprint baselines:
    - [`docs/sprints/2026-03-10-google-post-oauth-account-selection.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-google-post-oauth-account-selection.md)
    - [`docs/sprints/2026-03-10-google-account-discovery-hardening.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-google-account-discovery-hardening.md)
    - [`docs/sprints/2026-03-04-tiktok-business-center-connection.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-04-tiktok-business-center-connection.md)

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared TypeScript contracts in `@agency-platform/shared`
- Tailwind through the existing invite semantic tokens and shared UI primitives
- Progressive invite queue remains the interaction baseline; this sprint changes fulfillment semantics, not the one-platform-at-a-time structure

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” maps here to reusable React invite/runtime helpers in `apps/web/src/components/client-auth` and shared fulfillment helpers in `apps/api`.
- Token-system work is limited to keeping empty, partial, and unresolved states on the existing invite/request-detail surfaces visually consistent through current semantic tokens.
- Screenshot-polish verification applies to the invite wizard and the agency request-detail surface on desktop and mobile.

## External Research Decision

No new broad external research pass is required before implementation.

Implementation-time verification should still use primary sources for the only moderate-risk vendor contract in this sprint:
- LinkedIn Marketing API ad account discovery (`/rest/adAccounts`)

Local repo context is otherwise sufficient for planning:
- [`docs/research-linkedin-ads-access.md`](/Users/jhigh/agency-access-platform/docs/research-linkedin-ads-access.md)
- existing Google and TikTok sprint/discovery docs

## Product Decision Log (Locked)

1. `linkedin_ads` joins the asset-selecting post-OAuth set in this sprint.
   - First slice is ad-account selection only.
   - Do not expand LinkedIn to organization/page workflows in the same slice.
2. Meta keeps its current UI structure.
   - No Google-style zero-assets follow-up copy is added to Meta in this sprint.
   - Meta is included in the shared fulfillment model because `meta_ads` is already asset-selecting.
3. TikTok zero-advertiser cases will use a follow-up-needed partial path, not a hard block.
   - If zero advertisers are discoverable, the client can finish the broader request.
   - The TikTok product remains unresolved and the final request can become `partial`.
4. Shared fulfillment-aware completion applies to these asset-selecting OAuth products:
   - `google_ads`
   - `ga4`
   - `google_business_profile`
   - `google_tag_manager`
   - `google_search_console`
   - `google_merchant_center`
   - `meta_ads`
   - `linkedin_ads`
   - `tiktok`
   - `tiktok_ads`
5. `POST /client/:token/complete` must stop treating OAuth success alone as sufficient.
   - Terminal status becomes evaluator-driven: `completed` when all requested asset-selecting products are fulfilled, otherwise `partial` when the client finished but unresolved products remain.
6. Contract changes remain additive.
   - Preserve `completedPlatforms` and `isComplete`.
   - Add fulfillment detail rather than replacing existing fields.

## Architecture Approach

1. Introduce a shared fulfillment evaluator in the API layer.
   - Inputs: requested products, saved selected assets, and saved zero-assets discovery metadata.
   - Outputs: fulfilled products, unresolved products, completed platform groups, and resolved final request status.
2. Extend the saved asset-selection contract where needed so zero-assets states survive redirects and completion.
   - Google and LinkedIn will need `availableAssetCount` or an equivalent persisted empty-inventory signal.
   - TikTok can continue using saved advertiser discovery snapshots for empty-inventory detection.
3. Add LinkedIn asset discovery to the client asset route and wire the existing selector into the wizard.
4. Update `PlatformAuthWizard` readiness rules so all in-scope asset-selecting products use product-level fulfillment semantics.
5. Keep Meta’s step structure and TikTok’s manual-fallback grant section, but align both with the shared evaluator.
6. Expose additive unresolved-product detail to invite runtime and agency-side request detail surfaces.

## Milestones

### Milestone 1: Contract Lock + Plan
- `CPAF-001`, `CPAF-002`, `CPAF-010`, `CPAF-011`

### Milestone 2: Red Tests
- `CPAF-020`, `CPAF-021`, `CPAF-022`

### Milestone 3: LinkedIn Parity
- `CPAF-030`, `CPAF-031`, `CPAF-032`

### Milestone 4: Shared Fulfillment + TikTok Cleanup
- `CPAF-040`, `CPAF-041`, `CPAF-042`, `CPAF-043`

### Milestone 5: Polish + Verification
- `CPAF-050`, `CPAF-051`, `CPAF-052`, `CPAF-053`

## Ordered Task Board

- [x] `CPAF-001` Create sprint artifact for cross-platform post-OAuth fulfillment truthfulness.
  Dependency: none
  Acceptance criteria:
  - Sprint doc locks platform scope, staged milestones, and risk controls.
  - The doc distinguishes LinkedIn parity work from TikTok cleanup and shared-status work.

- [x] `CPAF-002` Refresh [`docs/sprints/mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md) for this sprint.
  Dependency: `CPAF-001`
  Acceptance criteria:
  - Requirement mapping includes stable `CPAF-*` task IDs.
  - Mapping distinguishes this sprint from the earlier Google-only and TikTok-only work.

- [x] `CPAF-010` Lock the shared fulfillment contract for asset-selecting OAuth products.
  Dependency: `CPAF-001`
  Acceptance criteria:
  - The in-scope product list is explicit.
  - Fulfillment, unresolved, and completion rules are defined before code changes.
  - The evaluator can distinguish `selection_required` from `no_assets`.

- [x] `CPAF-011` Define the additive persistence contract for zero-assets detection.
  Dependency: `CPAF-010`
  Acceptance criteria:
  - The plan identifies which selectors must persist `availableAssetCount` or equivalent discovery metadata.
  - Save-assets schema changes remain additive and backward-compatible.
  - API and web layers agree on where zero-assets truth comes from for Google, LinkedIn, and TikTok.

- [x] `CPAF-020` Add failing API/service tests for fulfillment evaluation and request completion.
  Dependency: `CPAF-010`, `CPAF-011`
  Acceptance criteria:
  - Tests prove active authorization alone does not fulfill `meta_ads`, `linkedin_ads`, `tiktok`, or the in-scope Google products.
  - Tests prove unresolved products are classified as `selection_required` or `no_assets` correctly.
  - Tests prove final request status resolves to `completed` vs `partial` from evaluator output.

- [x] `CPAF-021` Add failing web tests for LinkedIn Step 2 selection and TikTok zero-advertiser follow-up.
  Dependency: `CPAF-010`, `CPAF-011`
  Acceptance criteria:
  - LinkedIn no longer skips directly from OAuth receipt to confirmation.
  - TikTok zero-advertiser cases do not end in a validation-error dead end.
  - Existing Google and Meta step behavior remains covered.

- [x] `CPAF-022` Add failing route/service tests for LinkedIn asset discovery and additive save-assets contract changes.
  Dependency: `CPAF-011`
  Acceptance criteria:
  - Client asset routes cover `linkedin_ads` discovery.
  - Save-assets validation accepts the new additive zero-assets fields needed by the evaluator.
  - Unsupported-platform regressions remain covered.

- [x] `CPAF-030` Implement LinkedIn ad account discovery for client asset routes.
  Dependency: `CPAF-022`
  Acceptance criteria:
  - API can fetch selector-ready LinkedIn Campaign Manager ad accounts for `linkedin_ads`.
  - Route behavior preserves the existing `{ data, error }` contract and tenancy checks.
  - Errors are surfaced cleanly without token leakage.

- [x] `CPAF-031` Wire `LinkedInAssetSelector` into `PlatformAuthWizard` and product-level readiness rules.
  Dependency: `CPAF-021`, `CPAF-030`
  Acceptance criteria:
  - `linkedin_ads` is treated as asset-selecting in Step 2.
  - LinkedIn summary lines and empty states follow the same truthfulness standard as Google.
  - Existing Meta and TikTok render paths remain stable.

- [x] `CPAF-032` Persist LinkedIn and Google zero-assets metadata needed for evaluator truthfulness.
  Dependency: `CPAF-011`, `CPAF-022`
  Acceptance criteria:
  - Saved selection payloads persist the empty-inventory signal needed after redirects or refresh.
  - Existing saved-asset behavior for Google remains compatible.
  - No token storage or ownership model changes are introduced.

- [x] `CPAF-040` Implement the shared fulfillment evaluator and additive `authorizationProgress` fields.
  Dependency: `CPAF-020`, `CPAF-032`
  Acceptance criteria:
  - API derives `fulfilledProducts` and `unresolvedProducts` centrally.
  - `completedPlatforms` and `isComplete` remain available to current consumers.
  - Meta, LinkedIn, TikTok, and Google all use the same evaluator rules for in-scope products.

- [x] `CPAF-041` Update request completion, notifications, and webhook payload generation to use evaluator output.
  Dependency: `CPAF-040`
  Acceptance criteria:
  - `POST /client/:token/complete` no longer unconditionally marks `completed`.
  - Lifecycle status, webhook emission, and notification payloads align with resolved `completed` or `partial`.
  - Non-asset-selecting platforms retain current behavior.

- [x] `CPAF-042` Implement TikTok zero-advertiser follow-up handling.
  Dependency: `CPAF-021`, `CPAF-032`, `CPAF-040`
  Acceptance criteria:
  - The wizard does not attempt partner-share automation when zero advertisers are discoverable.
  - TikTok zero-assets cases surface clear follow-up-needed copy instead of a validation error.
  - Partial-share and manual-fallback behavior for non-zero selections remains intact.

- [x] `CPAF-043` Surface unresolved requested products on the affected invite and agency detail surfaces.
  Dependency: `CPAF-040`
  Acceptance criteria:
  - Invite success/summary states can distinguish connected vs fulfilled across LinkedIn, TikTok, and Google.
  - Agency request detail continues to render unresolved products truthfully.
  - Existing request list/detail consumers are not broken by additive fields.

- [x] `CPAF-050` Token-system and reusable-primitive polish pass for new unresolved/partial states.
  Dependency: `CPAF-031`, `CPAF-042`, `CPAF-043`
  Acceptance criteria:
  - New or updated empty/follow-up states use existing semantic tokens and shared card/list patterns.
  - No one-off styling bypasses the invite/request-detail visual system.
  - Shared helper logic for product summary lines or unresolved-state rendering is extracted where repetition appears.

- [ ] `CPAF-051` Capture screenshot evidence for required shells.
  Dependency: `CPAF-050`
  Acceptance criteria:
  - Capture desktop and mobile screenshots for:
    - LinkedIn Step 2 selection
    - TikTok zero-advertiser follow-up
    - Google mixed fulfilled/unresolved summary
    - Agency request detail unresolved-products panel
  - Store artifacts under `docs/images/cross-platform-post-oauth-fulfillment/2026-03-10`.

- [x] `CPAF-052` Run focused regression tests, relevant typechecks, and targeted review.
  Dependency: `CPAF-041`, `CPAF-042`, `CPAF-043`
  Acceptance criteria:
  - Relevant API and web test suites pass.
  - Relevant shared/api/web typechecks pass or unrelated blockers are documented precisely.
  - Review findings are recorded in this sprint doc and resolved or explicitly deferred.

- [x] `CPAF-053` Record rollout notes, residual risks, and downstream contract guidance in this sprint doc.
  Dependency: `CPAF-052`
  Acceptance criteria:
  - Verification log contains concrete commands and results.
  - Additive contract changes for downstream consumers are documented.
  - Deferred work, if any, is tied to specific platforms or follow-up sprints.

## Verification Strategy

1. API/service correctness
   - Fulfillment evaluator tests across Google, Meta Ads, LinkedIn Ads, and TikTok Ads
   - Request-completion tests for `completed` vs `partial`
   - Route tests for LinkedIn asset discovery and additive save-assets validation

2. Frontend behavior
   - Wizard tests for LinkedIn Step 2 asset selection
   - Wizard tests for TikTok zero-advertiser follow-up
   - Regression coverage for Google and Meta selection/readiness paths

3. Contract safety
   - Shared type checks for additive `authorizationProgress` fields
   - Webhook/notification tests or assertions where status resolution changes
   - Confirm no secret leakage and no token-storage regressions

4. UX verification
   - Desktop and mobile screenshot checks for changed invite and agency surfaces
   - Confirm copy separates `connected`, `fulfilled`, and `follow-up needed`

## Risks and Mitigations

1. A generalized evaluator could unintentionally change completion semantics for platforms outside scope.
   Mitigation: keep the in-scope product allowlist explicit and test non-asset-selecting platforms as unchanged.

2. LinkedIn discovery may have contract quirks or app-tier restrictions.
   Mitigation: keep the first slice narrowly scoped to ad accounts and verify against official LinkedIn docs during implementation.

3. TikTok zero-assets follow-up could be confused with the existing partial-share manual fallback.
   Mitigation: keep copy and result reasons distinct: `no_assets` vs automation partial failure.

4. Additive zero-assets persistence fields could drift between selectors and backend evaluator rules.
   Mitigation: lock the persistence contract up front and cover with route plus wizard tests.

5. Agency-facing unresolved-product visibility could create noisy UI if rendered too broadly.
   Mitigation: require request-detail support in-scope first; keep broader list/dashboard exposure out of this sprint unless needed by implementation.

## Review Findings Queue

1. Resolved: LinkedIn asset discovery now writes `LINKEDIN_TOKEN_READ` audit events for token-backed asset reads.
   Files:
   - [assets.routes.ts](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/assets.routes.ts#L1242)
2. Resolved: LinkedIn Marketing API requests now use a pinned `LinkedIn-Version` header instead of a calendar-derived value.
   Files:
   - [client-assets.service.ts](/Users/jhigh/agency-access-platform/apps/api/src/services/client-assets.service.ts#L95)
   - [client-assets.service.ts](/Users/jhigh/agency-access-platform/apps/api/src/services/client-assets.service.ts#L293)
3. Residual follow-up:
   - `CPAF-051` remains open for desktop/mobile screenshot capture.
   - Broader end-to-end request-flow browser evidence was not collected in this session.

## Verification Log

- `npm test --workspace=apps/api -- src/services/__tests__/access-request.service.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.linkedin.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.google.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.tiktok.test.ts`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.tiktok.test.tsx`
  Result: pass
- `npm run typecheck --workspace=packages/shared`
  Result: pass
- `npm run typecheck --workspace=apps/api`
  Result: pass
- `npm run typecheck --workspace=apps/web`
  Result: pass

## Rollout Notes

- `ClientAuthorizationProgress` now exposes additive `fulfilledProducts` and `unresolvedProducts` fields while preserving `completedPlatforms` and `isComplete`.
- `POST /api/client/:token/complete` now resolves terminal status from fulfillment truth instead of OAuth truth alone.
- LinkedIn client asset discovery now uses the Marketing API ad-account list route and feeds the existing selector UI.
- TikTok zero-advertiser cases now finalize as follow-up-needed instead of attempting partner-share automation with an empty selection.

## Residual Risks

1. Screenshot evidence is still missing for the planned desktop/mobile shells.
2. The agency request-detail surface now receives unresolved-product data, but this session verified it through contract/type/test coverage rather than live browser capture.
