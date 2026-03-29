# External Integrations

**Analysis Date:** 2026-03-29

## APIs & External Services

**Authentication & Identity:**
- Clerk - User authentication and JWT verification
  - SDK: `@clerk/nextjs` (frontend), `@clerk/backend` (backend)
  - Auth: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - Implementation: RS256 JWT verification via `verifyToken()` from `@clerk/backend`
  - Used for: User sessions, agency member management, role-based access control

**Secrets Management:**
- Infisical - OAuth token storage (never in database)
  - SDK: `@infisical/sdk`
  - Auth: `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET` (Machine Identity)
  - Config: `INFISICAL_PROJECT_ID`, `INFISICAL_ENVIRONMENT`
  - Implementation: `apps/api/src/lib/infisical.ts`
  - Used for: Storing OAuth access/refresh tokens, webhook secrets
  - Pattern: Store only `secretId` in PostgreSQL, retrieve tokens from Infisical

**Email Service:**
- Resend - Transactional emails
  - SDK: `resend` package
  - Auth: `RESEND_API_KEY`
  - Config: `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`
  - Implementation: `apps/api/src/services/email.service.ts`
  - Domain: notifications.authhub.co (verified)
  - Used for: Client invitations, access request notifications

**Payments & Billing:**
- Creem - Payment processing and subscription management
  - API: REST API at `https://api.creem.io`
  - Auth: `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`
  - Implementation: `apps/api/src/config/creem.config.ts`
  - Used for: Subscription tiers (STARTER, GROWTH, AGENCY), invoice management
  - Webhook: Signature-based verification for payment events

**Product Analytics:**
- PostHog - User behavior analytics
  - SDK: `posthog-js`
  - Implementation: Reverse proxy via Next.js rewrites (`/ingest/*`)
  - Config: Frontend SDK initialization
  - Used for: Event tracking, funnel analysis

**Error Tracking:**
- Sentry - Error and performance monitoring
  - SDK: `@sentry/nextjs` (web), `@sentry/node` (api)
  - Auth: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
  - Config: `SENTRY_ORG`, `SENTRY_PROJECT`
  - Webhook: `SENTRY_WEBHOOK_SECRET` for alert integration
  - Implementation: `apps/web/sentry.server.config.ts`, `apps/api/src/instrument.ts`

**Web Analytics:**
- Vercel Analytics - Web performance analytics
  - SDK: `@vercel/analytics/next`
  - Implementation: `apps/web/src/components/deferred-analytics.tsx`

- Vercel Speed Insights - Performance insights
  - SDK: `@vercel/speed-insights/next`
  - Implementation: `apps/web/src/components/deferred-analytics.tsx`

**Brand Assets:**
- Brandfetch Logo API - Platform logos
  - Auth: `NEXT_PUBLIC_BRANDFETCH_CLIENT_ID`
  - Implementation: `apps/web/src/components/ui/platform-icon.tsx`
  - Pattern: `https://cdn.brandfetch.io/{domain}?c={CLIENT_ID}`

**Customer Support:**
- Help Scout Beacon - Customer support widget
  - Auth: `HELPSCOUT_BEACON_SECRET` (for secure mode)

## Data Storage

**Databases:**
- PostgreSQL (Neon) - Primary database
  - Connection: `DATABASE_URL` env var
  - Client: Prisma ORM (`@prisma/client`)
  - Schema: `apps/api/prisma/schema.prisma`
  - Models: Agency, Client, AccessRequest, PlatformAuthorization, Subscription, WebhookEndpoint, etc.
  - SSL: Required in production (`sslmode=require` enforced via env validation)
  - Used for: All application data (NOT OAuth tokens - use Infisical)

**OAuth State Storage:**
- PostgreSQL - Replaced Redis for OAuth state tokens
  - Tables: `OAuthStateToken`, `PkceVerifier`
  - Implementation: `apps/api/src/services/oauth-state.service.ts`
  - Used for: CSRF protection during OAuth flows, PKCE code verifiers
  - TTL: Automatic cleanup of expired tokens

**File Storage:**
- None identified - Application does not store user files
- Images: Remote patterns for Unsplash and Brandfetch (CDN only)

**Caching:**
- In-memory LRU cache - Replaced Redis for general caching
  - Implementation: `apps/api/src/lib/cache.ts`
  - Used for: Agency lookups, platform connections caching
  - TTL: 30-minute default for agency email-based cache

**Job Queue:**
- pg-boss - Postgres-based job queue (replaced BullMQ)
  - Package: `pg-boss` 12.14.0
  - Used for: Background job processing
  - Toggle: `BACKGROUND_WORKERS_ENABLED` env var
  - Implementation: `apps/api/src/lib/job-handlers.ts`

## Authentication & Identity

**Auth Provider:**
- Clerk - Complete authentication solution
  - Implementation: JWT-based authentication with RS256
  - Frontend: `@clerk/nextjs` for session management
  - Backend: `@clerk/backend` `verifyToken()` for JWT verification
  - Middleware: `apps/api/src/middleware/auth.ts`
  - Used for: User authentication, agency member roles, session management
  - Pattern: Verify JWT on every API request, scope queries to user's agency

## Monitoring & Observability

