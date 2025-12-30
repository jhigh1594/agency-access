# BuildKit

## The Brief

A B2B SaaS platform enabling digital agencies to gain instant, agency-wide access to all their clients' existing third-party accounts (social media, ad accounts, analytics platforms) through one-click OAuth/API authorization. Agencies subscribe monthly or annually (tiered pricing: Starter 5 clients, Pro 25 clients, Enterprise unlimited) and manage client access centrally from a unified dashboard—solving the core problem of agencies spending 5-10 hours per client provisioning access across Facebook Ads, Google Analytics, TikTok Ads, LinkedIn Ads, and Instagram. The workflow: agencies send clients a secure authorization link (7-day expiry) where clients either authenticate with existing platform credentials or authorize the platform to create temporary agency accounts; the system encrypts OAuth tokens server-side with AES-256 encryption, displays all connected accounts with real-time status badges (Connected/Reconnect Required/Failed) and human-readable last-synced timestamps, automatically refreshes tokens 7 days before expiration via daily background processes, detects revoked access through hybrid polling with low-cost API calls detecting 401/403 responses plus error detection on agency API usage, and manages team member access with role-based permissions (Admin: initiate connections, disconnect accounts, manage team; Member: view accounts and initiate reconnections) with audit logging of all connection state changes retained 90+ days for compliance. Authentication via email/password with RFC 5322 validation and 24-hour email confirmation tokens; API calls check subscription status returning 403 for inactive/cancelled/past-due agencies; rate limiting at 100 requests/minute per agency with 1 new connection per 30 seconds; OAuth flows secured with CSRF protection via state parameter validation and secure redirect URI whitelisting; temporary accounts auto-deactivate when access revoked; background workers detect token expiration and revocation, updating dashboard in real-time with color-coded status badges.

## Problem & Solution

**Problem:** Agencies currently spend 5-10 hours per client gaining secure access to required platforms (Facebook Ads, Google Analytics, TikTok Ads, LinkedIn Ads, Instagram). Teams manually manage separate login credentials for each client-platform combination, distribute passwords creating security vulnerabilities, repeat onboarding friction for each new team member, and lack centralized visibility into which platforms are accessible. This creates operational overhead, security risks, lost productivity, and friction when provisioning access for new team members.

**Solution:** Agencies send clients a secure authorization link where clients authenticate with existing platform credentials or authorize temporary account creation via OAuth/API. System receives authorization via secure server-side token exchange with field-level AES-256 encryption at rest. Displays all connected client accounts in unified dashboard with real-time status badges (Connected/Reconnect Required/Failed) and human-readable last-synced timestamps. Automatically refreshes tokens 7 days before expiration via daily background processes. Detects revoked access via hybrid approach: background polling with low-cost API calls identifying 401/403 responses, plus error detection when agency attempts to use revoked tokens. Enables seamless multi-client account switching with agency-wide access based on role permissions (Admin: create/disconnect accounts and manage team; Member: view accounts and initiate reconnections). B2B subscription model with tiered pricing (Starter: 5 clients, Pro: 25 clients, Enterprise: unlimited) and subscription enforcement blocking API access for inactive/cancelled/past_due agencies. Security includes CSRF-protected OAuth flows with state parameter validation, audit logging of all connection state changes retained 90+ days, rate limiting at 100 requests/minute per agency, 1 new connection per 30 seconds per agency, exponential backoff on failures (immediate/1min/5min retries), and automatic temporary account deactivation when access revoked.

**Target Users:** Digital marketing agencies and creative service firms with 20+ person teams managing 10+ active clients. Primary decision-makers are agency owners and operations/account management leads responsible for team access provisioning and client platform management. Secondary users are account managers and team members who need to access client accounts across multiple platforms.

## Core User Flows

**Name:** Agency Account Creation & Email Verification

**Steps:**
- Agency owner navigates to signup page
- Agency owner enters email address, password, and agency name
- Agency owner clicks 'Create Account' button
- System validates email format to RFC 5322 standard
- System checks if email is already registered
- System validates password is minimum 8 characters
- System hashes password before storage
- System creates agency account with emailConfirmed set to false
- System generates cryptographically secure confirmation token with 24-hour expiry
- System sends confirmation email to provided address
- Agency owner receives email and clicks confirmation link
- System validates token exists, hasn't expired, and is single-use
- System marks email as confirmed and invalidates token
- System redirects to login page with success message
- Agency owner logs in with email and password
- System validates credentials against stored hashed password
- System creates authenticated JWT session token
- System redirects to dashboard
- Dashboard displays empty state with 'Connect Client Account' button

