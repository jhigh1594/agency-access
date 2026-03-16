# Sprint: Google Native Access Parity

- Date: 2026-03-15
- Status: Planned
- Owners: API + Web
- Scope: Expand Google support from grouped OAuth discovery into a full multi-product Google access platform across every Google product currently supported in the repo: Google Ads, GA4, Business Profile, Tag Manager, Search Console, and Merchant Center. The target is to automate native Google grants wherever the official APIs support durable access management, while keeping the current grouped Google OAuth flow as the discovery/orchestration backbone rather than the durable access outcome.
- Discovery input:
  - Local competitive baseline: [`docs/research-report-agencyaccess-competitor-2026-02-27.md`](/Users/jhigh/agency-access-platform/docs/research-report-agencyaccess-competitor-2026-02-27.md)
  - Existing Google truthfulness work: [`docs/solutions/google-authorization-fulfillment-truthfulness.md`](/Users/jhigh/agency-access-platform/docs/solutions/google-authorization-fulfillment-truthfulness.md)
  - Existing Google planning/history:
    - [`docs/sprints/2026-03-10-google-post-oauth-account-selection.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-google-post-oauth-account-selection.md)
    - [`docs/sprints/2026-03-10-google-account-discovery-hardening.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-google-account-discovery-hardening.md)
    - [`docs/google-ads-api-integration.md`](/Users/jhigh/agency-access-platform/docs/google-ads-api-integration.md)
  - Current implementation points:
    - `apps/api/src/routes/client-auth/oauth-state.routes.ts`
    - `apps/api/src/routes/client-auth/oauth-exchange.routes.ts`
    - `apps/api/src/routes/client-auth/assets.routes.ts`
    - `apps/api/src/services/connectors/google.ts`
    - `apps/api/src/services/connectors/google-ads.ts`
    - `apps/api/src/services/connectors/ga4.ts`
    - `apps/api/src/services/authorization-verification.service.ts`
    - `apps/api/prisma/schema.prisma`
    - `packages/shared/src/types.ts`
    - `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
    - `apps/web/src/components/client-auth/GoogleAssetSelector.tsx`
    - `apps/web/src/components/google-unified-settings.tsx`

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared TypeScript contracts in `@agency-platform/shared`
- Tailwind through existing semantic invite/admin tokens and repo-owned UI primitives
- Infisical-backed secret storage for OAuth tokens
- BullMQ-backed async verification/job execution

Adaptation note for planning requirements:
- “Reusable Phlex primitives/variants” maps here to reusable React invite/admin primitives plus shared API grant-state helpers.
- Token-system work is limited to keeping new Google pending / accepted / partial / follow-up states on existing semantic tokens rather than inventing a new visual system.
- Screenshot-polish verification applies to:
  - agency Google settings
  - client invite Google step
  - agency request detail / connections surfaces
  - desktop and mobile shells

## External Research Decision

Targeted external research is required before implementation because Google native-access automation has material platform/API risk and the supported Google products do not share a single access-management model.

Research outcomes locked for this sprint:
- Google Ads manager-account linking is API-supported through `CustomerClientLinkService` and `CustomerManagerLinkService`.
  Source: https://developers.google.com/google-ads/api/docs/account-management/linking-manager-accounts
- Google Ads direct user invitations are API-supported through `CustomerUserAccessInvitationService`.
  Source: https://developers.google.com/google-ads/api/docs/account-management/managing-invitations
- GA4 native user grants are API-supported through Analytics Admin API `accessBindings.create`.
  Sources:
  - https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/accounts.accessBindings/create
  - https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties.accessBindings/create
- Google Business Profile native admin management is API-supported through Business Profile Account Management admin resources.
  Sources:
  - https://developers.google.com/my-business/content/manage-admins
  - https://developers.google.com/my-business/reference/accountmanagement/rest
- Google Tag Manager native user-permission management is API-supported through Tag Manager API v2 `accounts.user_permissions`.
  Sources:
  - https://developers.google.com/tag-platform/tag-manager/api/v2/authorization
  - https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.user_permissions
- Merchant Center native account-user management is API-supported through Merchant API `accounts.users`, with optional provider/service relationship support through `accounts.relationships`.
  Sources:
  - https://developers.google.com/merchant/api/guides/accounts/control-access
  - https://developers.google.com/merchant/api/reference/rest/accounts_v1beta/accounts.users
  - https://developers.google.com/merchant/api/guides/accounts/relationships
- Search Console discovery and permission inspection are API-supported, but an equivalent native user-invite automation surface was not confirmed in the official docs. Search Console may require a different ownership/verification model rather than parity with Ads/GA4-style grant creation.
  Sources:
  - https://developers.google.com/webmaster-tools/
  - https://developers.google.com/webmaster-tools/v1/sites
  - https://developers.google.com/site-verification/v1/getting_started
- Leadsie publicly states Google Ads supports either manager-account / MCC or individual-user access and recommends MCC.
  Sources:
  - https://www.leadsie.com/automate-access/google-ads
  - https://help.leadsie.com/article/33-how-can-i-get-access-to-google-assets
- AgencyAccess publicly claims official platform APIs/flows and durable access, and current production evidence captured by the user confirms automated native Google Ads user invites.
  Sources:
  - https://www.agencyaccess.co/
  - user-provided Google Ads screenshots from this planning session

Implementation-time unknowns that still require verification in code review and test accounts:
1. Whether GA4 `accessBindings.create` emits a Google email/invite notification or grants immediately without recipient acceptance.
2. Whether Business Profile admin creation and Merchant Center user creation have propagation/acceptance states that must be modeled like Ads invites instead of immediate grants.
3. Whether Search Console should remain discovery-only in the first native-access slice, or use Site Verification ownership flows for selected use cases.
4. Whether AgencyAccess automates GA4 through native access bindings, user invites in the UI, or a different hybrid path.
5. Whether Google Ads developer-token access tier or manager-account hierarchy restrictions require additional onboarding checks before enabling MCC automation for all agencies.

## Product Decision Log (Locked)

1. Google parity is a hybrid model, not OAuth-only.
   - OAuth remains for discovery, asset selection, and orchestration authority.
   - Durable fulfillment must live inside Google wherever Google supports it.
2. Supported Google products split into two capability tiers:
   - `native_grant_supported`: `google_ads`, `ga4`, `google_business_profile`, `google_tag_manager`, `google_merchant_center`
   - `discovery_or_verification_only`: `google_search_console` unless official invite-grade automation is confirmed
3. `google_ads` must support two native fulfillment modes:
   - `manager_link`
   - `user_invite`
4. `ga4` must support a native fulfillment mode:
   - `access_binding`
5. `google_business_profile` must support native admin grants:
   - account admin
   - location admin
6. `google_tag_manager` must support native user-permission grants.
7. `google_merchant_center` must support native user grants first, with provider/service relationship automation evaluated as a follow-up slice.
8. `google_search_console` must remain truthful if it cannot use the same native grant model.
   - The first slice may treat it as discovery/verification only.
   - The product must not imply native invite automation unless the official API supports it.
9. The agency-side default for Google Ads should prefer `manager_link` when the agency has configured an eligible MCC/manager account.
   - If no eligible manager account is configured, fall back to `user_invite`.
10. The client-facing happy path should require no manual Google UI walkthroughs beyond Google’s own native approval steps.
   - For Google Ads `user_invite`, the agency recipient may still need to accept the Google invitation.
   - For Google Ads `manager_link`, the client-side Google account must still accept the link when Google requires acceptance.
   - For GA4, Business Profile, GTM, and Merchant Center, the product should model whether the Google API creates immediate access or a pending state.
   - The product should automate grant creation and surface any remaining native Google step truthfully.
11. Completion semantics must be per product, not just platform-group-level.
   - `google_ads` is fulfilled when the requested native grant is verified active.
   - `ga4` is fulfilled when the required access binding exists with the correct role.
   - `google_business_profile`, `google_tag_manager`, and `google_merchant_center` are fulfilled when the exact requested native grant exists with the correct scope/role.
   - `google_search_console` is fulfilled only by the explicit mode chosen for that product; grouped OAuth success alone is never enough.
12. Existing OAuth-driven Google discovery remains in place during rollout.
   - This sprint adds native grant orchestration and exact verification on top of the current discovery flow.
13. Security requirements remain non-negotiable.
   - OAuth tokens stay in Infisical only.
   - Native grant mutations and token reads must be audit logged.
   - No client credentials or OAuth secrets are stored in PostgreSQL.
14. If a requested native grant cannot be executed automatically, the system must degrade truthfully to `follow_up_needed` rather than claim `completed`.

## Architecture Approach

1. Introduce first-class Google grant concepts in shared contracts.
   - Add grant-mode, grant-status, capability-tier, and per-asset verification-state enums/types in `packages/shared`.
   - Keep existing grouped Google OAuth contracts additive and backward-compatible.
2. Add a dedicated persistence model for native Google grant lifecycle.
   - Use a new Prisma table rather than overloading `clientConnection.grantedAssets` JSON or `platformAuthorization.metadata`.
   - Store one row per requested Google asset grant with:
     - connection ID
     - product (`google_ads`, `ga4`, `google_business_profile`, `google_tag_manager`, `google_search_console`, `google_merchant_center`)
     - asset ID / display name
     - grant mode
     - requested role
     - recipient email or manager customer ID
     - provider resource name / external IDs
     - native grant state
     - verification timestamps / error codes / metadata
3. Extend agency Google configuration so the system knows which native modes are available.
   - Persist manager-account identifiers, invite-capable email identities, and per-product management capability on the agency Google connection.
   - Allow an agency-level default for `manager_link` vs `user_invite` where multiple modes exist.
4. Introduce a Google native-access orchestration layer in the API.
   - Planning step: determine requested assets + applicable grant mode per asset.
   - Execution step: create native grants using the correct Google API.
   - Reconciliation step: poll/verify exact final grant state and update lifecycle records.
5. Split Google native execution by product and grant mode:
   - `google-ads-user-invite.service`
   - `google-ads-manager-link.service`
   - `ga4-access-binding.service`
   - `google-business-profile-admin-grant.service`
   - `google-tag-manager-user-permission.service`
   - `google-merchant-center-user-grant.service`
   - `google-search-console-fulfillment.service` for discovery-only or ownership-based handling
6. Add product-specific capability rules rather than one shared Google-native write path.
   - Ads uses Google Ads API services.
   - GA4 uses Analytics Admin API access bindings.
   - Business Profile uses admin resources.
   - Tag Manager uses `accounts.user_permissions`.
   - Merchant Center uses `accounts.users` first.
   - Search Console may use verification/ownership flows or remain non-automated.
7. Add a Google scope planner so grouped OAuth requests only escalate scopes when a requested product truly needs native management.
   - Existing discovery scopes remain the minimum baseline.
   - Native management scopes are additive and product-specific.
8. Centralize fulfillment evaluation in the service layer.
   - Access requests resolve `completed`, `partial`, or `follow_up_needed` from exact per-asset grant state rather than from OAuth presence alone.
9. Keep async work off the request path.
   - Native grant creation, delayed status polling, and reconciliation should run in BullMQ jobs.
10. Expose truthful state to both client and agency surfaces.
   - Client sees: connecting, request sent, waiting on Google acceptance, fulfilled, failed.
   - Agency sees: which mode was used, who must accept, exact pending items, and what can be retried.

## Milestones

### Milestone 1: Contract Lock + Research Closure
- `GNAP-001`, `GNAP-002`, `GNAP-010`, `GNAP-011`, `GNAP-012`, `GNAP-013`

### Milestone 2: Red Tests + Schema
- `GNAP-020`, `GNAP-021`, `GNAP-022`, `GNAP-023`, `GNAP-024`, `GNAP-025`, `GNAP-026`, `GNAP-030`, `GNAP-031`

### Milestone 3: Agency Configuration + Core Orchestration
- `GNAP-032`, `GNAP-033`, `GNAP-040`

### Milestone 4: Product-Specific Grant Engines + Exact Verification
- `GNAP-041`, `GNAP-042`, `GNAP-043`, `GNAP-044`, `GNAP-045`, `GNAP-046`, `GNAP-047`, `GNAP-048`, `GNAP-049`

### Milestone 5: UX, Rollout, and Evidence
- `GNAP-050`, `GNAP-051`, `GNAP-052`, `GNAP-053`

## Ordered Task Board

- [ ] `GNAP-001` Create sprint artifact for Google native access parity.
  Dependency: none
  Acceptance criteria:
  - Sprint doc locks hybrid Google architecture, milestones, verification strategy, and risks.
  - The doc explicitly distinguishes OAuth discovery from durable Google-native access.

- [ ] `GNAP-002` Refresh [`docs/sprints/mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md) for this sprint.
  Dependency: `GNAP-001`
  Acceptance criteria:
  - Requirement mapping includes stable `GNAP-*` task IDs.
  - Requirements distinguish Google product capability tiers instead of collapsing all Google work into Ads/GA4.

