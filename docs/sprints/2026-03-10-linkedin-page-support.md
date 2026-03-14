# Sprint: LinkedIn Page Support

- Date: 2026-03-10
- Status: Implemented and verified
- Owners: Web + API
- Scope: Add LinkedIn Company Page support to the client access request flow as a distinct requestable product, including OAuth-scope resolution, post-OAuth page discovery and selection, and fulfillment-aware status handling for `linkedin_pages`.
- Discovery input:
  - LinkedIn ads/platform baseline: [`docs/research-linkedin-ads-access.md`](/Users/jhigh/agency-access-platform/docs/research-linkedin-ads-access.md)
  - Cross-platform post-OAuth selection baseline: [`docs/brainstorms/2026-03-10-cross-platform-post-oauth-selection-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-10-cross-platform-post-oauth-selection-brainstorm.md)
  - Cross-platform fulfillment sprint baseline: [`docs/sprints/2026-03-10-cross-platform-post-oauth-fulfillment.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-cross-platform-post-oauth-fulfillment.md)
  - Durable solution pattern: [`docs/solutions/grouped-oauth-product-expansion-with-truthful-fulfillment.md`](/Users/jhigh/agency-access-platform/docs/solutions/grouped-oauth-product-expansion-with-truthful-fulfillment.md)

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared TypeScript contracts in `@agency-platform/shared`
- Tailwind through the existing invite semantic tokens and shared UI primitives
- Progressive invite queue remains the interaction baseline; this sprint extends LinkedIn product coverage inside the existing group-based OAuth/runtime model

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” maps here to reusable React asset-selector helpers and LinkedIn-specific invite/runtime helpers in `apps/web/src/components/client-auth`.
- Token-system work is limited to keeping LinkedIn page empty, follow-up, and mixed-product states consistent with existing semantic tokens.
- Screenshot-polish verification applies to the invite wizard and the agency request-detail surface on desktop and mobile.

## External Research Decision

External research is required before implementation because LinkedIn page access is partner-gated, scope-sensitive, and versioned.

Primary sources that should guide implementation:
- LinkedIn Organizations overview: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations?view=li-lms-2026-02
- Organization Lookup API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-lookup-api?view=li-lms-2026-02
- Organization access-control / authorizations APIs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-authorizations/organization-authorizations?view=li-lms-2025-08
- Marketing integrations / auth scope docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/marketing-integrations?view=li-lms-2025-08

Research conclusions to carry into implementation:
- LinkedIn Company Pages are organization entities (`urn:li:organization:{id}`), separate from ad accounts.
- Page-management/admin discovery requires organization-specific permissions rather than the existing ads-only scope set.
- The current LinkedIn OAuth config in the repo is ads-focused and will need product-aware scope resolution when `linkedin_pages` is requested.

## Product Decision Log (Locked)

1. Introduce `linkedin_pages` as a new product under the existing `linkedin` platform group.
   - `linkedin_ads` remains unchanged.
   - Page support is not implicitly bundled into ad-account support.
2. `linkedin_pages` is asset-selecting and post-OAuth.
   - OAuth alone does not fulfill the product.
   - The client must be able to review and select administered LinkedIn Pages after OAuth.
3. First slice is selection-first, not automated page-role assignment.
   - This sprint stops at discovery, selection, persistence, and truthful fulfillment status.
   - Do not add `organizationAcls` write automation in the same slice.
4. LinkedIn OAuth scopes become request-aware.
   - `linkedin_ads` keeps its existing ads/reporting scopes.
   - Requests containing `linkedin_pages` add the organization-admin scope(s) required for page discovery.
   - Requests containing both products use the union of LinkedIn scopes.
5. Discovery is limited to pages the OAuth user already administers or can enumerate through the official organization access-control surface.
   - No public company search.
   - No organization creation flow.
