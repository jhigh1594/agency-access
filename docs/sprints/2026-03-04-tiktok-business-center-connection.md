# Sprint: TikTok Business Center Connection (Approach 3)

- Date: 2026-03-04
- Status: In Progress (Code Complete, rollout evidence pending)
- Owners: API + Web
- Scope: Deliver end-to-end TikTok Business Center connection, including OAuth, asset discovery, and BC partner-sharing automation.
- Discovery input: [`docs/brainstorms/2026-03-04-tiktok-business-center-connection-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-04-tiktok-business-center-connection-brainstorm.md)

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router (web)
  - Fastify + Prisma (api)
  - Clerk auth and agency-scoped authorization
  - Redis-backed OAuth state
  - Infisical token storage + audit logging
  - Tailwind tokenized UI patterns and shared React primitives

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” is implemented as reusable React primitives/variants in `apps/web/src/components/client-auth` and `apps/web/src/components/platform-*`.
- Token-system work is enforced via semantic design tokens and shared UI components on new TikTok surfaces.

## External Research Decision

External research is required and already completed due to high novelty and correctness risk.
Primary-source TikTok docs and official SDK metadata were used to validate:
- current OAuth endpoints,
- token semantics,
- Business Center asset APIs,
- partner-sharing APIs,
- permission scope requirements.

## Product Decision Log (Locked)

1. Ship **Approach 3**: OAuth + asset discovery + automated BC partner sharing.
2. Keep manual BC sharing as fallback path for partial failures; do not block connection finalization when automation partially fails.
3. Do not store provided TikTok client credentials in tracked repo files.
   - Credentials are runtime secrets in Infisical/local env only.
4. Preserve existing API response envelopes (`{ data, error }`) and current authz boundaries.
5. Implement role mapping server-side:
   - internal access levels map to TikTok `ADMIN` / `OPERATOR` / `ANALYST`.

## Execution Inputs

- TikTok app credentials were provided by user for execution.
- Handling policy:
  - set as runtime secrets only,
  - do not commit to git,
  - support both legacy and new env naming during migration (`TIKTOK_APP_*` and `TIKTOK_CLIENT_*`).

## Architecture Approach

1. Correct TikTok connector foundation:
   - replace deprecated auth/token endpoints,
   - fix env var resolution,
   - align token lifecycle handling with TikTok long-term token behavior.
2. Implement authoritative TikTok account/asset discovery service:
   - `/oauth2/advertiser/get/`, `/bc/get/`, `/bc/asset/get/`.
3. Extend client auth UX for TikTok Step 2:
   - selectable TikTok ad accounts,
   - no dead-end state,
   - persisted selections in `grantedAssets` and authorization metadata.
4. Implement BC partner-sharing automation:
   - `bc/partner/add` for selected advertiser IDs,
   - verification via partner/list asset endpoints,
   - idempotent retry behavior and partial-failure reporting.
5. Harden with tests, error normalization, observability, and rollout safeguards.

## Milestones

### Milestone 1: OAuth Foundation + Secret Compatibility
- `TTBC-001`, `TTBC-010`, `TTBC-011`, `TTBC-012`, `TTBC-013`, `TTBC-014`

### Milestone 2: Asset Discovery + Client Flow Completion
- `TTBC-020`, `TTBC-021`, `TTBC-022`, `TTBC-023`, `TTBC-024`, `TTBC-025`

### Milestone 3: BC Partner Automation + Verification
- `TTBC-030`, `TTBC-031`, `TTBC-032`, `TTBC-033`, `TTBC-034`, `TTBC-035`

### Milestone 4: Hardening + Evidence + Release Gates
- `TTBC-040`, `TTBC-041`, `TTBC-042`, `TTBC-043`, `TTBC-044`

## Ordered Task Board

- [x] `TTBC-001` Create sprint artifact with locked decisions, milestones, and risk controls.
  Dependency: none
  Acceptance criteria:
  - Sprint includes architecture, phased milestones, verification, and risk plan.
  - Task IDs are stable and dependency-linked.

- [x] `TTBC-010` Add/normalize TikTok secret resolution strategy in API env layer.
  Dependency: `TTBC-001`
  Acceptance criteria:
  - API supports runtime resolution for `TIKTOK_CLIENT_ID`/`TIKTOK_CLIENT_SECRET`.
  - Backward-compatible aliasing for `TIKTOK_APP_ID`/`TIKTOK_APP_SECRET` is implemented or migration path is explicit.
  - `.env.example` and env validation are consistent.

- [x] `TTBC-011` Replace deprecated TikTok OAuth endpoint config with current v1.3 endpoints.
  Dependency: `TTBC-010`
  Acceptance criteria:
  - Connector no longer uses `passport/v2` URLs.
  - Connector uses documented token/auth APIs (`/open_api/v1.3/oauth2/access_token/` and/or `/open_api/v1.3/oauth/token/`).
  - Connector errors are mapped to typed `ConnectorError` codes.

- [x] `TTBC-012` Align TikTok token model with long-term token semantics.
  Dependency: `TTBC-011`
  Acceptance criteria:
  - Token normalization no longer assumes refresh-token-required 24h expiry for Marketing API long-term tokens.
  - Revoke support path is implemented via TikTok revoke endpoint.
  - Connection health logic handles no-expiry token case safely.

- [x] `TTBC-013` Add TikTok connector tests for exchange, normalization, verify, and revoke behavior.
  Dependency: `TTBC-011`, `TTBC-012`
  Acceptance criteria:
  - Unit tests cover success, endpoint failure, malformed payloads, and auth errors.
  - Tests assert no secret leakage in logs/exceptions.

- [x] `TTBC-014` Add audit-log hooks for TikTok token read/revoke/exchange actions.
  Dependency: `TTBC-012`
  Acceptance criteria:
  - Audit events include user email, IP/timestamp/action, and platform metadata.
  - Behavior matches existing token-access logging standards.

- [x] `TTBC-020` Implement TikTok asset discovery service using OAuth + BC endpoints.
  Dependency: `TTBC-011`, `TTBC-012`
  Acceptance criteria:
  - Service fetches authorized advertisers via `/oauth2/advertiser/get/`.
  - Service fetches BC list via `/bc/get/` and ad-account assets via `/bc/asset/get/`.
  - Returned model is normalized for UI consumption.

- [x] `TTBC-021` Replace invalid TikTok asset fetch usage in client asset routes.
  Dependency: `TTBC-020`
  Acceptance criteria:
  - `fetchTikTokAssets` no longer relies on invalid/null advertiser-info pattern.
  - `/api/client/:token/assets?platform=tiktok` returns consistent typed shape.
  - Route preserves `{ data, error }` envelope and status code behavior.

- [x] `TTBC-022` Persist TikTok discovery + selection metadata on authorization records.
  Dependency: `TTBC-020`, `TTBC-021`
  Acceptance criteria:
  - Metadata stores selected advertiser IDs, selected BC ID, and discovery snapshots.
  - Data updates are merge-safe and do not overwrite unrelated metadata fields.

- [x] `TTBC-023` Add TikTok Step 2 UI path in `PlatformAuthWizard` (reusable variant task).
  Dependency: `TTBC-021`
  Acceptance criteria:
  - TikTok renders a selectable accounts section in Step 2.
  - User can continue to Step 3 without dead-end.
  - Existing Meta/Google behavior is unchanged.

- [x] `TTBC-024` Add reusable TikTok asset selector component and tests.
  Dependency: `TTBC-023`
  Acceptance criteria:
  - New selector component is reusable and typed, not page-inline logic.
  - Supports loading/error/empty states with semantic tokens.
  - Web tests cover selection and save interactions.

- [x] `TTBC-025` Add client-side analytics events for TikTok connect/select/save actions.
  Dependency: `TTBC-023`
  Acceptance criteria:
  - Events include platform, step, and selected account counts.
  - Fail-open behavior when analytics transport fails.

- [x] `TTBC-030` Implement TikTok BC partner-sharing service (`bc/partner/add`).
  Dependency: `TTBC-020`, `TTBC-022`
  Acceptance criteria:
  - Service accepts agency BC ID + selected advertiser IDs + role mapping.
  - Calls TikTok partner add endpoint with required parameters.
  - Supports per-account success/failure result aggregation.

- [x] `TTBC-031` Add role mapping layer internal access -> TikTok role enum.
  Dependency: `TTBC-030`
  Acceptance criteria:
  - Mapping supports `ADMIN`, `OPERATOR`, `ANALYST`.
  - Invalid mappings fail with typed validation errors.

- [x] `TTBC-032` Add post-share verification endpoints using partner/asset APIs.
  Dependency: `TTBC-030`
  Acceptance criteria:
  - Verification reads partner and shared-asset endpoints (`/bc/partner/get/`, `/bc/partner/asset/get/`, `/bc/asset/partner/get/`).
  - Verification result is persisted to metadata and returned to UI.

- [x] `TTBC-033` Add retry-safe idempotency strategy for partner-share operations.
  Dependency: `TTBC-030`, `TTBC-032`
  Acceptance criteria:
  - Repeat requests do not duplicate harmful side effects.
  - Partial failures can be retried by account subset.

- [x] `TTBC-034` Add manual fallback UX copy/actions for partial automation failures.
  Dependency: `TTBC-033`
  Acceptance criteria:
  - UI provides clear manual BC-sharing instructions when automation partially fails.
  - User can proceed with explicit partial status and remediation path.

- [x] `TTBC-035` Add API/security tests for partner-share authorization and tenancy.
  Dependency: `TTBC-030`, `TTBC-032`
  Acceptance criteria:
  - Tests cover forbidden cross-tenant access, invalid request payloads, and partial-failure reporting.
  - Secret IDs/tokens never appear in response bodies.

- [x] `TTBC-040` Run full test gates for touched workspaces.
  Dependency: `TTBC-013`, `TTBC-024`, `TTBC-035`
  Acceptance criteria:
  - `npm run test --workspace=apps/api` passes for changed suites.
  - `npm run test --workspace=apps/web` passes for changed suites.
  - Touched code is typecheck-clean.

- [x] `TTBC-041` Token-system and reusable-variant polish pass.
  Dependency: `TTBC-024`, `TTBC-034`
  Acceptance criteria:
  - New TikTok UI surfaces use semantic token classes + shared components.
  - No raw one-off visual styling without token mapping.

- [ ] `TTBC-042` Screenshot polish verification (desktop + mobile).
  Dependency: `TTBC-041`
  Acceptance criteria:
  - Capture states: TikTok connect, TikTok select assets, TikTok share success, partial-failure fallback.
  - Store artifacts under `docs/images/tiktok-bc-connection/2026-03-04`.

- [x] `TTBC-043` Update docs and requirement mapping.
  Dependency: `TTBC-001`
  Acceptance criteria:
  - `docs/sprints/mvp-requirement-mapping.md` includes TikTok BC requirement -> `TTBC-*` mapping.
  - Sprint rollout notes include fallback and operational runbook links.

- [ ] `TTBC-044` Release readiness checklist and staged rollout plan.
  Dependency: `TTBC-040`, `TTBC-042`, `TTBC-043`
  Acceptance criteria:
  - Feature flag or controlled rollout strategy documented.
  - Support playbook includes common TikTok failure codes and remediation.
  - Backout path documented.

## Verification Strategy

1. Connector/API correctness:
- Unit tests for TikTok connector exchange/verify/revoke behaviors.
- Route/service tests for asset discovery and partner-sharing operations.

2. Security and tenancy:
- Authz tests for agency scoping on all new TikTok endpoints.
- Confirm no token/secret leakage in responses or logs.

3. Frontend behavior:
- Integration tests for TikTok Step 2 completion path.
- Tests for selection persistence, save, and partial-failure fallback UX.

4. End-to-end smoke:
- Manual test with sandbox TikTok app across full flow:
  - authorize -> discover -> select -> share -> verify.

5. Quality gates:
- `npm run test --workspace=apps/api`
- `npm run test --workspace=apps/web`
- `npm run typecheck --workspace=apps/api`
- `npm run typecheck --workspace=apps/web`
- `npm run lint`

## Execution Evidence

- API tests (TikTok suites):
  - `npm test --workspace=apps/api src/lib/__tests__/env.test.ts src/services/connectors/__tests__/tiktok.connector.test.ts src/services/__tests__/client-assets.service.test.ts src/routes/client-auth/__tests__/assets.tiktok.test.ts src/routes/client-auth/__tests__/assets.security.test.ts src/services/__tests__/tiktok-partner.service.test.ts`
- Web tests (TikTok suites):
  - `npm test --workspace=apps/web src/components/client-auth/__tests__/TikTokAssetSelector.test.tsx src/components/client-auth/__tests__/PlatformAuthWizard.tiktok.test.tsx`
- Typecheck:
  - `npm run typecheck --workspace=apps/api`
  - `npm run typecheck --workspace=apps/web`

## Risks and Mitigations

1. Risk: TikTok API behavior differs by account type/region.
Mitigation: normalize error handling, use sandbox + real-account smoke matrix, keep manual fallback.

2. Risk: permission scope mismatch blocks BC APIs after token exchange.
Mitigation: preflight checks for required scope IDs; clear user-facing remediation guidance.

3. Risk: connector migration breaks existing TikTok connections.
Mitigation: dual env-var compatibility, backward-safe metadata schema migration, staged rollout.

4. Risk: partner-share operations create partial, hard-to-debug states.
Mitigation: idempotent retry model, per-account result persistence, verification endpoints.

5. Risk: credentials accidentally committed.
Mitigation: no plaintext secrets in tracked files, local/Infisical-only secret handling, PR checklist guard.

## Rollout Notes

1. Controlled gate: enable TikTok partner automation only for agencies with active agency-side TikTok connection and configured Business Center ID.
2. Early cohort: manually observe first 5 agency activations and track `TIKTOK_PARTNER_SHARE_ATTEMPT`/`TIKTOK_PARTNER_SHARE_VERIFIED` audit events.
3. Support runbook: use [`docs/features/tiktok-business-center-rollout-runbook.md`](/Users/jhigh/agency-access-platform/docs/features/tiktok-business-center-rollout-runbook.md) for failure-code remediation and manual fallback handling.
4. Promotion criteria: move from cohort rollout to default when partial-failure rate is stable and support can resolve manual fallback cases within SLA.

## Release Readiness Checklist (Draft)

- [x] TikTok OAuth endpoints migrated to v1.3 and connector tests passing.
- [x] Asset discovery + Step 2 TikTok selection flow complete with no dead-end.
- [x] Partner-share + verify endpoints implemented with audit logging and tenancy checks.
- [x] Touched API/web tests passing and typecheck clean.
- [ ] Screenshot evidence captured for desktop/mobile flow states (TTBC-042).
- [x] Support runbook with failure remediation and backout path documented.

## Review Findings Queue

- [ ] Capture desktop/mobile screenshots for TTBC-042 under `docs/images/tiktok-bc-connection/2026-03-04`.
- [ ] Run end-to-end sandbox smoke for authorize -> discover -> select -> share -> verify.
- [ ] Complete TTBC-044 release checklist after screenshot + smoke evidence is attached.

## Sources
- Authorization (Marketing API): https://business-api.tiktok.com/portal/docs?id=1738373141733378
- Authentication: https://business-api.tiktok.com/portal/docs?id=1738373164380162
- Obtain long-term token: https://business-api.tiktok.com/portal/docs?id=1739965703387137
- Revoke long-term token: https://business-api.tiktok.com/portal/docs?id=1739965949088770
- Get authorized ad accounts: https://business-api.tiktok.com/portal/docs?id=1738455508553729
- Get Business Centers: https://business-api.tiktok.com/portal/docs?id=1737115687501826
- Get assets: https://business-api.tiktok.com/portal/docs?id=1739432717798401
- Add partner to BC: https://business-api.tiktok.com/portal/docs?id=1739662756510721
- Get BC partners: https://business-api.tiktok.com/portal/docs?id=1739662727395330
- Get partner assets: https://business-api.tiktok.com/portal/docs?id=1739662828320769
- Permission scope hierarchy: https://business-api.tiktok.com/portal/docs?id=1753986142651394
- Official SDK reference: https://github.com/tiktok/tiktok-business-api-sdk
