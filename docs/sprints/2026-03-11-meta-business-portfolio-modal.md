# Sprint: Meta Business Portfolio Modal Hardening

- Date: 2026-03-11
- Status: In Progress
- Owners: Web + API
- Scope: Make the Meta Manage Assets modal render quickly from cached connection data, keep the portfolio selector truthful when Meta refresh fails, and prevent refreshed empty responses from erasing valid portfolio state.
- Discovery input:
  - Plan: [`docs/plans/2026-03-11-meta-business-portfolio-modal-fix.md`](/Users/jhigh/agency-access-platform/docs/plans/2026-03-11-meta-business-portfolio-modal-fix.md)
  - Active implementation points:
    - `apps/web/src/components/meta-unified-settings.tsx`
    - `apps/api/src/services/connectors/meta.ts`
    - `apps/api/src/routes/agency-platforms/assets.routes.ts`

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify backend in `apps/api`
- Shared TypeScript types in `@agency-platform/shared`
- Existing agency connection settings modal remains the baseline; this sprint hardens responsiveness and error truthfulness for Meta portfolio selection

Adaptation note for workflow requirements:
- “Phlex primitives / Stimulus / Turbo” maps here to existing React/TanStack Query patterns already used in the repo.
- UI changes stay inside the current modal and semantic token system; no new design language is introduced.

## Product Decision Log (Locked)

1. The Meta settings modal should render from cached connection state immediately.
2. A live Meta refresh should improve freshness, not block the modal shell.
3. Refresh failure must not masquerade as “no portfolios found.”
4. A stored portfolio should remain visible/selectable even if live options fail to load.
5. Backend refresh failures must not overwrite previously cached `metaBusinessAccounts`.

## Ordered Task Board

- [x] `MBP-001` Create sprint artifact and lock scope.
  Dependency: none
  Acceptance criteria:
  - Sprint doc exists in `docs/sprints`.
  - Scope, decisions, and tasks match the Meta modal problem only.

- [x] `MBP-010` Add failing backend tests for Meta portfolio refresh failure semantics.
  Dependency: `MBP-001`
  Acceptance criteria:
  - Connector test proves Meta business discovery throws on transport/API failure.
  - Route test proves `refresh=true` returns `FETCH_FAILED` instead of a silent empty list.

- [x] `MBP-011` Implement backend failure semantics without regressing pagination.
  Dependency: `MBP-010`
  Acceptance criteria:
  - `MetaConnector.getBusinessAccounts()` preserves pagination behavior.
  - Refresh failures propagate to the route catch block.
  - Cached `metaBusinessAccounts` metadata is not updated on refresh failure.

- [x] `MBP-020` Add failing frontend tests for cached-first modal rendering.
  Dependency: `MBP-001`
  Acceptance criteria:
  - Modal renders the stored portfolio while live refresh is pending.
  - Stored portfolio remains visible when live refresh fails.
  - Inline warning text reflects backend error messaging when available.

- [x] `MBP-021` Implement cached-first Meta modal behavior and error messaging.
  Dependency: `MBP-020`, `MBP-011`
  Acceptance criteria:
  - Modal no longer blocks on live Meta portfolio fetch.
  - Cached businesses hydrate the selector immediately.
  - Failed refresh keeps cached options and shows a non-blocking warning.
  - Fallback option is injected when `selectedBusinessId` is missing from refreshed options.

- [x] `MBP-030` Run focused verification and capture residual risks.
  Dependency: `MBP-011`, `MBP-021`
  Acceptance criteria:
  - Targeted API and web tests pass.
  - Relevant typechecks are run.
  - Any unrelated failures are documented precisely.

## Review Findings Queue

- Residual workspace blocker: `cd apps/web && npm run typecheck` fails in `src/evidence/linkedin-page-support-preview.tsx:318` and `:319` due missing `accounts` in `PlatformProductConfig`. This is unrelated to the Meta modal fix.
- Broader connection-page test blocker: `cd apps/web && npm test -- --run 'src/app/(authenticated)/connections/__tests__/page.test.tsx'` currently fails on a pre-existing expectation for `LinkedIn Ads`.
- Screenshot evidence not captured in this sprint because no live app/API pair was running on `localhost:3000` and `localhost:3001` during implementation.
- Meta client access-request gap: the current automatic grant path creates a system user under the agency BM (`apps/api/src/services/meta-assets.service.ts`) and then tries to assign that user on client-owned assets (`apps/api/src/routes/client-auth/assets.routes.ts`). Meta’s OBO guide requires creating the partner/client `managed_businesses` relationship first, then obtaining a system user token under the client BM before asset assignment.
- Meta endpoint mismatch: `apps/api/src/services/meta-partner.service.ts` still models ad account and Instagram assignment around a `business` parameter on `/{asset_id}/assigned_users`, while Meta’s assigned-users references require `user` plus task scopes for mutation.
- Meta asset-discovery truthfulness gap: `apps/api/src/services/client-assets.service.ts` still reads client Meta assets primarily from `/me/adaccounts` and `/me/accounts`, which can miss business-owned or partner-shared assets compared to business-scoped discovery (`owned_*`, `client_*`, and related BM edges).
- Meta ad-account fulfillment gap: `apps/web/src/components/client-auth/AdAccountSharingInstructions.tsx` and `apps/api/src/routes/client-auth/assets.routes.ts` only mark manual completion after client self-attestation; they do not verify or create the required Meta partner/OBO access programmatically.

## Verification Log

- `cd apps/api && npm test -- --run src/services/connectors/__tests__/meta.connector.test.ts`
  Result: pass
- `cd apps/web && npm test -- --run src/components/__tests__/meta-business-portfolio-selector.test.tsx`
  Result: pass
- `cd apps/api && npm test -- --run src/routes/__tests__/agency-platforms.routes.test.ts`
  Result: pass
- `cd apps/api && npm run typecheck`
  Result: pass
- `cd apps/web && npm test -- --run src/components/__tests__/meta-unified-settings.test.tsx`
  Result: pass
- `cd apps/web && npm test -- --run 'src/app/(authenticated)/connections/__tests__/page.test.tsx'`
  Result: fail, unrelated pre-existing `LinkedIn Ads` expectation mismatch
- `cd apps/web && npm run typecheck`
  Result: fail, unrelated pre-existing errors in `src/evidence/linkedin-page-support-preview.tsx:318` and `:319`
