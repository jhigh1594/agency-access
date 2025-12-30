# Design Documentation

**Note:** If your tool is externally accessible, please make sure you include screenshots.

## Company Name:

Agency Access Platform

## Business Model:

Agency Access Platform operates as a B2B SaaS platform that enables marketing agencies to streamline client onboarding by collecting OAuth access credentials across multiple advertising platforms (Meta Ads, Google Ads, Google Analytics 4, TikTok Ads, LinkedIn Ads, Snapchat Ads) through a single branded authorization link.

Our platform serves marketing agencies who need to obtain client access to advertising platforms. Instead of the traditional 2-3 day manual process involving back-and-forth emails and password sharing, agencies create a branded access request link specifying which platforms they need. Clients click one link and complete OAuth authorization for all requested platforms sequentially. Agencies receive instant API-level access without manual credential exchange.

We only facilitate OAuth authorization for platforms that clients explicitly grant access to. Agencies cannot access client accounts without explicit authorization through the OAuth flow. All OAuth tokens are stored securely in Infisical (secrets management) and never stored directly in our database.

## Tool Access/Use:

Our tool is used by marketing agency employees (account managers, ad managers, agency administrators) to:

1. **Create Access Requests:** Agency users create branded access request links with selected platforms, custom intake forms, and white-label branding (logo, colors, subdomain).

2. **Monitor Token Health:** Agency users view a dashboard showing the health and expiration status of all client platform connections. They can manually refresh expiring tokens and receive automated refresh notifications.

3. **Manage Client Connections:** Agency users can view all active client connections, see which platforms are authorized, and monitor token expiration status.

4. **Client Authorization Flow:** Clients (external users, not logged into our platform) receive access request links via email. They complete a branded authorization page with:
   - Custom intake form (collects company information)
   - OAuth authorization buttons for each requested platform
   - Sequential platform authorization flow
   - Confirmation screen after completion

5. **Automated Token Refresh:** Background jobs automatically refresh OAuth tokens before expiration (7 days before expiry) to prevent interrupted access.

6. **Audit Logging:** All token access events are logged with user email, IP address, timestamp, and action type for security compliance.

Our tool is not directly accessible to advertising agencies' clients (the end clients). Clients only interact with our platform through one-time authorization links. They do not have accounts or login access to our platform. Agencies are the primary users who manage access requests and monitor token health through our dashboard.

## Tool Design:

### Architecture Overview

**Frontend (Next.js 16):**
- Agency Dashboard: React-based interface for creating access requests, viewing connections, and monitoring token health
- Client Authorization Pages: Branded pages (white-label) where clients complete OAuth authorization
- Authentication: Clerk for agency user authentication
- State Management: TanStack Query (React Query) for server state
- UI Components: shadcn/ui component library with TailwindCSS

**Backend (Fastify):**
- API Routes: RESTful API endpoints for access request management, OAuth callbacks, token health monitoring
- Database: PostgreSQL (Neon) with Prisma ORM
- OAuth Connectors: Platform-specific connectors (Meta, Google, TikTok, LinkedIn, Snapchat) that handle OAuth flows
- Token Storage: Infisical SDK for secure OAuth token storage (tokens never stored in database)
- Background Jobs: BullMQ with Redis for automated token refresh jobs
- Authentication: Clerk JWT verification on all API requests

### Data Flow

**Access Request Creation:**
1. Agency user creates access request via dashboard
2. System generates unique token and saves to database
3. System returns shareable branded URL: `{subdomain}.agencyplatform.com/invite/{token}`

**Client Authorization Flow:**
1. Client clicks access request link
2. Client completes intake form (custom fields defined by agency)
3. Client clicks OAuth button for each platform
4. Client redirected to platform OAuth consent screen
5. Client grants permissions
6. Platform redirects back with authorization code
7. Backend exchanges code for access/refresh tokens
8. Tokens stored in Infisical (secrets management)
9. Only `secretId` (reference) stored in database
10. Platform marked as "Authorized" in UI
11. Agency receives notification

**Token Health Monitoring:**
1. Agency user views token health dashboard
2. System queries database for all `PlatformAuthorization` records
3. For each record, system retrieves token metadata from Infisical
4. System calculates health status based on expiration date:
   - Healthy: expires in >7 days
   - Expiring: expires in 1-7 days
   - Expired: past expiration date
5. Dashboard displays status badges and expiration countdowns
6. User can manually trigger refresh for any token

**Automated Token Refresh:**
1. BullMQ job runs every 6 hours
2. Job queries for tokens expiring within 7 days
3. For each expiring token:
   - Retrieve refresh token from Infisical
   - Call platform connector's `refreshToken()` method
   - Update Infisical with new access token and expiration
   - Update database `lastRefreshedAt` timestamp
   - Log refresh event in audit log
4. On failure: retry with exponential backoff, alert agency after 3 failures