- [ ] `GNAP-010` Lock the Google hybrid fulfillment contract across products and grant modes.
  Dependency: `GNAP-001`
  Acceptance criteria:
  - Supported grant modes are explicit for each product.
  - Product-level completion rules are defined before implementation.
  - The contract defines who must accept native Google steps for each mode.

- [ ] `GNAP-011` Close external Google API unknowns that affect implementation viability.
  Dependency: `GNAP-001`
  Acceptance criteria:
  - Official Google Ads, GA4, Business Profile, GTM, Search Console, and Merchant workflows are confirmed against current docs.
  - Remaining unknowns are narrowed to implementation-time validation, not architecture-level uncertainty.
  - Any API-scope or developer-token prerequisites are documented in this sprint doc.

- [ ] `GNAP-012` Lock persistence and rollout strategy for additive delivery.
  Dependency: `GNAP-010`, `GNAP-011`
  Acceptance criteria:
  - The plan chooses a dedicated native-grant persistence model instead of extending ad hoc JSON fields.
  - Feature-flag boundaries for rollout are explicit.
  - Existing grouped Google OAuth flow remains backward-compatible while native grants roll out.

- [x] `GNAP-013` Lock per-product capability tiers and scope-escalation rules for the grouped Google OAuth flow.
  Dependency: `GNAP-010`, `GNAP-011`
  Acceptance criteria:
  - Each supported Google product is classified as `native_grant_supported` or `discovery_only`.
  - Required discovery scopes and management scopes are explicit per product.
  - The plan documents why Search Console is treated differently if native invite automation remains unsupported.

