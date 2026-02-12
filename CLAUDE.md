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
OAuth connectors go in `apps/api/src/services/connectors/`. The system uses a **configuration-driven registry pattern** with a base connector class for code reuse.

**Architecture:**

1. **`registry.config.ts`** - Centralized OAuth configuration for all platforms
   - Contains OAuth endpoints, scope separators, auth params, API headers
   - Flags for platform behaviors: `requiresLongLivedExchange`, `supportsRefreshTokens`, etc.
   - Most platforms can be added with configuration alone

2. **`base.connector.ts`** - Reusable OAuth implementation
   - All connectors extend `BaseConnector` for common OAuth flows
   - Handles authorization URL generation, code exchange, token verification
   - Override methods only for platform-specific quirks

3. **`[platform].ts`** - Platform-specific connectors (when needed)
   - Extend `BaseConnector` and override specific methods
   - Required for non-standard flows (e.g., Beehiiv API key auth, Kit JSON token exchange)

4. **`factory.ts`** - Connector instantiation and caching

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

1. **Add Platform to Shared Types** (`packages/shared/src/types.ts`)
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

2. **Add to Registry Configuration** (`apps/api/src/services/connectors/registry.config.ts`)
   ```typescript
   export const PLATFORM_CONFIGS: Record<Platform, PlatformOAuthConfig> = {
     // ... existing
     zapier: {
       name: 'Zapier',
       authUrl: 'https://zapier.com/oauth/authorize',
       tokenUrl: 'https://zapier.com/oauth/token',
       scopeSeparator: ' ',
       userInfoUrl: 'https://api.zapier.com/v2/user',
       supportsRefreshTokens: true,
       defaultScopes: ['read', 'write'],
     },
   };
   ```

3. **Add Environment Variables** (`apps/api/src/lib/env.ts`)
   ```typescript
   const envSchema = z.object({
     // ... existing
     ZAPIER_CLIENT_ID: z.string(),
     ZAPIER_CLIENT_SECRET: z.string(),
     // ... add for each platform
   });
   ```
   Also update `apps/api/.env.example` with placeholder values.

4. **Create Platform Connector** (if needed)
   - Copy `apps/api/src/services/connectors/TEMPLATE.ts` to `[platform].ts`
   - Extend `BaseConnector` instead of implementing from scratch
   - Override only platform-specific methods
   - Most standard OAuth 2.0 platforms don't need this step

5. **Register in Factory** (`apps/api/src/services/connectors/factory.ts`)
   ```typescript
   import { zapierConnector } from './zapier'; // if custom connector needed

   const connectors: Partial<Record<Platform, PlatformConnector>> = {
     // ... existing
     zapier: zapierConnector, // or use createConnector('zapier') for config-only
   };
   ```

6. **Test OAuth Flow**
   - Test full flow: authorize → exchange code → store in Infisical → verify token
   - Test token refresh (if supported)
   - Test token verification
   - Test user info retrieval

**Platform Hierarchy:**

The platform supports two types of platforms:
- **Group-level** (`google`, `meta`, `linkedin`): Single OAuth for multiple products
- **Product-level** (`google_ads`, `ga4`, `meta_ads`): Individual OAuth per product

```typescript
// Categorized for UI display
export const PLATFORM_CATEGORIES = {
  recommended: ['google', 'meta', 'linkedin'] as const,  // Group-level (recommended)
  other: ['google_ads', 'ga4', 'meta_ads', 'tiktok', 'snapchat', 'instagram', 'kit', 'beehiiv'] as const,
};
```

**Current platforms:**
- Group-level: `google`, `meta`, `linkedin`
- Product-level: `google_ads`, `ga4`, `meta_ads`, `tiktok`, `snapchat`, `instagram`, `kit`, `beehiiv`

