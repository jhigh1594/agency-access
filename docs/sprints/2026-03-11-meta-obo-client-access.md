# Sprint: Meta OBO Client Access Refactor

- Date: 2026-03-11
- Status: In Progress
- Owners: API + Web
- Scope: Replace the current Meta client access-request fulfillment path with an OBO-aligned implementation that truthfully discovers client Business Portfolios and assets, creates/verifies partner access correctly, and only marks Meta products fulfilled when access has actually been granted.
- Discovery input:
  - Prior sprint: [`docs/sprints/2026-03-11-meta-business-portfolio-modal.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-11-meta-business-portfolio-modal.md)
  - Primary implementation points:
    - `apps/api/src/services/connectors/meta.ts`
    - `apps/api/src/services/client-assets.service.ts`
    - `apps/api/src/services/meta-obo.service.ts`
    - `apps/api/src/services/meta-partner.service.ts`
    - `apps/api/src/services/meta-system-user.service.ts`
    - `apps/api/src/routes/client-auth/assets.routes.ts`
    - `apps/web/src/components/client-auth/MetaAssetSelector.tsx`
    - `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
    - `apps/web/src/components/client-auth/AutomaticPagesGrant.tsx`
    - `apps/web/src/components/client-auth/AdAccountSharingInstructions.tsx`
  - External docs already reviewed:
    - `https://developers.facebook.com/docs/business-management-apis/business-manager/guides/on-behalf-of`
    - `https://developers.facebook.com/docs/business-management-apis/business-asset-management/guides/assets`
    - `https://developers.facebook.com/docs/business-management-apis/business-manager/get-started#business`
    - `https://developers.facebook.com/docs/marketing-api/reference/ad-account/assigned_users`
    - `https://developers.facebook.com/docs/graph-api/reference/page/assigned_users`

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify backend in `apps/api`
- Shared types and runtime schemas in `@agency-platform/shared`
- OAuth tokens remain in Infisical only; database stores secret references and non-sensitive metadata
- Audit logging remains mandatory for all token reads and access-grant side effects
- Existing invite flow UI and semantic token system remain the baseline; no new design language

Adaptation note for workflow requirements:
- “Phlex primitives / Stimulus / Turbo” maps here to reusable React/TanStack Query components and route contracts.
- “Token-system tasks” map here to semantic UI token usage and secure token-storage/audit tasks.
- Screenshot-polish verification still applies to the invite/auth flow on desktop and mobile once implementation starts.

## Problem Statement

The current Meta path mixes three incompatible models:

1. Agency-side Meta connection setup stores an agency Business Portfolio and creates an agency BM system user.
2. Client-side asset discovery reads mostly from user-centric `/me/*` edges, which can omit business-owned and partner-managed assets.
3. Client-side fulfillment attempts to assign agency-side users to client assets and marks ad-account completion via self-attestation, but Meta’s OBO guide requires:
   - partner/client `managed_businesses` relationship creation
   - client-BM system user token generation under the client’s BM
   - asset assignment to that client-BM system user
   - use of verified results, not manual “done” clicks, to determine fulfillment

Validated client-flow constraint from product review and screenshot analysis:
- The client must first choose the Business Portfolio / Business Manager that owns the assets they want to share.
- Facebook Pages can be selected from that chosen business and granted from the product.
- Meta ad accounts still require a client-visible manual partner-assignment step in Meta Ads / Business Portfolio settings, using the agency partner Business ID.
- The agency partner Business ID shown to the client must be the agency owner’s connected Business Portfolio / Business Manager ID, not a system-user ID.
- Completion still must be driven by verification, not by a client “I finished” click.

## Product Decision Log (Locked)

1. Meta access-request fulfillment must be truthful: OAuth alone does not mean access granted.
2. The source of truth for client Meta fulfillment is verified access state, not manual confirmation.
3. Asset discovery must prefer business-scoped edges over `/me/*` shortcuts for Meta.
4. OBO relationship creation and client-BM system-user token generation will be explicit backend steps with durable metadata.
5. Any Meta capability we cannot verify programmatically must remain visibly unresolved rather than being marked complete.
6. Existing agency-side Business Portfolio selection remains, but it is not sufficient by itself to satisfy client access fulfillment.
7. The validated first-pass UX is hybrid: automatic verified Facebook Page grants, manual verified Meta ad-account partner assignment.
8. The primary client-visible identifier for manual Meta partner assignment is the agency partner Business Portfolio ID.
9. Leadsie-style guided partner-assignment steps are an acceptable pattern, but Agency Access must improve on that pattern by verifying access before completion.
10. Dataset / pixel assignment shown in competitor examples is out of scope for this sprint unless added explicitly later.

## Architecture Approach

### Backend

- Introduce an OBO service layer that owns:
  - ensuring the partner/client `managed_businesses` relationship exists
  - generating and persisting the client-BM system-user access token reference in Infisical
  - discovering the client-BM system-user ID from the generated token
  - assigning selected Facebook Pages to that client-BM system user where supported
  - verifying assigned access before marking fulfillment complete
- Add a manual Meta ad-account verification contract that owns:
  - returning the agency partner Business ID for the selected request
  - accepting the selected client ad accounts to watch
  - re-checking partner assignment state after the client completes Meta’s native partner-assignment flow
  - persisting `waiting | verified | unresolved | failed` results without relying on self-attestation
- Separate “discovery” from “grant” metadata in `PlatformAuthorization.metadata.meta` so UI can show:
  - discovered businesses/assets
  - selected business/assets
  - OBO setup state
  - asset assignment results
  - verification timestamps
- Treat the current automatic ad-account OBO mutation path as backend-only experimental plumbing until product explicitly promotes it. It is not the validated primary UX.
- Keep all token reads audited with source metadata.

### Frontend

- Meta invite Step 2 becomes:
  - choose client Business Portfolio
  - choose assets within that portfolio
  - run automated Facebook Page grants
  - show a guided manual Meta Ads partner-assignment flow for selected ad accounts
  - display verified grant results and unresolved items
- Remove the ad-account “mark complete” self-attestation path and replace it with verified manual progress states.
- Keep semantic-token styling and existing card/wizard patterns; no bespoke UI system.

## Metadata Contract

Implemented additive contract under `PlatformAuthorization.metadata.meta`:

- `discovery`
  - `availableBusinesses[]`: `{ id, name, verticalName?, verificationStatus? }`
  - `discoveredAt?`
- `selection`
  - `clientBusinessId`
  - `clientBusinessName?`
  - `selectedAt`
  - `source?`
- `obo.managedBusinessLink`
  - `status`: `not_started | pending | linked | failed`
  - `partnerBusinessId`
  - `clientBusinessId`
  - `establishedAt?`
  - `lastAttemptAt?`
  - `lastErrorCode?`
  - `lastErrorMessage?`
- `obo.clientSystemUser`
  - `status`: `not_started | pending | ready | failed`
  - `clientBusinessId`
  - `appId`
  - `scopes[]`
  - `systemUserId?`
  - `tokenSecretId?`
  - `provisionedAt?`
  - `lastAttemptAt?`
  - `lastErrorCode?`
  - `lastErrorMessage?`
- `obo.assetGrantResults[]`
  - `assetId`
  - `assetType`
  - `requestedTasks[]`
  - `status`: `pending | granted | verified | failed | unresolved`
  - `grantedAt?`
  - `verifiedAt?`
  - `errorCode?`
  - `errorMessage?`
- `obo.lastVerifiedAt?`

Security split locked by this contract:
- Infisical stores raw OAuth/system-user tokens.
- `tokenSecretId` is the only persisted token reference in Postgres metadata.
- Audit logs record OBO token reads and OBO side effects with connection context.

Current additive Meta discovery response shape for `/client/:token/assets/meta_ads`:
- Existing asset arrays remain at top level: `adAccounts`, `pages`, `instagramAccounts`
- New additive fields:
  - `businesses[]`
  - `selectedBusinessId?`
  - `selectedBusinessName?`
  - `selectionRequired`
- Route accepts optional `businessId` query param and persists discovery + selection metadata under `PlatformAuthorization.metadata.meta`
- When no explicit business is selected, backend falls back to business-scoped aggregation across discovered portfolios so the current UI does not regress before `MOBO-040`

## Phased Milestones

### Milestone A: Contract and OBO State Model
- Define the additive API/schema surface for Meta OBO state, selected client BM, grant results, and verification results.
- Lock what gets stored in Infisical vs metadata vs audit logs.

### Milestone B: Business-Scoped Discovery
- Refactor client Meta asset discovery to support business-scoped discovery:
  - client business portfolios available to the client auth user
  - assets by selected client business
  - business-owned vs client/shared semantics where available

### Milestone C: OBO Setup and Asset Assignment
- Implement partner/client relationship creation and client-BM system-user token generation.
- Implement verified assignment for supported automatic asset types.
- Persist verifiable grant outcomes.

### Milestone D: Hybrid Manual Ad-Account Fulfillment
- Add backend/manual-flow support for Meta ad-account partner assignment using the agency Business ID.
- Verify manual ad-account completion after the client performs the native Meta partner-assignment steps.

### Milestone E: Invite Flow Integration
- Replace ad-account self-attestation with a hybrid UI:
  - business selection
  - automatic page grants
  - guided manual ad-account partner assignment
  - verified result summaries
- Update Meta invite UI states and summaries to reflect verified completion, partial completion, waiting, and unresolved items.

### Milestone F: Verification and Rollout Safety
- Add focused API/web tests.
- Add desktop/mobile screenshot evidence for the Meta invite flow.
- Document residual unsupported Meta cases and rollout constraints.

## Ordered Task Board

- [x] `MOBO-001` Create sprint artifact and lock planning scope.
  Dependency: none
  Acceptance criteria:
  - Sprint doc exists in `docs/sprints`.
  - Scope is limited to Meta OBO client access fulfillment and related truthfulness gaps.
  - Task IDs are stable and dependency-ordered.

- [x] `MOBO-010` Define additive Meta OBO metadata contract and shared requirement map.
  Dependency: `MOBO-001`
  Acceptance criteria:
  - Document the metadata shape used for Meta discovery, selection, OBO state, grant results, and verification state.
  - Identify any shared type additions needed in `@agency-platform/shared`.
  - Update `docs/sprints/mvp-requirement-mapping.md` with this sprint’s requirement-to-task mapping.

- [x] `MOBO-011` Add failing backend tests for the Meta OBO state machine.
  Dependency: `MOBO-010`
  Acceptance criteria:
  - Tests cover managed-business relationship creation.
  - Tests cover client-BM system-user token acquisition and metadata persistence.
  - Tests cover token-read audit logging for OBO steps.
  - Tests fail before implementation changes.

- [x] `MOBO-020` Refactor client Meta business and asset discovery to be business-scoped.
  Dependency: `MOBO-010`
  Acceptance criteria:
  - Client discovery no longer relies only on `/me/adaccounts` and `/me/accounts`.
  - API can return client-selectable Business Portfolios and assets for a chosen client BM.
  - Discovery metadata distinguishes the selected client BM from the agency BM.
  - Existing ownership guards remain intact.

- [x] `MOBO-021` Add failing route/service tests for business-scoped asset discovery.
  Dependency: `MOBO-020`
  Acceptance criteria:
  - Tests cover portfolio list retrieval.
  - Tests cover asset retrieval for a selected client business.
  - Tests cover empty/unsupported cases without silent success.

- [x] `MOBO-030` Implement partner/client `managed_businesses` setup service.
  Dependency: `MOBO-011`
  Acceptance criteria:
  - Backend can create or confirm the OBO relationship using the correct token context.
  - OBO relationship state is persisted in connection metadata.
  - Audit logs capture OBO setup attempts and outcomes.

- [x] `MOBO-031` Implement client-BM system-user token generation and secure storage.
  Dependency: `MOBO-030`
  Acceptance criteria:
  - Backend obtains the client-BM system-user access token using the OBO flow.
  - Token is stored only in Infisical, with a secret reference in metadata.
  - System-user ID can be derived and persisted for later asset assignment.
  - Token access is audited.

- [x] `MOBO-032` Implement verified asset assignment for supported Meta asset types.
  Dependency: `MOBO-031`, `MOBO-020`
  Acceptance criteria:
  - Page assignment uses the documented `user` + `tasks` mutation shape.
  - Ad-account assignment uses the documented `user` + `tasks` mutation shape.
  - Unsupported or unverifiable asset types stay explicitly unresolved.
  - Assignment results are persisted with per-asset status and error details.

- [x] `MOBO-033` Implement post-assignment verification before fulfillment state changes.
  Dependency: `MOBO-032`
  Acceptance criteria:
  - Backend verifies the expected assigned-user state after mutation.
  - Request/product fulfillment only advances on verified success.
  - Partial success is represented explicitly in persisted metadata and response payloads.

- [x] `MOBO-034` Add backend support for verified manual Meta ad-account partner assignment.
  Dependency: `MOBO-033`
  Acceptance criteria:
  - Backend exposes the agency partner Business ID needed for manual Meta ad-account sharing.
  - Backend can persist selected ad accounts in a `waiting_for_manual_share` state.
  - Backend can re-check selected ad accounts and mark them `verified`, `failed`, or `unresolved` based on observed partner-assignment state.
  - Manual ad-account verification no longer relies on self-attested completion.

- [x] `MOBO-035` Quarantine automatic ad-account grant from the primary Meta client UX.
  Dependency: `MOBO-034`
  Acceptance criteria:
  - The frontend-facing Meta flow does not treat automatic ad-account OBO mutation as the primary path.
  - Automatic page grants remain supported where verified.
  - Manual ad-account verification becomes the primary advertised contract for Meta Ads.
  - Residual automated ad-account behavior is documented as experimental or internal-only if retained.

- [x] `MOBO-040` Add failing frontend tests for the revised Meta Step 2 flow.
  Dependency: `MOBO-010`, `MOBO-020`, `MOBO-034`
  Acceptance criteria:
  - Tests cover client Business Portfolio selection before asset selection.
  - Tests cover the hybrid model: automatic Facebook Pages plus manual Meta ad-account guidance.
  - Tests cover verified-success, partial-success, waiting, and unresolved-error states.
  - Tests cover removal of ad-account self-attestation as the source of completion.

- [x] `MOBO-041` Implement Meta invite UI for portfolio selection, automated grant, and truthful completion states.
  Dependency: `MOBO-040`, `MOBO-035`
  Acceptance criteria:
  - Meta Step 2 shows the selected client BM before loading/selecting assets.
  - UI supports automatic verified Facebook Page grants from the selected business.
  - UI shows Leadsie-style guided manual Meta ad-account partner-assignment steps using the agency Business ID.
  - UI renders verified result summaries from backend data, including `waiting` and `unresolved` states.
  - UI keeps semantic token usage and existing wizard layout patterns.
  - Desktop and mobile layouts remain intentional and readable.

- [x] `MOBO-042` Remove or quarantine the manual ad-account completion path.
  Dependency: `MOBO-041`
  Acceptance criteria:
  - The “mark complete” / self-attested completion button is removed from the primary path.
  - Fulfillment state is no longer updated solely from client self-attestation.
  - If any fallback remains, it is explicitly labeled as follow-up-needed rather than complete.

- [x] `MOBO-050` Add focused verification coverage for routes, services, and invite UI.
  Dependency: `MOBO-021`, `MOBO-033`, `MOBO-041`
  Acceptance criteria:
  - API tests cover OBO setup, token storage, asset assignment, and verification.
  - Web tests cover Meta invite progression and result rendering.
  - Typechecks for touched workspaces are included in the verification log.

- [x] `MOBO-051` Capture screenshot-polish evidence for Meta invite flow on desktop and mobile.
  Dependency: `MOBO-041`
  Acceptance criteria:
  - Screenshot evidence exists for portfolio selection, automated grant in-progress, verified success, and partial/unresolved states.
  - Evidence references are added to this sprint doc.
  - Any missing local runtime prerequisites are documented precisely.

- [ ] `MOBO-052` Final rollout and risk review.
  Dependency: `MOBO-050`, `MOBO-051`
  Acceptance criteria:
  - Sprint doc includes final verification results.
  - Residual unsupported Meta cases are listed explicitly.
  - Rollout guidance clarifies whether the feature should ship broadly or behind a controlled rollout.
  - Rollout review includes explicit go/no-go gates, monitoring signals, and rollback triggers.
  - Operational rollout instructions do not assume a hidden feature flag that does not exist.

## Verification Strategy

- Backend
  - `apps/api` connector/service/route tests for Meta OBO setup and asset assignment
  - `npm run typecheck --workspace=apps/api`
- Frontend
  - `apps/web` tests for Meta invite flow and result rendering
  - `npm run typecheck --workspace=apps/web`
- Evidence
  - Browser screenshots for desktop and mobile Meta invite states
  - Audit-log inspection for OBO/token-read events during local verification

## Verification Log

- 2026-03-11
  - `npm run build --workspace=packages/shared`
  - `npm run test:run --workspace=apps/api -- src/services/__tests__/meta-obo.service.test.ts`
  - `npm run typecheck --workspace=apps/api`
  - `npm run test:run --workspace=apps/api -- src/services/__tests__/client-assets.service.test.ts src/routes/client-auth/__tests__/assets.meta.test.ts`
  - `npm run test:run --workspace=apps/api -- src/services/__tests__/meta-system-user.service.test.ts src/services/__tests__/meta-assets.service.test.ts`
  - `npm run typecheck --workspace=apps/api`
  - `npm run test:run --workspace=apps/api -- src/routes/client-auth/__tests__/assets.meta.test.ts src/services/__tests__/meta-partner.service.test.ts`
  - `npm run typecheck --workspace=apps/api`
  - `npm run test:run --workspace=apps/api -- src/routes/client-auth/__tests__/assets.meta.test.ts`
  - `npm run typecheck --workspace=apps/api`
  - `npm run test:run --workspace=apps/web -- src/components/client-auth/__tests__/AutomaticPagesGrant.test.tsx src/components/client-auth/__tests__/AdAccountSharingInstructions.test.tsx`
  - `npm run test:run --workspace=apps/web -- src/components/client-auth/__tests__/MetaAssetSelector.test.tsx`
  - `npm run typecheck --workspace=apps/api`
  - `npm run typecheck --workspace=apps/web` (fails in unrelated evidence file: `apps/web/src/evidence/linkedin-page-support-preview.tsx` missing `accounts` on `PlatformProductConfig`)
  - `npm run test:run --workspace=apps/api -- src/routes/client-auth/__tests__/assets.meta.test.ts`
  - `npm run test:run --workspace=apps/web -- src/components/client-auth/__tests__/AutomaticPagesGrant.test.tsx src/components/client-auth/__tests__/AdAccountSharingInstructions.test.tsx src/components/client-auth/__tests__/MetaAssetSelector.test.tsx src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  - `npm run typecheck --workspace=apps/api`
  - `npm run typecheck --workspace=apps/web` (still fails in unrelated evidence file: `apps/web/src/evidence/linkedin-page-support-preview.tsx` missing `accounts` on `PlatformProductConfig`)
  - `npm run test:run --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  - `npm run test:run --workspace=apps/web -- src/components/client-auth/__tests__/AutomaticPagesGrant.test.tsx src/components/client-auth/__tests__/AdAccountSharingInstructions.test.tsx src/components/client-auth/__tests__/MetaAssetSelector.test.tsx`
  - `npm run typecheck --workspace=apps/web` (still fails in unrelated evidence file: `apps/web/src/evidence/linkedin-page-support-preview.tsx` missing `accounts` on `PlatformProductConfig`)
  - `npm run test:run --workspace=apps/api -- src/routes/client-auth/__tests__/assets.meta.test.ts`
  - `npm run typecheck --workspace=apps/api`
  - `npm run test:run --workspace=apps/api -- src/services/__tests__/meta-obo.service.test.ts src/services/__tests__/meta-system-user.service.test.ts src/services/__tests__/meta-assets.service.test.ts src/services/__tests__/meta-partner.service.test.ts src/services/__tests__/client-assets.service.test.ts src/routes/client-auth/__tests__/assets.meta.test.ts`
  - `npm run test:run --workspace=apps/web -- src/components/client-auth/__tests__/AutomaticPagesGrant.test.tsx src/components/client-auth/__tests__/AdAccountSharingInstructions.test.tsx src/components/client-auth/__tests__/MetaAssetSelector.test.tsx src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  - `npm run typecheck --workspace=apps/api`
  - `npm run typecheck --workspace=apps/web`
  - `npm run evidence:meta-invite --workspace=apps/web`
    Result: passed; saved eight screenshots under `docs/images/meta-obo-client-access/2026-03-11`
    Local prerequisite note: Playwright browsers must be installed for `apps/web`; when `EVIDENCE_BASE_URL` is unset, the script auto-starts the Vite evidence preview on `http://127.0.0.1:4174`
  - `npm run test:run --workspace=apps/web -- src/components/client-auth/__tests__/AutomaticPagesGrant.test.tsx src/components/client-auth/__tests__/AdAccountSharingInstructions.test.tsx src/components/client-auth/__tests__/MetaAssetSelector.test.tsx src/components/client-auth/__tests__/MetaAssetSelector.interaction.test.tsx src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx src/components/ui/__tests__/multi-select-combobox.test.tsx`
  - `npm run typecheck --workspace=apps/web`

## Evidence Artifacts

- Meta invite evidence captured 2026-03-11 under `docs/images/meta-obo-client-access/2026-03-11`
  - `desktop-light-meta-portfolio-selection.png`
  - `mobile-light-meta-portfolio-selection.png`
  - `desktop-light-meta-grant-in-progress.png`
  - `mobile-light-meta-grant-in-progress.png`
  - `desktop-light-meta-verified-success.png`
  - `mobile-light-meta-verified-success.png`
  - `desktop-light-meta-partial-follow-up.png`
  - `mobile-light-meta-partial-follow-up.png`

## MOBO-052 Execution Plan

### Ship Recommendation

- Default recommendation: controlled rollout first, not immediate broad release.
- Reason:
  - Core API/web verification is complete and screenshot evidence is in place.
  - The remaining risk is not local correctness drift; it is real-world Meta environment variance around OBO prerequisites, partner/client BM state, and manual ad-account sharing behavior.
  - There is no explicit code-level feature flag for this flow in the current implementation, so “controlled rollout” must be operational and cohort-based.

### Residual Unsupported or Follow-Up-Only Cases

- Instagram account automation remains unsupported and must continue rendering as unresolved follow-up work.
- Dataset / pixel partner assignment remains out of scope for this sprint and must not be implied as fulfilled.
- Meta ad-account completion remains user-triggered verification through the manual “Check access” path; it is not background-polled.
- Environment-specific Meta advanced-access or Business Manager eligibility failures may still block OBO setup even when local tests pass.
- Existing invites/connections with pre-OBO metadata may still surface mixed historical state; additive metadata handling reduces risk but does not eliminate legacy-data variance.

### Rollout Stages

1. Internal validation cohort
   - Use one or two agency-owned test requests with known-good Meta Business Portfolios.
   - Verify the full hybrid path against live Meta:
     - client business selection
     - automatic page grant
     - manual ad-account partner assignment
     - partial/unresolved confirmation messaging
   - Inspect audit logs for:
     - `META_OBO_TOKEN_READ`
     - `META_TOKEN_READ`
     - `META_ASSET_ACCESS_VERIFIED`
     - `META_MANUAL_AD_ACCOUNT_SHARE_STARTED`
     - `META_MANUAL_AD_ACCOUNT_SHARE_VERIFIED`

2. Small production cohort
   - Enable usage only for a small set of agencies who already have:
     - agency Meta Business Portfolio connected
     - `partnerAdminSystemUserTokenSecretId` provisioned
   - Communicate the current scope explicitly:
     - Pages are automatic and verified
     - Ad accounts require manual partner assignment plus verification
     - Instagram and datasets are follow-up work, not automated fulfillment

3. Broad rollout review
   - Promote from controlled cohort only if the internal and small-cohort runs show:
     - no false-success completion states
     - acceptable unresolved rates for supported asset classes
     - no repeated OBO setup/token-read failures caused by missing agency prerequisites

### Go / No-Go Gates

- Go only if:
  - all commands in the verification log remain green on the release branch
  - screenshot artifacts remain representative of the current shipped UI
  - at least one live end-to-end Meta request has completed with verified page fulfillment and truthful ad-account follow-up behavior
  - support/internal stakeholders understand the unsupported scope: Instagram, datasets/pixels

- No-go if:
  - live OBO setup fails for otherwise valid agency/client Meta configurations
  - page-only success can still incorrectly imply full Meta completion
  - manual ad-account verification produces confusing or misleading final-state messaging
  - audit logs are missing token-read or verification events required for incident diagnosis

### Monitoring Signals After Release

- Monitor audit-log volume and failure patterns for:
  - `META_OBO_TOKEN_READ`
  - `META_TOKEN_READ`
  - `META_ASSET_ACCESS_VERIFIED`
  - `META_MANUAL_AD_ACCOUNT_SHARE_VERIFIED`
- Watch for repeated error families:
  - agency Meta setup missing prerequisites
  - invalid or unavailable selected client business
  - OBO relationship creation failure
  - client system-user provisioning failure
  - page verification failure after mutation
  - manual ad-account verification staying unresolved unexpectedly
- Review support feedback for two product-truth risks:
  - clients expecting Instagram automation
  - agencies expecting datasets/pixels inside the same flow

### Rollback Guidance

- Immediate rollback trigger:
  - verified false-positive completion
  - severe production-only OBO failures across otherwise valid Meta setups
  - widespread inability to save or verify Meta selections in Step 2
- Operational rollback path:
  - pause broad customer communication and restrict usage to the internal cohort
  - direct agencies back to manual Meta onboarding instructions if needed
  - if code rollback is required, revert the Meta invite/UI changes and OBO route integration together rather than partially restoring self-attestation paths
- Non-goal during rollback:
  - do not restore `/grant-pages-access` or `/ad-accounts-shared` as active completion mechanisms; those routes should remain disabled

## Risks and Mitigations

- Risk: Meta OBO endpoints may have environment-specific prerequisites or advanced-access gating not satisfied in every dev environment.
  Mitigation:
  - Implement explicit error-code handling and preserve unresolved states instead of false success.
  - Keep OBO setup and assignment results separately visible in metadata/UI.

- Risk: Some Meta asset classes may still require manual handling or have inconsistent partner semantics.
  Mitigation:
  - Limit automated “completed” state to verified supported asset types.
  - Mark unsupported asset classes as unresolved with concrete follow-up messaging.

- Risk: Existing client connections may have mixed metadata from the old manual flow.
  Mitigation:
  - Use additive metadata keys under a dedicated Meta namespace.
  - Keep migration/refactor logic behavior-preserving for untouched connections.

- Risk: Invite-flow complexity can create regressions across mobile and callback continuity.
  Mitigation:
  - Add focused frontend tests before implementation.
  - Require screenshot evidence for the affected states.

## Open Questions

1. Do we want the manual ad-account verification check to be user-triggered (“Check access”) or background-polled after the guide starts?
2. Should dataset / pixel partner assignment become a follow-on sprint, or remain explicitly unsupported in the Meta Ads first pass?
3. Should any internal-only automatic ad-account OBO mutation remain callable for debugging, or be fully hidden during rollout?

## Review Findings Queue

- Resolved 2026-03-11: `grant-meta-access` now merges subset verification results into the persisted Meta OBO state instead of replacing unrelated asset classes, and preserves page/ad-account access booleans across page-only retries. See `apps/api/src/routes/client-auth/assets.routes.ts`.
- Resolved 2026-03-11: manual ad-account verification now treats `partial` as a completable wizard state and carries truthful follow-up messaging into the Meta confirmation step. See `apps/web/src/components/client-auth/AdAccountSharingInstructions.tsx` and `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`.
- Resolved 2026-03-11: the Meta asset selector now preserves the active client business ID on refresh/create flows and exposes a real `Switch business` control instead of dead guidance copy. See `apps/web/src/components/client-auth/MetaAssetSelector.tsx`.
- Resolved 2026-03-11: the Meta confirmation step now renders explicit follow-up lines for unresolved manual ad-account verification results and unsupported Instagram selections instead of implying full completion. See `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`.
- Resolved 2026-03-11: legacy Meta backend endpoints `/grant-pages-access` and `/ad-accounts-shared` now return explicit `LEGACY_META_ROUTE_DISABLED` errors instead of mutating fulfillment state, so stale callers can no longer self-attest Meta completion. See `apps/api/src/routes/client-auth/assets.routes.ts`.
- Resolved 2026-03-11: focused Meta verification coverage now includes the manual-share waiting state in the invite UI, and the web workspace typecheck is clean again after aligning evidence fixtures with the shared `PlatformProductConfig` contract. See `apps/web/src/components/client-auth/__tests__/AdAccountSharingInstructions.test.tsx` and `apps/web/src/evidence/linkedin-page-support-preview.tsx`.
- Resolved 2026-03-11: portalized option clicks in `MultiSelectCombobox` now remain inside the component, so browser-driven asset selection works correctly in Meta Step 2 and other multi-select surfaces. See `apps/web/src/components/ui/multi-select-combobox.tsx` and `apps/web/src/components/ui/__tests__/multi-select-combobox.test.tsx`.
- Resolved 2026-03-11: `MetaAssetSelector` no longer short-circuits `onSelectionChange` when analytics debouncing is active, restoring the Step 2 “Save selected accounts” CTA after real asset selection. See `apps/web/src/components/client-auth/MetaAssetSelector.tsx` and `apps/web/src/components/client-auth/__tests__/MetaAssetSelector.interaction.test.tsx`.
- The primary Meta UI now supports explicit client Business Portfolio selection inside the asset selector and uses verified page-only automation plus manual ad-account verification endpoints. Remaining sprint work is concentrated on rollout readiness under `MOBO-052` onward.
- Instagram account automation remains intentionally unresolved in the backend. The frontend must present those results as unresolved follow-up work instead of implying verified completion.
- Dataset / pixel partner assignment appears in competitor flows, but this sprint currently has no product-approved dataset scope. Rollout notes must call that out explicitly if it remains unsupported.
