# Architecture

**Analysis Date:** 2026-03-29

## Pattern Overview

**Overall:** Monorepo with separate frontend (Next.js) and backend (Fastify) applications, connected by shared TypeScript types and Zod schemas.

**Key Characteristics:**
- **Monorepo structure** - Separate apps and packages managed via npm workspaces
- **Token-first security** - OAuth tokens stored in Infisical (external secrets manager), never in PostgreSQL
- **Platform connector pattern** - Base connector class with platform-specific OAuth implementations
- **Service-oriented backend** - Business logic in services layer, routes handle HTTP concerns
- **Client-side data fetching** - TanStack Query for server state, optimistic updates
- **Design system hybrid** - shadcn/ui foundation with "Acid Brutalism" aesthetic layer

## Layers

**Frontend (apps/web):**
- Purpose: Next.js 16 application with App Router, server components, and client-side interactivity
- Location: `apps/web/src/`
- Contains: UI components, pages, hooks, query functions
- Depends on: `@agency-platform/shared` for types, backend API for data
- Used by: End users (agencies and clients)

**Backend (apps/api):**
- Purpose: Fastify REST API with authentication, business logic, and OAuth orchestration
- Location: `apps/api/src/`
- Contains: Routes, services, middleware, connectors, jobs
- Depends on: PostgreSQL via Prisma, Infisical for token storage, Clerk for JWT verification
- Used by: Frontend app, external webhooks

**Shared (packages/shared):**
- Purpose: TypeScript types and Zod schemas shared across frontend and backend
- Location: `packages/shared/src/`
- Contains: Platform enums, type definitions, validation schemas
- Depends on: Zod for runtime validation
- Used by: Both apps/web and apps/api

## Data Flow

**Client Authorization Flow:**

1. **Access Request Creation** - Agency creates access request via `apps/api/src/routes/access-requests.ts` with platforms and client info
2. **Client Authorization Link** - Client visits `/invite/[token]` route with unique token from `AccessRequest.uniqueToken`
3. **OAuth Redirect** - User clicks platform authorization, redirected to platform OAuth endpoint via connector
4. **Token Exchange** - Platform redirects to `/platforms/callback`, backend exchanges code for tokens via `apps/api/src/services/connectors/`
5. **Token Storage** - Tokens stored in Infisical, only `secretId` reference saved to `PlatformAuthorization` table
6. **Asset Selection** - Backend fetches available assets (ad accounts, properties) via platform APIs, client selects
7. **Connection Completion** - Selected assets stored in `ClientConnection.grantedAssets` and `PlatformAuthorization.metadata`
8. **Agency Notification** - Webhook sent to agency if configured, agency can view authorized platforms

**State Management:**
- **Server state** - TanStack Query with React Query devtools, optimistic updates for mutations
- **Client state** - React Context for auth, UI state, sidebar navigation
- **Form state** - React Hook Form with Zod validation
- **URL state** - Search params for filters, pagination

## Key Abstractions

**BaseConnector:**
- Purpose: Abstract base class for platform OAuth connectors
- Examples: `apps/api/src/services/connectors/meta.ts`, `apps/api/src/services/connectors/google.ts`
- Pattern: Template method pattern - override `normalizeResponse()` for standard OAuth, override `exchangeCode()` for custom flows

**Platform Registry:**
- Purpose: Configuration-driven platform OAuth endpoints and capabilities
- Examples: `apps/api/src/services/connectors/registry.config.ts`
- Pattern: Static configuration object with platform-specific OAuth URLs, scopes, flags

**Service Layer:**
- Purpose: Business logic separated from HTTP routes
- Examples: `apps/api/src/services/access-request.service.ts`, `apps/api/src/services/connection-aggregation.service.ts`
- Pattern: Stateless functions with Prisma client dependency, return standardized `{ data, error }` responses

**Query Hooks:**
- Purpose: Frontend data fetching with TanStack Query
- Examples: `apps/web/src/lib/query/billing.ts`, `apps/web/src/lib/query/onboarding.ts`
- Pattern: Custom hooks wrapping `useQuery` and `useMutation` with API client

## Entry Points

**Backend Server:**
- Location: `apps/api/src/index.ts`
- Triggers: `npm run dev:api` starts Fastify server on port 3001
- Responsibilities: Register middleware, routes, plugins; start pg-boss job handlers; listen on configured port

**Frontend App:**
- Location: `apps/web/src/app/layout.tsx` (root layout)
- Triggers: `npm run dev:web` starts Next.js dev server on port 3000
- Responsibilities: Root layout with fonts, metadata, providers; route segments handle nested layouts

**Shared Types:**
- Location: `packages/shared/src/index.ts`
- Triggers: Imported by both apps during build/runtime
- Responsibilities: Export all shared types and Zod schemas

## Error Handling

**Strategy:** Standardized `{ error: { code, message, details } }` format across all API responses

**Patterns:**
- **API errors** - Routes return `{ data: null, error: { code, message } }` for validation and business logic errors
- **HTTP errors** - Global Fastify error handler converts uncaught errors to standard format
- **Frontend errors** - API client checks `if ('error' in json)` and throws with `json.error.message`
- **Error codes** - Common codes: INVALID_TOKEN, VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, PLATFORM_ERROR

## Cross-Cutting Concerns

**Logging:** Pino logger in backend with JSON output; structured logging with request context

**Validation:** Zod schemas for all API inputs; runtime validation on both backend and frontend

**Authentication:** Clerk JWT verification via `@clerk/backend` RS256 token handling; `authenticate()` middleware on protected routes; scoped to agency via `agencyId`

**Authorization:** Role-based access control (admin, member, viewer) enforced in services and routes

**Token Security:** Infisical SDK for secret storage; `secretId` only stored in database; audit logging on all token access

**Caching:** In-memory cache for agency lookups (30min TTL); Redis for OAuth state (pg-boss job queue uses PostgreSQL)

**Performance:** Performance monitoring middleware; perf marks for auth, database, API calls; Sentry for error tracking

---

*Architecture analysis: 2026-03-29*