**Connector pattern notes:**
- Meta requires exchanging short-lived tokens for 60-day tokens (use `getLongLivedToken`)
- Google Ads requires a `developer-token` header for all API calls
- Kit uses JSON request body for token exchange (not form-encoded)
- Beehiiv uses API key authentication (team invitation workflow, not OAuth)
- Zapier uses manual invitation flow (like Beehiiv/Kit) - no OAuth, agencies provide email for client invitations
- Store all metadata (user IDs, business IDs, ad accounts) in `PlatformAuthorization.metadata` as JSON
- OAuth state is managed by `OAuthStateService` using Redis for CSRF protection
- **NEVER store tokens in database** - always use Infisical and store only `secretId`

**Template File:**
- Full template available at `apps/api/src/services/connectors/TEMPLATE.ts`
- Includes detailed comments, examples, and all required/optional methods
- Copy and customize for new platforms with non-standard flows

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
The platform currently supports one authorization model (set per `AccessRequest`):

**Delegated Access (`authModel: 'delegated_access'`)**
- Agency grants access to client using agency's own platform connection
- Requires agency to have `AgencyPlatformConnection` for the platform
- Agency delegates specific permissions/accounts to client
- Tokens stored in `AgencyPlatformConnection`, referenced by access request
- Use case: Agency manages ads from their own account, gives client view-only access

**Implementation note:**
The `AccessRequest.authModel` field is set to `'delegated_access'` for all access requests. Frontend and backend handle the flow through agency-owned connections.

### Access Levels & Granular Permissions

The platform supports granular access levels for platform connections:

**Access Levels:**
- `admin` - Full control over the account (create, edit, delete, manage billing, add/remove users)
- `standard` - Can create and edit, but not delete (create campaigns, edit settings, view reports)
- `read_only` - View-only access for reporting (view campaigns, view reports, export data)
- `email_only` - Basic email access for notifications (receive email reports, view shared dashboards)

**Usage:**
```typescript
import { AccessLevel, ACCESS_LEVEL_DESCRIPTIONS } from '@agency-platform/shared';

// In access request creation
const accessRequest = await prisma.accessRequest.create({
  data: {
    globalAccessLevel: 'standard', // Applied to all platforms
    platforms: {
      meta: ['meta_ads'],
      google: ['google_ads', 'ga4']
    }
  }
});

// Access level descriptions for UI
const levelInfo = ACCESS_LEVEL_DESCRIPTIONS['standard'];
// { title: 'Standard Access', description: 'Can create and edit...', permissions: [...] }
```

**Permission mapping to platform-specific scopes:**
- Access levels are translated to platform-specific OAuth scopes during authorization
- Different platforms may map to different scopes based on their capabilities
- See `PLATFORM_SCOPES` in `packages/shared/src/types.ts` for platform-specific scope definitions

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

See the **Platform Connectors** section above for detailed instructions on adding new platforms.

**Quick Start:**
1. Add platform to `packages/shared/src/types.ts` (`PlatformSchema`, `PLATFORM_NAMES`, `PLATFORM_SCOPES`)
2. Add OAuth config to `apps/api/src/services/connectors/registry.config.ts`
3. Add environment variables to `apps/api/src/lib/env.ts` and `apps/api/.env.example`
4. Create custom connector only if platform has non-standard OAuth flow (extend `BaseConnector`)
5. Register in `apps/api/src/services/connectors/factory.ts`
6. Test OAuth flow end-to-end, verify Infisical token storage

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

## Frontend Development & Design System

### Design System Reference

**Complete documentation**: `apps/web/DESIGN_SYSTEM.md`
**Visual token showcase**: Run dev server → visit `http://localhost:3000/design-system`

### "Acid Brutalism" Aesthetic

Our design system combines shadcn/ui patterns with a bold brutalist aesthetic:

**Core Philosophy**: Be bold, be memorable, be intentional. One brutalist element per view.

#### Color Palette (CSS Variables)
| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | #09090B | Backgrounds |
| `--paper` | #FAFAFA | Surfaces |
| `--coral` | #FF6B35 | Primary CTAs (10% usage) |
| `--teal` | #00A896 | Success states (5% usage) |
| `--acid` | #CCFF00 | Kinetic elements (2% only!) |
| `--electric` | #8B5CF6 | Hover states |

