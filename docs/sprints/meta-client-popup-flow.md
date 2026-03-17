# Sprint: Meta Client Popup Flow

- Date: 2026-03-17
- Status: In Progress
- Owners: Web + API
- Scope: Replace the client invite Meta redirect/callback flow with a popup-based Meta login flow, reusing the existing downstream token storage, asset discovery, and OBO/manual grant pipeline.
- Requirement mapping: [docs/sprints/mvp-requirement-mapping.md](mvp-requirement-mapping.md) (Meta Client Popup Flow section)

## Problem Statement

The current client Meta invite flow is backend-driven and code-based: the frontend requests an OAuth URL, redirects the whole page to Facebook, and returns via `/invite/oauth-callback` with a code. Meta's "Feature Unavailable" error blocks non-role users when the app uses Login for Business `config_id`, and even after scoping `config_id` to agency flows only, Meta can still impose app-level restrictions.

Competitor reverse-engineering (Leadsie, AgencyAccess) shows the winning pattern: frontend JS SDK popup login with scope-based auth (no `config_id`) and backend token validation/finalization. The migration adopts that pattern for client invites, using scopes `ads_management`, `ads_read`, `business_management`, `pages_read_engagement` to match the backend Meta OAuth flow.

## Architecture Approach

### Current Path (Replaced for Meta)

- `PlatformAuthWizard` requests `POST /client/:token/oauth-url`, does `window.location.href = authUrl`
- Full-page redirect to Facebook, then to `/invite/oauth-callback`
- Callback page POSTs `code + state` to `POST /client/oauth-exchange`
- Backend exchanges code, stores token in Infisical, creates `ClientConnection` and `PlatformAuthorization`

### Target Path (Meta Only)

- `PlatformAuthWizard` (Meta branch) loads Meta JS SDK, launches popup with `scope=ads_management,ads_read,business_management,pages_read_engagement` (no `config_id`)
- Popup returns auth payload (accessToken, userId, etc.)
- Frontend POSTs payload to new `POST /client/:token/meta/finalize`
- Backend validates token, upgrades to long-lived, stores in Infisical, creates/updates connection and authorization
- Wizard advances directly to Step 2 (asset selection) without full-page redirect

### Preserved Pipeline

- `GET /client/:token/assets/meta_ads` – asset discovery
- `POST /client/:token/save-assets` – selected asset persistence
- `POST /client/:token/grant-meta-access` – OBO page/ad-account grant
- `POST /client/:token/meta/manual-ad-account-share/*` – manual ad-account fallback

## Phased Milestones

### Phase 1: Backend Contract and Primitive

- `meta-client-01` Define popup-finalize API contract
- `meta-client-02` Implement backend finalize route
- `meta-client-03` Add invite-safe Meta popup login helper (no `config_id`)

### Phase 2: UI Rewire

- `meta-client-04` Rewire invite wizard from redirect to popup/finalize
- `meta-client-05` Retire Meta invite callback dependence

### Phase 3: Verification and Tests

- `meta-client-06` Verify asset selection and grant pipeline compatibility
- `meta-client-07` Add regression tests for client Meta popup flow
- `meta-client-08` Run verification and screenshot QA

## Ordered Task Board

| ID | Task | Acceptance Criteria | Dependency |
|----|------|---------------------|------------|
| meta-plan-01 | Build requirement mapping | Maps each Meta client-flow requirement to task IDs; distinguishes replaced vs reused pipeline steps | - |
| meta-plan-02 | Create sprint doc | Includes architecture, milestones, risks, verification, stable task IDs | - |
| meta-client-01 | Define popup-finalize API contract | Request schema supports frontend auth payload instead of `code`; validates invite token/state; response returns `connectionId`, `platform`, metadata for Step 2 resume | - |
| meta-client-02 | Implement backend finalize flow | Verifies token, upgrades to long-lived, stores in Infisical, upserts `PlatformAuthorization`, audit logs; metadata shape compatible with asset/grant routes | meta-client-01 |
| meta-client-03 | Add invite-safe Meta popup helper | Loads SDK once, launches popup without `config_id`, returns auth payload; agency config-based login isolated | - |
| meta-client-04 | Rewire invite Step 1 to popup | Meta Step 1 does not use `/oauth-url` or `window.location.href`; successful popup advances to asset selection; loading, cancel, error states explicit | meta-client-02, meta-client-03 |
| meta-client-05 | Retire Meta invite callback dependence | Meta flow no longer uses `/invite/oauth-callback`; callback remains for Google/LinkedIn/etc. only | meta-client-04 |
| meta-client-06 | Verify asset and grant pipeline | Selected business/assets persist; page grant and manual ad-account verification work with popup-finalized tokens | meta-client-02, meta-client-04 |
| meta-client-07 | Add regression tests | Covers popup finalize success, cancelled login, invalid token, Step 2 direct entry, asset selection, grant flows | meta-client-04, meta-client-06 |
| meta-client-08 | Verification and screenshot QA | Typecheck/test pass; browser QA covers full invite flow; UI review desktop and mobile | meta-client-07 |

## Requirement Mapping (Task IDs)

| Requirement | Mapped Tasks |
|-------------|--------------|
| Replace Meta client redirect with popup login | meta-client-03, meta-client-04 |
| Remove Meta invite callback dependence | meta-client-05 |
| Preserve secure backend validation and Infisical storage | meta-client-01, meta-client-02 |
| Reuse existing asset discovery and grant pipeline | meta-client-06 |
| Regression protection for Meta flow changes | meta-client-07, meta-client-08 |