### Security Design

**Token Storage:**
- All OAuth tokens stored in Infisical (encrypted secrets management)
- Database only stores `secretId` (reference to Infisical secret)
- Tokens retrieved only when needed for API calls
- Never logged or exposed in error messages

**Authentication:**
- Agency users authenticated via Clerk
- Clerk JWT verified on every API request
- Role-based access control (admin/member/viewer roles)
- Client authorization pages are public (no authentication required)

**Audit Logging:**
- Every token access logged with:
  - User email (agency user or client email)
  - IP address
  - Timestamp
  - Action type (access_granted, token_refreshed, token_viewed, etc.)
- Audit logs are append-only (never deleted)

**OAuth Security:**
- OAuth state parameter stored in Redis for CSRF protection
- State tokens expire after 10 minutes
- Redirect URIs validated against registered OAuth apps

### Platform Connectors

Each platform (Meta, Google, TikTok, LinkedIn, Snapchat) has a dedicated connector class that implements:

- `getAuthUrl(state: string)`: Generate OAuth authorization URL
- `exchangeCode(code: string)`: Exchange authorization code for tokens
- `refreshToken(refreshToken: string)`: Refresh expired access tokens
- `verifyToken(accessToken: string)`: Verify token is valid
- `getUserInfo(accessToken: string)`: Get user/business metadata

Platform-specific OAuth scopes are defined per platform and requested during authorization.

### Database Schema

**Core Models:**
- `Agency`: Marketing agencies using the platform
- `AgencyMember`: Team members with roles (admin/member/viewer)
- `AccessRequest`: Access requests created by agencies (has uniqueToken, platforms, branding)
- `ClientConnection`: Active client connections (created after authorization)
- `PlatformAuthorization`: Per-platform OAuth authorizations (stores secretId reference only)
- `AuditLog`: Security audit trail (append-only)

**Key Relationships:**
- Agency → AccessRequest → ClientConnection → PlatformAuthorization
- Agency → AgencyPlatformConnection (agency's own platform connections for delegated access)

### API Endpoints

**Agency Endpoints (Authenticated):**
- `POST /api/access-requests`: Create new access request
- `GET /api/access-requests`: List agency's access requests
- `GET /api/token-health`: Get token health status for all connections
- `POST /api/token-refresh`: Manually refresh a token
- `GET /api/audit-logs`: View audit log entries

**Client Endpoints (Public):**
- `GET /api/access-requests/:token`: Get access request details for client view
- `POST /api/oauth/:platform/callback`: OAuth callback handler
- `POST /api/intake-responses`: Submit intake form responses

**OAuth Flow:**
- Client clicks platform authorization button
- Redirected to platform OAuth consent screen
- Platform redirects back to `/api/oauth/:platform/callback` with code
- Backend exchanges code, stores tokens in Infisical, creates database records

### User Interface Design

**Agency Dashboard:**
- Sidebar navigation (Dashboard, Access Requests, Connections, Token Health, Settings)
- Main content area with cards/tables
- Status badges (green/yellow/red) for token health
- Action buttons (Create Request, Refresh Token, etc.)

**Client Authorization Page:**
- Branded with agency logo and colors
- Multi-step wizard:
  1. Intake form (custom fields)
  2. Platform authorization (OAuth buttons)
  3. Confirmation screen
- Responsive design (mobile-friendly)
- No authentication required (public pages)

**Design System:**
- Color palette: Indigo primary (#6366f1), Emerald success (#10b981), Amber warning (#f59e0b), Red error (#ef4444)
- Typography: Inter font family
- Components: shadcn/ui component library
- Spacing: 8px base unit, multiples of 4
- Professional B2B SaaS aesthetic (inspired by Stripe, Linear)

### External Integrations

**Infisical:**
- Secrets management for OAuth token storage
- Machine Identity authentication
- Project-based secret organization

**Clerk:**
- User authentication and session management
- JWT token verification
- User profile management

**Platform OAuth APIs:**
- Meta Marketing API OAuth
- Google Ads API OAuth
- Google Analytics API OAuth
- TikTok Marketing API OAuth
- LinkedIn Marketing API OAuth
- Snapchat Ads API OAuth

**Redis (Upstash):**
- OAuth state management (CSRF protection)
- BullMQ job queue storage

**PostgreSQL (Neon):**
- Primary database for application data
- Prisma ORM for type-safe database access

### Deployment

**Frontend:**
- Hosted on Vercel
- Next.js 16 App Router
- Environment variables for API URLs, Clerk keys

**Backend:**
- Hosted on Railway
- Fastify server
- Environment variables for database, Infisical, platform OAuth credentials

**Infrastructure:**
- PostgreSQL: Neon (serverless)
- Redis: Upstash (serverless)
- Secrets: Infisical (cloud-hosted)

---

**Last Updated:** January 2025  
**Version:** 1.0
