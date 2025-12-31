# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OAuth aggregation platform for marketing agencies. Allows agencies to create access requests, clients authorize multiple platforms (Meta, Google Ads, GA4, LinkedIn) through a single link, and agencies get instant token access. Replaces 2-3 days of manual OAuth setup with a 5-minute flow.

## Monorepo Structure

This is an **npm workspaces monorepo** with three packages:

- `apps/web/` - Next.js 16 frontend (App Router, TypeScript, TailwindCSS, Clerk auth)
- `apps/api/` - Fastify backend (TypeScript, Prisma, PostgreSQL, BullMQ, Redis)
- `packages/shared/` - Shared TypeScript types and schemas (Zod)

## Essential Commands

### Development
```bash
# From root - starts both frontend (3000) and backend (3001)
npm run dev

# Individual apps
npm run dev:web    # Frontend only
npm run dev:api    # Backend only

# Type-check all packages
npm run typecheck

# Lint all packages
npm run lint

# Build all packages
npm run build
```

### Database (from apps/api/)
```bash
cd apps/api
npm run db:generate    # Generate Prisma client after schema changes
npm run db:push        # Push schema to database (development)
npm run db:studio      # Open Prisma Studio GUI
```

### Testing
```bash
# From root
npm run test

# Individual workspace tests
npm run test --workspace=apps/api
npm run test --workspace=apps/web
```

## Critical Architecture Patterns

### Token Security (MUST FOLLOW)
**NEVER store OAuth tokens directly in PostgreSQL.** All OAuth tokens MUST be stored in Infisical (secrets management):

1. Store tokens in Infisical using the SDK
2. Store only the `secretId` (secret reference) in database:
   - `PlatformAuthorization.secretId` - for client OAuth tokens
   - `AgencyPlatformConnection.secretId` - for agency's own platform connections
3. Retrieve tokens only when needed for API calls
4. Log all token access in `AuditLog` table

**Example:**
```typescript
// ❌ WRONG - Never do this
await prisma.platformAuthorization.create({
  data: { accessToken: token.access_token } // NEVER store tokens directly
});

// ✅ CORRECT - Always use Infisical
import { infisical } from '@/lib/infisical';

const secretName = infisical.generateSecretName('meta', connectionId);
await infisical.storeOAuthTokens(secretName, {
  accessToken: token.access_token,
  refreshToken: token.refresh_token,
  expiresAt: new Date(Date.now() + token.expires_in * 1000),
});

await prisma.platformAuthorization.create({
  data: { secretId: secretName } // Only store the secret name
});
```

**Important:** Infisical configuration requires:
- Machine Identity credentials (`INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`)
- Project details (`INFISICAL_PROJECT_ID`, `INFISICAL_ENV`)
- See `apps/api/src/lib/infisical.ts` for implementation

### Shared Types Usage
Types in `packages/shared/src/types.ts` are available to both frontend and backend:

```typescript
// Both apps import the same types
import { Platform, AccessRequestStatus } from '@agency-platform/shared';
```

**When adding new shared types:**
1. Add to `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`
3. Use Zod schemas for runtime validation
4. TypeScript will auto-reload in both apps (hot reload)

### API Response & Error Handling
All API endpoints follow a consistent response pattern:

```typescript
// Success response
{
  data: T  // The actual response data
}

// Error response
{
  error: {
    code: string;      // Machine-readable error code (e.g., 'INVALID_TOKEN')
    message: string;   // Human-readable error message
    details?: any;     // Optional additional error context
  }
}
```

**Error handling pattern:**
```typescript
// Backend (Fastify route)
try {
  const result = await someService.doWork();
  return { data: result };
} catch (error) {
  if (error instanceof ValidationError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors
      }
    });
  }
  throw error; // Let Fastify error handler catch unexpected errors
}

// Frontend (API client)
const response = await fetch('/api/endpoint');
const json = await response.json();

if ('error' in json) {
  // Handle error
  throw new Error(json.error.message);
}

return json.data; // Type-safe data access
```

**Common error codes:**
- `INVALID_TOKEN` - OAuth token invalid or expired
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `PLATFORM_ERROR` - External platform API error