**Edge Cases:**
- WHEN email is already registered -> THEN show error 'This email is already in use. Try logging in instead.' with clickable login link
- WHEN password is less than 8 characters -> THEN show inline validation error 'Password must be at least 8 characters' and prevent submission
- WHEN email format is invalid -> THEN show inline validation error 'Please enter a valid email address' and prevent submission
- WHEN agency name field is empty -> THEN show inline validation error 'Agency name is required' and prevent submission
- WHEN confirmation email fails to send -> THEN still create account and show banner 'Verification email sent. Check spam folder.' with resend button
- WHEN confirmation link expires after 24 hours -> THEN show error 'This link has expired. Request a new confirmation email' with resend button
- WHEN confirmation token is reused or already confirmed -> THEN show error 'This link has already been used. Request a new confirmation email' with resend button
- WHEN resend clicked more than 3 times per hour -> THEN disable resend button and show countdown 'Too many attempts. Please try again in 1 hour'
- WHEN user logs in before email confirmed -> THEN allow login but show persistent banner 'Please confirm your email to activate all features' with resend link
- WHEN network fails during form submission -> THEN preserve form data in browser storage and show 'Connection lost. Please try again' with retry button

## Design & UX

**Brand Vibe:** Professional, efficient, and trustworthy. Should feel like a serious business tool that solves a critical operational pain point for agencies managing multiple client accounts. The platform inspires confidence through clarity and security—agencies are delegating access to sensitive client accounts, so reliability and straightforward workflows are paramount. Not flashy or consumer-like; grounded in solving real business problems with no time wasted.

**Tone Of Voice:** Clear, action-oriented, and reassuring. Direct messaging that helps agency admins understand exactly what they can do next without unnecessary jargon. Acknowledge the security-conscious nature of managing client credentials with confident, professional language. When prompting reconnections or reporting status changes, maintain empathetic but direct tone: 'This connection needs updating' rather than marketing-speak. Specific and concrete about what's happening and what comes next. Language should convey 'we've solved your problem'—confidence without arrogance.

**Visual Aesthetic:** Clean, modern dashboard aesthetic with data-first presentation. Client account cards as primary content blocks showing: client name, platform type (with official brand icons), connection status badge (color-coded), and last synced timestamp. Status badges immediately scannable: Connected (green with checkmark), Reconnect Required (amber with warning icon), Failed (red with error icon). Minimal decoration, maximum clarity—think Stripe's account management interface or Linear's workspace dashboard. Platform icons use official Meta/Google/TikTok/LinkedIn brand assets for instant visual parsing. White space used strategically to reduce cognitive load. No sidebar clutter, no unnecessary visual hierarchy. Light mode as default with optional dark mode. Typography should be clean and readable: sans-serif primary font for UI, monospace for technical details if needed.

**Interaction Style:** Immediate and straightforward with clear affordances for primary actions. One-click OAuth flows should feel frictionless with transparent loading states ('Connecting to [Platform]...', 'Redirecting...'). Real-time status updates (Connecting→Connected, Reconnect Required) with subtle smooth transitions—no flashy animations or delays. Confirmation dialogs for destructive actions with descriptive warning text and prominent cancel/confirm buttons. Persistent but non-intrusive reconnection prompts (sticky banner at top or subtle card highlight, not modal popups unless critical). Role-based UI rendering: Admin sees full action menus (connect, disconnect, manage team); Member sees limited actions (view, reconnect); Viewer sees read-only interface. All interactions feel responsive with immediate visual feedback—copy link to clipboard shows toast confirmation, status badge updates appear within 1-2 seconds of API response, OAuth redirect flows use progress indicators. Hover states on cards show available actions.

**Layout Philosophy:** Dashboard-first with clear information hierarchy: Connected Client Accounts Grid/List (primary focus, main content area occupying 70-80% of viewport showing client cards with platform icons, status badges, and last-synced timestamps in clear scannable format), Quick Stats Summary Bar (secondary, showing total connected clients, status breakdown at-a-glance: X Connected, Y Need Attention, Z Failed), Team & Settings Access (tertiary, accessible via top navigation or account menu). Top navigation includes primary CTA button ('Connect New Client') prominent and right-hand side, account dropdown, and search. Empty state immediately guides first-time users with large 'Add your first client' call-to-action and brief workflow explanation showing: (1) Generate link → (2) Client authorizes → (3) Access granted. Client account cards are scannable units displaying: client name (prominent heading), platform type with official icon and name label, status badge with color and descriptive text ('Connected', 'Reconnect Required', 'Failed'), last synced human-readable timestamp ('2 hours ago', 'Today', '3 days ago'), and action menu (three-dot icon revealing disconnect/reconnect/details). All critical information accessible within 1 click for viewing, 2 clicks for actions.

