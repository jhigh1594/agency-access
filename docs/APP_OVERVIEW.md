# Agency Access Platform - Comprehensive Overview

**Purpose:** This document provides a complete description of the Agency Access Platform for brainstorming future improvements, features, and architectural changes with LLMs or stakeholders.

**Last Updated:** 2025-01-20

---

## Executive Summary

The Agency Access Platform is an OAuth aggregation SaaS that streamlines how marketing agencies obtain client access to advertising platforms. It replaces a 2-3 day manual process (emails, password sharing, complex setup instructions) with a 5-minute automated flow where clients click one link and authorize multiple platforms sequentially.

**Value Proposition:**
- **For Agencies:** Save 2-3 days per client onboarding, eliminate credential sharing security risks, get instant API-level access
- **For Clients:** One-click authorization instead of navigating complex platform-specific setup instructions
- **Market Validation:** Competitors (Leadsie, AgencyAccess) prove demand, but gaps exist in security transparency, platform coverage, and pricing simplicity

**Current Status:** MVP in development - core OAuth flow for Meta Ads implemented, additional platforms (Google Ads, GA4, LinkedIn, TikTok, Snapchat) in progress.

---

## Problem Statement

### The Manual Process (Before)

When a marketing agency needs access to a client's advertising accounts, the current process involves:

1. **Agency sends instructions** via email with platform-specific setup guides
2. **Client confusion** - different steps for each platform (Meta Business Manager, Google Ads, LinkedIn, etc.)
3. **Password sharing** - insecure credential exchange via email/Slack
4. **Multiple back-and-forth emails** - clarifying permissions, troubleshooting access issues
5. **Time delay** - 2-3 days average before agency can start work
6. **Security risks** - credentials stored in email threads, shared passwords
7. **Ongoing maintenance** - token expiration requires repeating the process

### The Automated Solution (After)

1. **Agency creates branded access request** (2 minutes) - selects platforms, customizes branding
2. **Client receives one link** - clicks and sees branded authorization page
3. **Sequential OAuth flow** - client authorizes each platform through standard OAuth (no passwords)
4. **Instant access** - agency receives API tokens immediately after authorization
5. **Automated token refresh** - background jobs keep tokens fresh without client intervention
6. **Complete audit trail** - all access events logged for security compliance

**Time Savings:** 2-3 days → 5 minutes (99% reduction)

---

## Core Features

### 1. Multi-Platform OAuth Authorization

**Supported Platforms:**
- **Meta:** Facebook Ads, Instagram Ads, Facebook Pages
- **Google:** Google Ads, Google Analytics 4 (GA4), Google Tag Manager
- **LinkedIn:** LinkedIn Ads, Company Pages
- **TikTok:** TikTok Ads
- **Snapchat:** Snapchat Ads

**How It Works:**
- Agency selects which platforms to request access for
- Client clicks single link and authorizes each platform sequentially
- Each platform uses standard OAuth 2.0 flow (no password sharing)
- Tokens stored securely in Infisical (secrets management), never in database
- Agency receives instant API-level access after authorization

**Technical Implementation:**
- Platform connectors in `apps/api/src/services/connectors/`
- Each connector implements `PlatformConnector` interface:
  - `getAuthUrl()` - Generate OAuth authorization URL
  - `exchangeCode()` - Exchange authorization code for tokens
  - `refreshToken()` - Refresh expired tokens
  - `verifyToken()` - Validate token health
  - `getUserInfo()` - Retrieve platform user/business info

### 2. Secure Token Storage

**Security Model:**
- **NEVER store tokens in PostgreSQL** - critical security requirement
- All OAuth tokens stored in **Infisical** (secrets management service)
- Database stores only `secretId` (reference to Infisical secret)
- Tokens retrieved only when needed for API calls
- All token access logged in `AuditLog` table

**Token Lifecycle:**
1. Client authorizes platform → OAuth code received
2. Code exchanged for access + refresh tokens
3. Tokens stored in Infisical with secret name: `{platform}_{connectionId}_{platform}`
4. Database record created with `secretId` only
5. Background job refreshes tokens 7 days before expiration
6. Manual refresh available from agency dashboard

**Audit Trail:**
- Every token access logged: `token_viewed`, `access_granted`, `access_revoked`
- Includes: user email, IP address, timestamp, action type, metadata
- Append-only log (never deleted) for security compliance

### 3. Real-Time Token Health Dashboard

**Features:**
- Visual status indicators: Green (healthy >7 days), Yellow (expiring 1-7 days), Red (expired), Gray (unknown)
- Expiration countdown: "59 days", "2 days", "23 hours"
- Last refreshed timestamp: "2 hours ago", "Yesterday"
- Manual refresh button: Force immediate token refresh
- Filtering: By client, platform, or status
- Sorting: By expiration date (soonest first)

