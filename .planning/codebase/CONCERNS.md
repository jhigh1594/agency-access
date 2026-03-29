# Codebase Concerns

**Analysis Date:** 2026-03-29

## Tech Debt

**Legacy Platform Support:**
- Issue: Multiple legacy platforms still supported in codebase (whatsapp_business, google_tag_manager, google_merchant_center, google_search_console, youtube_studio, google_business_profile, display_video_360)
- Files: `packages/shared/src/types.ts`, `apps/api/src/services/access-request.service.ts`
- Impact: Code complexity, maintenance burden for unused platforms
- Fix approach: Remove legacy platform schemas and routing; create migration path for existing clients if any

**Analytics Integration Fragmentation:**
- Issue: Legacy analytics integration maintained alongside current system, requiring dual-track maintenance
- Files: `apps/web/src/lib/analytics/billing.ts`, `apps/web/src/lib/analytics/onboarding.ts`, `apps/web/src/lib/analytics/affiliate.ts`
- Impact: Increased complexity, potential data inconsistency
- Fix approach: Migrate all analytics events to current system, remove legacy forwarding code

**Deprecated Asset Fetching Methods:**
- Issue: `apps/api/src/services/client-assets.service.ts` contains deprecated methods still referenced elsewhere
- Files: `apps/api/src/services/client-assets.service.ts` (line 459: "deprecated - use GoogleConnector.getAdsAccounts instead")
- Impact: Code duplication, confusion about which method to use
- Fix approach: Refactor all callers to use GoogleConnector methods, remove deprecated code

**Intake Form Data Storage:**
- Issue: TODO comment indicates intake responses not stored permanently (line 34-35 in intake.routes.ts)
- Files: `apps/api/src/routes/client-auth/intake.routes.ts`
- Impact: Client intake data lost after connection created, cannot be retrieved later
- Fix approach: Store intake responses in ClientConnection.intakeResponses or dedicated table

## Known Bugs

**Hardcoded System User in Beehiiv Verification:**
- Symptoms: Agency platform connections show incorrect "connected by" user
- Files: `apps/api/src/services/beehiiv-verification.service.ts` (line 68: "system@authhub.com // TODO: Get actual user email from request")
- Trigger: Every Beehiiv connection created
- Workaround: None - audit trail shows incorrect user
- Fix approach: Pass authenticated user email through verification service call stack

**Missing Token Health Page:**
- Symptoms: Commented out navigation item in authenticated layout
- Files: `apps/web/src/app/(authenticated)/layout.tsx` (line 15: "// Heart, // TODO: Re-enable when Token Health page is restored")
- Trigger: Attempting to navigate to token health monitoring
- Workaround: No direct UI access to token health status
- Fix approach: Restore token health page or remove commented navigation code

**Silent Failures in Asset Fetching:**
- Symptoms: Empty arrays returned when Google asset APIs fail
- Files: `apps/api/src/services/connectors/google.ts` (lines 314-319: `.catch(() => ({ accounts: [] }))`)
- Trigger: API rate limits, network failures, invalid tokens
- Workaround: None - errors swallowed
- Fix approach: Proper error handling with logging, surface errors to UI

## Security Considerations

**Direct Environment Variable Access:**
- Risk: Scattered `process.env` access throughout codebase makes security audit difficult
- Files: `apps/api/src/index.ts`, `apps/api/src/lib/env.ts`, multiple connector files
- Current mitigation: Centralized env.ts with Zod validation
- Recommendations: Create strict typed config accessors, eliminate direct process.env usage in business logic

**Hardcoded System Credentials:**
- Risk: Beehiiv verification uses hardcoded system email
- Files: `apps/api/src/services/beehiiv-verification.service.ts` (line 68)
- Current mitigation: None
- Recommendations: Always use authenticated user context for audit trails

**TypeScript `any` Usage in Error Handling:**
- Risk: Type safety lost in catch blocks, potential runtime errors
- Files: Multiple services use `error: any` in catch blocks
- Current mitigation: Zod validation for input, runtime checks in error handlers
- Recommendations: Create proper error types, use `unknown` with type guards

## Performance Bottlenecks

**Large Client Assets File:**
- Problem: 2558 lines in `apps/api/src/routes/client-auth/assets.routes.ts`
- Files: `apps/api/src/routes/client-auth/assets.routes.ts`
- Cause: Asset fetching for all platforms in single file
- Improvement path: Split into platform-specific route modules

**Large Shared Types File:**
- Problem: 2672 lines in `packages/shared/src/types.ts`
- Files: `packages/shared/src/types.ts`
- Cause: All shared types in single file
- Improvement path: Split by domain (auth, platform, billing, etc.)

**Unoptimized Agency Resolution:**
- Problem: Agency lookup queries may run multiple times per request
- Files: `apps/api/src/services/agency-resolution.service.ts`
- Cause: Missing caching layer for email-based agency lookup
- Improvement path: Add Redis caching with 30-minute TTL (already exists in some endpoints)

**No Pagination on Large Lists:**
- Problem: Clients and access requests may return thousands of records
- Files: `apps/api/src/services/client.service.ts`, `apps/api/src/services/access-request.service.ts`
- Cause: Missing LIMIT/OFFSET or cursor-based pagination
- Improvement path: Implement cursor-based pagination for all list endpoints

## Fragile Areas