**Responsive Approach:** Desktop-first design (agencies primarily work from laptops/desktops during business hours managing client access provisioning) with mobile-responsive views for quick status checks and urgent reconnection prompts on mobile devices. Desktop layout: grid of client account cards (2-3 columns based on screen width adapting to 1920px+ screens), top navigation with primary CTA, full status details visible at glance, optional sidebar for team management (deferred to modal on mobile). Mobile layout: single-column stack of account cards, hamburger menu for navigation, touch-friendly tap targets (minimum 48px × 48px for buttons), status badges remain prominently color-coded with icon + text labels. Tablets bridge both (2-column grid at 1024px+). Mobile prioritizes: viewing connected accounts status at-a-glance, quickly identifying reconnection needs with visual prominence, and initiating new client connections. Detailed audit logs and team member management secondary on mobile (available but not in primary flow). Landscape mode on mobile shows 2-column grid when space allows.

**Accessibility Baseline:** WCAG 2.1 AA minimum for professional B2B SaaS compliance (required for enterprise client compliance audits). Keyboard navigation essential: Tab through cards/buttons with visible focus indicators (minimum 4:1 contrast ratio, 3px border or outline), Enter/Space to activate buttons/cards, Escape to close modals, arrow keys optional for card navigation within grids. Screen reader support for all status badges with semantic HTML and descriptive aria-labels (e.g., 'Facebook Ads account for Acme Corp, connection status connected, last synced 2 hours ago'). Color accessibility: never rely on color alone—all status indicators use icon + text + color combination. High contrast mode supported (meets 7:1 ratio minimum). Focus indicators clearly visible on all interactive elements (no keyboard trap states). Alt text for all platform type icons and official brand assets. Form validation messages announced via aria-live='polite' regions and associated with input fields via aria-describedby. Loading states announced ('Connecting to Facebook', 'Processing authorization request'). Modal dialogs with proper focus management, focus trap on open, focus restored on close. Skip navigation link to jump to main content area. Reduce motion option supported for users sensitive to animations—transitions become instant, no auto-playing indicators. Semantic HTML structure (proper heading hierarchy h1→h2→h3, list elements for account cards/team lists). Language set to 'en' with region attribute if localized. Links have descriptive text (no 'click here' patterns).

## Data Model

### Agency

**Fields:** id: uuid, primary key, auto-generated, email: string, unique, validated (RFC 5322), required, password: string, hashed, required, minimum 8 characters, agencyName: string, required, max 255 chars, emailConfirmed: boolean, default false, subscriptionPlan: enum (starter|pro|enterprise), required, subscriptionStatus: enum (active|inactive|cancelled|past_due), default inactive, maxClientConnections: integer, determined by plan (starter: 5, pro: 25, enterprise: unlimited), createdAt: timestamp, auto-generated, updatedAt: timestamp, auto-generated
**Relationships:**
- Agency has many ConnectedAccounts (one-to-many, foreign key: agencyId)
- Agency has many TeamMembers (one-to-many, foreign key: agencyId)
- Agency has many EmailConfirmations (one-to-many, foreign key: agencyId)
- Agency has many ClientAccessLinks (one-to-many, foreign key: agencyId)
- Agency has one Subscription (one-to-one, foreign key: agencyId)
- Agency has many OAuthLogs through ConnectedAccounts (one-to-many)

### EmailConfirmation

**Fields:** id: uuid, primary key, auto-generated, agencyId: uuid, foreign key to Agency, required, token: string, unique, cryptographically secure, required, expiresAt: timestamp, required (24 hours from creation), confirmedAt: timestamp, nullable (set when token used, enforces single-use), createdAt: timestamp, auto-generated
**Relationships:**
- EmailConfirmation belongs to Agency (foreign key: agencyId, required)

### ClientAccessLink