- [x] `GNAP-020` Add failing shared/API tests for Google grant planning and product-level fulfillment.
  Dependency: `GNAP-010`, `GNAP-012`
  Acceptance criteria:
  - Tests prove grouped Google OAuth alone does not fulfill native-grant-supported products.
  - Tests prove per-asset native states drive final request status.
  - Tests prove unsupported automation paths cannot be falsely marked complete.

- [ ] `GNAP-021` Add failing Google Ads tests for automated direct-user invites.
  Dependency: `GNAP-010`, `GNAP-011`
  Acceptance criteria:
  - Tests cover invitation creation, pending status persistence, retry behavior, revoke behavior, and post-acceptance verification.
  - Role mapping to Google Ads access roles is explicit and tested.

- [ ] `GNAP-022` Add failing Google Ads tests for automated manager-account linking.
  Dependency: `GNAP-010`, `GNAP-011`
  Acceptance criteria:
  - Tests cover pending link creation, manager link ID lookup, acceptance verification, and termination/retry logic.
  - MCC hierarchy prerequisites and failure states are covered.

- [ ] `GNAP-023` Add failing GA4 tests for native access-binding creation and verification.
  Dependency: `GNAP-010`, `GNAP-011`
  Acceptance criteria:
  - Tests cover account/property role mapping, `accessBindings.create`, readback verification, and revoke/update flows.
  - Unclear Google notification behavior is represented as a documented verification gap rather than an untested assumption.

