# Sprint: Post-OAuth Account Selection Truthfulness

- Date: 2026-03-10
- Status: Implemented
- Owners: Web + API
- Scope: Make Google, Meta Ads, and LinkedIn Ads account selection a required post-OAuth fulfillment step in the client invite flow, support multi-select asset picking, and keep request completion truthful by using `partial` when requested ad products cannot be fulfilled due to zero discoverable assets.
- Discovery input:
  - Brainstorm: [`docs/brainstorms/2026-03-10-google-post-oauth-account-selection-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-10-google-post-oauth-account-selection-brainstorm.md)
  - Progressive invite runtime baseline: [`docs/sprints/2026-03-09-progressive-platform-auth-flow.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-09-progressive-platform-auth-flow.md)
  - Active implementation points:
    - `apps/api/src/services/access-request.service.ts`
    - `apps/api/src/routes/client-auth/completion.routes.ts`
    - `apps/api/src/routes/client-auth/assets.routes.ts`
    - `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
    - `apps/web/src/components/client-auth/GoogleAssetSelector.tsx`
    - `packages/shared/src/types.ts`

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared TypeScript contracts in `@agency-platform/shared`
- Tailwind through existing semantic invite tokens and repo-owned UI primitives
- Existing progressive invite queue remains the baseline; this sprint changes fulfillment semantics, not the one-platform-at-a-time interaction model

Adaptation note for planning requirements:
- “Reusable Phlex primitives/variants” maps here to additive React invite/runtime primitives and shared TS fulfillment helpers.
- Token-system work is limited to preserving the current invite surface quality while adding empty and partial-success states; no net-new design language is introduced.

## External Research Decision

Targeted external research was used for the LinkedIn extension only.
- UX direction still came from the user-supplied Leadsie reference.
- Repo-local patterns provided the baseline for OAuth exchange, asset selection, and invite sequencing.
- Official Microsoft Learn documentation was consulted to confirm LinkedIn Campaign Manager asset discovery should use the versioned `/rest/adAccounts` endpoint.

## Product Decision Log (Locked)

1. Asset selection is required after OAuth for the asset-selectable ad products in scope:
   - Google products with account-level selectors
   - `meta_ads`
   - `linkedin_ads`
   - OAuth success alone is not enough to count those products as fulfilled.
   - Multi-select is required, not single-select.
2. Fulfillment is product-level, not just platform-group-level.
   - `google_ads`, `ga4`, `google_business_profile`, `google_tag_manager`, `google_search_console`, and `google_merchant_center` are each evaluated independently.
3. When assets exist, each requested in-scope product requires at least one selected asset before that product is fulfilled.
4. Zero-assets cases must not mark the request `completed`.
   - The client may continue the broader invite flow.
   - The request should finalize as `partial` if unresolved requested products remain.
5. Existing success semantics must become more truthful across invite runtime, agency-facing surfaces, notifications, and webhook payloads.
6. The strict fulfillment contract remains intentionally narrow.
   - It applies to Google account-selectable products plus `meta_ads` and `linkedin_ads`.
   - Other Meta/LinkedIn products keep their existing semantics for now.

## Architecture Approach

1. Introduce a shared fulfillment evaluator in the API service layer that derives:
   - per-requested-product fulfillment
   - unresolved requested products
   - completed platform groups
   - whether the request should be considered `completed` or `partial`
2. Extend `ClientAuthorizationProgress` additively so invite runtime can distinguish:
   - OAuth-connected platforms
   - fulfilled requested products
   - unresolved requested products and reasons
3. Update request completion handling so `POST /client/:token/complete` writes:
   - `completed` when every requested product is fulfilled
   - `partial` when at least one requested product remains unresolved after the client finishes the flow
4. Update `PlatformAuthWizard` step validation so the save/continue path reflects product-level readiness for all in-scope asset-selectable products:
   - selections required where assets exist
   - explicit empty-state messaging where zero assets exist
5. Keep the progressive invite queue intact.
   - This sprint changes what “done” means for Google, not which platform is active.
6. Surface unresolved-product information in agency/admin payloads using additive fields rather than breaking existing contracts.

## Milestones

### Milestone 1: Fulfillment Contract + Plan
- `GPAS-001`, `GPAS-002`, `GPAS-010`

### Milestone 2: Red Tests
- `GPAS-020`, `GPAS-021`, `GPAS-022`

### Milestone 3: Backend Truthfulness
- `GPAS-030`, `GPAS-031`, `GPAS-032`

### Milestone 4: Invite UX + Agency Visibility
- `GPAS-040`, `GPAS-041`, `GPAS-042`

### Milestone 5: Verification + Rollout
- `GPAS-050`, `GPAS-051`, `GPAS-052`

## Ordered Task Board

- [x] `GPAS-001` Create sprint artifact for Google post-OAuth account selection.
  Dependency: none
  Acceptance criteria:
  - Sprint doc locks multi-select Google selection and product-level fulfillment semantics.
  - Architecture notes explicitly adapt the generic workflow-plan baseline to this Next.js/Fastify repo.

- [x] `GPAS-002` Refresh `docs/sprints/mvp-requirement-mapping.md` for the Google post-OAuth fulfillment flow.
  Dependency: `GPAS-001`
  Acceptance criteria:
  - Requirement mapping includes stable `GPAS-*` task IDs.
  - Mapping distinguishes fulfillment truthfulness work from the earlier progressive queue sprint.

- [x] `GPAS-010` Define the additive fulfillment contract for invite runtime and agency-facing payloads.
  Dependency: `GPAS-001`
  Acceptance criteria:
  - Shared types define additive fields for requested-product fulfillment and unresolved products.
  - Existing consumers that only read `completedPlatforms` and `isComplete` remain valid.

- [x] `GPAS-020` Add failing API/service tests for Google product fulfillment derivation.
  Dependency: `GPAS-010`
  Acceptance criteria:
  - Tests prove Google is not considered fulfilled from OAuth authorization alone.
  - Tests prove selected Google assets mark the correct requested products as fulfilled.
  - Tests prove zero-assets cases remain unresolved.

- [x] `GPAS-021` Add failing request-completion tests for `completed` vs `partial`.
  Dependency: `GPAS-010`
  Acceptance criteria:
  - Completing an invite with every requested product fulfilled results in `completed`.
  - Completing an invite with unresolved zero-assets Google products results in `partial`.
  - Webhook/notification paths remain consistent with the resulting request status.

- [x] `GPAS-022` Add failing invite/wizard tests for Google product-level readiness and empty states.
  Dependency: `GPAS-010`
  Acceptance criteria:
  - Google Step 2 cannot be treated as ready when a requested product has assets but no selection.
  - Requested products with zero assets show explicit unresolved guidance.
  - Existing multi-select behavior remains intact.

- [x] `GPAS-030` Implement API fulfillment evaluation helpers and request-progress derivation.
  Dependency: `GPAS-020`
  Acceptance criteria:
  - `access-request.service` computes product-level fulfillment and unresolved products.
  - `authorizationProgress` remains backward-compatible while exposing additive detail.
  - Google is no longer marked complete solely by active authorization presence.

- [x] `GPAS-031` Implement truthful request finalization for client completion.
  Dependency: `GPAS-021`, `GPAS-030`
  Acceptance criteria:
  - `POST /client/:token/complete` resolves the correct terminal status: `completed` or `partial`.
  - Notifications and lifecycle webhooks use the resolved status.
  - No unexpected status regressions for non-Google requests.

- [x] `GPAS-032` Preserve secure and tenant-safe asset persistence while attaching enough metadata to reason about zero-assets states.
  Dependency: `GPAS-020`
  Acceptance criteria:
  - No token storage changes; OAuth secrets remain in Infisical only.
  - Saved Google asset metadata is sufficient to distinguish “no assets found” from “assets available but none selected.”
  - Existing access-request ownership checks remain intact.

- [x] `GPAS-040` Update Google Step 2 UX in `PlatformAuthWizard` to use product-level readiness.
  Dependency: `GPAS-022`, `GPAS-030`
  Acceptance criteria:
  - Save/continue affordance reflects all requested Google product states.
  - Empty-state messaging is explicit and calm.
  - The client can still continue the broader invite flow when the unresolved state is due to zero assets.

- [x] `GPAS-041` Surface unresolved requested products in agency/admin request payloads and affected views.
  Dependency: `GPAS-030`
  Acceptance criteria:
  - Agency-side request data exposes unresolved Google products.
  - At minimum, request detail views can render truthful unresolved-product state.
  - Existing lists/details do not mislabel partial requests as fully granted.

- [x] `GPAS-042` Keep styling and interaction quality consistent on desktop and mobile for the new empty/partial states.
  Dependency: `GPAS-040`
  Acceptance criteria:
  - Invite UI uses existing semantic tokens and component patterns.
  - Empty and partial states do not crowd the active step or hide the primary action.
  - Added copy clearly separates “connected” from “fulfilled.”

- [x] `GPAS-050` Run focused regression tests, relevant typechecks, and targeted review.
  Dependency: `GPAS-031`, `GPAS-040`, `GPAS-041`
  Acceptance criteria:
  - Relevant API and web tests pass.
  - Shared/api/web typechecks relevant to changed contracts pass.
  - Review findings are captured in this sprint doc and resolved or explicitly documented.
  Execution note:
  - Focused API and web tests passed.
  - `packages/shared`, `apps/api`, and `apps/web` typechecks have been rerun for the touched surfaces; current remaining blocker is unrelated `apps/api` workspace typecheck noise tracked separately in follow-up sprint docs.

- [x] `GPAS-051` Capture rollout notes and residual risks in this sprint doc.
  Dependency: `GPAS-050`
  Acceptance criteria:
  - Verification log includes concrete commands executed.
  - Residual risks and any deferred non-Google generalization are documented.
  - Rollout notes explain additive contract changes for downstream consumers.

- [x] `GPAS-052` Capture durable learnings in `docs/solutions/` if the fulfillment model introduces reusable patterns beyond this sprint.
  Dependency: `GPAS-050`
  Acceptance criteria:
  - Solution doc exists only if a reusable pattern or trap is worth preserving.
  - The write-up links back to this sprint and includes prevention guidance.

## Verification Strategy

1. API/service correctness
   - Unit coverage for fulfillment derivation from requested products plus saved assets.
   - Request-finalization coverage for `completed` vs `partial`.

2. Frontend behavior
   - Wizard tests for product-level gating and zero-assets messaging.
   - Invite page tests to confirm partial-completion handling remains coherent.

3. Contract safety
   - Shared type checks for additive `authorizationProgress` fields.
   - Existing tests for non-Google flows should continue to pass without semantic regression.

4. UX spot checks
   - Confirm Step 2 still reads clearly on mobile and desktop when Google returns mixed states.
   - Confirm the primary action remains visible and unambiguous.

## Risks and Mitigations

1. Product-level fulfillment logic could accidentally mark unrelated grouped platforms incomplete.
   Mitigation: scope evaluator rules explicitly to Google account-selectable products plus `meta_ads` and `linkedin_ads`.

2. Completion semantics could drift between invite runtime and agency-facing request data.
   Mitigation: centralize fulfillment evaluation in the service layer and reuse it for both payload and completion decisions.

3. Zero-assets detection could be conflated with “user made no selection.”
   Mitigation: persist or derive enough discovery metadata to tell empty inventory apart from empty choice.

4. Additive shared-type changes could break narrow consumer assumptions.
   Mitigation: preserve `completedPlatforms` and `isComplete`; add fields instead of replacing them.

5. Partial completion messaging could feel like failure if written poorly.
   Mitigation: keep copy explicit, neutral, and action-oriented: connected successfully, some requested products still need follow-up.

## Review Findings Queue

1. No change-specific correctness findings remained after review.
2. Residual workspace blocker: `npm run typecheck --workspace=apps/api` now fails because of unrelated pre-existing issues in `apps/api/instrument.ts` and `apps/api/src/index.ts` rootDir handling.

## Verification Log

- `npm test --workspace=apps/api -- src/services/__tests__/access-request.service.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/__tests__/client-auth.routes.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/services/__tests__/client-assets.service.test.ts`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  Result: pass
- `npm test --workspace=apps/web -- 'src/app/invite/[token]/__tests__/page.test.tsx'`
  Result: pass
- `npm test --workspace=apps/web -- src/components/access-request-detail/__tests__/request-platforms-card.test.tsx`
  Result: pass
- `npm run build --workspace=packages/shared`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/GoogleAssetSelector.test.tsx`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  Result: pass
- `npm test --workspace=apps/web -- src/components/access-request-detail/__tests__/request-platforms-card.test.tsx`
  Result: pass
- `npm run typecheck --workspace=apps/web`
  Result: pass
- `npm run typecheck --workspace=packages/shared`
  Result: pass
- `npm run typecheck --workspace=apps/api`
  Result: fails due unrelated pre-existing errors:
  - `apps/api/instrument.ts(74,7)` unknown `captureUnhandledRejections` property on `NodeOptions`
  - `apps/api/src/index.ts(2,8)` `instrument.ts` outside configured `rootDir`
- `npm run typecheck --workspace=apps/web`
  Result: fails due unrelated pre-existing errors:
  - `.next/types/validator.ts(25,44)` / `.next/types/validator.ts(25,75)` route validator constraint issue
  - `apps/web/instrumentation-client.ts(58,7)` duplicate `beforeSend`

## Rollout Notes

- `authorizationProgress` now exposes additive product-level fulfillment detail:
  - `fulfilledProducts`
  - `unresolvedProducts`
- Google platform-group completion is now derived from requested product fulfillment instead of OAuth authorization alone.
- Client completion endpoint now finalizes as `partial` when unresolved requested Google products remain.
- Agency request-detail payloads now expose unresolved requested products so partial outcomes are visible after the client finishes.
- Downstream consumers that only read `completedPlatforms` and `isComplete` remain compatible.