**Fields:** id: uuid, primary key, auto-generated, agencyId: uuid, foreign key to Agency, required, token: string, unique, cryptographically secure, required, clientEmail: string, required, validated (RFC 5322), clientName: string, required, max 255 chars, requestedPlatforms: enum array (instagram|facebook_ads|google_ads|google_analytics|linkedin_ads|tiktok_ads), required, non-empty, status: enum (pending|authorized|expired|revoked), default pending, expiresAt: timestamp, required (7 days from creation), authorizedAt: timestamp, nullable, createdAt: timestamp, auto-generated, updatedAt: timestamp, auto-generated
**Relationships:**
- ClientAccessLink belongs to Agency (foreign key: agencyId, required)
- ClientAccessLink has many ConnectedAccounts (one-to-many, foreign key: clientAccessLinkId)

### ConnectedAccount

**Fields:** id: uuid, primary key, auto-generated, agencyId: uuid, foreign key to Agency, required, clientAccessLinkId: uuid, foreign key to ClientAccessLink, nullable, clientName: string, required, max 255 chars, platformType: enum (social_media|ad_account|analytics), required, platformName: enum (instagram|facebook_ads|google_ads|google_analytics|linkedin_ads|tiktok_ads), required, platformAccountId: string, required, max 255 chars, oauthToken: string, encrypted (AES-256 at rest), required, oauthRefreshToken: string, encrypted (AES-256 at rest), nullable, oauthTokenExpiresAt: timestamp, nullable, connectionStatus: enum (connected|reconnect_required|revoked), default connected, lastSyncedAt: timestamp, nullable, connectedAt: timestamp, auto-generated, updatedAt: timestamp, auto-generated
**Relationships:**
- ConnectedAccount belongs to Agency (foreign key: agencyId, required)
- ConnectedAccount belongs to ClientAccessLink (foreign key: clientAccessLinkId, nullable)
- ConnectedAccount has many OAuthLogs (one-to-many, foreign key: connectedAccountId)

### TeamMember

**Fields:** id: uuid, primary key, auto-generated, agencyId: uuid, foreign key to Agency, required, email: string, required, validated (RFC 5322), password: string, hashed, required, minimum 8 characters, role: enum (admin|member), default member, accountStatus: enum (active|invited|disabled), default invited, emailConfirmed: boolean, default false, createdAt: timestamp, auto-generated, updatedAt: timestamp, auto-generated
**Relationships:**
- TeamMember belongs to Agency (foreign key: agencyId, required)
- TeamMember has many TeamMemberInvitations (one-to-many, foreign key: teamMemberId)

### TeamMemberInvitation

**Fields:** id: uuid, primary key, auto-generated, teamMemberId: uuid, foreign key to TeamMember, required, invitationToken: string, unique, cryptographically secure, required, invitedEmail: string, required, validated (RFC 5322), invitedBy: uuid, foreign key to TeamMember (sender), required, status: enum (pending|accepted|declined), default pending, expiresAt: timestamp, required (7 days from creation), acceptedAt: timestamp, nullable, createdAt: timestamp, auto-generated
**Relationships:**
- TeamMemberInvitation belongs to TeamMember (foreign key: teamMemberId, required)

### OAuthLog

**Fields:** id: uuid, primary key, auto-generated, connectedAccountId: uuid, foreign key to ConnectedAccount, required, eventType: enum (authorization_initiated|authorization_success|authorization_failed|token_refreshed|token_expired|revocation_detected|reconnection_prompted), required, errorMessage: string, nullable, statusCode: integer, nullable, timestamp: timestamp, auto-generated
**Relationships:**
- OAuthLog belongs to ConnectedAccount (foreign key: connectedAccountId, required)

### Subscription

**Fields:** id: uuid, primary key, auto-generated, agencyId: uuid, foreign key to Agency, required, unique, stripePlanId: string, required, max 255 chars, stripeSubscriptionId: string, required, max 255 chars, plan: enum (starter|pro|enterprise), required, status: enum (active|inactive|cancelled|past_due), default inactive, currentPeriodStart: timestamp, required, currentPeriodEnd: timestamp, required, cancelledAt: timestamp, nullable, createdAt: timestamp, auto-generated, updatedAt: timestamp, auto-generated
**Relationships:**
- Subscription belongs to Agency (foreign key: agencyId, required, one-to-one)

## Key Features

**Name:** Client Authorization Link Generation

**Outcome:** Agency admins generate shareable authorization links that invite clients to grant platform access to their existing accounts across social media, ad platforms, and analytics tools without sharing passwords or credentials