- [ ] `GNAP-024` Add failing tests for Google Business Profile native admin grants.
  Dependency: `GNAP-010`, `GNAP-011`
  Acceptance criteria:
  - Tests cover account-vs-location grant planning, admin creation, verification, and revoke/update behavior.
  - The product-level role mapping is explicit and tested.

- [ ] `GNAP-025` Add failing tests for Google Tag Manager user-permission grants.
  Dependency: `GNAP-010`, `GNAP-011`
  Acceptance criteria:
  - Tests cover container/account discovery assumptions, user-permission creation, verification, and revoke/update behavior.
  - Required write scopes are verified in planner tests.

- [ ] `GNAP-026` Add failing tests for Merchant Center user grants and Search Console capability boundaries.
  Dependency: `GNAP-010`, `GNAP-011`, `GNAP-013`
  Acceptance criteria:
  - Merchant Center tests cover account-user creation, verification, and revoke/update behavior.
  - Search Console tests cover truthful non-automation behavior if invite-grade API support is unavailable.
  - Capability planner tests prevent unsupported Search Console native-grant attempts.

- [x] `GNAP-030` Add shared types and additive API contracts for Google native grant lifecycle.
  Dependency: `GNAP-020`
  Acceptance criteria:
  - `packages/shared` exports grant-mode, grant-status, capability-tier, and product-fulfillment detail needed by API and web.
  - Existing request-progress consumers remain valid through additive fields.