## Verification Strategy

- **Backend**: finalize route contract, token validation, Infisical persistence, audit logging, compatibility with assets/OBO routes
- **Frontend**: wizard state transitions without full-page redirect, popup cancel/error handling, progression to `MetaAssetSelector`
- **Browser QA**: invite start → Meta popup happy path → asset selection (one/many businesses) → page auto-grant → manual ad-account fallback
- **Non-goals**: redesign OBO/manual access model; change agency-side Meta Business Login UX

## Risks and Mitigations

- **Meta JS SDK blocked by Firefox Enhanced Tracking Protection**: The SDK loads from connect.facebook.net and makes requests to facebook.com; Firefox blocks these as known trackers, causing "Network Protocol Error". Mitigation: fallback to redirect flow when popup fails. Try popup first; on any error (SDK load, FB.login, network), use `POST /oauth-url` + `window.location.href` so the user completes Meta auth via full-page redirect.
- **Meta JS SDK on unauthenticated invite pages**: Reuse SDK loader shape, isolate client-invite options, test popup blockers/cancel early
- **Frontend token weakens trust boundary**: Backend must verify token validity and app ownership before persistence, following agency finalize pattern
- **Downstream metadata depends on old callback**: Keep `PlatformAuthorization.metadata.meta` shape stable; run focused regression on assets.meta.test
- **Callback removal breaks other platforms**: Scope Meta-specific removal; Google/LinkedIn continue using redirect/callback

## Key Files

- Frontend: `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`, `apps/web/src/lib/meta-business-login.ts`, `apps/web/src/app/invite/[token]/page.tsx`, `apps/web/src/app/invite/oauth-callback/page.tsx`
- Backend: `apps/api/src/routes/client-auth/oauth-exchange.routes.ts`, `apps/api/src/routes/client-auth/schemas.ts`, `apps/api/src/services/connectors/meta.ts`, `apps/api/src/routes/client-auth/meta-finalize.routes.ts`
- Reference: `apps/api/src/routes/agency-platforms/oauth.routes.ts` (agency `meta/business-login/finalize`)

---

## Workflow Review Findings (2026-03-17)

Review target: Meta Client Popup Flow implementation (`meta-client-01` through `meta-client-08`). Changed files: `meta-finalize.routes.ts`, `schemas.ts`, `meta-business-login.ts`, `PlatformAuthWizard.tsx`, `client-auth.routes.test.ts`, `PlatformAuthWizard.test.tsx`, `client-auth/index.ts`.

### High severity — none

No high-severity issues identified.

### Medium severity

1. **Double-click / rapid Connect Meta** — `PlatformAuthWizard.tsx`  
   No guard against rapid double-clicks on "Connect Meta". User could create multiple oauth-state tokens and open multiple Meta popups. Mitigation: disable the button while `isProcessing` is true (already done). Verdict: acceptable; `isProcessing` is set immediately on click. Consider adding `aria-disabled` for accessibility.

2. **State expiry window (10 min)** — `oauth-state.service.ts`  
   OAuth state tokens expire in 10 minutes. If the user waits >10 min after clicking Connect and before completing the Meta popup, finalize will fail with `INVALID_STATE`. UX: generic "Invalid or expired" message. Acceptable; matches redirect flow. Optional: add copy in Step 1: "Complete the Meta sign-in promptly."

### Low severity

3. **SDK loader edge case** — `meta-business-login.ts` L107–109  
   When `existingScript` exists (script already in DOM) and `sdkPromise` was cleared (e.g. by `resetMetaBusinessLoginSdkForTests`), the promise executor `return`s early and the promise never resolves. Real impact only in tests that reset then reload without removing the script. Fix: if `existingScript` exists and `window.FB` is ready, resolve immediately; otherwise let the existing script's `fbAsyncInit` resolve.

4. **Non-null assertions** — `meta-finalize.routes.ts` L61, 112, 113, 165  
   Uses `stateData.accessRequestId!` and `stateData.clientEmail!`. `createState` for client flows includes these. Risk: low; consider runtime checks or Zod refinement if stricter validation is desired.

5. **Sprint doc scope mismatch** — `docs/sprints/meta-client-popup-flow.md` L26  
   Doc says `scope=email,business_management`. Implementation uses `ads_management`, `ads_read`, `business_management`, `pages_read_engagement` (matching connector). Implementation is correct; update doc to match.

### Architecture and design

- Backend finalize flow mirrors agency `meta/business-login/finalize`.
- Frontend token is verified with `connector.verifyToken` before persistence.
- State is single-use via `validateState`; tokens stored only in Infisical; audit log records `CLIENT_AUTHORIZED` with `authSource: 'meta_client_popup'`.
- Response shape (`connectionId`, `platform`, `token`) aligns with redirect flow for Step 2 resume.

### Security and data integrity

- Invite token from URL is checked against `accessRequest.uniqueToken`.
- Meta token is checked before any DB write.
- No tokens in responses; only `secretId` stored in DB.
- Audit trail is present for token-related actions.

### Performance and scalability

- `Promise.all` for `getUserInfo`, `getTokenMetadata`, `getLongLivedToken` avoids unnecessary serialization.
- No N+1 patterns in the new route.

### Follow-up items

- [x] Fix SDK loader edge case when `existingScript` exists and `sdkPromise` was cleared (`meta-business-login.ts`).
- [x] Align sprint doc scope description with actual scopes (`ads_management`, `ads_read`, `business_management`, `pages_read_engagement`).