#### Typography
- **dela** → Hero headlines (`font-dela`)
- **display** (Geist) → Section headings (`font-display`)
- **sans** → Body text, UI elements
- **mono** → Code, data, technical content

#### Hard Shadows (Brutalist Signature)
```css
/* Defined in globals.css */
.shadow-brutalist     → 4px 4px 0px #000
.shadow-brutalist-lg  → 6px 6px 0px #000
.shadow-brutalist-xl  → 8px 8px 0px #000
```

#### Component Patterns

**Button Variants** (see `components/ui/button.tsx`):
- `primary`, `secondary`, `success`, `danger`, `ghost` — Standard flows
- `brutalist` — Hero CTAs, use **once per page**
- `brutalist-ghost` — Outlined brutalist
- `brutalist-rounded` — Softer brutalist for cards

**Card Styles**:
- `Card` (shadcn) — Standard refined card
- `.brutalist-card` — Hard borders, hard shadows
- `.clean-card` — Subtle shadow with hover lift

**Animation Utilities**:
```tsx
// Reveal animations
<div className="reveal-element reveal-up">Content</div>
<div className="reveal-element reveal-down stagger-1">Delayed</div>

// Brutalist hover
<div className="hover-lift-brutalist">Card</div>
```

### Frontend Development Guidelines

1. **Use shadcn/ui patterns** — `cn()` utility, forwardRef, proper types
2. **Reference design tokens** — Use CSS variables, not hard-coded values
3. **One brutalist element per view** — Restraint creates impact
4. **Touch targets minimum 44×44px** — iOS HIG compliance
5. **Mobile-first responsive** — `md:`, `lg:` breakpoints for larger screens
6. **Respect motion preferences** — All animations respect `prefers-reduced-motion`

### Component Library Structure
```
apps/web/src/components/ui/
├── button.tsx           # Extended with brutalist variants
├── card.tsx             # shadcn/ui base
├── status-badge.tsx     # Custom status indicators
├── platform-icon.tsx    # Platform logos
├── empty-state.tsx      # Empty state patterns
└── [components]         # Custom components
```

## Test-Driven Development (TDD) (MUST FOLLOW)

**All new code MUST be written using Test-Driven Development.** This is not optional - tests are written BEFORE implementation code.

### The TDD Cycle (Red-Green-Refactor)

1. **Red**: Write a failing test for the desired behavior
2. **Green**: Write the MINIMUM code to make the test pass
3. **Refactor**: Improve the code while keeping tests green
4. **Repeat** for each small piece of functionality

### TDD Workflow by Code Type

**Backend Services (`apps/api/src/services/`):**
```typescript
// 1. First, create the test file: src/services/__tests__/my-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyService } from '../my-service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should validate platform authorization', async () => {
    // Arrange
    const token = 'valid-token';
    
    // Act
    const result = await service.verifyToken(token);
    
    // Assert
    expect(result).toBe(true);
  });

  it('should throw error for invalid token', async () => {
    await expect(service.verifyToken('invalid'))
      .rejects.toThrow('INVALID_TOKEN');
  });
});

// 2. Run the test - it WILL fail (Red)
// npm test src/services/__tests__/my-service.test.ts

// 3. Write MINIMUM code to pass (Green)
export class MyService {
  async verifyToken(token: string): Promise<boolean> {
    if (!token || token === 'invalid') {
      throw new Error('INVALID_TOKEN');
    }
    return true;
  }
}

// 4. Refactor if needed, keeping tests green
```

**Frontend Components (`apps/web/src/components/`):**
```typescript
// 1. Write test first: components/__tests__/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should display user greeting', () => {
    render(<MyComponent name="Claude" />);
    expect(screen.getByText('Hello, Claude!')).toBeInTheDocument();
  });

  it('should show loading state while fetching', () => {
    render(<MyComponent name="Claude" loading />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});

// 2. Run test - it fails (Red)
// 3. Write minimal component (Green)
export function MyComponent({ name, loading }: { name: string; loading?: boolean }) {
  if (loading) return <div data-testid="loading-spinner">Loading...</div>;
  return <div>Hello, {name}!</div>;
}

// 4. Refactor as needed
```