- [x] `GNAP-031` Add Prisma schema and repository support for per-asset native Google grants.
  Dependency: `GNAP-012`, `GNAP-020`
  Acceptance criteria:
  - Prisma schema introduces a durable per-asset grant model with indexes suited for reconciliation jobs and request-detail reads.
  - Migration/backfill impact is documented.
  - Existing access-request and connection models remain compatible.

- [ ] `GNAP-032` Implement agency Google settings for manager accounts, invite identities, and per-product management capability.
  Dependency: `GNAP-030`, `GNAP-031`
  Acceptance criteria:
  - Agency-side Google settings can persist manager customer ID, invite email, and preferred mode where applicable.
  - Validation prevents impossible configurations from being selected as defaults.
  - Existing Google connection health UI remains intact.

- [ ] `GNAP-033` Implement grouped Google scope planning for discovery vs native-management features.
  Dependency: `GNAP-013`, `GNAP-030`
  Acceptance criteria:
  - Scope resolution requests only the Google scopes needed for the requested products and selected native-management capabilities.
  - Existing grouped OAuth behavior remains backward-compatible for current discovery-only requests.
  - Management-only scopes are not requested when they are not needed.

- [ ] `GNAP-040` Implement the Google native access orchestrator and queue-backed lifecycle.
  Dependency: `GNAP-030`, `GNAP-031`, `GNAP-032`, `GNAP-033`
  Acceptance criteria:
  - Orchestration plans grants per selected asset and enqueues native grant jobs.
  - Re-runs are idempotent at the per-asset level.
  - The orchestrator never marks fulfillment complete before verification.

- [ ] `GNAP-041` Implement automated Google Ads direct-user invitation execution.
  Dependency: `GNAP-021`, `GNAP-040`
  Acceptance criteria:
  - The service creates `CustomerUserAccessInvitation` records through the Google Ads API.
  - Pending invitations are persisted with provider IDs/resource names.
  - Agency request-detail surfaces can show that the invite is awaiting agency-user acceptance when applicable.

- [ ] `GNAP-042` Implement automated Google Ads manager-account linking execution.
  Dependency: `GNAP-022`, `GNAP-040`
  Acceptance criteria:
  - The service creates `CustomerClientLink` invitations from the agency manager account.
  - Verification can prove when the client account has accepted and the link is active.
  - MCC mode can be selected as the default and fall back safely when preconditions are not met.

- [ ] `GNAP-043` Implement GA4 native access-binding execution.
  Dependency: `GNAP-023`, `GNAP-040`
  Acceptance criteria:
  - The service creates and verifies GA4 access bindings on the correct account or property scope.
  - Product-level roles map cleanly from requested access levels.
  - Follow-up states are truthful if Google-side acceptance or propagation is delayed.

- [ ] `GNAP-044` Implement Google Business Profile native admin grants.
  Dependency: `GNAP-024`, `GNAP-040`
  Acceptance criteria:
  - The service creates and verifies account/location admin grants through the official Business Profile admin resources.
  - Role/scoping behavior is explicit in code and UI.
  - Pending/propagation states are modeled truthfully if needed.

- [ ] `GNAP-045` Implement Google Tag Manager native user-permission grants.
  Dependency: `GNAP-025`, `GNAP-040`
  Acceptance criteria:
  - The service creates and verifies GTM user permissions on the correct account scope.
  - Requested access levels map cleanly to GTM permissions.
  - Read-only Google Tag Manager discovery flows remain intact.

- [ ] `GNAP-046` Implement Merchant Center native user grants and settle provider-relationship deferral.
  Dependency: `GNAP-026`, `GNAP-040`
  Acceptance criteria:
  - The first slice uses `accounts.users` to create and verify Merchant Center user access.
  - Relationship-based provider/service flows are either explicitly deferred or separately planned with rationale.
  - Merchant-specific role mapping and revoke/update behavior are tested.

- [ ] `GNAP-047` Implement exact verification, Search Console truthful fulfillment handling, reconciliation jobs, and evaluator-driven completion semantics.
  Dependency: `GNAP-041`, `GNAP-042`, `GNAP-043`, `GNAP-044`, `GNAP-045`, `GNAP-046`
  Acceptance criteria:
  - Verification proves the specific asset has the requested native grant, not just “some Google access.”
  - Search Console products cannot be falsely marked complete from grouped OAuth alone.
  - `authorizationVerification.service` and request completion use exact per-asset state.
  - Delayed acceptance or propagation states can reconcile to success without manual DB intervention.

