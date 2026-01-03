# AI Coding Agent PRD Template

---

## Instructions for AI Coding Agent

**Before building, follow this process:**

1. Read this entire document to understand scope and constraints
2. Ask clarifying questions if any requirements are ambiguous or conflicting
3. Propose your implementation approach and get approval before coding
4. Build in phases, pausing for verification at each checkpoint
5. After each phase, summarize what was built and confirm before proceeding

**Building principles:**
- Follow the technical constraints exactly—don't introduce new dependencies without asking
- When requirements conflict, ask rather than assume
- Build the simplest solution that meets the acceptance criteria
- Include error handling and edge cases only where specified (don't over-engineer)
- If you're unsure, ask. If you make an assumption, state it explicitly.

---

## Project Overview

### What We're Building

An OAuth aggregation platform that enables marketing agencies to collect client access credentials across multiple advertising platforms (Meta, Google, TikTok, LinkedIn, and others) through a single branded authorization link. Agencies create access requests specifying which platforms they need, clients click one link to authorize all platforms via OAuth, and agencies receive instant API-level access without manual back-and-forth emails or password exchanges. The platform securely stores OAuth tokens using Infisical secrets management (never in the database), provides real-time token health monitoring, and includes intake forms for collecting additional client information during onboarding.

### Why We're Building It

Marketing agencies currently spend 2-3 days and countless back-and-forth emails to obtain client access to advertising platforms. This delays campaign launches, frustrates clients with technical setup instructions, and creates security risks when credentials are shared via email/chat. Competitors (Leadsie, AgencyAccess) prove this is a validated market but leave gaps in security transparency, platform coverage, and pricing simplicity.

### Success Looks Like

An agency can create a branded access request link in under 2 minutes, send it to a client, and receive fully authenticated API access to multiple platforms within 5 minutes—replacing what was previously a 2-3 day manual process. The agency dashboard shows real-time token health status, expiration countdowns, and automated refresh job status. Security-conscious enterprises can review detailed architecture documentation confirming all tokens are encrypted in Infisical with comprehensive audit logging.

---

## Technical Constraints

### Stack & Environment

| Constraint | Value |
|------------|-------|
| **Language** | TypeScript 5.x |
| **Runtime** | Node 20+ (backend), Bun/Node (frontend) |
| **Frontend Framework** | Next.js 16 with App Router |
| **Backend Framework** | Fastify |
| **UI Library** | shadcn/ui + TailwindCSS |
| **Database** | PostgreSQL (Neon) + Prisma ORM |
| **Auth** | Clerk (frontend), @clerk/backend (backend verification) |
| **Cache/Queue** | Redis (Upstash) + BullMQ |
| **Secrets Management** | Infisical (@infisical/sdk) |
| **State Management** | @tanstack/react-query |
| **Validation** | Zod |

### Patterns to Follow

- **Token Storage**: NEVER store OAuth tokens directly in PostgreSQL. Always store in Infisical, store only `secretId` reference in `PlatformAuthorization.secretId`
- **Partner-Based Access**: Always add agencies as PARTNER (not OWNER) to client assets via platform APIs
- **Shared Types**: Add shared types to `packages/shared/src/types.ts` and export from `packages/shared/src/index.ts`
- **Environment Validation**: Add new env vars to `apps/api/src/lib/env.ts` Zod schema
- **Audit Logging**: Log every token access to `AuditLog` table with user email, IP, timestamp, action
- **API Response Shape**: All API routes return `{ data, error }` shape for consistency
- **Error Handling**: Use Zod for runtime validation at API boundaries

### Anti-Patterns (Don't Do This)

- **Never store tokens in database**: Direct token storage in PostgreSQL is a security violation
- **Don't use `any` type**: Always define types or use `unknown` with proper type guards
- **Don't skip Infisical**: Every OAuth token must go through Infisical, no exceptions
- **Don't add dependencies without asking**: Consult before adding new npm packages
- **Don't implement auth from scratch**: Use Clerk for authentication, don't build your own
- **Don't make agencies owners**: Use platform partner mechanisms, not asset transfers

### File Structure

```
apps/
├── web/                          # Next.js frontend
│   ├── app/                      # App router pages
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── dashboard/            # Dashboard-specific components
│   │   └── access-requests/      # Access request components
│   └── lib/                      # Frontend utilities
├── api/                          # Fastify backend
│   ├── src/
│   │   ├── routes/               # API route handlers
│   │   ├── services/
│   │   │   ├── connectors/       # OAuth connector implementations
│   │   │   │   ├── meta.ts
│   │   │   │   ├── google.ts
│   │   │   │   ├── tiktok.ts
│   │   │   │   └── linkedin.ts
│   │   │   └── infisical.ts      # Infisical client wrapper
│   │   ├── jobs/                 # BullMQ job processors
│   │   │   └── token-refresh.ts  # Automated token refresh
│   │   ├── lib/
│   │   │   ├── env.ts            # Zod environment validation
│   │   │   ├── prisma.ts         # Prisma client
│   │   │   └── clerk.ts          # Clerk JWT verification
│   │   └── types/                # Backend-specific types
└── shared/                       # Shared TypeScript package
    └── src/
        ├── types.ts              # Shared type definitions
        └── index.ts              # Package exports
```

---

## Design & Visual Direction

### Design Assets

| Asset | Location | Coverage |
|-------|----------|----------|
| Mockups/Wireframes | N/A - Use competitor patterns as reference | Dashboard, access request creation, client authorization flow |
| Design System | shadcn/ui defaults | Use default components with custom accent color |
| Brand Guidelines | N/A - To be established | Minimal, professional SaaS aesthetic |

### Visual Style

**Aesthetic:** Clean, professional B2B SaaS. Think Stripe or Linear—minimal but not generic. Trustworthy for security-conscious agencies.

**Color Palette:**
- Primary: `#0f172a` (slate-900) - dark, professional
- Secondary: `#6366f1` (indigo-500) - primary action color
- Accent: `#10b981` (emerald-500) - success/healthy states
- Warning: `#f59e0b` (amber-500) - expiring tokens
- Error: `#ef4444` (red-500) - failed states
- Background: White with subtle gray sections (`#f8fafc` slate-50)
- Border: `#e2e8f0` (slate-200)

**Typography:**
- Font: Inter (default shadcn/ui font)
- Headings: Tight tracking (-0.02em), font-weight 600-700
- Body: Normal tracking, line-height 1.6 for readability
- Code/monospace: JetBrains Mono or SF Mono for technical identifiers (token IDs, etc.)

**Spacing & Density:**
- Generous whitespace - nothing cramped
- 8px base unit, multiples of 4 (16, 24, 32, 48)
- Card padding: 24px
- Section gaps: 48px vertical
- Dense data tables allowed (agencies want to see lots of connections)

### Layout Guidelines

- **Dashboard**: Sidebar navigation on left (collapsed to icons on tablet), main content area fills remaining space
- **Access Request Builder**: Split view - left side for request configuration, right side for live preview
- **Client List**: Table-based with filters on top, pagination on bottom
- **Token Health Dashboard**: Card-based layout with consistent 16px gaps, status indicators prominent

### Responsive Behavior

- **Desktop (1024px+)**: Primary design target - full sidebar, all features available
- **Tablet (768-1023px)**: Collapse sidebar to icons, stack split views vertically
- **Mobile (<768px)**: Full-width layout, bottom navigation for key actions, drawer for secondary navigation

### Component Patterns

- **Buttons**: Use shadcn Button with variants: `default` (primary), `outline` (secondary), `ghost` (tertiary), `destructive` (danger)
- **Forms**: Inline validation with error messages below fields, real-time feedback where appropriate
- **Tables**: Use shadcn Table with sortable headers, status badges, row hover states
- **Modals**: Use shadcn Dialog for confirmation flows, Sheet for slide-out panels
- **Status Indicators**: Colored dot + label (green = healthy, yellow = expiring, red = expired, gray = unknown)
- **Empty States**: Illustration (use Lucide icons or simple shapes), headline, subtext, primary CTA

### Avoid

- No gradients - keep it flat and professional
- No animations except subtle hover states and page transitions
- No icons without labels - accessibility matters
- No dark mode for MVP (focus on light mode polish first)
- No notification spam - batch important updates, show critical alerts immediately

---

## Key Features

### Core Features (Must Have)

1. **Multi-Platform OAuth Authorization**: Single link that routes clients through OAuth flows for Meta (Facebook, Instagram, Ads), Google (Ads, Analytics, GA4, Tag Manager), TikTok Ads, LinkedIn Ads, and Snapchat Ads
2. **Secure Token Storage with Infisical**: All OAuth tokens encrypted in Infisical secrets management, only `secretId` stored in database
3. **Real-Time Token Health Dashboard**: Visual status of each connection showing healthy/expiring/expired state with countdown to expiration
4. **Intake Forms**: Customizable form fields to collect client information during authorization (company name, website, timezone, etc.)
5. **White-Label Branding**: Custom logo, colors, and subdomain (`agency.agencyplatform.com`) for seamless client experience
6. **Automated Token Refresh**: Background jobs refresh expiring tokens before they expire, logged in audit trail

### Secondary Features (Should Have)

1. **Webhooks**: Trigger external automations when access is granted, revoked, or tokens refreshed
2. **Role-Based Team Access**: Admin, member, viewer roles with different permissions within agency accounts
3. **Access Request Templates**: Reusable request configurations for common client types (ecommerce, B2B, local business)
4. **Multi-Language Support**: Client authorization flow available in Spanish, French, German, Portuguese
5. **Embed Capability**: Embed authorization flow directly on agency's website via iframe/script tag

### Future Considerations (Out of Scope for Now)

- API access for programmatic integration (Planned for v2)
- Zapier integration (Planned for v2)
- Asset creation scaffolding (Meta Business Manager creation - Planned for v1.1)
- Access Detective tool for troubleshooting forgotten admin access (Planned for v1.1)
- Mobile app (Not planned - responsive web sufficient)
- Custom integrations for niche platforms (Enterprise feature - v2+)

---

## Primary Workflows

### Workflow 1: Agency Creates Access Request

**Goal:** Agency creates a branded authorization link to send to a new client

**Steps:**
1. User logs in via Clerk → Dashboard shows existing clients and "New Request" CTA
2. User clicks "New Request" → System displays multi-step form
3. **Step 1 - Client Info**: User enters client name, email → System validates email format
4. **Step 2 - Platforms**: User selects platforms from checklist (Meta, Google, TikTok, LinkedIn, Snapchat) → System shows platform icons and suggested access levels
5. **Step 3 - Intake Form**: User adds custom form fields (company name, website, timezone, etc.) → System provides field type options
6. **Step 4 - Branding**: User uploads logo, selects colors, reviews subdomain → System shows live preview
7. User clicks "Create Request" → System generates unique token, saves to database, returns shareable link
8. **End state:** User has a branded URL (`agency.agencyplatform.com/invite/abc123`) ready to send to client

**Key decisions in this flow:**
- **Platform selection**: User chooses which platforms to request access for
- **Access level**: User selects manage vs. view-only access per platform
- **Intake fields**: User decides what additional information to collect from client

---

### Workflow 2: Client Authorizes Access

**Goal:** Client clicks link and completes OAuth authorization for all requested platforms

**Steps:**
1. Client receives email with branded link → Client clicks link
2. System validates unique token → System displays branded authorization page with agency logo and colors
3. **Step 1 - Intake Form**: Client fills out custom form fields → System validates required fields
4. **Step 2 - Platform Authorization**: System shows OAuth buttons for each selected platform
5. Client clicks "Authorize Meta" → System redirects to Meta OAuth consent screen
6. Client grants permissions → Meta redirects back with authorization code
7. System exchanges code for tokens → System stores tokens in Infisical, creates `PlatformAuthorization` record with `secretId`
8. System marks Meta as "Authorized" in UI → Repeat steps 5-7 for each platform
9. **Step 3 - Confirmation**: System shows thank you page with summary of granted access
10. **End state:** Agency receives notification, tokens are stored securely, client can close browser

**Key decisions in this flow:**
- **OAuth flow**: Client logs in directly with platform credentials (Facebook, Google, etc.)
- **Asset selection**: Client chooses which specific accounts/assets to share (e.g., which ad accounts)
- **Intake completion**: Client must complete intake form before proceeding to OAuth

---

### Workflow 3: Agency Views Token Health

**Goal:** Agency monitors the health and expiration status of all client connections

**Steps:**
1. User navigates to "Token Health" dashboard → System fetches all `PlatformAuthorization` records
2. For each record, System retrieves token metadata from Infisical → System calculates health status
3. System displays table with columns: Client, Platform, Status, Expires In, Last Refreshed, Actions
4. **Status badges**: Green (healthy, >7 days), Yellow (expiring soon, 1-7 days), Red (expired), Gray (unknown)
5. User sees "Meta Ads - Expiring in 2 days" → User clicks "Refresh Now" button
6. System queues immediate refresh job → System shows loading state
7. Job completes → System updates status to "Healthy, expires in 59 days" → System logs refresh in `AuditLog`
8. **End state:** User has visibility into all connection health and can manually trigger refreshes

**Key decisions in this flow:**
- **Status calculation**: System determines health based on expiration proximity
- **Manual refresh**: User can force immediate refresh instead of waiting for automated job

---

### Workflow 4: Automated Token Refresh (Background Job)

**Goal:** System automatically refreshes tokens before they expire without user intervention

**Steps:**
1. BullMQ job runs every 6 hours → Job queries for tokens expiring within 7 days
2. For each expiring token, Job calls connector's `refreshToken()` method with refresh token from Infisical
3. Platform returns new access token → Job updates Infisical with new token and expiration
4. Job updates `PlatformAuthorization.lastRefreshedAt` timestamp → Job logs refresh event in `AuditLog`
5. Job sends agency notification (optional, configurable) → Agency knows refresh occurred
6. **End state:** Tokens stay fresh, agencies don't experience interrupted access

**Key decisions in this flow:**
- **Refresh window**: Refresh tokens 7 days before expiration to allow retry failures
- **Failure handling**: If refresh fails, retry with exponential backoff, alert agency after 3 failures

---

## User Stories & Acceptance Criteria

### Story 1: Create Access Request

**As an** agency account holder, **I can** create a branded access request link with selected platforms, **so that** I can send a single URL to my client to authorize multiple advertising platforms at once.

**Acceptance Criteria:**
- [ ] Form collects client name and email (validated)
- [ ] Platform selector shows all supported platforms with icons (Meta, Google, TikTok, LinkedIn, Snapchat)
- [ ] User can select multiple platforms with checkboxes
- [ ] For each platform, user can choose access level (manage or view-only)
- [ ] Intake form builder allows adding custom fields (text, email, phone, dropdown)
- [ ] Branding step allows logo upload (max 2MB, PNG/JPG/SVG), color picker, and subdomain preview
- [ ] Upon submission, system generates unique 12-character token and saves `AccessRequest` record
- [ ] System returns shareable URL with pattern: `{subdomain}.agencyplatform.com/invite/{token}`
- [ ] Request appears in agency's dashboard with "Pending" status

**Example scenario:**
> Given agency is logged in and on dashboard
> When user clicks "New Access Request" and enters client email "client@example.com"
> And user selects platforms: Meta Ads (manage), Google Ads (manage), TikTok Ads (view-only)
> And user adds intake field: "Company website" (URL type)
> And user uploads logo, selects brand colors
> When user clicks "Create Request"
> Then system generates AccessRequest with unique token
> And system displays shareable link: `agency.agencyplatform.com/invite/abc123xyz`
> And request appears in dashboard with "Pending" status

---

### Story 2: Client Completes Authorization

**As a** client receiving an access request, **I can** click a single link and complete OAuth authorization for all requested platforms, **so that** I don't have to manually share credentials or navigate complex setup instructions.

**Acceptance Criteria:**
- [ ] Link opens branded page with agency logo and colors
- [ ] Intake form displays first with all custom fields
- [ ] Required fields are validated before proceeding
- [ ] OAuth step shows buttons for each selected platform with platform icons
- [ ] Clicking platform button redirects to platform's OAuth consent screen
- [ ] After OAuth completion, user is redirected back with authorization code
- [ ] System exchanges code for access and refresh tokens
- [ ] Tokens are stored in Infisical with secret name pattern: `platform_connection_{connectionId}_{platform}`
- [ ] Only `secretId` is stored in `PlatformAuthorization.secretId`
- [ ] Platform is marked as "Authorized" with green checkmark
- [ ] User cannot re-authorize an already authorized platform
- [ ] Final screen shows summary: "You've granted access to [platform list]"
- [ ] Agency receives notification that access was granted

**Example scenario:**
> Given client received link "agency.agencyplatform.com/invite/abc123xyz"
> When client clicks link
> Then branded page loads with agency logo and colors
> And intake form displays: "Company website" field
> When client fills intake form and clicks "Continue"
> Then OAuth step displays buttons: "Authorize Meta Ads", "Authorize Google Ads", "Authorize TikTok Ads"
> When client clicks "Authorize Meta Ads"
> Then client is redirected to Meta OAuth consent screen
> When client grants permissions on Meta
> Then Meta redirects back to agencyplatform.com with authorization code
> And system exchanges code for tokens
> And tokens are stored in Infisical as `meta_connection_123_meta`
> And PlatformAuthorization record created with secretId only
> And Meta Ads button shows green checkmark "Authorized"
> When client completes remaining platforms
> Then confirmation screen shows "You've granted access to Meta Ads, Google Ads, TikTok Ads"
> And agency receives notification

---

### Story 3: View Token Health Dashboard

**As an** agency account holder, **I can** view a dashboard showing the health and expiration status of all client platform connections, **so that** I can proactively address expiring tokens and avoid interrupted access.

**Acceptance Criteria:**
- [ ] Dashboard displays table with columns: Client Name, Platform, Status, Expires In, Last Refreshed, Actions
- [ ] Status badges show: Green (healthy >7 days), Yellow (expiring 1-7 days), Red (expired), Gray (unknown/never refreshed)
- [ ] "Expires In" shows human-readable format: "5 days", "23 hours", "59 days"
- [ ] "Last Refreshed" shows relative time: "2 hours ago", "Yesterday", "5 days ago"
- [ ] Actions column shows "Refresh Now" button for all rows
- [ ] Clicking "Refresh Now" queues immediate background job
- [ ] Button shows loading spinner during refresh
- [ ] On completion, row updates with new status and timestamp
- [ ] Failed refresh shows error badge and "Retry" button
- [ ] Dashboard can be filtered by client or platform
- [ ] Dashboard can be sorted by expiration date (soonest first)
- [ ] Table includes count of total connections and breakdown by status

**Example scenario:**
> Given agency has 5 client connections with various expiration statuses
> When user navigates to "Token Health" dashboard
> Then table shows all 5 connections with appropriate status badges
> And connection expiring in 2 days shows yellow badge
> And connection expiring in 59 days shows green badge
> And expired connection shows red badge
> When user clicks "Refresh Now" on expiring connection
> Then button shows loading spinner
> And background job refreshes token from Infisical
> And row updates to green badge with "59 days" expiration
> And AuditLog entry created with refresh action

---

### Story 4: Automated Token Refresh Job

**As a** system process, **I can** automatically refresh tokens before they expire, **so that** agencies don't experience interrupted access due to expired tokens.

**Acceptance Criteria:**
- [ ] BullMQ job runs every 6 hours checking for tokens expiring within 7 days
- [ ] Job queries `PlatformAuthorization` for records where `expiresAt <= now() + 7 days`
- [ ] For each token, job retrieves refresh token from Infisical
- [ ] Job calls appropriate connector's `refreshToken()` method
- [ ] On success, job updates Infisical with new access token and expiration
- [ ] Job updates `PlatformAuthorization.lastRefreshedAt` timestamp
- [ ] Job logs refresh event in `AuditLog` with success status
- [ ] On failure, job retries with exponential backoff (1 min, 5 min, 30 min)
- [ ] After 3 failed attempts, job sends alert email to agency
- [ ] Job marks token as "expired" status if all retries fail
- [ ] Agency can view refresh history in audit log

**Example scenario:**
> Given Meta Ads token expires in 5 days
> When BullMQ job runs
> Then job identifies expiring token
> And job retrieves refresh token from Infisical
> And job calls MetaConnector.refreshToken(refreshToken)
> And Meta returns new access token with 60-day expiration
> And job updates Infisical secret with new token
> And job updates PlatformAuthorization.lastRefreshedAt
> And job creates AuditLog entry: "Token refreshed for connection_123_meta"
> And token status remains "Healthy"

---

### Story 5: Intake Form Builder

**As an** agency account holder, **I can** create custom intake forms to collect client information during authorization, **so that** I can gather necessary details (company name, website, timezone) without separate email threads.

**Acceptance Criteria:**
- [ ] Access request creation flow includes "Intake Form" step
- [ ] Default fields provided: Company Name (text), Website (URL), Timezone (dropdown)
- [ ] User can add custom fields with types: text, email, phone, URL, dropdown, textarea
- [ ] Each field has label, placeholder, and required/optional toggle
- [ ] Dropdown fields allow adding multiple options
- [ ] Fields can be reordered with drag-and-drop
- [ ] Fields can be deleted
- [ ] Preview shows how form will appear to client
- [ ] Form schema is stored in `AccessRequest.intakeFields` as JSON
- [ ] Client responses are stored in `IntakeResponse` table linked to `AccessRequest`

**Example scenario:**
> Given user is creating a new access request
> When user reaches "Intake Form" step
> Then system shows default fields: Company Name, Website, Timezone
> When user clicks "Add Field" and selects "Email" type
> And user enters label: "Primary Contact Email"
> And user marks field as required
> Then field appears in form preview
> When user reorders fields with drag-and-drop
> Then preview updates to show new order
> And schema is stored in AccessRequest.intakeFields JSON

---

### Story 6: White-Label Branding

**As an** agency account holder, **I can** customize the authorization page with my logo, colors, and subdomain, **so that** clients have a seamless, professional onboarding experience that feels like my brand.

**Acceptance Criteria:**
- [ ] Access request creation includes "Branding" step
- [ ] Logo upload accepts PNG, JPG, SVG (max 2MB, recommended 500x150px)
- [ ] System displays uploaded logo preview
- [ ] Color picker allows selecting primary color (hex code or color swatches)
- [ ] System shows live preview of authorization page with applied branding
- [ ] Subdomain input allows custom subdomain (validated for uniqueness)
- [ ] System shows preview URL: `{subdomain}.agencyplatform.com/invite/{token}`
- [ ] Branding config stored in `AccessRequest.branding` JSON field
- [ ] Client authorization page applies branding from config
- [ ] Email notification to client uses agency logo and colors

**Example scenario:**
> Given user is creating a new access request
> When user reaches "Branding" step
> And user uploads logo file "agency-logo.png"
> And user selects primary color #6366f1 (indigo)
> And user enters subdomain "growth-agency"
> Then system shows live preview with logo, indigo buttons, "growth-agency.agencyplatform.com/invite/abc123"
> When user clicks "Create Request"
> Then branding config stored in AccessRequest.branding
> And client clicking link sees branded page with agency logo and indigo theme

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| **Invalid access request token** | Show friendly 404 page with "This link has expired or doesn't exist. Please contact your agency for a new link." |
| **OAuth authorization denied by client** | Platform button shows "Skipped" status, allows proceeding to other platforms, notes which platforms were declined in summary |
| **OAuth returns error (invalid client_id, redirect_uri mismatch)** | Show error message: "We couldn't connect to [Platform]. Please contact support with error code: [code]" - Log full error for investigation |
| **Infisical token storage fails** | Rollback entire authorization, show error: "We encountered a secure storage issue. Your authorization wasn't saved. Please try again." - Alert ops team |
| **Token refresh job fails 3 times** | Mark token as "expiring_critical", send alert email to agency with link to manually refresh, create support ticket if no manual refresh within 24 hours |
| **Client tries to authorize same platform twice** | Disable platform button after first successful authorization, show "Authorized" badge with checkmark |
| **Intake form validation fails** | Show inline validation errors below invalid fields, highlight fields in red, prevent proceeding until valid |
| **Subdomain already taken** | Show validation error: "This subdomain is already in use. Try 'growth-agency-2' or another variation." |
| **Logo upload exceeds 2MB or invalid format** | Show error: "Logo must be PNG, JPG, or SVG under 2MB. Recommended size: 500x150px." |
| **Access request expired (>30 days old)** | Show friendly message: "This request has expired. Please contact your agency for a new link." |
| **Agency account suspended/canceled** | Existing access requests remain functional (access is permanent), but can't create new requests - show "Account inactive. Please reactivate to create new requests." |
| **Platform API rate limit during OAuth** | Show message: "[Platform] is experiencing high volume. Please wait a moment and try again." - Retry button with exponential backoff suggestion |
| **Network timeout during token exchange** | Show: "Connection timed out. Please check your internet and try again." - Retry button |

---

## Build Phases

### Phase 1: Foundation

**Goal:** Database schema, shared types, Infisical integration, and basic API structure in place.

**Build:**

- [ ] Update Prisma schema with all models: `Agency`, `AgencyMember`, `AccessRequest`, `ClientConnection`, `PlatformAuthorization`, `IntakeField`, `IntakeResponse`, `AuditLog`
- [ ] Run `npm run db:push` to create database tables
- [ ] Add shared types to `packages/shared/src/types.ts` (Platform, AccessRequestStatus, etc.)
- [ ] Export shared types from `packages/shared/src/index.ts`
- [ ] Set up Infisical client in `apps/api/src/services/infisical.ts`
- [ ] Implement `generateSecretName()` and `storeOAuthTokens()` functions
- [ ] Implement `retrieveOAuthTokens()` function
- [ ] Set up Clerk JWT verification middleware in `apps/api/src/lib/clerk.ts`
- [ ] Create base Fastify app with CORS, error handling, and logging in `apps/api/src/server.ts`
- [ ] Add environment variables to `apps/api/src/lib/env.ts` Zod schema (Infisical credentials, platform OAuth configs)
- [ ] Set up BullMQ and Redis connection in `apps/api/src/lib/queue.ts`

**Verify before proceeding:**
- [ ] Can connect to PostgreSQL via Prisma Studio (`npm run db:studio`)
- [ ] Can store and retrieve a test secret from Infisical
- [ ] Shared types are importable in both `apps/web` and `apps/api`
- [ ] Fastify server starts on port 3001 with health check endpoint
- [ ] Clerk JWT verification rejects unsigned tokens

**Checkpoint:** Pause and confirm this foundation is solid before Phase 2.

---

### Phase 2: Core OAuth Flow

**Goal:** End-to-end OAuth authorization for one platform (Meta Ads) as proof of concept.

**Build:**

- [ ] Create `MetaConnector` class in `apps/api/src/services/connectors/meta.ts`
- [ ] Implement `getAuthUrl()` method for Meta OAuth
- [ ] Implement `exchangeCode()` method for token exchange
- [ ] Implement `refreshToken()` method for token refresh
- [ ] Create API route: `POST /api/access-requests` (create request)
- [ ] Create API route: `GET /api/access-requests/:token` (retrieve request for client view)
- [ ] Create API route: `POST /api/oauth/meta/callback` (OAuth callback handler)
- [ ] Create frontend page: `/app/invite/[token]/page.tsx` (client authorization page)
- [ ] Implement intake form UI component
- [ ] Implement OAuth button component for Meta
- [ ] Connect OAuth callback to store tokens in Infisical
- [ ] Create `PlatformAuthorization` record with `secretId` only
- [ ] Log authorization in `AuditLog`

**Verify before proceeding:**
- [ ] Agency can create access request with Meta Ads selected
- [ ] Client clicking link sees branded page with intake form
- [ ] Client can complete Meta OAuth flow successfully
- [ ] Tokens are stored in Infisical (verify via Infisical dashboard)
- [ ] Database contains `secretId` reference only (no actual tokens)
- [ ] Agency can view granted access in dashboard

**Checkpoint:** Confirm Meta OAuth works end-to-end before adding more platforms.

---

### Phase 3: Additional Platforms & Token Health

**Goal:** Add remaining platforms and implement token health monitoring.

**Build:**

- [ ] Create `GoogleConnector` class (Ads, Analytics, GA4, Tag Manager)
- [ ] Create `TikTokConnector` class
- [ ] Create `LinkedInConnector` class
- [ ] Create `SnapchatConnector` class
- [ ] Implement token health monitoring: `GET /api/token-health` endpoint
- [ ] Create token health dashboard page in frontend
- [ ] Implement status badge component (green/yellow/red/gray)
- [ ] Implement "Refresh Now" button and API handler
- [ ] Create BullMQ job for automated token refresh
- [ ] Implement `refresh-token` job processor
- [ ] Add job scheduler to run every 6 hours
- [ ] Implement audit log viewer for agencies

**Verify before proceeding:**
- [ ] Can create access request with any combination of platforms
- [ ] All platforms successfully store tokens in Infisical
- [ ] Token health dashboard shows accurate status for all connections
- [ ] Manual refresh button successfully updates tokens
- [ ] Automated refresh job picks up expiring tokens
- [ ] Audit log shows all token access events

**Checkpoint:** Confirm all platforms working and health monitoring functional before Phase 4.

---

### Phase 4: Polish & Edge Cases

**Goal:** Handle edge cases, improve UX, add white-label branding.

**Build:**

- [ ] Implement white-label branding UI in access request flow
- [ ] Add logo upload handling with validation
- [ ] Implement color picker with live preview
- [ ] Add subdomain uniqueness validation
- [ ] Implement branded email notifications (logo, colors)
- [ ] Add comprehensive error handling for OAuth failures
- [ ] Implement retry logic for token refresh failures
- [ ] Add email alerts for critical token expiration
- [ ] Implement subdomain routing in Next.js
- [ ] Add loading states and skeletons
- [ ] Add empty states for all views
- [ ] Implement role-based access control (admin/member/viewer)
- [ ] Add multi-language support for client flow

**Verify:**
- [ ] All edge cases from table are handled gracefully
- [ ] Error messages are clear and actionable
- [ ] Branded pages match agency customization
- [ ] Subdomain routing works correctly
- [ ] Email notifications render properly across clients
- [ ] Role permissions are enforced correctly
- [ ] Multi-language pages display correctly

---

## Examples & Test Cases

### Example 1: Happy Path - Agency Creates Request and Client Authorizes

**Context:** Agency "Growth Media" wants to onboard new client "Acme Ecommerce" and needs access to Meta Ads and Google Ads.

**User Action:**
```
Agency user logs in, clicks "New Access Request", fills out:
- Client Name: "Acme Ecommerce"
- Client Email: "john@acme.com"
- Platforms: Meta Ads (manage), Google Ads (manage)
- Intake Fields: Company Website (required, URL type)
- Branding: Uploads logo, selects #6366f1, subdomain "growthmedia"
- Clicks "Create Request"
```

**Input Data (API POST to /api/access-requests):**
```json
{
  "clientName": "Acme Ecommerce",
  "clientEmail": "john@acme.com",
  "platforms": [
    { "platform": "meta_ads", "accessLevel": "manage" },
    { "platform": "google_ads", "accessLevel": "manage" }
  ],
  "intakeFields": [
    {
      "label": "Company Website",
      "type": "url",
      "required": true,
      "order": 0
    }
  ],
  "branding": {
    "logoUrl": "https://cdn.agencyplatform.com/logos/growthmedia.png",
    "primaryColor": "#6366f1",
    "subdomain": "growthmedia"
  }
}
```

**Expected Output (API Response):**
```json
{
  "data": {
    "id": "ar_123abc",
    "uniqueToken": "abc123xyz789",
    "shareableUrl": "growthmedia.agencyplatform.com/invite/abc123xyz789",
    "status": "pending",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "error": null
}
```

**Database State:**
```sql
-- AccessRequest record
INSERT INTO "AccessRequest" (
  id, uniqueToken, clientName, clientEmail, status,
  platforms, intakeFields, branding, agencyId
) VALUES (
  'ar_123abc',
  'abc123xyz789',
  'Acme Ecommerce',
  'john@acme.com',
  'pending',
  '[{"platform":"meta_ads","accessLevel":"manage"},{"platform":"google_ads","accessLevel":"manage"}]',
  '[{"label":"Company Website","type":"url","required":true,"order":0}]',
  '{"logoUrl":"https://cdn...png","primaryColor":"#6366f1","subdomain":"growthmedia"}',
  'agency_456'
);
```

**What the UI should show:**
- Success toast notification: "Access request created! Share this link with your client."
- Request appears in dashboard table with "Pending" badge
- "Copy Link" button next to request for easy sharing
- Email preview button to see what client will receive

---

### Example 2: Client Completes OAuth Authorization

**Context:** Client John receives email and clicks link to authorize platforms.

**User Action:**
```
1. John clicks link: growthmedia.agencyplatform.com/invite/abc123xyz789
2. Branded page loads with Growth Media logo and indigo theme
3. John fills intake form: Company Website = "https://acme.com"
4. John clicks "Authorize Meta Ads" button
5. Redirected to Meta OAuth, grants permissions
6. Redirected back, Meta shows "Authorized" with green checkmark
7. John clicks "Authorize Google Ads" button
8. Redirected to Google OAuth, grants permissions
9. Redirected back, Google shows "Authorized"
10. Confirmation screen: "You've granted access to Meta Ads, Google Ads"
```

**Input Data (OAuth Callback from Meta):**
```json
{
  "code": "AQBzHs...",
  "state": "abc123xyz789"
}
```

**Expected Backend Processing:**
```typescript
// 1. Exchange code for tokens
const tokens = await metaConnector.exchangeCode(code);
// Returns: { accessToken: "EAABwz...", refreshToken: "EAABwz...", expiresAt: 2025-03-15T10:30:00Z }

// 2. Store in Infisical
const secretName = infisical.generateSecretName('meta', 'conn_123', 'meta_ads');
await infisical.storeOAuthTokens(secretName, tokens);

// 3. Create database record (ONLY secretId)
await prisma.platformAuthorization.create({
  data: {
    connectionId: 'conn_123',
    platform: 'meta_ads',
    secretId: secretName, // NOT the actual token!
    expiresAt: tokens.expiresAt
  }
});

// 4. Log the access
await prisma.auditLog.create({
  data: {
    connectionId: 'conn_123',
    platform: 'meta_ads',
    action: 'GRANTED',
    userEmail: 'john@acme.com',
    ipAddress: '1.2.3.4'
  }
});
```

**Expected Output (API Response to client after completion):**
```json
{
  "data": {
    "message": "Authorization complete!",
    "authorizedPlatforms": [
      { "platform": "Meta Ads", "status": "authorized" },
      { "platform": "Google Ads", "status": "authorized" }
    ],
    "agencyName": "Growth Media"
  },
  "error": null
}
```

**Infisical State:**
```
Secret Name: meta_connection_123_meta_ads
Secret Value (JSON):
{
  "accessToken": "EAABwz...",
  "refreshToken": "EAABwz...",
  "expiresAt": "2025-03-15T10:30:00Z",
  "grantedAt": "2025-01-15T10:30:00Z"
}
```

**What the UI should show (client facing):**
- Branded page with Growth Media logo and indigo buttons
- Intake form with "Company Website" field (validated as URL)
- OAuth buttons with platform icons (Meta "f" icon, Google "G" icon)
- After each authorization: button disabled, green checkmark appears, "Authorized!" text
- Final confirmation: celebration animation, summary of granted access, "You can close this window"

**What the UI should show (agency dashboard after):**
- Request status changes from "Pending" to "Authorized"
- New row in "Token Health" table:
  - Client: Acme Ecommerce
  - Platform: Meta Ads
  - Status: Green badge "Healthy"
  - Expires In: "59 days"
  - Last Refreshed: "Just now"
- Notification badge: "1 new client authorized"

---

### Example 3: Token Health Monitoring & Manual Refresh

**Context:** Agency user checks dashboard and sees a token expiring soon.

**User Action:**
```
1. User navigates to /token-health
2. Table shows Acme Ecommerce → Meta Ads → Yellow badge "Expiring in 2 days"
3. User clicks "Refresh Now" button
4. Button shows spinner: "Refreshing..."
5. After 2 seconds, row updates to green badge "59 days"
```

**Input Data (API POST to /api/token-refresh):**
```json
{
  "connectionId": "conn_123",
  "platform": "meta_ads"
}
```

**Expected Output (API Response):**
```json
{
  "data": {
    "connectionId": "conn_123",
    "platform": "meta_ads",
    "status": "healthy",
    "expiresAt": "2025-03-15T10:30:00Z",
    "lastRefreshedAt": "2025-01-13T10:30:00Z"
  },
  "error": null
}
```

**Backend Processing:**
```typescript
// 1. Retrieve authorization record
const auth = await prisma.platformAuthorization.findUnique({
  where: { connectionId_platform: { connectionId: 'conn_123', platform: 'meta_ads' } }
});

// 2. Get tokens from Infisical
const tokens = await infisical.retrieveOAuthTokens(auth.secretId);

// 3. Refresh using platform connector
const newTokens = await metaConnector.refreshToken(tokens.refreshToken);

// 4. Update Infisical
await infisical.updateOAuthTokens(auth.secretId, newTokens);

// 5. Update database
await prisma.platformAuthorization.update({
  where: { id: auth.id },
  data: {
    expiresAt: newTokens.expiresAt,
    lastRefreshedAt: new Date()
  }
});

// 6. Log the refresh
await prisma.auditLog.create({
  data: {
    connectionId: 'conn_123',
    platform: 'meta_ads',
    action: 'REFRESHED',
    triggeredBy: 'agency_user@example.com',
    ipAddress: '5.6.7.8'
  }
});
```

**What the UI should show:**
- Initial row: Yellow badge, "2 days", "Refresh Now" button
- Clicking button: button shows spinner icon, text changes to "Refreshing..."
- After completion: row updates with green badge, "59 days", timestamp updates to "Just now"
- Success toast: "Token refreshed successfully"
- Audit log shows new entry: "Meta Ads token refreshed by sarah@growthmedia.com"

---

### Example 4: OAuth Failure - Client Denies Access

**Context:** Client authorizes Meta Ads but denies Google Ads access.

**User Action:**
```
1. John completes Meta OAuth successfully (green checkmark)
2. John clicks "Authorize Google Ads"
3. On Google OAuth screen, John clicks "Deny" or closes window
4. Google redirects back with error parameter
5. System shows error message but allows proceeding
6. Final summary shows: "Authorized: Meta Ads | Skipped: Google Ads"
```

**Input Data (OAuth Callback with Error):**
```json
{
  "error": "access_denied",
  "state": "abc123xyz789"
}
```

**Expected Output (API Response):**
```json
{
  "data": {
    "message": "You skipped Google Ads authorization. You can still proceed with other platforms.",
    "authorizedPlatforms": [
      { "platform": "Meta Ads", "status": "authorized" }
    ],
    "skippedPlatforms": [
      { "platform": "Google Ads", "status": "skipped", "reason": "client_denied" }
    ]
  },
  "error": null
}
```

**What the UI should show:**
- Error message below Google Ads button: "Authorization was declined. You can skip this platform or try again."
- Button changes to "Skipped" with gray badge, icon changes to "X"
- "Continue to Next Platform" or "Finish Authorization" button becomes available
- Final summary shows clear distinction between authorized and skipped platforms
- Agency notification notes which platforms were declined

---

### Example 5: Edge Case - Invalid/Expired Access Request Link

**Context:** Client clicks an old link that has expired (>30 days old) or was never created.

**User Action:**
```
1. Client clicks link: growthmedia.agencyplatform.com/invite/invalidtoken
2. System looks up token in database
3. Token not found OR token found but created >30 days ago
4. System shows friendly error page
```

**Input Data (API GET to /api/access-requests/invalidtoken):**
```json
// Not applicable - token lookup happens server-side
```

**Expected Output (API Response):**
```json
{
  "data": null,
  "error": {
    "code": "REQUEST_NOT_FOUND",
    "message": "This access request link has expired or doesn't exist."
  }
}
```

**What the UI should show:**
- Clean, friendly error page (no stack traces)
- Header: "Link Expired" or "Link Not Found"
- Body: "This access request link has expired or doesn't exist. Please contact your agency for a new link."
- Optional: Agency logo if subdomain valid (shows branded error)
- No navigation links (client has no account)
- Footer: "Powered by Agency Platform" with subtle branding

---

### Example 6: API Response Shapes (Reference for All Endpoints)

**Successful creation response:**
```json
{
  "data": {
    "id": "ar_123abc",
    "uniqueToken": "abc123xyz789",
    "shareableUrl": "growthmedia.agencyplatform.com/invite/abc123xyz789",
    "status": "pending",
    "createdAt": "2025-01-15T10:30:00Z",
    "clientName": "Acme Ecommerce",
    "platforms": ["meta_ads", "google_ads"]
  },
  "error": null
}
```

**Successful list response (paginated):**
```json
{
  "data": [
    {
      "id": "ar_123abc",
      "clientName": "Acme Ecommerce",
      "status": "authorized",
      "platforms": ["meta_ads", "google_ads"],
      "authorizedAt": "2025-01-15T10:35:00Z"
    },
    {
      "id": "ar_456def",
      "clientName": "B2B Startup",
      "status": "pending",
      "platforms": ["tiktok_ads"],
      "authorizedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 2,
    "hasMore": false
  },
  "error": null
}
```

**Error response (validation):**
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "clientEmail",
        "message": "Must be a valid email address"
      },
      {
        "field": "platforms",
        "message": "At least one platform must be selected"
      }
    ]
  }
}
```

**Error response (OAuth failure):**
```json
{
  "data": null,
  "error": {
    "code": "OAUTH_ERROR",
    "message": "Unable to complete authorization with Meta",
    "platform": "meta_ads",
    "reason": "invalid_client_id",
    "userMessage": "We couldn't connect to Meta. Please try again or contact support if this persists."
  }
}
```

**Loading states (frontend behavior):**
- Initial dashboard load: Show skeleton cards matching table structure (3-5 rows)
- Token refresh action: Button shows spinner icon, "Refreshing..." text, row becomes semi-transparent
- Creating access request: Submit button shows spinner, "Creating..." text, modal remains open
- Error state: Show inline error message with retry button, preserve form data

---

## Out of Scope

**Explicitly NOT building in v1:**

- **Native mobile apps** - Responsive web is sufficient for both agency and client flows
- **API access for third-party developers** - Planned for v2 as Enterprise feature
- **Zapier integration** - Planned for v2, webhooks will be available first
- **Asset creation scaffolding** - Planned for v1.1 (help clients create Meta Business Manager)
- **Access Detective troubleshooting tool** - Planned for v1.1
- **Dark mode** - Focus on polished light mode for MVP
- **Advanced analytics** - Basic audit logging only, detailed analytics planned for v2
- **Multi-currency billing** - USD only for MVP
- **Custom platform integrations** - Enterprise feature, v2+
- **White-label mobile app** - Not planned, web is primary
- **Self-serve plan downgrade/upgrade** - Manual for MVP, automated in v2
- **In-app messaging/support chat** - Email support only for MVP

**Security features explicitly NOT implementing:**
- **2FA for agency accounts** - Handled by Clerk, not custom implementation
- **IP whitelisting** - Not requested for v1
- **Custom SSO/SAML** - Enterprise feature for v2
- **Hardware security keys** - Not planned

---

## Open Questions

| Question | Blocking? | Notes |
|----------|-----------|-------|
| What happens when an agency cancels their subscription? Do we revoke all stored tokens? | No | **Decision**: No - access is permanent per competitive analysis. Tokens remain valid, agency just can't create new requests. |
| Should we support "view-only" access requests as a separate credit/tier from "manage" access? | No | **Decision**: No - simplifying pricing. One price per client regardless of access level mix. |
| Do we need to implement "Access Detective" for v1 to help troubleshoot forgotten admin access? | No | **Decision**: No - this is a nice-to-have, can be v1.1. Focus on core OAuth flow first. |
| Should we allow agencies to customize the OAuth permission scopes they request, or use fixed scopes per platform? | Yes | **Decision**: Fixed scopes per platform for MVP. Later add granular scope selection. |
| What's the maximum number of custom intake fields we should allow per request? | No | **Recommendation**: Limit to 20 fields to prevent abuse, can be adjusted later. |
| Should intake form responses be editable by the client after authorization? | No | **Decision**: No - responses are immutable. If client needs to change, they contact agency to create new request. |
| Do we need to implement client accounts so clients can log in and view their connected agencies? | No | **Decision**: No - adds significant complexity. Clients are anonymous users who only interact via one-time links. |
| Should we implement "static invites" (reusable links for multiple clients) as AgencyAccess does? | No | **Decision**: No - one-time links per client is simpler and more secure. Static invites can be v2. |
| What's our token refresh buffer window? How many days before expiration do we refresh? | No | **Recommendation**: 7 days gives enough retry buffer. Make configurable via env var. |
| Should we send agency notifications when tokens are successfully refreshed, or only on failures? | No | **Decision**: Failure notifications only (after 3 failed attempts). Success would be too noisy. |

---

## Reference Materials

- **Competitor Analysis**: See separate analysis documents for Leadsie (31+ platforms, credit pricing) and AgencyAccess (20+ platforms, flat pricing, intake forms)
- **Existing Codebase**: `/Users/jhigh/agency-access-platform/` - monorepo with apps/web (Next.js), apps/api (Fastify), packages/shared (types)
- **Prisma Schema**: `apps/api/prisma/schema.prisma` - existing data models for Agency, AgencyMember, AccessRequest, etc.
- **Shared Types**: `packages/shared/src/types.ts` - add new types here for Platform, AccessRequestStatus, etc.
- **Infisical SDK**: `@infisical/sdk` documentation for secrets management patterns
- **Platform OAuth Docs**:
  - [Meta OAuth for Business](https://developers.facebook.com/docs/marketing-api/overview/oauth)
  - [Google Ads OAuth 2.0](https://developers.google.com/google-ads/api/docs/first-call/overview)
  - [TikTok OAuth](https://developers.tiktok.com/doc/tiktok-for-business-oauth/)
  - [LinkedIn Marketing API OAuth](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/marketing-integrations)
  - [Snapchat Ads OAuth](https://marketingapi.snapchat.com/docs/docs/oauth-2-0/)

---

## Definition of Done

**This project is complete when:**

- [ ] Agency can create access request with multiple platforms, custom intake fields, and branding
- [ ] Client can click link, complete intake form, and authorize all selected platforms via OAuth
- [ ] All OAuth tokens are stored in Infisical (verified via Infisical dashboard)
- [ ] Database contains only `secretId` references, no actual tokens (verified via Prisma Studio)
- [ ] Agency can view all client connections in dashboard with accurate status
- [ ] Token health dashboard shows real-time status for all connections
- [ ] Agency can manually refresh tokens with "Refresh Now" button
- [ ] Automated token refresh job successfully refreshes expiring tokens
- [ ] All token access events are logged in `AuditLog` table
- [ ] Authorization pages are fully branded per agency customization
- [ ] All edge cases from the edge case table are handled gracefully
- [ ] Error messages are clear, actionable, and user-friendly
- [ ] Email notifications are sent for key events (request created, access granted, token critical)
- [ ] Role-based access control is enforced (admin/member/viewer)
- [ ] Frontend passes TypeScript compilation with no `any` types
- [ ] Backend passes TypeScript compilation with no `any` types
- [ ] All API routes follow the `{ data, error }` response shape
- [ ] Zod validation is in place for all API inputs
- [ ] Code follows patterns specified in Technical Constraints
- [ ] Design matches the Visual Direction guidelines

**Not required for done:**

- **Unit tests** - We'll add comprehensive test coverage after v1 is working
- **E2E tests** - Manual testing is sufficient for MVP
- **API documentation** - README with curl examples is sufficient
- **Performance optimization** - Focus on correctness, optimize measured bottlenecks later
- **Accessibility audit** - Follow shadcn/ui accessibility defaults, formal audit later
- **SEO optimization** - This is a B2B SaaS app, not a consumer website
- **Analytics integration** - We'll add usage analytics post-launch
- **Advanced security audit** - Third-party penetration testing planned for v2

---

**End of PRD**
