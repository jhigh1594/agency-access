# 2026-03-04 TikTok Business Center Connection Brainstorm

## Objective
Define what is required to fully implement TikTok as a production-ready platform connection, centered on TikTok Business Center authorization and asset sharing.

## Repo Context (Observed)
- TikTok is already listed as a supported platform in shared types and UI platform catalogs:
  - `packages/shared/src/types.ts`
- A TikTok connector exists and is registered:
  - `apps/api/src/services/connectors/tiktok.ts`
  - `apps/api/src/services/connectors/factory.ts`
  - `apps/api/src/services/connectors/registry.config.ts`
- Client OAuth flow and token storage pipeline already exists and is generic across platforms:
  - `apps/api/src/routes/client-auth/oauth-state.routes.ts`
  - `apps/api/src/routes/client-auth/oauth-exchange.routes.ts`
  - `apps/api/src/services/oauth-state.service.ts`

## Critical Gaps Identified
1. TikTok OAuth endpoints in code are deprecated/broken.
- Current config uses:
  - `https://business-api.tiktok.com/passport/v2/authorize/`
  - `https://business-api.tiktok.com/passport/v2/token/`
- Both return `404 Not Found` and do not match current TikTok Business API docs.

2. Env variable naming is incompatible with BaseConnector conventions.
- BaseConnector expects `{PLATFORM}_CLIENT_ID` and `{PLATFORM}_CLIENT_SECRET`.
- TikTok env currently uses `TIKTOK_APP_ID` and `TIKTOK_APP_SECRET`.
- Result: runtime connector failures unless additional aliasing logic is added.

3. Token model assumptions are incorrect for TikTok Marketing API long-term tokens.
- Current connector assumes refresh token flow and 24h expiry.
- TikTok current docs state long-term Marketing API access tokens do not expire and are revoked explicitly or invalidated when advertiser revokes authorization.

4. TikTok user/profile fetch strategy is not aligned with documented APIs.
- Current connector points to `v1.3/user/info` and sends `Access-Token` header.
- Current TikTok docs emphasize `/oauth2/advertiser/get/`, `/bc/get/`, and `/bc/asset/get/` for practical post-auth account discovery.

5. TikTok client asset fetch implementation is likely invalid.
- `client-assets.service.ts` currently calls `POST /open_api/v1.3/advertiser/info/` with `advertiser_id: null`.
- Documented endpoints for auth/account discovery indicate using:
  - `/open_api/v1.3/oauth2/advertiser/get/` for authorized ad accounts
  - `/open_api/v1.3/bc/get/` and `/open_api/v1.3/bc/asset/get/` for Business Center assets

6. Invite UI flow blocks completion for TikTok.
- `PlatformAuthWizard` Step 2 renders selectors only for Meta and Google products.
- TikTok path has no selector/continue branch, which can strand users after OAuth callback in Step 2.

## Default Architecture Baseline Check
The `workflow-discovery` default baseline (Rails + Phlex + Stimulus + Turbo/Hotwire) does not apply.

Applicable stack here:
- Next.js 16 App Router frontend (`apps/web`)
- Fastify + Prisma backend (`apps/api`)
- Shared TS/Zod package (`packages/shared`)
- Redis OAuth state + Infisical token storage + audit logging

## External Research Summary (TikTok Primary Docs)
### Prerequisites
- Create TikTok for Business account, developer profile, and app.
- Configure advertiser redirect URL(s) in My Apps.
- Select required app permissions/scopes in My Apps and pass review.

### Authorization model for Marketing API
- TikTok recommends using the app's Advertiser Authorization URL from My Apps.
- Advertiser approves permissions and is redirected with `auth_code`.
- `auth_code` validity for Marketing API flow: 1 hour, single-use.

### Authentication/token exchange
- Supported token endpoints:
  - `POST /open_api/v1.3/oauth2/access_token/` (`app_id`, `secret`, `auth_code`)
  - `POST /open_api/v1.3/oauth/token/` (`client_id`, `client_secret`, `code`, `grant_type=authorization_code`)
- Long-term Marketing API access token does not expire.
- Token revocation endpoint exists:
  - `POST /open_api/v1.3/oauth2/revoke_token/`

### Business Center and asset discovery endpoints
- Get authorized ad accounts:
  - `GET /open_api/v1.3/oauth2/advertiser/get/`
- Get business centers:
  - `GET /open_api/v1.3/bc/get/`
- Get assets (including ad accounts) within BC:
  - `GET /open_api/v1.3/bc/asset/get/`

### Business Center partner sharing endpoints (for true delegated access)
- Add partner BC and optionally share ad accounts:
  - `POST /open_api/v1.3/bc/partner/add/`
- Verify partner relationships and shared assets:
  - `GET /open_api/v1.3/bc/partner/get/`
  - `GET /open_api/v1.3/bc/partner/asset/get/`
  - `GET /open_api/v1.3/bc/asset/partner/get/`
- Requires BC Admin permissions for key partner-management actions.

### Permissions needed (scope hierarchy)
- Business Center-related operations map under Business Center scope IDs.
- For this product goal, minimum practical scope set should include:
  - Read Business Center
  - Business Center Asset
  - Business Center Partner Management

## Users and Success Criteria
### Primary users
- Agency admin initiating TikTok access collection
- Client-side TikTok advertiser/BC admin authorizing and selecting what to share