- [ ] `GNAP-048` Harden auditing, error handling, and retry controls for Google native grant mutations.
  Dependency: `GNAP-040`
  Acceptance criteria:
  - Every native grant mutation and token read is audit logged with action, actor, timestamp, and metadata.
  - Retry limits and exponential backoff are explicit for provider-side transient failures.
  - User-facing errors use the existing `{ error: { code, message } }` contract.

- [ ] `GNAP-049` Add reusable Google grant-state helpers and shared UI primitives for pending/fulfilled/follow-up rendering.
  Dependency: `GNAP-030`, `GNAP-047`
  Acceptance criteria:
  - Shared UI/status helpers cover all supported Google products without one-off per-product rendering logic exploding across the app.
  - New Google states remain on existing semantic tokens and component patterns.
  - Product-level copy differences remain configurable without duplicating structural UI.

- [ ] `GNAP-050` Update client invite and agency-facing UX for truthful multi-product Google native grant states.
  Dependency: `GNAP-032`, `GNAP-047`, `GNAP-049`
  Acceptance criteria:
  - The client Google step can explain what will happen for Ads, GA4, Business Profile, GTM, Search Console, and Merchant Center without exposing internal API jargon.
  - Agency request detail and connections views show per-asset mode, pending acceptance owner, capability boundary, and retry/follow-up state.
  - Desktop and mobile layouts remain coherent using current semantic tokens and component patterns.

- [ ] `GNAP-051` Update lifecycle webhooks, notifications, support copy, and docs for the hybrid Google model.
  Dependency: `GNAP-047`, `GNAP-050`
  Acceptance criteria:
  - Webhook payloads and notification templates distinguish `invite_sent`, `pending_acceptance`, `verified`, and `follow_up_needed`.
  - Marketing/product-support copy no longer implies OAuth alone equals durable Google access.
  - Support docs explain the difference between manager linking, user invites, native grants, and discovery-only Search Console handling.

- [ ] `GNAP-052` Capture browser evidence, focused regression tests, and relevant typechecks.
  Dependency: `GNAP-050`, `GNAP-051`
  Acceptance criteria:
  - Focused API and web tests covering each supported Google product path pass.
  - Relevant shared/api/web typechecks pass or unrelated blockers are documented precisely.
  - Desktop and mobile screenshots are captured for the required Google flows, including at least one discovery-only Search Console state.

- [ ] `GNAP-053` Roll out behind feature flags, document backfill/runbook needs, and record residual risks.
  Dependency: `GNAP-052`
  Acceptance criteria:
  - Rollout order is explicit: internal test accounts, limited agencies, then broader release.
  - Backfill strategy for existing OAuth-only Google connections is documented.
  - Residual platform limits and manual fallback triggers are captured in this sprint doc or a linked solution doc.

## Verification Strategy

1. API/service correctness
   - Unit and integration coverage for:
     - Google grant planning
     - Google Ads user invites
     - Google Ads manager linking
     - GA4 access bindings
     - Business Profile admin grants
     - GTM user-permission grants
     - Merchant Center user grants
     - Search Console truthful discovery-only handling
     - exact grant verification and completion semantics

2. Contract safety
   - Shared-type checks for additive request-progress and grant-state fields
   - Route/service tests preserving `{ data, error }` response contracts
   - Migration verification for new native-grant persistence model

3. Browser and UX evidence
   - Desktop and mobile screenshots for:
     - agency Google settings with manager/default-mode configuration
     - client invite Google step before and after native grant creation
     - agency request detail showing pending Google acceptance
     - completed Google Ads MCC-linked request
     - completed Google Ads user-invite request
     - completed or follow-up-needed GA4 request
     - completed or follow-up-needed Business Profile request
     - completed GTM permission-grant request
     - completed Merchant Center user-grant request
     - Search Console discovery-only / follow-up-needed request

4. Sandbox / live-provider validation
   - Confirm Google Ads user invites are generated and status is read back correctly
   - Confirm Google Ads manager links become active after client acceptance
   - Confirm GA4 access bindings create the expected access state and note whether Google sends a notification or grants immediately
   - Confirm Business Profile admin grants create the expected access state and whether Google emits email notifications
   - Confirm GTM user-permission creation and readback behavior
   - Confirm Merchant Center user grants create the expected access state and whether provider-relationship automation is needed later
   - Confirm Search Console official API limits before claiming native automation