**Shared Types (`packages/shared/src/`):**
```typescript
// 1. Write validation tests first
import { describe, it, expect } from 'vitest';
import { PlatformSchema, AccessLevelSchema } from '../types';

describe('Shared Types Validation', () => {
  it('should validate valid platform enum', () => {
    const result = PlatformSchema.safeParse('meta_ads');
    expect(result.success).toBe(true);
  });

  it('should reject invalid platform', () => {
    const result = PlatformSchema.safeParse('invalid_platform');
    expect(result.success).toBe(false);
  });

  it('should validate access levels', () => {
    expect(AccessLevelSchema.safeParse('admin').success).toBe(true);
    expect(AccessLevelSchema.safeParse('super_admin').success).toBe(false);
  });
});

// 2. Define types to pass tests
export const PlatformSchema = z.enum(['meta_ads', 'google_ads', 'ga4']);
export const AccessLevelSchema = z.enum(['admin', 'standard', 'read_only', 'email_only']);
```

### TDD Rules for This Project

1. **Never write implementation code without a failing test**
   - The test MUST fail initially (Red phase)
   - If the test passes immediately, you're not testing anything new

2. **Write the MINIMUM code to pass**
   - Don't add features "for later" - only what the test requires
   - Keep implementation simple until refactoring phase

3. **One test, one small piece of behavior**
   - Each test should verify ONE specific behavior
   - Break complex features into multiple small tests

4. **Test names describe behavior, not implementation**
   ```typescript
   // Good: describes behavior
   it('should revoke OAuth token and log audit entry')
   
   // Bad: describes implementation
   it('should call infisical.delete() and prisma.auditLog.create()')
   ```

5. **Run tests continuously during development**
   ```bash
   # Watch mode - tests run on every save
   npm test -- --watch
   
   # Run specific test file during TDD cycle
   npm test src/services/__tests__/my-service.test.ts
   ```

### What NOT to Do (Anti-Patterns)

```typescript
// ❌ WRONG: Writing code first, then tests
function calculateDiscount(price: number, discount: number) {
  return price * (1 - discount / 100);
}

// Later adding tests...
test('calculates discount', () => { ... });

// ✅ CORRECT: Test first
test('should apply 20% discount to $100', () => {
  expect(calculateDiscount(100, 20)).toBe(80);
});

// Then write implementation
function calculateDiscount(price: number, discount: number) {
  return price * (1 - discount / 100);
}
```

### Integration with Existing Test Setup

This project uses:
- **Vitest** for backend and frontend tests
- **Testing Library** for React components
- **Test location**: `__tests__/` directories next to source files

```bash
# Before starting any new feature work:
# 1. Create test file
touch apps/api/src/services/__tests__/new-feature.test.ts

# 2. Write first failing test
# 3. Run: npm test apps/api/src/services/__tests__/new-feature.test.ts
# 4. Write minimum implementation
# 5. Refactor
# 6. Repeat for next behavior
```

### When Tests Are Not Required

The only exceptions to TDD are:
- **Configuration files** (tsconfig, vite.config, etc.)
- **Type definitions** (without runtime validation logic)
- **Styling/CSS files** (use visual regression testing via dev-browser skill instead)

**Everything else MUST follow TDD:**
- Services, utilities, helpers
- React components and hooks
- API routes and endpoints
- Database migrations (write test for migration behavior)
- Background jobs

### Coverage Requirements

Maintain test coverage above:
- **Backend**: 80% minimum, 90% target for critical paths (OAuth, token storage)
- **Frontend**: 70% minimum for components, 90% for utilities/hooks
- **Shared**: 95%+ (types and schemas are critical for type safety)

Check coverage:
```bash
npm test -- --coverage
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