6. Zero-page states must remain truthful.
   - If LinkedIn returns zero administered pages, the product remains unresolved with `no_assets`.
   - The broader request may still finalize as `partial`, consistent with the existing fulfillment model.

## Architecture Approach

1. Extend shared product modeling and labels for `linkedin_pages`.
   - Update shared platform enums, hierarchy, names, and any product-group helpers.
   - Ensure creator/runtime/request-detail surfaces can render the new product without fallback labels.
2. Add product-aware LinkedIn OAuth scope resolution.
   - Mirror the existing Google product-union logic in `oauth-state.routes.ts`.
   - Avoid widening LinkedIn ads-only requests unnecessarily.
3. Implement LinkedIn page discovery as a separate asset-fetch path from `linkedin_ads`.
   - Add client asset route support for `linkedin_pages`.
   - Normalize organization/page entities into selector-ready objects with stable IDs and display names.
   - Preserve pinned LinkedIn API versions and token-read audit logging.
4. Extend the LinkedIn asset-selection UI for multi-product support.
   - Keep the current `LinkedInAssetSelector` pattern, but support `linkedin_ads` and `linkedin_pages` cleanly.
   - Reuse shared `AssetGroup`/state primitives so LinkedIn pages look native to the existing invite system.
5. Bring `linkedin_pages` into fulfillment and agency-status aggregation.
   - Add it to asset-selecting evaluator allowlists.
   - Persist zero-assets truth in saved selections.
   - Surface unresolved `linkedin_pages` on invite summary and agency request detail.
6. Keep grant semantics explicit.
   - UI copy must make it clear that this slice captures which LinkedIn Pages the client is approving in the request flow.
   - Any future automated page-role assignment remains a separate sprint once agency LinkedIn identity/URN handling is designed.

## Milestones

### Milestone 1: Contract + Research Lock
- `LIPS-001`, `LIPS-002`, `LIPS-010`, `LIPS-011`

### Milestone 2: Red Tests
- `LIPS-020`, `LIPS-021`, `LIPS-022`

### Milestone 3: Product Model + OAuth Scopes
- `LIPS-030`, `LIPS-031`

### Milestone 4: Discovery + Fulfillment
- `LIPS-040`, `LIPS-041`, `LIPS-042`, `LIPS-043`

### Milestone 5: Polish + Verification
- `LIPS-050`, `LIPS-051`, `LIPS-052`, `LIPS-053`

## Ordered Task Board

- [x] `LIPS-001` Create sprint artifact for LinkedIn Page support.
  Dependency: none
  Acceptance criteria:
  - Sprint doc locks product scope, architecture approach, and explicit defer decisions.
  - The doc distinguishes page discovery/selection from future automated page-role assignment.