**Error Tracking:**
- Sentry - Error and performance monitoring
  - Frontend: `@sentry/nextjs`
  - Backend: `@sentry/node` with profiling
  - DSN: Configured via `SENTRY_DSN`
  - Webhook integration: For alert-based task creation
  - Test routes: `/test/sentry/error` for integration testing

**Logs:**
- Pino - Structured logging (backend)
  - Package: `pino` 9.6.0
  - Pretty print: `pino-pretty` 13.1.3 (dev)
  - Config: `LOG_LEVEL` env var
  - Used for: Application logging, audit trails

**Audit Logging:**
- Append-only audit log table
  - Table: `AuditLog` in PostgreSQL
  - Fields: action, resourceType, resourceId, userEmail, ipAddress, userAgent
  - Implementation: Logged on all token access, authorization changes
  - Required for: Security compliance, token access tracking

## CI/CD & Deployment

**Hosting:**
- Vercel - Frontend deployment (apps/web)
  - Config: `vercel.json`
  - Build command: `npm run build:web`
  - Output: `apps/web/.next`
  - Headers: Security headers (HSTS, X-Frame-Options, etc.)
  - Redirects: www → non-www, blog post redirects

- Railway - Backend deployment (apps/api)
  - Config: `render.yaml`
  - Build command: Build shared package, then API
  - Start command: `cd apps/api && npm start`
  - Health check: `/health` endpoint

**CI Pipeline:**
- GitHub Actions - Workflow automation
  - Location: `.github/workflows/`
  - Workflows:
    - `dashboard-perf-gate.yml` - Performance gate for dashboard
    - `web-client-perf-gate.yml` - Client-side performance checks
    - `blog-creation-zai.yml` - Automated blog post creation

## Environment Configuration

**Required env vars:**

**Backend (`apps/api/.env`):**
- `DATABASE_URL` - PostgreSQL connection (Neon)
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` - Authentication
- `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET` - Secrets management
- `INFISICAL_PROJECT_ID`, `INFISICAL_ENVIRONMENT` - Infisical config
- `FRONTEND_URL` - CORS origin
- `API_URL` - Backend URL for OAuth callbacks
- `OAUTH_STATE_HMAC_SECRET` - CSRF protection (32-byte hex)

**Platform OAuth Credentials:**
- `META_APP_ID`, `META_APP_SECRET` - Meta/Facebook OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` - LinkedIn OAuth
- `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET` - TikTok OAuth
- `MAILCHIMP_CLIENT_ID`, `MAILCHIMP_CLIENT_SECRET` - Mailchimp OAuth
- `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` - Pinterest OAuth
- `KLAVIYO_CLIENT_ID`, `KLAVIYO_CLIENT_SECRET` - Klaviyo OAuth
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET_KEY` - Shopify OAuth
- `ZAPIER_CLIENT_ID`, `ZAPIER_CLIENT_SECRET` - Zapier OAuth
- `KIT_CLIENT_ID`, `KIT_CLIENT_SECRET` - ConvertKit OAuth
- `BEEHIIV_API_KEY` - Beehiiv team invitations (API key, not OAuth)

**Third-Party Services:**
- `RESEND_API_KEY` - Email service
- `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` - Payments
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` - Error tracking

**Frontend (`apps/web/.env.local`):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk auth
- `CLERK_SECRET_KEY` - Clerk backend (SSO)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend URL
- `NEXT_PUBLIC_META_APP_ID` - Meta OAuth
- `NEXT_PUBLIC_BRANDFETCH_CLIENT_ID` - Logo API
- `NEXT_PUBLIC_CREEM_PUBLISHABLE_KEY` - Payments frontend

**Secrets location:**
- Infisical - OAuth tokens, webhook secrets
- Environment variables - API keys, credentials
- Pattern: Never commit `.env` files (gitignored)

## Webhooks & Callbacks

**Incoming:**
- Creem - Payment webhooks (subscription events, invoices)
  - Endpoint: `/api/webhooks/creem`
  - Secret: `CREEM_WEBHOOK_SECRET`
  - Events: subscription.created, subscription.updated, invoice.paid
  - Implementation: Signature verification

- Sentry - Error alert webhooks
  - Endpoint: Configured in Sentry dashboard
  - Secret: `SENTRY_WEBHOOK_SECRET`
  - Used for: Automated task creation for errors

**Outgoing:**
- Agency webhooks - Custom webhook delivery system
  - Implementation: `WebhookEndpoint`, `WebhookEvent`, `WebhookDelivery` models
  - Config: `WEBHOOK_DELIVERY_TIMEOUT_MS`, `WEBHOOK_MAX_ATTEMPTS`
  - Events: access_granted, access_revoked, token_refreshed, subscription.*
  - Retry: Exponential backoff with max attempts
  - Security: Signature-based verification (HMAC)

**OAuth Callbacks:**
- Platform OAuth redirects - Handle OAuth authorization responses
  - Pattern: `/api/oauth/callback/:platform`
  - CSRF protection: HMAC-signed state tokens via `OAuthStateToken` table
  - PKCE: Code verifier storage for platforms requiring it (Klaviyo)
  - Implementation: `apps/api/src/routes/oauth-callback.routes.ts`

---

*Integration audit: 2026-03-29*