**Constraints:**
- Link must expire after exactly 7 days of creation
- Link token must be cryptographically unique and single-use per client-platform combination
- Requested platforms must be non-empty array selected from: instagram, facebook_ads, google_ads, google_analytics, linkedin_ads, tiktok_ads
- Client email must be validated to RFC 5322 format before link generation
- Client name must not be empty and cannot exceed 255 characters
- Link status transitions: pending → authorized (when OAuth completes) or pending → expired (when 7-day expiration reached)
- Agency must have active subscription status with sufficient client connection slots remaining for current plan (Starter: 5, Pro: 25, Enterprise: unlimited)
- New client account connections rate limited to 1 per 30 seconds per agency to prevent quota exhaustion
- Only one active unconfirmed link allowed per client-platform combination at any time (previous link invalidated when new one generated)

**Edge Case Behavior:**
- WHEN link expires after 7 days -> THEN status automatically changes to expired and link becomes inaccessible with message 'This link has expired. Ask your agency to send a new one'
- WHEN same client-platform combination requested twice -> THEN generate new unique link and immediately invalidate previous link to prevent reuse
- WHEN client email format invalid -> THEN show inline validation error 'Please enter a valid email address' and prevent link generation
- WHEN agency exceeds client connection rate limit (1 per 30 seconds) -> THEN show error 'Too many connection requests. Please wait 30 seconds before adding another client' with countdown timer
- WHEN agency at subscription limit (e.g., Starter plan at 5 clients) -> THEN show error 'You have reached your client limit for your plan. Upgrade to add more clients' with upgrade link
- WHEN client receives link but doesn't authorize within 7 days -> THEN link expires and admin must generate new link to allow client authorization
- WHEN admin attempts to generate link with empty platforms array -> THEN show validation error 'Please select at least one platform' and prevent submission
- WHEN admin manually revokes pending link before expiry -> THEN status changes to revoked and link becomes immediately inaccessible

**Must:**
- Generate cryptographically secure unique token for each link
- Enforce exactly 7-day expiration for all links
- Validate client email format to RFC 5322 standard
- Enforce single-use per client-platform combination with previous link invalidation
- Check Agency.subscriptionStatus is active before allowing link generation
- Check Agency has available client connection slots remaining based on plan
- Enforce connection rate limit of 1 new ConnectedAccount per 30 seconds per agency
- Validate requestedPlatforms array is non-empty
- Validate clientName is non-empty and max 255 characters

**Should:**
- Allow admin to copy link to clipboard with single click and confirmation toast
- Display visual countdown showing link expiration time (e.g., '5 days remaining')
- Show list of all active pending authorization links with client names, platforms, and expiration timestamps
- Allow admin to manually revoke pending links before 7-day expiry
- Display success message when link generated with copy option and preview of what client will see

**Must Not:**
- Allow same link token to be used more than once
- Grant account access without completed OAuth authorization
- Allow links to remain valid beyond 7-day expiration timestamp
- Bypass subscription limit enforcement (must check maxClientConnections for plan)
- Allow unlimited connection requests without enforcing 30-second rate limit
- Accept platform names outside hardcoded list (instagram, facebook_ads, google_ads, google_analytics, linkedin_ads, tiktok_ads only)

## What Makes This Special

**Unique Angle:** One-click OAuth-based access model that eliminates password sharing and manual credential provisioning. Agencies send clients a shareable authorization link, clients authenticate with existing platform credentials or authorize temporary account creation, and the platform automatically syncs and updates connection status in a unified dashboard—enabling instant, agency-wide access to all connected client accounts (social media, ad accounts, analytics) without separate logins or credential distribution.

**Why It Matters:** Transforms account access management from a manual, error-prone, credential-sharing process into a secure, one-click workflow. Solves the confirmed core problem: agencies currently spend 5-10 hours per client gaining access to required platforms (Facebook Ads, Google Analytics, TikTok Ads, LinkedIn Ads, Instagram). Eliminates operational overhead of managing separate logins per platform per client, reduces security risks inherent in credential sharing, enables instant team onboarding without distributing passwords, and saves agencies significant cumulative time switching between client accounts.