- [x] `LIPS-002` Refresh [`docs/sprints/mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md) for this sprint.
  Dependency: `LIPS-001`
  Acceptance criteria:
  - Requirement mapping includes stable `LIPS-*` IDs.
  - LinkedIn Page support is distinguishable from the earlier cross-platform fulfillment sprint.

- [x] `LIPS-010` Lock the product and contract model for `linkedin_pages`.
  Dependency: `LIPS-001`
  Acceptance criteria:
  - The new product ID and platform-group membership are explicit.
  - The plan identifies all shared/frontend/backend contract surfaces that need the new product.
  - Selection, fulfillment, and unresolved-state rules are defined before implementation.

- [x] `LIPS-011` Capture the LinkedIn page discovery contract and scope requirements from official docs.
  Dependency: `LIPS-001`
  Acceptance criteria:
  - Official docs for organizations/access control are referenced in the sprint.
  - The required LinkedIn scope additions for `linkedin_pages` are explicit.
  - The plan states which API surface will drive page discovery.

- [x] `LIPS-020` Add failing tests for product modeling and OAuth scope union.
  Dependency: `LIPS-010`, `LIPS-011`
  Acceptance criteria:
  - Tests prove `linkedin_pages` is exposed under the `linkedin` group across shared/runtime consumers.
  - OAuth URL generation tests prove LinkedIn page requests add organization-admin scope(s).
  - Ads-only LinkedIn requests remain scoped narrowly.

- [x] `LIPS-021` Add failing route/service tests for LinkedIn page discovery.
  Dependency: `LIPS-011`
  Acceptance criteria:
  - Client asset routes cover `linkedin_pages`.
  - Tests assert pinned LinkedIn version headers and token-read audit logging.
  - Tests cover normalized selector-ready page payloads and zero-page responses.

- [x] `LIPS-022` Add failing web tests for LinkedIn page selection and empty-state follow-up.
  Dependency: `LIPS-010`, `LIPS-011`
  Acceptance criteria:
  - The wizard renders a LinkedIn Page selection step when `linkedin_pages` is requested.
  - Zero-page states surface follow-up-needed copy rather than false completion.
  - Mixed LinkedIn requests (`linkedin_ads` + `linkedin_pages`) remain coherent in Step 2 and summary states.

- [x] `LIPS-030` Implement `linkedin_pages` product modeling across shared/backend/frontend contracts.
  Dependency: `LIPS-020`
  Acceptance criteria:
  - Shared types, hierarchy, labels, and platform helpers recognize `linkedin_pages`.
  - Creator/runtime/request-detail surfaces render the product without fallback naming.
  - Existing LinkedIn Ads behavior remains intact.

- [x] `LIPS-031` Implement product-aware LinkedIn OAuth scope resolution.
  Dependency: `LIPS-020`, `LIPS-030`
  Acceptance criteria:
  - `oauth-url` generation unions LinkedIn scopes from requested products.
  - `linkedin_pages` requests include organization-admin scope(s).
  - Ads-only LinkedIn requests do not accidentally inherit page-management scopes.

- [x] `LIPS-040` Implement LinkedIn page discovery in the client asset route.
  Dependency: `LIPS-021`, `LIPS-031`
  Acceptance criteria:
  - API can fetch selector-ready LinkedIn Pages/organizations for `linkedin_pages`.
  - Route behavior preserves tenancy checks, audit logging, and pinned API versions.
  - Errors surface cleanly without token leakage.

- [x] `LIPS-041` Extend LinkedIn asset-selection UI for page support.
  Dependency: `LIPS-022`, `LIPS-040`
  Acceptance criteria:
  - Clients can select LinkedIn Pages in Step 2.
  - Shared selector primitives handle LinkedIn page naming, empty states, and counts cleanly.
  - Mixed LinkedIn product requests render clearly without ad-hoc styling.

- [x] `LIPS-042` Persist page-selection and zero-page truth for `linkedin_pages`.
  Dependency: `LIPS-021`, `LIPS-041`
  Acceptance criteria:
  - Save-assets schema and persistence remain additive.
  - Zero-page discovery survives refresh/redirect via saved metadata.
  - Existing LinkedIn ad-account persistence stays compatible.

- [x] `LIPS-043` Bring `linkedin_pages` into fulfillment and request-detail status aggregation.
  Dependency: `LIPS-030`, `LIPS-042`
  Acceptance criteria:
  - `linkedin_pages` is treated as asset-selecting in shared evaluators.
  - Invite summary and agency request detail can render unresolved LinkedIn Pages truthfully.
  - Completion remains `completed` vs `partial` based on selected LinkedIn assets, not OAuth presence.

- [x] `LIPS-050` Token-system and reusable-primitive polish pass for LinkedIn page states.
  Dependency: `LIPS-041`, `LIPS-043`
  Acceptance criteria:
  - LinkedIn page selection, empty, and follow-up states use existing semantic tokens and card/list patterns.
  - Repetition between LinkedIn ads/pages selector rendering is extracted where useful.
  - No one-off styling bypasses the invite/request-detail visual system.

- [x] `LIPS-051` Capture screenshot evidence for required shells.
  Dependency: `LIPS-050`
  Acceptance criteria:
  - Capture desktop and mobile screenshots for:
    - LinkedIn Page Step 2 selection
    - LinkedIn zero-page follow-up state
    - Mixed LinkedIn Ads + Pages summary
    - Agency request detail unresolved LinkedIn Pages panel
  - Store artifacts under `docs/images/linkedin-page-support/2026-03-10`.

- [x] `LIPS-052` Run focused regression tests, relevant typechecks, and targeted review.
  Dependency: `LIPS-031`, `LIPS-040`, `LIPS-041`, `LIPS-043`
  Acceptance criteria:
  - Relevant shared/api/web test suites pass.
  - Relevant typechecks pass or blockers are documented precisely.
  - Review findings are recorded in this sprint doc and resolved or explicitly deferred.

- [x] `LIPS-053` Record rollout notes, residual risks, and downstream contract guidance in this sprint doc.
  Dependency: `LIPS-052`
  Acceptance criteria:
  - Verification log contains concrete commands and results.
  - Downstream additive contract changes for `linkedin_pages` are documented.
  - Deferred work for automated page-role assignment is called out explicitly.

## Verification Strategy

1. API/service correctness
   - OAuth URL scope-union tests for LinkedIn products
   - Route tests for `linkedin_pages` discovery, audit logging, and pinned API versions
   - Fulfillment/status tests proving `linkedin_pages` is not fulfilled by OAuth alone

2. Frontend behavior
   - Wizard tests for LinkedIn Page selection
   - Wizard tests for zero-page follow-up states
   - Mixed LinkedIn Ads + Pages regression coverage in Step 2 and summary states

3. Contract safety
   - Shared type checks for new product modeling
   - Additive save-assets and `authorizationProgress` evolution checks
   - Confirm no token storage regressions and no public-company-search leakage

4. UX verification
   - Desktop and mobile screenshot checks for changed invite and agency surfaces
   - Confirm copy distinguishes LinkedIn Ads from LinkedIn Pages clearly

## Risks and Mitigations

1. LinkedIn page permissions may require app-review or partner entitlements not present in all environments.
   Mitigation: verify scope and endpoint access against official docs first and document environment prerequisites in the sprint log.

2. The current OAuth URL generator only special-cases Google and Meta, so LinkedIn product-aware scopes could widen too much or too little if implemented casually.
   Mitigation: add explicit scope-union tests for ads-only, pages-only, and mixed LinkedIn requests before implementation.

3. “Pages” versus “organizations” naming could confuse clients and agencies if UI copy exposes raw LinkedIn terminology.
   Mitigation: normalize user-facing copy to “LinkedIn Pages” while preserving organization URNs and raw types only in internal metadata.

4. Adding page support without automated role assignment could overstate what the flow completes.
   Mitigation: keep this sprint selection-first and describe the defer explicitly in product decisions, rollout notes, and follow-up sections.

5. Mixed LinkedIn requests could create duplicated or awkward selector surfaces in Step 2.
   Mitigation: include a reusable selector-polish task and screenshot gate for the mixed Ads + Pages state.

## Review Findings Queue

1. Closed after verification: keep the `organizationAcls` `role=ADMINISTRATOR` filter for this sprint. The current LinkedIn Pages slice is intentionally scoped to organizations the client can administer with `rw_organization_admin`, so widening discovery would overstate supported access rather than fix a proven bug. Scope note documented inline next to the filter. Reference: [`apps/api/src/services/client-assets.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/client-assets.service.ts#L375)
2. Resolved: if all LinkedIn organization-detail lookups fail after ACL discovery, the service now surfaces a real integration error instead of degrading to `[]`, and partial failures are logged with counts. Reference: [`apps/api/src/services/client-assets.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/client-assets.service.ts#L332)
3. Review focus:
   - LinkedIn OAuth scope-union correctness
   - page discovery endpoint choice and normalization
   - mixed LinkedIn Ads + Pages Step 2 clarity
   - fulfillment truthfulness without automated page-role grants
4. Verification blockers still open:
   - shared types Jest suite still has the pre-existing `google_ads_mcc` expectation failure unrelated to `linkedin_pages`
   - `apps/web` typecheck is still blocked by the existing `.next/types/validator.ts` / `next-env.d.ts` route-type state

## Verification Log

- `npm test --workspace=apps/api -- src/routes/__tests__/client-auth.routes.test.ts`
  Result: passed
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.linkedin.test.ts`
  Result: passed
- `npm test --workspace=apps/api -- src/services/__tests__/client-assets.service.test.ts`
  Result: passed
- `npm test --workspace=apps/api -- src/services/__tests__/access-request.service.test.ts`
  Result: passed
- `npm test --workspace=apps/api -- src/services/__tests__/client.service.test.ts`
  Result: passed
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  Result: passed
- `npm test --workspace=apps/web -- src/components/access-request-detail/__tests__/request-platforms-card.test.tsx`
  Result: passed
- `npm run typecheck --workspace=packages/shared`
  Result: passed
- `npm run build --workspace=packages/shared`
  Result: passed
- `npm run typecheck --workspace=apps/api`
  Result: passed after rebuilding `@agency-platform/shared`
- `npm test --workspace=packages/shared -- src/__tests__/types.test.ts`
  Result: failed for a pre-existing `google_ads_mcc` hierarchy expectation unrelated to `linkedin_pages`; new LinkedIn Pages assertions passed
- `npm run typecheck --workspace=apps/web`
  Result: failed in existing generated Next route validator state:
  `.next/types/validator.ts(25,44): Type 'Route' does not satisfy the constraint 'never'`
- `npm test --workspace=apps/api -- src/services/__tests__/client-assets.service.test.ts`
  Result: passed after changing LinkedIn page discovery to error when all organization lookups fail
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.linkedin.test.ts`
  Result: passed after asserting the route surfaces `ASSET_FETCH_ERROR` when LinkedIn page hydration fully fails
- `node scripts/capture-linkedin-page-support-evidence.mjs`
  Result: passed; refreshed all eight LinkedIn Pages evidence screenshots under `docs/images/linkedin-page-support/2026-03-10`
- Playwright browser harness captured desktop + mobile evidence under `docs/images/linkedin-page-support/2026-03-10`
  Result: saved
  - `desktop-light-linkedin-page-step2-selection.png`
  - `mobile-light-linkedin-page-step2-selection.png`
  - `desktop-light-linkedin-zero-page-follow-up.png`
  - `mobile-light-linkedin-zero-page-follow-up.png`
  - `desktop-light-linkedin-mixed-summary.png`
  - `mobile-light-linkedin-mixed-summary.png`
  - `desktop-light-agency-request-detail-linkedin-pages-unresolved.png`
  - `mobile-light-agency-request-detail-linkedin-pages-unresolved.png`

## Rollout Notes

1. `linkedin_pages` is now a first-class product under the `linkedin` group across shared contracts, invite/runtime status evaluation, and agency request detail rendering.
2. Client OAuth for LinkedIn now unions scopes from requested products:
   - ads-only requests keep `rw_ads` + `r_ads_reporting`
   - page requests add `rw_organization_admin`
   - mixed requests use the additive union
3. LinkedIn page discovery uses the Organizations admin surfaces:
   - enumerate approved administrator relationships from `organizationAcls`
   - hydrate organization details from `organizations/{id}`
   - normalize to selector-ready LinkedIn Page records with stable IDs and URNs
4. Zero-page discovery is persisted truthfully in `grantedAssets.linkedin_pages` with `availableAssetCount: 0`, so refresh/re-entry and agency detail views remain follow-up-aware.
5. Automated LinkedIn page-role assignment remains explicitly deferred. This slice stops at discovery, client selection, persistence, and truthful fulfillment state.