**Status Calculation:**
- Healthy: Token expires >7 days from now
- Expiring: Token expires 1-7 days from now
- Expired: Token expiration date passed
- Unknown: Token never refreshed or metadata missing

### 4. Access Request Templates

**Purpose:** Reusable configurations for common client types

**Template Components:**
- **Platform Selection:** Pre-configured platform combinations (e.g., "Ecommerce Standard" = Meta Ads + Google Ads + GA4)
- **Intake Fields:** Custom form fields to collect client information
- **Branding:** Logo, colors, subdomain
- **Default Template:** One template can be marked as default per agency

**Use Cases:**
- "Ecommerce Client" template: Meta Ads, Google Ads, GA4, custom fields for website, monthly budget
- "B2B Client" template: LinkedIn Ads, Google Ads, different intake fields
- "Local Business" template: Meta Ads only, simplified intake form

### 5. Custom Intake Forms

**Purpose:** Collect client information during authorization (eliminates separate email threads)

**Field Types:**
- Text, Email, Phone, URL, Number, Textarea, Dropdown
- Required/Optional toggle
- Custom labels and placeholders
- Drag-and-drop reordering

**Default Fields:**
- Company Name (text, required)
- Website (URL, optional)
- Timezone (dropdown, optional)

**Storage:**
- Form schema stored in `AccessRequest.intakeFields` as JSON
- Client responses stored in `IntakeResponse` table (linked to access request)
- Immutable after submission (client must contact agency to update)

### 6. White-Label Branding

**Customization Options:**
- **Logo Upload:** PNG, JPG, SVG (max 2MB, recommended 500x150px)
- **Primary Color:** Hex code or color picker
- **Subdomain:** Custom subdomain for branded URLs (e.g., `growthmedia.agencyplatform.com`)