**Implementation Note:** Core workflow confirmed: (1) Agency owner/team member generates shareable authorization link for each client with 7-day expiry, (2) Client receives link and either grants login credentials to existing platform accounts OR authorizes platform to create temporary agency accounts on their behalf, (3) Platform receives OAuth authorization via secure server-side token exchange, (4) System automatically syncs and updates connection status in agency dashboard showing which platforms are accessible with real-time status badges (Connected, Reconnect Required, Failed) and last-synced timestamps. Technical implementation requires: secure server-side OAuth token storage with field-level AES-256 encryption at rest, automatic daily token refresh checking tokens expiring within 7 days with refresh via platform-specific refresh_token flow, hybrid revocation detection via background polling with low-cost API calls detecting 401/403 responses plus error catching when agency uses revoked tokens, multi-client dashboard with connection status color-coded badges and human-readable last-synced timestamps, CSRF protection on OAuth flows using state parameter validation with secure redirect URI whitelisting, OAuthLog audit table tracking all connection state changes retained minimum 90 days for compliance, API rate limiting at 100 requests/minute per agency to prevent quota exhaustion, connection creation rate limited to 1 new client account per 30 seconds per agency, exponential backoff on failed API calls (retry 3 times: immediate, 1 minute, 5 minutes with logged error messages), automatic temporary account deactivation/deletion when access revoked, subscription enforcement blocking API access for inactive/cancelled/past_due agencies returning 403 Forbidden, email confirmation tokens with 24-hour expiry and single-use enforcement with maximum 3 resend attempts per hour per agency, and team member role-based access control (Admin: initiate connections, disconnect accounts, manage team members; Member: view connected accounts and initiate reconnection flows; all roles have agency-wide access with no client-level restrictions for MVP). Supported platforms via OAuth/API: Meta (Instagram, Facebook Ads), Google (Google Ads, Google Analytics), TikTok Ads, LinkedIn Ads. Data freshness approach: connect-and-manage model where system enables OAuth access and clients manage their data flow downstream—platform does not pull continuous live data from connected accounts, only maintains connection status and credential management with one-time authorization at connection setup.

## Technical Architecture

**Frontend:** React (real-time dashboard updates with connection status badges, OAuth redirect handling, role-based UI rendering, multi-client account switching, and immediate visual feedback on token state changes require efficient component re-rendering)
*Dashboard-heavy application with: (1) centralized grid/list of connected client accounts with live status badges (Connected/Reconnect Required/Failed) and last-synced timestamps, (2) OAuth authorization flows with secure redirect handling and loading states, (3) seamless account switching between multiple clients with persistent context, (4) role-based conditional UI rendering (admin sees all actions, member has restricted capabilities), (5) empty state guidance for new agencies, (6) color-coded status badges requiring component-based architecture for reusable account cards, modals, empty states, role-based action menus, and OAuth loading states*
*Let AI decide:* State management library (for OAuth token context, client list state, currently selected client, user role, subscription status), Routing library (for OAuth callback routes, account detail pages, dashboard views, settings pages, team management pages), UI component library (Material Design 3 or iOS-style components for dashboard cards, modals, forms, status badges, empty states, tooltips, confirmation dialogs), Build tooling and production setup (Vite/Next.js/other), CSS-in-JS or utility-first CSS approach (Tailwind/styled-components/etc), Form validation library

**Backend:** Node.js with persistent HTTP server supporting long-running OAuth token refresh processes (background jobs running daily for token refresh 7 days before expiration, connection status polling for revoked access detection via 401/403 responses, and audit logging)
*Background job processing essential for: (1) daily token refresh check on all ConnectedAccounts with oauthTokenExpiresAt within 7 days, (2) polling for revoked access by attempting low-cost API calls and detecting 401/403 status codes to trigger revocation_detected OAuthLog events, (3) automatic connection status updates (connected→reconnect_required) when API failures detected, (4) subscription status enforcement checking inactive/cancelled/past_due agencies and returning 403 Forbidden on API calls, (5) temporary account auto-deactivation when access revoked, (6) CSRF protection via state parameter validation on OAuth flows, (7) email confirmation token generation and expiry tracking, (8) rate limiting at 100 requests/minute per API key with exponential backoff on failures (retry immediate, 1min, 5min), (9) field-level AES-256 encryption of OAuth tokens at rest, (10) connection creation rate limiting to 1 per 30 seconds per agency*
*Let AI decide:* Web framework (Express/Fastify/Hono/other), Background job queue system (for daily token refresh, revocation detection polling, temporary account cleanup, email sending), Password hashing library (for secure credential storage), JWT implementation (for session management with 30-minute inactivity timeout), Email delivery service integration (transactional emails for confirmation, invitations, reconnection prompts), Encryption library for field-level AES-256 token encryption, Rate limiting middleware implementation, CSRF protection middleware, Session storage (in-memory/Redis/database)

