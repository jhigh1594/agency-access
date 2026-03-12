# Sprint: Meta Business Login JS SDK Cutover

- Date: 2026-03-11
- Status: Planned
- Owners: Web + API
- Scope: Replace the current agency Meta generic OAuth connect flow with Meta Business Login via the JavaScript SDK so Business Portfolio selection and refresh are driven by Meta's native business-login session model instead of incomplete post-auth Graph enumeration.
- Discovery input:
  - Prior sprint: [`docs/sprints/2026-03-11-meta-business-portfolio-modal.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-11-meta-business-portfolio-modal.md)
  - Current backend auth path:
    - `apps/api/src/services/connectors/meta.ts`
    - `apps/api/src/routes/agency-platforms/oauth.routes.ts`
    - `apps/api/src/routes/agency-platforms/assets.routes.ts`
  - Current frontend connect path:
    - `apps/web/src/app/onboarding/platforms/page.tsx`
    - `apps/web/src/app/(authenticated)/connections/page.tsx`
    - `apps/web/src/app/platforms/callback/page.tsx`
    - `apps/web/src/components/meta-business-portfolio-selector.tsx`
  - External signals:
    - Meta Business Manager API docs: https://developers.facebook.com/docs/business-management-apis/business-manager-api/
    - Meta Business Login configuration evidence (`config_id=1436589444014622`)
    - Leadsie network evidence showing Meta JS SDK traffic (`sdk=joey`, `/x/oauth/status`)

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify backend in `apps/api`
- Shared TypeScript types in `@agency-platform/shared`
- TanStack Query for authenticated frontend/server coordination
- Infisical-backed OAuth token storage; PostgreSQL stores secret references only

Adaptation note for workflow requirements:
- “Phlex primitives / Stimulus / Turbo” maps here to existing React components, route handlers, and TanStack Query orchestration.
- UI changes must preserve the current AuthHub design system and current Meta connection surfaces rather than introducing a parallel flow.

## Problem Statement

The current agency Meta connect flow assumes that after generic OAuth we can enumerate every accessible Business Portfolio using Graph edges such as `/me/businesses`, `/me/business_users`, and recursive `managed_businesses`. Production evidence shows that this assumption is false for the current Meta app/token context: the backend successfully returns only the primary portfolio (`Jon High`) while Leadsie shows a broader business picker for the same user session.

The strongest evidence is that Leadsie appears to use Meta Business Login through the JavaScript SDK, not a backend-only OAuth code flow. Their UI copy also treats portfolio refresh as “log in again,” implying the portfolio set is a login-time snapshot derived from Meta’s business-login session context.

## Product Decision Log (Locked)

1. Agency Meta business selection should be driven by Meta Business Login, not by trying to reconstruct Meta’s business switcher entirely via Graph after generic OAuth.
2. The source of truth for “available Business Portfolios” is the fresh Meta Business Login session/token payload returned during JS SDK login.
3. Backend Graph discovery remains useful for asset enumeration within the selected business, but it is not the primary mechanism for reconstructing the business picker.
4. The selected Business Portfolio remains persisted in AuthHub metadata so the product can render current state and support “Switch business.”
5. Meta tokens remain stored only in Infisical; frontend-obtained tokens must be exchanged/validated server-side before persistence.
6. The old `/agency-platforms/meta/initiate` redirect flow should be quarantined behind an explicit fallback once the JS SDK path is live.

## Architecture Approach

### 1. Frontend Business Login Launcher

Add a dedicated Meta Business Login client utility in `apps/web` that:
- loads the Meta JS SDK lazily on authenticated Meta connect surfaces,
- initializes the SDK with the Meta app ID,
- invokes Business Login using the Business Login configuration ID,
- requests a user access token flow appropriate for agency portfolio selection,
- returns the auth payload to the app without relying on the legacy backend redirect callback.

This should become the entrypoint for:
- first-time agency Meta connect on onboarding,
- reconnecting Meta,
- switching Business Portfolios from settings/manage-assets.

### 2. Backend Token Exchange + Connection Finalization

Introduce a backend route that accepts the JS SDK login payload and finalizes the Meta connection:
- validate a short-lived frontend-issued nonce/intention token so the exchange request is not free-floating,
- validate or introspect the Meta user token server-side,
- exchange the short-lived token for a long-lived token if Meta still requires that for this flow,
- store only the resulting token reference in Infisical,
- record the granted scopes and token metadata in `AgencyPlatformConnection.metadata`,
- fetch and persist the Business Portfolio snapshot associated with the fresh login context,
- create or update the agency Meta connection record atomically.

### 3. Business Portfolio Refresh Model

Replace “refresh=true Graph discovery” as the primary refresh mechanism for the portfolio dropdown with:
- current selected business from connection metadata,
- last login-time business snapshot from metadata,
- explicit “Log in again” / “Switch business” CTA that re-runs Business Login and refreshes the snapshot.

Graph refresh can remain as a secondary diagnostic/fallback path if we still need it, but not as the product’s primary promise for completeness.

### 4. Legacy Path Quarantine

The current Meta redirect callback flow in `apps/api/src/routes/agency-platforms/oauth.routes.ts` and `apps/web/src/app/platforms/callback/page.tsx` should remain temporarily available only as a controlled fallback. Once the JS SDK path is verified, the UI should stop using it for Meta.

## Verification Strategy

- Backend:
  - unit tests for Meta Business Login finalize route/token exchange
  - unit tests for scope persistence and metadata merge behavior
  - route tests for invalid nonce, invalid token, and successful finalize flows
- Frontend:
  - tests for JS SDK loader/launcher behavior
  - tests for onboarding/connections Meta button using JS SDK instead of redirect initiation
  - tests for “Switch business” and “Log in again” refreshing the portfolio snapshot
- Browser evidence:
  - desktop screenshots for onboarding connect, manage-assets current state, and switch-business state
  - mobile screenshots for the same surfaces if the JS SDK modal/business flow affects mobile
- Rollout:
  - one known-good internal Meta account with multiple portfolios
  - compare post-login snapshot against Leadsie-visible portfolio set for the same user

## Risks And Mitigations

- Risk: Meta JS SDK Business Login returns payload fields that differ from the current backend assumptions.
  - Mitigation: implement a dedicated finalize route with strict runtime validation and save raw diagnostic metadata temporarily where safe.

- Risk: Business Login still does not expose the broader portfolio set if app-level permissions/config remain insufficient.
  - Mitigation: persist token introspection results and granted scopes so we can distinguish product-flow failure from app-review/config failure.

- Risk: Exchanging frontend-obtained tokens weakens security posture.
  - Mitigation: backend-only token exchange, nonce validation, Infisical storage only, audit all token reads/writes.

- Risk: The current settings modal and onboarding page assume a redirect-based callback.
  - Mitigation: ship the JS SDK path behind a Meta-only branch first, keep the rest of the platform connection model unchanged.

- Risk: Browser popup/login blockers or SDK load failures degrade the connect experience.
  - Mitigation: provide retry guidance and controlled fallback messaging before keeping legacy redirect fallback.

## Ordered Task Board

- [ ] `MBL-001` Create sprint artifact and lock Business Login JS SDK scope.
  Dependency: none
  Acceptance criteria:
  - Sprint doc exists in `docs/sprints`.
  - Scope clearly supersedes “discover all portfolios via Graph” as the primary strategy.

- [x] `MBL-010` Add failing backend tests for Meta Business Login finalization contract.
  Dependency: `MBL-001`
  Acceptance criteria:
  - Route test proves backend rejects missing/invalid Meta login payload.
  - Route test proves backend stores a Meta connection from JS SDK login payload without exposing raw tokens in PostgreSQL.
  - Route test proves granted scopes/token metadata are persisted additively in connection metadata.

- [x] `MBL-011` Implement backend finalize route for Meta Business Login.
  Dependency: `MBL-010`
  Acceptance criteria:
  - New authenticated route finalizes Meta connections from JS SDK login payload.
  - Short-lived user token is validated/exchanged server-side and stored only in Infisical.
  - Token access/exchange events are audited.
  - Existing agency Meta connection is updated atomically instead of duplicating active records.

- [x] `MBL-012` Persist token introspection and business snapshot metadata.
  Dependency: `MBL-011`
  Acceptance criteria:
  - Connection metadata records granted scopes, token type, and data-access expiry where available.
  - Connection metadata stores the latest Business Portfolio snapshot from the login session.
  - A reduced portfolio result is diagnosable from stored metadata without logging raw tokens.

- [x] `MBL-020` Add failing frontend tests for Meta JS SDK launch flow.
  Dependency: `MBL-001`
  Acceptance criteria:
  - Onboarding Meta connect uses a JS SDK launcher instead of POST `/agency-platforms/meta/initiate`.
  - Connections/settings Meta reconnect uses the same launcher.
  - Failed SDK load and failed login flows surface actionable error copy.

- [x] `MBL-021` Implement shared Meta JS SDK loader and launcher.
  Dependency: `MBL-020`
  Acceptance criteria:
  - `apps/web` has a reusable Meta Business Login SDK utility for authenticated surfaces.
  - The utility accepts app/config IDs and returns the auth payload needed by the backend finalize route.
  - The implementation is isolated enough to mock in tests.

- [x] `MBL-022` Wire agency onboarding and connections Meta connect actions to Business Login.
  Dependency: `MBL-021`, `MBL-011`
  Acceptance criteria:
  - Onboarding page Meta connect path no longer redirects through the legacy Meta initiate route.
  - Connections page Meta reconnect path uses the same JS SDK flow.
  - Successful finalize invalidates the same platform connection queries the current flow uses.

- [x] `MBL-030` Replace dropdown completeness semantics with login-snapshot semantics.
  Dependency: `MBL-012`, `MBL-022`
  Acceptance criteria:
  - Manage-assets/business-selector surfaces render the stored selected business plus the latest login snapshot.
  - “Don’t see your Business Portfolio? Log in again” re-runs Business Login instead of only refetching Graph data.
  - “Switch business” is an explicit re-auth action, not just a local select refresh.

- [x] `MBL-031` Quarantine the legacy Meta redirect OAuth flow.
  Dependency: `MBL-022`
  Acceptance criteria:
  - UI no longer uses `/agency-platforms/meta/initiate` for the primary Meta flow.
  - Legacy callback route remains behind an explicit fallback path only if needed for rollback.
  - Sprint doc records the rollback mechanism.

- [x] `MBL-040` Add focused browser evidence and regression coverage.
  Dependency: `MBL-030`
  Acceptance criteria:
  - Desktop screenshots capture onboarding connect, settings selected business, and switch-business re-auth states.
  - Mobile screenshots capture the affected Meta connect surface if behavior differs materially.
  - Focused frontend tests cover login failure, finalize failure, and refresh/re-auth copy.

- [ ] `MBL-050` Run live internal validation and ship recommendation.
  Dependency: `MBL-011`, `MBL-030`, `MBL-040`
  Acceptance criteria:
  - One internal Meta account with multiple known portfolios is validated end-to-end.
  - Resulting portfolio snapshot is compared directly to a known-good external reference (for example Leadsie) for the same user.
  - Remaining scope/app-review limitations are documented explicitly before ship.

## Review Findings Queue

- The current Meta app still shows several permissions/features as `Ready for testing`, which may remain a production limitation even after the JS SDK flow is implemented.
- Existing business-discovery Graph logic in `MetaConnector.getBusinessAccounts()` should be retained only as a fallback/diagnostic path once Business Login becomes the primary source of truth.
- The current `platforms/callback` route and callback page are Meta-specific debt once the JS SDK path ships; rollback/cleanup sequencing should be deliberate.
- The onboarding page, authenticated connections page, portfolio selector, and manage-assets settings modal now all use Business Login re-auth to refresh Meta Business Portfolio snapshots. The remaining gap is legacy callback quarantine rather than dropdown completeness.
- The legacy Meta redirect callback path is now gated behind `useLegacyFallback=true` on `/agency-platforms/meta/initiate`. That is the documented rollback switch until the callback path is removed entirely.
- Browser evidence for the JS SDK flow now exists under `docs/images/meta-business-login-js-sdk/2026-03-12`, backed by the dedicated harness in `apps/web/dev/meta-business-login` and `apps/web/scripts/capture-meta-business-login-evidence.mjs`.

## Verification Log

- `cd apps/api && npm run test -- --run src/routes/__tests__/agency-platforms.routes.test.ts`
  Result: pass (`POST /agency-platforms/meta/business-login/finalize` now validates payload, stores Meta connection metadata, and returns sanitized connection data)
- `cd apps/api && npm run test -- --run src/services/connectors/__tests__/meta.connector.test.ts`
  Result: pass
- `cd apps/api && npm run typecheck`
  Result: pass
- `cd apps/web && npm run test -- --run src/app/onboarding/platforms/__tests__/page.test.tsx`
  Result: pass (Meta connect now uses the mocked Business Login launcher/finalizer path and surfaces SDK load errors)
- `cd apps/web && npm run test -- --run src/app/(authenticated)/connections/__tests__/page.test.tsx`
  Result: pass (Meta reconnect now uses the JS SDK launcher/finalizer instead of the legacy initiate endpoint)
- `cd apps/web && npm run typecheck`
  Result: pass
- `cd apps/web && npm run test -- --run src/components/__tests__/meta-business-portfolio-selector.test.tsx src/components/__tests__/meta-unified-settings.test.tsx`
  Result: pass (Meta manage-assets surfaces now re-authenticate instead of reloading when the portfolio snapshot is incomplete)
- `cd apps/web && npm run test -- --run src/app/onboarding/platforms/__tests__/page.test.tsx src/app/(authenticated)/connections/__tests__/page.test.tsx src/components/__tests__/meta-business-portfolio-selector.test.tsx src/components/__tests__/meta-unified-settings.test.tsx`
  Result: pass
- `cd apps/api && npm run test -- --run src/routes/__tests__/agency-platforms.routes.test.ts`
  Result: pass (Meta `/initiate` now returns `410 LEGACY_META_OAUTH_DISABLED` unless `useLegacyFallback=true` is provided for rollback)
- `cd apps/web && npm run test -- --run src/app/onboarding/platforms/__tests__/page.test.tsx`
  Result: pass (Meta onboarding now surfaces both JS SDK launch failures and finalize failures)
- `npm run typecheck --workspace=apps/web`
  Result: pass
- `cd apps/web && npm run evidence:meta-business-login`
  Result: pass (desktop + mobile screenshots captured for onboarding connect, settings selected business, and settings switch-business re-auth)

## Initial Requirement Mapping

- Requirement: Agency owners must see the same Business Portfolio set Meta surfaces during agency login.
  - Mapped tasks: `MBL-011`, `MBL-012`, `MBL-021`, `MBL-022`, `MBL-030`, `MBL-050`

- Requirement: Meta agency connect must use the correct Meta Business Login product semantics rather than generic OAuth reconstruction.
  - Mapped tasks: `MBL-010`, `MBL-011`, `MBL-020`, `MBL-021`, `MBL-022`, `MBL-031`

- Requirement: Token handling must remain secure and auditable.
  - Mapped tasks: `MBL-010`, `MBL-011`, `MBL-012`, `MBL-050`

- Requirement: The UI must truthfully explain that refreshing portfolios requires logging in again.
  - Mapped tasks: `MBL-020`, `MBL-022`, `MBL-030`, `MBL-040`