**Client Experience:**
- Authorization page displays agency logo and colors
- Branded email notifications
- Seamless white-label experience (clients don't see "Agency Platform" branding)

**Implementation:**
- Branding config stored in `AccessRequest.branding` JSON field
- Subdomain routing in Next.js (planned)
- Email templates use agency branding

### 7. Automated Token Refresh

**Background Jobs:**
- BullMQ job runs every 6 hours
- Queries for tokens expiring within 7 days
- Calls platform connector's `refreshToken()` method
- Updates Infisical with new tokens
- Updates database `lastRefreshedAt` timestamp
- Logs refresh event in `AuditLog`

**Failure Handling:**
- Retry with exponential backoff (1 min, 5 min, 30 min)
- After 3 failed attempts: Alert email to agency
- Mark token as "expired" if all retries fail
- Agency can manually refresh from dashboard

**Refresh Window:**
- 7 days before expiration (configurable via env var)
- Provides buffer for retry failures
- Prevents service interruption

### 8. Role-Based Access Control

**Agency Member Roles:**
- **Admin:** Full access (create, edit, delete, manage team, view all connections)
- **Member:** Create and manage access requests, view connections, refresh tokens
- **Viewer:** Read-only access to dashboard and token health

**Implementation:**
- `AgencyMember` model with `role` field
- Unique constraint: `agencyId + email` (one role per email per agency)
- Backend middleware enforces role permissions
- Frontend UI shows/hides features based on role

### 9. Two Authorization Models

**1. Client Authorization (Default)**
- Client authorizes their own platform accounts to the agency
- Client clicks OAuth link, logs into platform, grants access
- Tokens stored in `PlatformAuthorization` linked to `ClientConnection`
- Use case: Agency needs access to client's existing ad accounts

**2. Delegated Access**
- Agency grants access to client using agency's own platform connection
- Requires agency to have `AgencyPlatformConnection` for the platform
- Agency delegates specific permissions/accounts to client
- Tokens stored in `AgencyPlatformConnection`, referenced by access request
- Use case: Agency manages ads from their own account, gives client view-only access

**Implementation:**
- `AccessRequest.authModel` field determines which flow to use
- Frontend and backend handle both flows differently
- UI adapts based on authorization model

### 10. Client Asset Selection

**Purpose:** After OAuth authorization, client selects which specific assets to share

**Asset Types (Platform-Specific):**
- **Meta:** Ad Accounts, Facebook Pages, Instagram Accounts
- **Google:** Google Ads Accounts, GA4 Properties, Tag Manager Containers
- **LinkedIn:** Ad Accounts, Company Pages

**Flow:**
1. Client completes OAuth for platform
2. Backend fetches all accessible assets via platform API
3. Client sees list of assets with checkboxes
4. Client selects which assets to grant access to
5. Selected assets stored in `ClientConnection.grantedAssets` JSON field

**Storage Format:**
```json
{
  "adAccounts": [
    { "id": "act_123", "name": "Acme Ecommerce" }
  ],
  "pages": [
    { "id": "123456789", "name": "Acme Company Page" }
  ]
}
```

---

## Technical Architecture

### Monorepo Structure

**Three Packages:**
- `apps/web/` - Next.js 16 frontend (App Router, TypeScript, TailwindCSS, Clerk auth)
- `apps/api/` - Fastify backend (TypeScript, Prisma, PostgreSQL, BullMQ, Redis)
- `packages/shared/` - Shared TypeScript types and Zod schemas

**Benefits:**
- Shared types ensure frontend/backend type safety
- Single repository for all code
- Coordinated deployments
- Hot reload works across packages

### Frontend Stack (`apps/web`)

**Framework:** Next.js 16 with App Router
- Server Components for initial data fetching
- Client Components for interactivity
- API routes for server-side logic

**UI Library:** shadcn/ui + TailwindCSS
- Pre-built accessible components
- Customizable design system
- Dark mode support (planned)

**State Management:**
- **Server State:** TanStack Query (React Query) for API data
- **Client State:** React Context + useState for UI state
- **Form State:** React Hook Form with Zod validation

**Authentication:** Clerk
- Pre-built sign-in/sign-up UI
- JWT tokens for API authentication
- User management and session handling

**Deployment:** Vercel
- Automatic deployments from main branch
- Environment variables in Vercel dashboard
- Edge functions for API routes

### Backend Stack (`apps/api`)

**Framework:** Fastify
- High-performance HTTP server
- Plugin ecosystem (@fastify/cors, @fastify/jwt)
- TypeScript-first design

**Database:** PostgreSQL (Neon) + Prisma ORM
- Type-safe database queries
- Migration management
- Prisma Studio for database inspection

**Background Jobs:** BullMQ + Redis (Upstash)
- Token refresh jobs
- Cleanup jobs (expired access requests)
- OAuth state management (CSRF protection)

**Secrets Management:** Infisical
- Machine Identity authentication
- Encrypted token storage
- Project-based organization

**Authentication:** @clerk/backend
- JWT verification middleware
- User authentication on every API request
- Role-based access control

**Deployment:** Railway
- Environment variables via Railway CLI
- Automatic deployments
- PostgreSQL and Redis as external services

### Database Schema

**Core Models (9 total):**

1. **Agency** - Marketing agencies using the platform
   - Fields: name, email, subscriptionTier, settings, notificationEmail
   - Relations: members, accessRequests, connections, auditLogs, platformConnections, clients, templates

2. **AgencyMember** - Team members with roles
   - Fields: email, role (admin/member/viewer)
   - Unique: agencyId + email

3. **AgencyPlatformConnection** - Agency's own OAuth connections
   - Fields: platform, secretId, status, expiresAt, connectionMode (oauth/identity)
   - Unique: agencyId + platform
   - Used for delegated_access authorization model

4. **Client** - Reusable client profiles
   - Fields: name, company, email, website, language (en/es/nl)
   - Unique: agencyId + email

5. **AccessRequestTemplate** - Reusable templates
   - Fields: name, platforms (JSON), intakeFields (JSON), branding (JSON), isDefault
   - Unique: agencyId + name

6. **AccessRequest** - Access requests sent to clients
   - Fields: clientName, clientEmail, platforms (JSON), authModel, status, uniqueToken, expiresAt, intakeFields (JSON), branding (JSON)
   - Unique: uniqueToken

7. **ClientConnection** - Active client connections (after authorization)
   - Fields: clientEmail, status, grantedAssets (JSON)
   - Relations: accessRequest, authorizations

8. **PlatformAuthorization** - Per-platform OAuth tokens
   - Fields: platform, secretId, expiresAt, lastRefreshedAt, status, metadata (JSON)
   - Unique: connectionId + platform
   - **Critical:** Only stores `secretId`, never actual tokens

9. **AuditLog** - Security audit trail
   - Fields: userEmail, action, resourceType, resourceId, metadata (JSON), ipAddress, userAgent
   - Append-only (never deleted)

10. **AuthorizationVerification** - Platform-native identity verification tracking
    - Fields: platform, status, attempts, verifiedPermissions (JSON), errorMessage
    - Used for verifying delegated access permissions

### Shared Types (`packages/shared`)

**Purpose:** Type-safe communication between frontend and backend

**Key Types:**
- `Platform` - Enum of supported platforms (meta_ads, google_ads, ga4, etc.)
- `AccessRequestStatus` - pending, partial, completed, expired, revoked
- `PLATFORM_NAMES` - Human-readable platform names
- `PLATFORM_SCOPES` - OAuth scopes per platform

**Usage:**
```typescript
// Both apps import the same types
import { Platform, AccessRequestStatus } from '@agency-platform/shared';
```

### API Response Pattern

**Consistent Response Shape:**
```typescript
// Success
{
  data: T  // The actual response data
}

// Error
{
  error: {
    code: string;      // Machine-readable (e.g., 'INVALID_TOKEN')
    message: string;   // Human-readable
    details?: any;     // Optional additional context
  }
}
```

**Common Error Codes:**
- `INVALID_TOKEN` - OAuth token invalid or expired
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `PLATFORM_ERROR` - External platform API error

---

## User Flows

### Flow 1: Agency Creates Access Request

**Goal:** Agency creates a branded authorization link to send to a new client

**Steps:**
1. Agency user logs in via Clerk → Dashboard shows existing clients and "New Request" CTA
2. User clicks "New Request" → Multi-step form displays
3. **Step 1 - Client Info:** Enter client name, email → System validates email format
4. **Step 2 - Platforms:** Select platforms from checklist (Meta, Google, TikTok, LinkedIn, Snapchat) → System shows platform icons and suggested access levels
5. **Step 3 - Intake Form:** Add custom form fields (company name, website, timezone, etc.) → System provides field type options
6. **Step 4 - Branding:** Upload logo, select colors, review subdomain → System shows live preview
7. User clicks "Create Request" → System generates unique token, saves to database, returns shareable link
8. **End state:** User has branded URL (`agency.agencyplatform.com/invite/abc123`) ready to send to client

**Key Decisions:**
- Platform selection: Which platforms to request access for
- Access level: Manage vs. view-only access per platform
- Intake fields: What additional information to collect from client
- Branding: Logo, colors, subdomain customization

### Flow 2: Client Authorizes Access

**Goal:** Client clicks link and completes OAuth authorization for all requested platforms

**Steps:**
1. Client receives email with branded link → Client clicks link
2. System validates unique token → System displays branded authorization page with agency logo and colors
3. **Step 1 - Intake Form:** Client fills out custom form fields → System validates required fields
4. **Step 2 - Platform Authorization:** System shows OAuth buttons for each selected platform
5. Client clicks "Authorize Meta" → System redirects to Meta OAuth consent screen
6. Client grants permissions → Meta redirects back with authorization code
7. System exchanges code for tokens → System stores tokens in Infisical, creates `PlatformAuthorization` record with `secretId`
8. System marks Meta as "Authorized" in UI → Repeat steps 5-7 for each platform
9. **Step 3 - Asset Selection (if applicable):** Backend fetches accessible assets, client selects which to share
10. **Step 4 - Confirmation:** System shows thank you page with summary of granted access
11. **End state:** Agency receives notification, tokens are stored securely, client can close browser

**Key Decisions:**
- OAuth flow: Client logs in directly with platform credentials
- Asset selection: Client chooses which specific accounts/assets to share
- Intake completion: Client must complete intake form before proceeding to OAuth

### Flow 3: Agency Views Token Health

**Goal:** Agency monitors the health and expiration status of all client connections

**Steps:**
1. User navigates to "Token Health" dashboard → System fetches all `PlatformAuthorization` records
2. For each record, System retrieves token metadata from Infisical → System calculates health status
3. System displays table with columns: Client, Platform, Status, Expires In, Last Refreshed, Actions
4. **Status badges:** Green (healthy, >7 days), Yellow (expiring soon, 1-7 days), Red (expired), Gray (unknown)
5. User sees "Meta Ads - Expiring in 2 days" → User clicks "Refresh Now" button
6. System queues immediate refresh job → System shows loading state
7. Job completes → System updates status to "Healthy, expires in 59 days" → System logs refresh in `AuditLog`
8. **End state:** User has visibility into all connection health and can manually trigger refreshes

**Key Decisions:**
- Status calculation: System determines health based on expiration proximity
- Manual refresh: User can force immediate refresh instead of waiting for automated job

### Flow 4: Automated Token Refresh (Background Job)

**Goal:** System automatically refreshes tokens before they expire without user intervention

**Steps:**
1. BullMQ job runs every 6 hours → Job queries for tokens expiring within 7 days
2. For each expiring token, Job calls connector's `refreshToken()` method with refresh token from Infisical
3. Platform returns new access token → Job updates Infisical with new token and expiration
4. Job updates `PlatformAuthorization.lastRefreshedAt` timestamp → Job logs refresh event in `AuditLog`
5. Job sends agency notification (optional, configurable) → Agency knows refresh occurred
6. **End state:** Tokens stay fresh, agencies don't experience interrupted access

**Key Decisions:**
- Refresh window: Refresh tokens 7 days before expiration to allow retry failures
- Failure handling: If refresh fails, retry with exponential backoff, alert agency after 3 failures

---

## Platform Integrations

### Meta (Facebook/Instagram)

**Products Supported:**
- Facebook Ads Manager
- Instagram Ads
- Facebook Pages
- Instagram Business Accounts

**OAuth Flow:**
1. Short-lived token (1-2 hours) from initial OAuth
2. Exchange for 60-day long-lived token via `getLongLivedToken()`
3. Refresh token valid for 60 days
4. Store Business Manager ID and Ad Account IDs in metadata

**Special Requirements:**
- Requires Meta App ID and App Secret
- Business Manager setup for partner access
- Asset selection: Ad Accounts, Pages, Instagram Accounts

**Connector:** `apps/api/src/services/connectors/meta.ts`

### Google (Ads, Analytics, Tag Manager)

**Products Supported:**
- Google Ads
- Google Analytics 4 (GA4)
- Google Tag Manager

**OAuth Flow:**
1. Standard OAuth 2.0 flow
2. Refresh token doesn't expire (unless revoked)
3. Store Google Account ID and product-specific IDs in metadata

**Special Requirements:**
- Requires Google Cloud Console OAuth credentials
- Google Ads requires `developer-token` header for all API calls
- Asset selection: Google Ads Accounts, GA4 Properties, Tag Manager Containers

**Connector:** `apps/api/src/services/connectors/google.ts`, `google-ads.ts`, `ga4.ts`

### LinkedIn

**Products Supported:**
- LinkedIn Ads (Campaign Manager)
- LinkedIn Company Pages

**OAuth Flow:**
1. Standard OAuth 2.0 flow
2. Refresh token valid for 60 days
3. Store LinkedIn Company ID and Ad Account IDs in metadata

**Special Requirements:**
- Requires LinkedIn App credentials
- Partner access model for ad accounts
- Asset selection: Ad Accounts, Company Pages

**Connector:** `apps/api/src/services/connectors/linkedin.ts` (planned)

### TikTok

**Products Supported:**
- TikTok Ads Manager

**OAuth Flow:**
1. Standard OAuth 2.0 flow
2. Refresh token valid for 30 days
3. Store TikTok Advertiser ID in metadata

**Special Requirements:**
- Requires TikTok for Business App credentials
- Asset selection: Ad Accounts

**Connector:** `apps/api/src/services/connectors/tiktok.ts` (planned)

### Snapchat

**Products Supported:**
- Snapchat Ads Manager

**OAuth Flow:**
1. Standard OAuth 2.0 flow
2. Refresh token valid for 60 days
3. Store Snapchat Ad Account ID in metadata

**Special Requirements:**
- Requires Snapchat Ads API credentials
- Asset selection: Ad Accounts

**Connector:** `apps/api/src/services/connectors/snapchat.ts` (planned)

---

## Security Model

### Token Storage Security

**Critical Rule:** NEVER store OAuth tokens directly in PostgreSQL

**Implementation:**
1. All tokens stored in Infisical (encrypted secrets management)
2. Database stores only `secretId` (reference to Infisical secret)
3. Tokens retrieved only when needed for API calls
4. Secret naming pattern: `{platform}_{connectionId}_{platform}`

**Infisical Configuration:**
- Machine Identity authentication (`INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`)
- Project-based organization (`INFISICAL_PROJECT_ID`, `INFISICAL_ENVIRONMENT`)
- Environment separation: dev, staging, prod

### Audit Logging

**Purpose:** Complete security audit trail for compliance and troubleshooting

**Logged Events:**
- `token_viewed` - Agency user views token details
- `access_granted` - Client completes OAuth authorization
- `access_revoked` - Agency or client revokes access
- `AGENCY_CONNECTED` - Agency connects their own platform account
- `AGENCY_DISCONNECTED` - Agency disconnects platform account
- `AGENCY_TOKEN_REFRESHED` - Token refresh job completes

**Log Fields:**
- `userEmail` - Email of user who performed action
- `ipAddress` - IP address of request
- `userAgent` - Browser/client information
- `metadata` - Additional context (JSON)
- `createdAt` - Timestamp

**Storage:**
- `AuditLog` table (append-only, never deleted)
- Indexed by `agencyId` and `createdAt` for fast queries

### Authentication & Authorization

**Agency Authentication:**
- Clerk handles all user authentication
- JWT tokens verified on every API request
- Backend middleware: `apps/api/src/lib/clerk.ts`

**Role-Based Access Control:**
- Admin: Full access (create, edit, delete, manage team)
- Member: Create and manage access requests, view connections
- Viewer: Read-only access to dashboard

**Client Authentication:**
- Clients are anonymous users
- Access via one-time unique token links
- No client accounts or login required

### OAuth State Management

**CSRF Protection:**
- OAuth state stored in Redis with TTL
- State validated on callback to prevent CSRF attacks
- Service: `apps/api/src/services/oauth-state.service.ts`

**State Format:**
- Unique state per OAuth request
- Links to `AccessRequest.uniqueToken`
- Expires after 10 minutes (configurable)

### Access Request Expiration

**Default Expiration:** 7 days from creation

**Purpose:**
- Prevents stale links from being used
- Security measure (time-limited access)

**Handling:**
- Expired requests show friendly error page
- Agency can create new request if needed
- Expired requests cannot be completed

---

## Current Implementation Status

### Completed Features

✅ **Foundation:**
- Monorepo structure with npm workspaces
- Database schema (9 models) with Prisma
- Shared TypeScript types package
- Clerk authentication (frontend + backend)
- Infisical integration for token storage
- BullMQ + Redis for background jobs

✅ **Meta OAuth:**
- Meta connector implementation
- OAuth flow (authorization → code exchange → token storage)
- Long-lived token exchange
- Asset selection (Ad Accounts, Pages, Instagram)

✅ **Core API:**
- Access request creation
- Client authorization flow
- Token health monitoring
- Manual token refresh

✅ **Frontend:**
- Agency dashboard (basic)
- Access request creation form
- Client authorization page (branded)
- Token health dashboard

### In Progress

🔄 **Additional Platforms:**
- Google Ads connector (partial)
- GA4 connector (partial)
- LinkedIn connector (planned)
- TikTok connector (planned)
- Snapchat connector (planned)

🔄 **Features:**
- Access request templates
- Custom intake forms (UI complete, backend in progress)
- White-label branding (partial)
- Automated token refresh jobs
- Role-based access control (backend complete, frontend in progress)

### Planned (Not Started)

❌ **Secondary Features:**
- Webhooks for external automations
- Multi-language support (Spanish, French, German, Portuguese)
- Embed capability (iframe/script tag)
- Subdomain routing for white-label URLs

❌ **Future Considerations:**
- API access for programmatic integration
- Zapier integration
- Asset creation scaffolding (help clients create Meta Business Manager)
- Access Detective tool (troubleshooting forgotten admin access)
- Mobile app (not planned - responsive web sufficient)

---

## Key Design Decisions

### 1. Token Storage: Infisical vs. Database

**Decision:** Store all OAuth tokens in Infisical, never in PostgreSQL

**Rationale:**
- Security best practice (encrypted secrets management)
- Compliance requirements (SOC 2, GDPR)
- Separation of concerns (database for metadata, Infisical for secrets)
- Audit trail (all token access logged)

**Trade-offs:**
- Additional service dependency (Infisical)
- Slightly slower token retrieval (API call vs. database query)
- Cost consideration (Infisical pricing)

### 2. Monorepo Structure

**Decision:** Single repository with npm workspaces

**Rationale:**
- Shared types ensure frontend/backend type safety
- Coordinated deployments
- Easier development (hot reload across packages)
- Single source of truth

**Trade-offs:**
- Larger repository size
- All packages must use compatible dependency versions

### 3. Two Authorization Models

**Decision:** Support both client_authorization and delegated_access

**Rationale:**
- Different agency workflows require different models
- Client authorization: Agency needs access to client's accounts
- Delegated access: Agency manages from their own account, gives client view access

**Trade-offs:**
- Increased complexity in UI and backend
- More code paths to test and maintain

### 4. Access Request Expiration

**Decision:** All access requests expire after 7 days

**Rationale:**
- Security measure (time-limited links)
- Prevents stale links from being used
- Encourages agencies to create fresh requests

**Trade-offs:**
- Agencies must recreate requests if client doesn't complete in time
- Potential friction if client needs more time

### 5. No Client Accounts

**Decision:** Clients are anonymous users, no login required

**Rationale:**
- Simpler user experience (no account creation)
- Faster onboarding (click link and authorize)
- Reduced complexity (no client authentication system)

**Trade-offs:**
- Clients cannot view their connected agencies
- Clients cannot revoke access themselves (must contact agency)
- No client dashboard or history

### 6. Platform Connector Pattern

**Decision:** Each platform has its own connector class implementing `PlatformConnector` interface

**Rationale:**
- Clean separation of concerns
- Easy to add new platforms (copy template, implement methods)
- Testable (each connector can be tested independently)
- Consistent API across platforms

**Trade-offs:**
- Some code duplication (similar OAuth flows)
- Platform-specific quirks require custom handling

---

## Data Flow Examples

### Example 1: Agency Creates Access Request

```
1. Agency user fills form → Frontend validates
2. POST /api/access-requests → Backend validates with Zod
3. Generate uniqueToken (12 characters)
4. Create AccessRequest record in database
5. Return shareable URL: {subdomain}.agencyplatform.com/invite/{token}
6. Agency copies link and sends to client
```

**Database State:**
- `AccessRequest` record created with status='pending'
- `uniqueToken` stored for lookup
- `platforms` JSON: `[{platform: 'meta_ads', accessLevel: 'manage'}]`
- `intakeFields` JSON: `[{label: 'Company Website', type: 'url', required: true}]`
- `branding` JSON: `{logoUrl: '...', primaryColor: '#6366f1', subdomain: 'growthmedia'}`

### Example 2: Client Completes OAuth

```
1. Client clicks link → GET /api/access-requests/{token}
2. Backend validates token, returns request details
3. Client fills intake form → POST /api/intake-responses
4. Client clicks "Authorize Meta" → GET /api/oauth/meta/authorize?token={token}
5. Backend generates OAuth URL → Redirect to Meta
6. Client grants permissions → Meta redirects to /api/oauth/meta/callback?code=...
7. Backend exchanges code for tokens → Meta returns access + refresh tokens
8. Store tokens in Infisical → Get secretId
9. Create PlatformAuthorization record with secretId only
10. Create ClientConnection record
11. Update AccessRequest status to 'completed'
12. Log event in AuditLog
13. Return success to client → Show confirmation page
```

**Infisical State:**
- Secret name: `meta_connection_123_meta_ads`
- Secret value (JSON):
  ```json
  {
    "accessToken": "EAABwz...",
    "refreshToken": "EAABwz...",
    "expiresAt": "2025-03-15T10:30:00Z",
    "grantedAt": "2025-01-15T10:30:00Z"
  }
  ```

**Database State:**
- `PlatformAuthorization` record: `{secretId: 'meta_connection_123_meta_ads', platform: 'meta_ads'}`
- `ClientConnection` record: `{status: 'active', clientEmail: 'john@acme.com'}`
- `AccessRequest` record: `{status: 'completed', authorizedAt: '2025-01-15T10:30:00Z'}`
- `AuditLog` record: `{action: 'access_granted', userEmail: 'john@acme.com', ipAddress: '1.2.3.4'}`

### Example 3: Token Refresh

```
1. BullMQ job runs every 6 hours → Query tokens expiring within 7 days
2. For each token: Retrieve refreshToken from Infisical
3. Call platform connector.refreshToken(refreshToken)
4. Platform returns new accessToken + expiration
5. Update Infisical secret with new tokens
6. Update PlatformAuthorization.lastRefreshedAt
7. Log event in AuditLog: action='AGENCY_TOKEN_REFRESHED'
```

**Infisical State (Updated):**
- Same secret name: `meta_connection_123_meta_ads`
- Updated secret value:
  ```json
  {
    "accessToken": "EAABwz_NEW...",
    "refreshToken": "EAABwz...",  // Same refresh token
    "expiresAt": "2025-05-15T10:30:00Z",  // New expiration
    "grantedAt": "2025-01-15T10:30:00Z",
    "lastRefreshedAt": "2025-01-20T10:30:00Z"
  }
  ```

**Database State:**
- `PlatformAuthorization` record: `{lastRefreshedAt: '2025-01-20T10:30:00Z', expiresAt: '2025-05-15T10:30:00Z'}`
- `AuditLog` record: `{action: 'AGENCY_TOKEN_REFRESHED', triggeredBy: 'system', metadata: {platform: 'meta_ads'}}`

---

## Environment Configuration

### Backend (`apps/api/.env`)

**Required Variables:**
```bash
# Core
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...          # Neon PostgreSQL
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001

# Authentication
CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
CLERK_SECRET_KEY=sk_live_your_secret_key_here

# Token Storage
INFISICAL_CLIENT_ID=                   # Machine Identity
INFISICAL_CLIENT_SECRET=               # Machine Identity
INFISICAL_PROJECT_ID=                  # Project UUID
INFISICAL_ENVIRONMENT=dev              # dev, staging, prod

# Redis/BullMQ
REDIS_URL=redis://localhost:6379      # Upstash or local

# Platform OAuth (add for each platform)
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Logging
LOG_LEVEL=info                         # debug, info, warn, error
```

### Frontend (`apps/web/.env.local`)

**Required Variables:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
CLERK_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Deployment

### Frontend (Vercel)

**Process:**
1. Connect GitHub repository to Vercel
2. Set build directory to `apps/web`
3. Configure environment variables in Vercel dashboard
4. Automatic deployments from main branch

**Environment Variables:**
- All `NEXT_PUBLIC_*` variables must be set in Vercel
- `CLERK_SECRET_KEY` for server-side API routes

### Backend (Railway)

**Process:**
1. Connect GitHub repository to Railway
2. Set root directory to `apps/api`
3. Configure environment variables via Railway CLI or dashboard
4. Railway detects Fastify server and starts automatically

**Environment Variables:**
- All backend env vars must be set in Railway
- `DATABASE_URL` from Neon
- `REDIS_URL` from Upstash
- Platform OAuth credentials

**Database & Redis:**
- PostgreSQL: Neon (external service)
- Redis: Upstash (external service)
- Connection strings configured in Railway env vars

---

## Known Limitations & Future Improvements

### Current Limitations

1. **Platform Coverage:** Only Meta fully implemented, others in progress
2. **Token Refresh:** Automated jobs not fully tested in production
3. **White-Label:** Subdomain routing not implemented (planned)
4. **Templates:** UI exists but backend integration incomplete
5. **Intake Forms:** Backend storage incomplete
6. **Multi-Language:** Not implemented (planned)
7. **Webhooks:** Not implemented (planned)
8. **API Access:** No programmatic API for agencies (planned v2)

### Future Improvements (Ideas for Brainstorming)

**Product Features:**
- [ ] Bulk access request creation (CSV upload)
- [ ] Access request scheduling (send link at future date)
- [ ] Client self-service portal (view connected agencies, revoke access)
- [ ] Advanced analytics dashboard (authorization rates, platform popularity)
- [ ] Custom OAuth scopes per platform (granular permission control)
- [ ] Access request reminders (email client if not completed)
- [ ] Team collaboration features (comments, notes on access requests)
- [ ] Integration marketplace (Zapier, Make.com, n8n)

**Technical Improvements:**
- [ ] GraphQL API for flexible data queries
- [ ] Real-time updates via WebSockets (token health changes)
- [ ] Advanced caching strategy (Redis for frequently accessed data)
- [ ] Database query optimization (indexes, connection pooling)
- [ ] Rate limiting (prevent abuse)
- [ ] API versioning (v1, v2 endpoints)
- [ ] Comprehensive test coverage (unit, integration, E2E)
- [ ] Performance monitoring (Sentry, Datadog)
- [ ] A/B testing framework for UI improvements

**Security Enhancements:**
- [ ] IP whitelisting for agency accounts
- [ ] 2FA for agency accounts (Clerk supports this)
- [ ] Token rotation policies (force refresh after X days)
- [ ] Advanced audit log analytics (anomaly detection)
- [ ] Security scanning (dependency vulnerabilities)
- [ ] Penetration testing (third-party security audit)

**Platform Expansions:**
- [ ] Twitter/X Ads
- [ ] Pinterest Ads
- [ ] Amazon Ads
- [ ] Microsoft Advertising (Bing Ads)
- [ ] Reddit Ads
- [ ] YouTube Ads (separate from Google Ads)
- [ ] Shopify (store access)
- [ ] Stripe (payment data access)

**Enterprise Features:**
- [ ] SSO/SAML for agency authentication
- [ ] Custom domain support (agency.com instead of subdomain)
- [ ] Advanced role permissions (custom roles)
- [ ] Multi-currency billing
- [ ] Invoice generation
- [ ] SLA guarantees
- [ ] Dedicated support channels

---

## Competitive Landscape

### Leadsie

**Strengths:**
- 31+ platforms supported
- Credit-based pricing model
- Established market presence

**Weaknesses:**
- Limited security transparency
- Complex pricing structure
- Less focus on white-label branding

### AgencyAccess

**Strengths:**
- 20+ platforms supported
- Flat pricing model (simpler)
- Intake forms included

**Weaknesses:**
- Less security transparency
- Limited customization options
- No automated token refresh

### Our Differentiation

1. **Security First:** Complete audit trail, Infisical token storage, transparent security model
2. **Developer-Friendly:** Well-documented API, extensible connector pattern
3. **White-Label:** Full branding customization, subdomain support
4. **Automated:** Token refresh jobs, no manual intervention needed
5. **Modern Stack:** Next.js 16, TypeScript, type-safe architecture

---

## Success Metrics

### Key Performance Indicators (KPIs)

**Adoption Metrics:**
- Number of agencies using platform
- Number of access requests created per month
- Average platforms per access request
- Client authorization completion rate

**Performance Metrics:**
- Average time from request creation to authorization completion
- Token refresh success rate
- API response times
- Uptime percentage

**Business Metrics:**
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Customer lifetime value (LTV)
- Churn rate

**Technical Metrics:**
- OAuth success rate (authorization completion)
- Token refresh failure rate
- Error rate by platform
- Database query performance

---

## Conclusion

The Agency Access Platform is a modern, secure OAuth aggregation SaaS that solves a real pain point for marketing agencies. By automating the 2-3 day manual process into a 5-minute flow, we save agencies significant time while improving security and user experience.

**Current State:** MVP in development with Meta OAuth fully functional, additional platforms in progress.

**Next Steps:** Complete platform connectors, polish UI/UX, add secondary features (templates, intake forms, branding), deploy to production, onboard pilot agencies.

**Future Vision:** Become the industry standard for agency-client OAuth aggregation, expand to 20+ platforms, add enterprise features, build integration marketplace.

---

**Document Purpose:** This overview is designed for brainstorming future improvements, features, and architectural changes. Use it as context when discussing enhancements with LLMs, stakeholders, or team members.

**Questions to Consider:**
- What features would make agencies choose us over competitors?
- How can we improve the client authorization experience?
- What technical improvements would scale better?
- What security enhancements would enterprise customers require?
- How can we expand platform coverage efficiently?