### Success criteria
- Client can authorize TikTok through one invite flow without dead ends.
- System can discover authorized TikTok ad accounts/BC assets.
- Agency can verify access state from dashboard (connected, partial, failed).
- (If full BC automation enabled) agency BC is added as partner and selected ad accounts are shared with selected role.
- All token operations are logged/audited; tokens remain only in Infisical.

## Scope and Security Guardrails
- Never store raw TikTok OAuth tokens in Postgres (Infisical only).
- Audit-log all token access and high-risk operations (exchange, read, revoke, partner-share attempts).
- Preserve API response contracts (`{ data }` / `{ error }`).
- Keep fallback path when automation fails (manual BC sharing instructions).

## Approaches
### 1) OAuth-Only Connection (Minimal)
Scope
- Fix OAuth exchange and token storage only.
- Mark TikTok connected after token exchange.
- No BC asset retrieval or partner-sharing automation.

Pros
- Fastest path to "connectable" status.
- Lower implementation risk.

Cons
- Not sufficient for true agency access workflow.
- No BC-level validation or operational value beyond token capture.

### 2) OAuth + Business Center Asset Discovery
Scope
- Fix OAuth and token model.
- Add TikTok asset fetching using `/oauth2/advertiser/get/`, `/bc/get/`, `/bc/asset/get/`.
- Let users select ad accounts in invite flow and persist selection.
- No automated `bc/partner/add`.

Pros
- Strong middle ground.
- Gives accurate visibility and selection UX.
- Lower risk than direct partner automation.

Cons
- Agencies still need manual BC partner-sharing step.
- Adds support burden for manual completion.

### 3) Full Business Center Delegated Access Automation (Recommended)
Scope
- Includes Approach 2.
- Add API workflow to perform `bc/partner/add` for selected ad accounts.
- Add verification via partner asset endpoints.
- Add guided recovery for failed partial shares.

Pros
- Aligns with "fully implemented" objective.
- End-to-end agency onboarding outcome (not just token capture).
- Most defensible differentiation.

Cons
- Highest integration complexity and support surface.
- Requires careful permission/scoping and failure handling design.

## Recommendation
Use **Approach 3** in phased delivery:

1. Phase A: Correct OAuth foundation
- Replace deprecated endpoints with v1.3 endpoints.
- Resolve env naming mismatch (`APP_ID/APP_SECRET` vs connector `CLIENT_ID/CLIENT_SECRET` expectations).
- Update TikTok token normalization for long-term token behavior.
- Add revoke-token support.

2. Phase B: Asset discovery + usable client flow
- Implement TikTok asset discovery service (advertisers + BC + BC assets).
- Fix invite Step 2 UX for TikTok (no dead-end state; explicit Continue path).
- Persist selected TikTok ad accounts in `grantedAssets` + authorization metadata.

3. Phase C: Business Center partner sharing automation
- Add backend service for `bc/partner/add` with advertiser role mapping.
- Add verification endpoint(s) to confirm shared assets/partner links.
- Add retry-safe idempotent flow and partial-failure recovery UI.

4. Phase D: Hardening
- Contract tests for TikTok connector/service.
- Structured error mapping for common TikTok API failures.
- Monitoring and audit enrichment.

## Implementation Notes for Workflow-Plan
- Add dedicated `TikTokConnector` overrides (do not rely on generic BaseConnector defaults blindly).
- Keep mapping compatibility for existing `tiktok`/`tiktok_ads` product IDs.
- Introduce clear metadata schema for TikTok authorizations:
  - authorized advertiser IDs
  - selected advertiser IDs
  - selected BC ID
  - partner-share status per advertiser
- Ensure reconnection and revoke flows are symmetric.

## Open Questions
1. Should first production release include **automated BC partner sharing** (`bc/partner/add`) or ship first with **manual sharing fallback** after asset selection?
2. Do we want to model TikTok access levels in UI as TikTok-native roles (`ADMIN`, `OPERATOR`, `ANALYST`) directly or keep internal levels and map server-side?
3. For agencies with multiple BCs, should we require a preselected agency BC in settings before enabling TikTok client authorization?

## Validation Check
- Clarity: objective, required external API behaviors, and repo gaps are explicit.
- Scope boundaries: phased rollout and non-goals are clear.
- Open questions: unresolved product choices listed and implementation-impacting.

## Handoff
Ready for `workflow-plan` once Open Question 1 is decided.

## Sources
- TikTok Marketing API Authorization: https://business-api.tiktok.com/portal/docs?id=1738373141733378
- TikTok Marketing API Authentication: https://business-api.tiktok.com/portal/docs?id=1738373164380162
- Obtain long-term token: https://business-api.tiktok.com/portal/docs?id=1739965703387137
- Revoke long-term token: https://business-api.tiktok.com/portal/docs?id=1739965949088770
- Get authorized ad accounts: https://business-api.tiktok.com/portal/docs?id=1738455508553729
- Get Business Centers: https://business-api.tiktok.com/portal/docs?id=1737115687501826
- Get BC assets: https://business-api.tiktok.com/portal/docs?id=1739432717798401
- Add BC partner: https://business-api.tiktok.com/portal/docs?id=1739662756510721
- Get BC partners/assets: https://business-api.tiktok.com/portal/docs?id=1739662727395330 and https://business-api.tiktok.com/portal/docs?id=1739662828320769
- Permission scope hierarchy: https://business-api.tiktok.com/portal/docs?id=1753986142651394
- Official TikTok Business API SDK (endpoint references): https://github.com/tiktok/tiktok-business-api-sdk