**Database:** PostgreSQL (complex relational data model with foreign keys, transactions, and joins: Agency→ConnectedAccount, Agency→TeamMember, Agency→Subscription, ConnectedAccount→OAuthLog, TeamMember→TeamMemberInvitation, ClientAccessLink→ConnectedAccount; requires ACID transactions for subscription status enforcement and token encryption state consistency; optional full-text search for client account search by name/platform)
*Relational database essential for: (1) strict foreign key constraints ensuring data integrity across agency-team-client-connection hierarchy, (2) ACID transaction support for atomic updates during OAuth token refresh (preventing partial state during failures), (3) complex join queries for dashboard (ConnectedAccount joined with Agency, joined with OAuthLog for audit trail), (4) subscription status enforcement requiring transactional read-check-update patterns, (5) single-use token enforcement (confirmedAt timestamp tracking) requiring row-level locks or serializable isolation, (6) audit logging requiring write-heavy append-only OAuthLog table with indexing on connectedAccountId and timestamp for efficient retrieval, (7) encrypted field storage requiring database support for large bytea/TEXT columns*
*Let AI decide:* ORM choice (for query building, migrations, type safety), Connection pooling strategy (sizing based on concurrent connections), Migration tool (for schema versioning and deployment), Backup and disaster recovery strategy, Indexing strategy (for audit log queries, token lookups, subscription status checks)

**Integrations:**
- Stripe (monthly/annual subscription billing with tiered pricing: Starter 5 clients, Pro 25 clients, Enterprise unlimited; plan management, webhook fulfillment for subscription status sync, subscription enforcement on API calls returning 403 when inactive/cancelled/past_due)
- Meta/Facebook OAuth (Instagram, Facebook Ads API access via OAuth 2.0, token refresh via refresh_token flow, revocation detection via API 401 responses)
- Google OAuth (Google Ads, Google Analytics API access via OAuth 2.0, token refresh via refresh_token flow)
- TikTok Ads OAuth (TikTok Ads Manager API via OAuth 2.0)
- LinkedIn Ads OAuth (LinkedIn Ads API via OAuth 2.0)
- Email service (transactional email: account confirmation links 24-hour expiry, team member invitations 7-day expiry, reconnection prompts, subscription notifications; LetAIDecide: SendGrid/Resend/Postmark with retry logic 3 attempts with exponential backoff)

**Special Requirements:**
- OAuth 2.0 Authorization Code Flow with CSRF protection via state parameter validation and secure redirect URI whitelisting for all platform integrations
- Field-level AES-256 encryption for oauthToken and oauthRefreshToken at rest in database (never transmitted to frontend except as opaque session-bound tokens)
- Daily background process: token refresh check on all ConnectedAccounts where oauthTokenExpiresAt is within 7 days, refresh via platform-specific refresh_token flow, update oauthTokenExpiresAt, log token_refreshed event to OAuthLog
- Real-time revocation detection: background process polling ConnectedAccounts with status=connected, attempting low-cost API call (e.g., /me endpoint), if 401/403 response detected set connectionStatus=reconnect_required and log revocation_detected event to OAuthLog
- Automatic temporary account deactivation when access revoked: when ConnectedAccount.connectionStatus set to revoked, trigger platform-specific account deactivation API call if applicable
- Email confirmation tokens: generate cryptographically secure token, set 24-hour expiry, enforce single-use via confirmedAt timestamp, maximum 3 resend attempts per hour per agency
- Subscription status enforcement: on every API call, check Agency.subscriptionStatus; if inactive/cancelled/past_due return 403 Forbidden with message 'Subscription inactive. Please reactivate to continue.', render ConnectedAccounts as inaccessible but visible in UI
- API rate limiting: 100 requests per minute per agency ID (headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset); connection creation rate limited to 1 new ConnectedAccount per 30 seconds per agency
- Exponential backoff on failed OAuth token refresh: retry immediately, then 1 minute, then 5 minutes; log failed attempts to OAuthLog with errorMessage and statusCode
- Audit logging: OAuthLog table tracks all connection state changes with eventType (authorization_initiated, authorization_success, authorization_failed, token_refreshed, token_expired, revocation_detected, reconnection_prompted), errorMessage (for failures), statusCode (for API errors), retained minimum 90 days for compliance
- Client access invitation flow: agency generates shareable authorization link with ClientAccessLink token (7-day expiry), client receives link and authenticates to platform or authorizes temporary account creation, system receives OAuth authorization via secure server-side token exchange, ConnectedAccount created with encrypted oauthToken, dashboard updates with new connection status badge
- Multi-client account switching: dashboard displays grid/list of all ConnectedAccounts across all clients (agency-wide view), clicking account card switches context and restricts subsequent API calls to that specific ConnectedAccount, persistent context in session/localStorage, seamless transitions with loading states
- Role-based access control: Admin role can initiate client account connections, disconnect accounts, manage team members; Member role can view all connected accounts and initiate reconnection flows (trigger new authorization link); only two roles for MVP, all roles have agency-wide access (no client-level restrictions)
- Empty state guidance: first-time agencies see 'Add your first client' message with 'Connect Client Account' button and brief explanation of workflow
- Connection status badges: color-coded visual indicators (Connected=green, Reconnect Required=amber, Failed=red) with descriptive text and tooltip on hover showing last sync time or error message
- Last synced timestamps: display human-readable relative time (e.g., 'Last synced 2 hours ago', 'Last synced today', 'Last synced 3 days ago') updated in real-time as background processes refresh tokens
- Password security: minimum 8 characters, hashed before storage (never plain text), validated on signup and team member creation
- HTTPS-only communication: all OAuth redirects and API calls over HTTPS, secure flag on session cookies, Strict-Transport-Security header enforced
- Input sanitization: all user inputs validated and sanitized to prevent SQL injection, XSS, CSRF attacks
- Session management: JWT-based sessions with 30-minute inactivity timeout, secure cookie storage with HttpOnly and Secure flags
- Email validation: RFC 5322 standard for all email fields (agency email, team member email, client email)
- Team member invitations: 7-day expiry, single-use token, maximum 3 resend attempts per hour per agency
- Hybrid revocation detection: system combines background polling of token validity (low-cost API calls detecting 401/403 responses) with error-based detection when agency API calls fail due to revoked credentials, both trigger immediate status update to reconnect_required with OAuthLog event recording