**Platform Auth Wizard Component:**
- Files: `apps/web/src/components/client-auth/PlatformAuthWizard.tsx` (1515 lines)
- Why fragile: Handles OAuth flow, asset selection, and manual grants for multiple platforms in single component
- Safe modification: Extract platform-specific logic into separate components
- Test coverage: Moderate (component tests exist, but E2E coverage unknown)

**Access Request Service:**
- Files: `apps/api/src/services/access-request.service.ts` (1664 lines)
- Why fragile: Complex business logic for request lifecycle, quota enforcement, Google product fulfillment
- Safe modification: Extract quota enforcement to separate service, create domain models for request states
- Test coverage: Good (1326 lines of tests)

**Internal Admin Service:**
- Files: `apps/api/src/services/internal-admin.service.ts` (1886 lines)
- Why fragile: Monolithic service handling subscriptions, affiliates, agencies, usage leaderboards
- Safe modification: Split into domain-specific services (subscription-admin, affiliate-admin, agency-admin)
- Test coverage: Unknown (no dedicated test file found)

**Token Lifecycle Management:**
- Files: `apps/api/src/services/token-lifecycle.service.ts`, `apps/api/src/services/connection.service.ts`
- Why fragile: Token refresh logic, Infisical integration, health checks, expiry calculations
- Safe modification: Add comprehensive logging, create refresh state machine
- Test coverage: Moderate (token-lifecycle tests exist)

## Scaling Limits

**Prisma Connection Pool:**
- Current capacity: Default connection pool size (typically 10 connections)
- Limit: Connection exhaustion under high concurrent load
- Scaling path: Configure connection pool based on DATABASE_URL parameters, add connection pooling service (PgBouncer)

**Redis Single Instance:**
- Current capacity: Single Redis instance for OAuth state, caching, queues
- Limit: Single point of failure, memory-based limits
- Scaling path: Redis Cluster for horizontal scaling, Redis Sentinel for HA

**BullMQ Job Processing:**
- Current capacity: Single worker process for background jobs
- Limit: Job backlog grows with high token refresh volume
- Scaling path: Horizontal worker scaling, job prioritization, dead letter queue

**Infisical Rate Limits:**
- Current capacity: Dependent on Infisical plan limits
- Limit: Token storage/retrieval throttled at high volume
- Scaling path: Implement local caching layer, batch operations

## Dependencies at Risk

**Legacy Analytics Forwarding:**
- Risk: Legacy analytics SDK may be removed or break
- Impact: Analytics events lost for users on legacy tracking
- Migration plan: Complete migration to current analytics system, remove legacy forwarding

**Cerk Custom CSS Overrides:**
- Risk: Clerk UI changes may break custom styling in globals.css (lines 767-1198)
- Impact: Authentication UI broken or styled incorrectly
- Migration plan: Monitor Clerk changelog, create component wrappers for critical auth UI

**Next.js 16 (RC/Beta):**
- Risk: Using pre-release Next.js version may have breaking changes
- Impact: App router, server components, or build process may break
- Migration plan: Pin to specific Next.js 16.x version, monitor for stable release

**Infisical SDK:**
- Risk: Infisical SDK changes may break token storage/retrieval
- Impact: All OAuth flows fail
- Migration plan: Create abstraction layer for secrets management, version-pin Infisical SDK

## Missing Critical Features

**Intake Response Persistence:**
- Problem: Client intake form responses not stored permanently (TODO comment in intake.routes.ts)
- Blocks: Cannot retrieve client intake data after connection created
- Fix approach: Add intakeResponses JSONB column to ClientConnection, store responses on submission

**Token Health Monitoring UI:**
- Problem: Token health page commented out in navigation
- Blocks: Agencies cannot proactively monitor token expiry
- Fix approach: Restore token health page or remove from navigation

**Pagination on List Endpoints:**
- Problem: Many list endpoints return all records
- Blocks: Cannot scale beyond thousands of records per resource
- Fix approach: Implement cursor-based pagination across all list endpoints

**Webhook Retry Logic:**
- Problem: Webhook delivery service lacks exponential backoff retry
- Blocks: Webhooks may fail permanently on transient errors
- Fix approach: Add retry queue with exponential backoff for failed webhooks

## Test Coverage Gaps

**Internal Admin Service:**
- What's not tested: Subscription overview, usage leaderboards, affiliate partner listing
- Files: `apps/api/src/services/internal-admin.service.ts`
- Risk: Admin dashboard errors, incorrect usage metrics
- Priority: High (affects billing and revenue)

**Platform Auth Wizard E2E:**
- What's not tested: Full OAuth flow across platforms, asset selection, error states
- Files: `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
- Risk: Regression in critical client-facing OAuth flow
- Priority: High (core user journey)

**Token Refresh Integration:**
- What's not tested: End-to-end token refresh with Infisical, expired token handling
- Files: `apps/api/src/services/token-lifecycle.service.ts`
- Risk: Silent token expiry, client connections fail
- Priority: High (core platform functionality)

**Webhook Delivery:**
- What's not tested: Webhook delivery failure, retry logic, signature validation edge cases
- Files: `apps/api/src/services/webhook-delivery.service.ts`
- Risk: Webhooks lost or delivered inconsistently
- Priority: Medium (integration feature)

**Migration Helpers in CSS:**
- What's not tested: CSS utility migration helpers (lines 1206-1231 in globals.css)
- Files: `apps/web/src/app/globals.css`
- Risk: Visual regressions during CSS migration
- Priority: Low (cosmetic, has visual testing)

---

*Concerns audit: 2026-03-29*