### Database Model Relationships
The database has 9 core models with two main flows:

**Client Authorization Flow (clients authorizing their platforms to agencies):**
```
Agency
  ├─→ AgencyMember (team members with roles: admin/member/viewer)
  ├─→ Client (reusable client profiles with language preferences)
  ├─→ AccessRequestTemplate (reusable templates for access requests)
  ├─→ AccessRequest (request sent to client, has uniqueToken + platforms[])
  │     └─→ ClientConnection (created after client authorizes)
  │           └─→ PlatformAuthorization[] (one per platform: meta_ads, google_ads, etc.)
  └─→ AuditLog (security tracking - append-only)
```

**Agency Platform Connections Flow (agency's own OAuth connections):**
```
Agency
  └─→ AgencyPlatformConnection[] (agency's own platform connections)
        - Each connection has secretId (Infisical token reference)
        - Used for delegated_access auth model
```

**Key unique constraints:**
- `AccessRequest.uniqueToken` - unique link sent to clients
- `PlatformAuthorization.connectionId + platform` - one auth per platform per connection
- `AgencyPlatformConnection.agencyId + platform` - one connection per platform per agency
- `AgencyMember.agencyId + email` - one role per email per agency
- `Client.agencyId + email` - one client profile per email per agency
- `AccessRequestTemplate.agencyId + name` - unique template names per agency

### Environment Configuration
The backend uses Zod validation in `apps/api/src/lib/env.ts` for environment variables. When adding new env vars:

1. Add to the `envSchema` Zod object
2. Update `apps/api/.env.example`
3. TypeScript will enforce the env var exists at runtime

### Platform Connectors
OAuth connectors go in `apps/api/src/services/connectors/`. Each platform connector implements the `PlatformConnector` interface defined in `factory.ts`.

**Connector Interface:**
```typescript
export interface PlatformConnector {
  // Required methods
  getAuthUrl(state: string, scopes?: string[], redirectUri?: string): string;
  exchangeCode(code: string, redirectUri?: string): Promise<any>;
  verifyToken(accessToken: string): Promise<boolean>;
  getUserInfo(accessToken: string): Promise<any>;
  
  // Optional methods (implement if platform supports)
  refreshToken?(refreshToken: string): Promise<any>;
  getLongLivedToken?(shortToken: string): Promise<any>;
  verifyClientAccess?(agencyAccessToken: string, ...args: any[]): Promise<any>;
  revokeToken?(accessToken: string): Promise<void>;
}
```

**Adding a New Platform Connector:**

1. **Use the Template**
   - Copy `apps/api/src/services/connectors/TEMPLATE.ts` to `[platform].ts`
   - Replace all `[Platform]` placeholders with your platform name
   - Follow the template's inline comments and examples

2. **Add Platform to Shared Types** (`packages/shared/src/types.ts`)
   ```typescript
   // Add to PlatformSchema enum
   export const PlatformSchema = z.enum([
     // ... existing
     'beehiiv', 'kit', 'zapier',
   ]);
   
   // Add to PLATFORM_NAMES
   export const PLATFORM_NAMES: Record<Platform, string> = {
     // ... existing
     beehiiv: 'Beehiiv',
     kit: 'Kit',
     zapier: 'Zapier',
   };
   
   // Add to PLATFORM_SCOPES (check platform OAuth docs)
   export const PLATFORM_SCOPES: Record<Platform, string[]> = {
     // ... existing
     beehiiv: ['read', 'write'],
     kit: ['read', 'write'],
     zapier: ['read', 'write'],
   };
   ```

3. **Add Environment Variables** (`apps/api/src/lib/env.ts`)
   ```typescript
   const envSchema = z.object({
     // ... existing
     BEEHIIV_CLIENT_ID: z.string(),
     BEEHIIV_CLIENT_SECRET: z.string(),
     // ... add for each platform
   });
   ```
   Also update `apps/api/.env.example` with placeholder values.

4. **Register Connector** (`apps/api/src/services/connectors/factory.ts`)
   ```typescript
   import { beehiivConnector } from './beehiiv';
   
   const connectors: Partial<Record<Platform, PlatformConnector>> = {
     // ... existing
     beehiiv: beehiivConnector,
   };
   ```

5. **Test OAuth Flow**
   - Test full flow: authorize → exchange code → store in Infisical → verify token
   - Test token refresh (if supported)
   - Test token verification
   - Test user info retrieval

**Platform configuration:**
- Platform definitions: `packages/shared/src/types.ts` (`PlatformSchema`)
- OAuth scopes: `PLATFORM_SCOPES` constant (maps platform to required scopes)
- Current platforms: meta_ads, google_ads, ga4, tiktok, linkedin, snapchat, instagram

**Connector pattern notes:**
- Meta requires exchanging short-lived tokens for 60-day tokens (use `getLongLivedToken`)
- Google Ads requires a `developer-token` header for all API calls
- Store all metadata (user IDs, business IDs, ad accounts) in `PlatformAuthorization.metadata` as JSON
- OAuth state is managed by `OAuthStateService` using Redis for CSRF protection
- **NEVER store tokens in database** - always use Infisical and store only `secretId`

**Template File:**
- Full template available at `apps/api/src/services/connectors/TEMPLATE.ts`
- Includes detailed comments, examples, and all required/optional methods
- Copy and customize for new platforms

### Client Authorization Pattern
Clients authorize platforms through a simplified 2-step wizard:
1. **OAuth**: Redirect to platform, authorize requested scopes.
2. **Asset Selection**: Backend fetches all accessible assets (ad accounts, pages, etc.), client selects which ones to share.

**Asset fetching endpoints:**
- `GET /api/client-assets/:connectionId/:platform`
- Google uses `GoogleConnector.getAllGoogleAccounts()` to fetch all products.
- Meta uses `clientAssetsService.fetchMetaAssets()` to fetch ad accounts, pages, and Instagram.

**Asset selection storage:**
- Selected IDs are saved in `ClientConnection.grantedAssets` and `PlatformAuthorization.metadata.selectedAssets`.
- Format: `{ adAccounts: string[], pages: string[], ... }`

### Authorization Models
The platform supports two distinct authorization models (set per `AccessRequest`):

**1. Client Authorization (default: `authModel: 'client_authorization'`)**
- Client authorizes their own platform accounts to the agency
- Client clicks OAuth link, logs into platform, grants access
- Tokens stored in `PlatformAuthorization` linked to `ClientConnection`
- Use case: Agency needs access to client's existing ad accounts

**2. Delegated Access (`authModel: 'delegated_access'`)**
- Agency grants access to client using agency's own platform connection
- Requires agency to have `AgencyPlatformConnection` for the platform
- Agency delegates specific permissions/accounts to client
- Tokens stored in `AgencyPlatformConnection`, referenced by access request
- Use case: Agency manages ads from their own account, gives client view-only access

**Implementation note:**
The `AccessRequest.authModel` field determines which flow to use. Frontend and backend must handle both flows differently in the authorization UI and token management.

### Templates & Custom Branding
Agencies can create reusable templates and customize the client-facing experience:

**Access Request Templates (`AccessRequestTemplate` model):**
- Reusable platform configurations saved per agency
- Hierarchical platform format: `{ google: ['google_ads', 'ga4'], meta: ['meta_ads'] }`
- Custom intake fields (form questions for clients)
- Custom branding (logo, colors, subdomain)
- One template can be marked as default per agency (`isDefault: true`)

**Template usage:**
```typescript
// Create template
await prisma.accessRequestTemplate.create({
  data: {
    agencyId: 'agency-uuid',
    name: 'Standard Client Onboarding',
    platforms: { google: ['google_ads', 'ga4'], meta: ['meta_ads'] },
    intakeFields: [
      { id: 'business_name', label: 'Business Name', type: 'text', required: true },
      { id: 'monthly_budget', label: 'Monthly Budget', type: 'number', required: false }
    ],
    branding: {
      logoUrl: 'https://...',
      primaryColor: '#3B82F6',
      subdomain: 'myagency'
    },
    isDefault: true
  }
});

// Apply template to access request
const template = await prisma.accessRequestTemplate.findUnique({ where: { id } });
await prisma.accessRequest.create({
  data: {
    ...baseData,
    platforms: template.platforms,      // Copy from template
    intakeFields: template.intakeFields,
    branding: template.branding
  }
});
```

**Custom branding features:**
- Client sees agency logo and colors on authorization page
- Subdomain support (planned): `{subdomain}.accessplatform.com`
- White-label experience for enterprise agencies

**Client profiles (`Client` model):**
- Reusable client information (name, company, email, language)
- Language support: `en` (English), `es` (Spanish), `nl` (Dutch)
- One client can have multiple access requests over time
- Unique per agency + email combination

## Development Workflow

### Adding a New Feature
1. If database changes needed:
   ```bash
   # Edit apps/api/prisma/schema.prisma
   cd apps/api
   npm run db:push        # Push schema changes
   npm run db:generate    # Regenerate Prisma client
   ```

2. If shared types needed:
   - Add to `packages/shared/src/types.ts`
   - Export from `packages/shared/src/index.ts`

3. Start dev servers and verify hot reload works:
   ```bash
   npm run dev  # From root
   ```

### Adding a Platform Connector

**Quick Start:**
1. Copy `apps/api/src/services/connectors/TEMPLATE.ts` to `apps/api/src/services/connectors/[platform].ts`
2. Replace all `[Platform]` placeholders with your platform name
3. Follow the detailed steps below

**Detailed Steps:**

1. **Create Connector File**
   - Copy `TEMPLATE.ts` to `[platform].ts` (e.g., `beehiiv.ts`)
   - Replace placeholders: `[Platform]`, `[PLATFORM]`, `[platform]`
   - Update OAuth URLs, endpoints, and scopes based on platform documentation
   - Implement platform-specific methods (e.g., `getLongLivedToken` if needed)

2. **Add Platform to Shared Types** (`packages/shared/src/types.ts`)
   - Add to `PlatformSchema` enum
   - Add to `PLATFORM_NAMES` object
   - Add to `PLATFORM_SCOPES` object (check platform OAuth docs for correct scopes)

3. **Add Environment Variables**
   - Add to `apps/api/src/lib/env.ts` (`envSchema` Zod object)
   - Add to `apps/api/.env.example` with placeholder values
   - Format: `[PLATFORM]_CLIENT_ID` and `[PLATFORM]_CLIENT_SECRET`

4. **Register Connector** (`apps/api/src/services/connectors/factory.ts`)
   - Import your connector instance
   - Add to `connectors` object mapping platform to connector

5. **Test OAuth Flow**
   - Test authorization URL generation
   - Test code exchange for tokens
   - Test token refresh (if supported)
   - Test token verification
   - Test user info retrieval
   - Verify tokens are stored in Infisical (not database)

**Template File:**
- Full template with examples: `apps/api/src/services/connectors/TEMPLATE.ts`
- Includes all required and optional methods with detailed comments
- Platform-specific examples and patterns included

### Background Jobs & Redis
The platform uses BullMQ with Redis for background job processing:

**Use cases:**
- Token refresh jobs (scheduled before expiration)
- Cleanup jobs (expired access requests, revoked connections)
- OAuth state management (CSRF protection with TTL)

**Key files:**
- `apps/api/src/lib/redis.ts` - Redis client (IORedis, Upstash)
- `apps/api/src/lib/queue.ts` - BullMQ queue configuration
- `apps/api/src/jobs/token-refresh.ts` - Token refresh worker
- `apps/api/src/services/oauth-state.service.ts` - OAuth state management

**Adding a new job:**
```typescript
// 1. Define job in queue.ts
export const myQueue = new Queue('my-job', { connection: redisConnection });

// 2. Create worker in jobs/my-job.ts
const worker = new Worker('my-job', async (job) => {
  // Job logic here
}, { connection: redisConnection });

// 3. Schedule job from service
await myQueue.add('job-name', { data }, {
  delay: 1000 * 60 * 5, // 5 minutes
  attempts: 3
});
```

## Key Dependencies

### Backend (`apps/api`)
- **Fastify** - Web framework with plugins (@fastify/cors, @fastify/jwt)
- **Prisma** - ORM with PostgreSQL (Neon)
- **BullMQ** - Background jobs (token refresh, cleanup)
- **IORedis** - Redis client (Upstash)
- **@clerk/backend** - User authentication verification
- **@infisical/sdk** - Secrets management for OAuth token storage
- **Zod** - Runtime validation and type safety
- **Pino** - Structured logging (pino-pretty for dev)

### Frontend (`apps/web`)
- **Next.js 16** - React framework (App Router)
- **@clerk/nextjs** - Authentication UI and hooks
- **@tanstack/react-query** - Server state management
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Component library (in `components/ui/`)

### Running Tests
```bash
# Run all tests (from root)
npm run test

# Individual workspace tests
npm run test --workspace=apps/api
npm run test --workspace=apps/web
npm run test --workspace=packages/shared

# Run specific test files
cd apps/api
npm test src/services/__tests__/connection.service.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Test structure:**
- Backend: Vitest with `__tests__/` directories next to source files
- Frontend: Vitest for components, hooks, and utilities
- Shared: Jest for type validation and schemas
- Test utilities: `@testing-library/react`, `vitest` globals

### UI Testing
**ALWAYS use the `dev-browser` skill for UI testing tasks.** This includes:
- Browser automation and testing
- Visual regression testing
- End-to-end user flow testing
- Screenshot-based testing
- Interactive UI debugging

The dev-browser skill should be the default approach for all browser-based testing and automation.

## Port Configuration
- Frontend: `3000` (configurable via Next.js PORT env var)
- Backend: `3001` (configurable via `apps/api/.env` PORT)
- Prisma Studio: `5555` (default)

Kill ports if needed:
```bash
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

## Deployment

### Frontend (Vercel)
- Deployed from `apps/web/`
- Set environment variables in Vercel dashboard
- Automatic deployments from main branch

### Backend (Railway)
- Deployed from `apps/api/`
- Set environment variables via Railway CLI or dashboard
- PostgreSQL (Neon) and Redis (Upstash) are external services

```bash
# Railway deployment
cd apps/api
railway up
```

## Security Requirements

1. **Token Storage**: Always use Infisical, never store tokens in database
2. **Audit Logging**: Log every token access with user email, IP, timestamp, action
   - Actions: `token_viewed`, `access_granted`, `access_revoked`, `AGENCY_CONNECTED`, `AGENCY_DISCONNECTED`, `AGENCY_TOKEN_REFRESHED`
   - Include `metadata`, `ipAddress`, `userAgent` where applicable
3. **Authentication**: Verify Clerk JWT on every API request (backend middleware)
4. **Role-Based Access**: Enforce agency member roles (admin/member/viewer)
   - Admin: Full access (create, edit, delete, manage team)
   - Member: Create and manage access requests, view connections
   - Viewer: Read-only access to dashboard
5. **OAuth State Management**: Use Redis-backed CSRF tokens for all OAuth flows
6. **Secrets Rotation**: Rotate Infisical Machine Identity credentials quarterly
7. **Access Request Expiration**: All access requests expire after 7 days by default

## Environment Variables

**Required environment variables** (see `apps/api/.env.example` for full list):

### Backend (`apps/api/.env`)
```bash
# Core
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...          # Neon PostgreSQL
FRONTEND_URL=http://localhost:3000

# Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Token Storage
INFISICAL_CLIENT_ID=                   # Machine Identity
INFISICAL_CLIENT_SECRET=               # Machine Identity
INFISICAL_PROJECT_ID=                  # Project UUID
INFISICAL_ENVIRONMENT=dev              # dev, staging, prod

# Redis/BullMQ
REDIS_URL=redis://localhost:6379      # Upstash or local

# Logging
LOG_LEVEL=info                         # debug, info, warn, error
```

### Frontend (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Adding platform credentials:**
When adding a new platform connector, add credentials to both files:
```bash
# apps/api/.env
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret

# Also update apps/api/.env.example with placeholder values
```