---

## Integration Documentation

*Auto-detected integrations with official documentation links for AI agents and developers.*

### Stripe Payments

- **[Stripe API Reference](https://docs.stripe.com/api)** - Complete REST API documentation
- **[Payment Intents](https://docs.stripe.com/payments/payment-intents)** - Accept one-time payments securely
- **[Subscriptions](https://docs.stripe.com/billing/subscriptions/overview)** - Set up recurring billing
- **[Webhooks](https://docs.stripe.com/webhooks)** - Handle asynchronous payment events

### Supabase

- **[Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)** - Complete JavaScript SDK reference
- **[Authentication](https://supabase.com/docs/guides/auth)** - User authentication and authorization
- **[Database & Queries](https://supabase.com/docs/guides/database/overview)** - PostgreSQL database with Row Level Security
- **[Realtime](https://supabase.com/docs/guides/realtime)** - Subscribe to database changes in real-time

### PostgreSQL

- **[PostgreSQL Documentation](https://www.postgresql.org/docs/current/)** - Official PostgreSQL documentation
- **[Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)** - TypeScript ORM for PostgreSQL
- **[SQL Syntax Reference](https://www.postgresql.org/docs/current/sql-syntax.html)** - PostgreSQL SQL syntax and commands

### React

- **[React Documentation](https://react.dev/)** - Official React documentation and guides
- **[React Hooks Reference](https://react.dev/reference/react/hooks)** - Built-in React Hooks API
- **[Next.js Documentation](https://nextjs.org/docs)** - Next.js framework documentation

### Tailwind CSS

- **[Tailwind CSS Documentation](https://tailwindcss.com/docs)** - Utility-first CSS framework
- **[Tailwind UI Components](https://tailwindui.com/components)** - Pre-built component examples

### Vercel

- **[Vercel Documentation](https://vercel.com/docs)** - Platform documentation and deployment guides
- **[Environment Variables](https://vercel.com/docs/projects/environment-variables)** - Manage secrets and configuration

### Twilio

- **[Twilio API Reference](https://www.twilio.com/docs/usage/api)** - Complete API documentation
- **[SMS Messaging](https://www.twilio.com/docs/sms)** - Send and receive SMS messages
- **[SendGrid Email API](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api)** - Email delivery service

### Redis

- **[Redis Documentation](https://redis.io/docs/)** - In-memory data structure store
- **[Redis Commands](https://redis.io/commands/)** - Complete command reference

### WebSocket

- **[WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)** - Browser WebSocket API reference
- **[Socket.IO Documentation](https://socket.io/docs/v4/)** - Real-time bidirectional communication