5. Security and auditability
   - Verify OAuth tokens remain in Infisical only
   - Verify audit logs for token reads and native grant mutations
   - Verify no sensitive provider payloads leak to frontend or logs

## Risks and Mitigations

1. Google products do not share a single access-management model.
   Mitigation: treat every Google product as a separate capability path with separate grant modes, scopes, and verification rules.

2. AgencyAccess and Leadsie may differ on non-Ads Google products.
   Mitigation: target official Google-native durable access parity where supported, and truthful discovery/follow-up semantics where the official APIs do not expose equivalent invite automation.

3. Existing JSON-based grant tracking is too weak for native lifecycle management.
   Mitigation: introduce a dedicated per-asset native-grant persistence model early in the sprint.

4. Google acceptance can be delayed or handled by a different actor than the person who initiated the invite.
   Mitigation: model `pending_acceptance` explicitly and run reconciliation jobs instead of assuming immediate completion.

5. MCC mode can fail due to account hierarchy limits, missing manager configuration, or developer-token constraints.
   Mitigation: validate agency configuration up front, prefer MCC only when eligible, and fall back to user invites safely.

6. Search Console may not support the same native automation class as the other Google products.
   Mitigation: keep Search Console on a separate capability tier and do not promise native grant creation until official docs support it.

7. Marketing and product semantics can drift again if OAuth and native access are conflated.
   Mitigation: centralize completion and status evaluation in the service layer and update copy/webhooks in the same sprint.

## Open Questions To Close During Milestone 1

1. Should the first GA4 slice grant at the property level only, or support account-level grants in the same sprint?
   Recommended answer: property-level first, account-level later unless the user explicitly requests both.
2. Should Business Profile first slice grant at the location level only, or support account-level admins in the same sprint?
   Recommended answer: support both only if the role mapping is simple; otherwise location-level first.
3. Should Merchant Center first slice include provider/service relationships, or direct user grants only?
   Recommended answer: direct user grants first, provider/service relationships later unless there is a clear customer need already validated.
4. Should agencies be allowed to choose grant mode per request, or only per agency default in the first slice?
   Recommended answer: agency default plus automatic fallback first; per-request override can follow.
5. Do we expose Google-native grant retry controls in the UI immediately, or keep retries internal/admin-only in the first slice?
   Recommended answer: internal/admin retry first, user-facing retry later if needed.

## Planned Verification Commands

- `npm test --workspace=packages/shared -- src/__tests__/types.test.ts`
- `npm test --workspace=apps/api -- src/services/connectors/__tests__/google.connector.test.ts`
- `npm test --workspace=apps/api -- src/services/connectors/__tests__/google-native-access*.test.ts`
- `npm test --workspace=apps/api -- src/services/__tests__/authorization-verification.service.test.ts`
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.google.test.ts`
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/GoogleAssetSelector.test.tsx`
- `npm test --workspace=apps/web -- src/app/(authenticated)/connections/__tests__/page.test.tsx`
- `npm run typecheck --workspace=packages/shared`
- `npm run typecheck --workspace=apps/api`
- `npm run typecheck --workspace=apps/web`

## Review Findings

1. No change-specific planning defects were found in this review pass.

## Review Follow-up

1. Milestone 1 must confirm whether Search Console remains discovery-only before any product or marketing copy implies native grant automation.
2. Milestone 1 must confirm whether GA4, Business Profile, and Merchant Center create immediate access or pending acceptance states so fulfillment/status contracts do not guess.
3. Isolated API test runs now depend on rebuilding `packages/shared` when new runtime exports are added to `@agency-platform/shared`; if this becomes recurring friction, add a workspace-aware test/build guard.
4. `packages/shared/src/__tests__/types.test.ts` currently contains unrelated subscription-tier assertions for legacy `PRO` / `ENTERPRISE` values; keep that baseline failure separate from Google-native-access verification until the tier test suite is updated.
5. `apps/api/src/services/__tests__/access-request.service.test.ts` still contains an unrelated dashboard-summary failure about revoked/expired requests; keep that baseline red separate from Google native-fulfillment verification until the dashboard summary path is fixed.
6. `GNAP-031` introduces a new empty `google_native_grants` table with lazy row creation on future grant attempts, so no historical backfill is required for rollout.
