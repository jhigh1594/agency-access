# Codebase Structure

**Analysis Date:** 2026-03-29

## Directory Layout

```
agency-access-platform/
├── apps/
│   ├── web/              # Next.js 16 frontend (App Router, Clerk, TailwindCSS)
│   ├── api/              # Fastify backend (Prisma, PostgreSQL, BullMQ)
│   └── docs/             # Documentation site (if present)
├── packages/
│   └── shared/           # Shared TypeScript types and Zod schemas
├── tools/
│   └── design-os/        # Design system documentation tool
├── docs/                 # Product documentation and technical specs
├── .cursor/              # Cursor IDE configurations
├── .claude/              # Claude Code agent definitions
├── scripts/              # Automation and benchmarking scripts
└── marketing/            # Content calendar and strategy docs
```

## Directory Purposes

**apps/web/:**
- Purpose: Next.js frontend application for agencies and clients
- Contains: Pages, components, hooks, query functions, styling
- Key files: `src/app/layout.tsx`, `src/lib/api-client.ts`, `DESIGN_SYSTEM.md`

**apps/api/:**
- Purpose: Fastify backend API server
- Contains: Routes, services, middleware, connectors, Prisma schema
- Key files: `src/index.ts`, `prisma/schema.prisma`, `src/services/connectors/`

**packages/shared/:**
- Purpose: Shared TypeScript types and Zod schemas
- Contains: Type definitions, platform enums, validation schemas
- Key files: `src/types.ts`, `src/index.ts`

**docs/:**
- Purpose: Product documentation, technical specs, session logs
- Contains: `START-HERE.md`, `SESSION-LOG.md`, `DECISIONS.md`, feature specs
- Key files: `START-HERE.md`, `SESSION-LOG.md`, `tdd-guide.md`

**.cursor/ and .claude/:**
- Purpose: AI assistant configurations and agent definitions
- Contains: Skills, rules, commands, agent definitions
- Key files: `.cursor/rules/security.mdc`, `.claude/agents/`

## Key File Locations

**Entry Points:**
- `apps/api/src/index.ts`: Fastify server bootstrap, middleware registration, route mounting
- `apps/web/src/app/layout.tsx`: Root layout with fonts, metadata, providers
- `packages/shared/src/index.ts`: Re-exports all shared types

**Configuration:**
- `apps/api/src/lib/env.ts`: Backend environment variable validation with Zod
- `apps/web/src/lib/api/api-env.ts`: Frontend API base URL resolution
- `apps/api/prisma/schema.prisma`: Database schema and relationships
- `apps/api/src/services/connectors/registry.config.ts`: Platform OAuth configuration

**Core Logic:**
- `apps/api/src/routes/`: HTTP route handlers grouped by domain (agencies, access-requests, client-auth)
- `apps/api/src/services/`: Business logic layer (access-request.service, connection-aggregation.service)
- `apps/api/src/services/connectors/`: Platform-specific OAuth implementations (meta.ts, google.ts, linkedin.ts)
- `apps/web/src/lib/query/`: TanStack Query hooks for data fetching (billing.ts, onboarding.ts)
- `apps/web/src/components/`: React components organized by feature (client-auth, client-detail, access-request-detail)

**Testing:**
- `apps/api/src/routes/__tests__/`: Route handler tests
- `apps/api/src/services/__tests__/`: Service layer tests
- `apps/web/src/components/__tests__/`: Component tests with Testing Library
- `__tests__/` directories: Co-located with source files (TDD pattern)

**Design System:**
- `apps/web/DESIGN_SYSTEM.md`: Design tokens, component usage, aesthetic guidelines
- `apps/web/src/components/ui/`: shadcn/ui base components with brutalist customization
- `apps/web/src/app/design-system/page.tsx`: Live token showcase

## Naming Conventions

**Files:**
- **React components**: PascalCase (e.g., `access-request-detail/index.tsx`, `PlatformCard.tsx`)
- **Utilities/libs**: kebab-case (e.g., `api-client.ts`, `transform-platforms.ts`)
- **Routes**: kebab-case (e.g., `access-requests.ts`, `agency-platforms.ts`)
- **Services**: kebab-case with `.service.ts` suffix (e.g., `access-request.service.ts`)
- **Tests**: `<name>.test.ts` or `<name>.spec.ts` next to source

**Directories:**
- **Feature groupings**: kebab-case (e.g., `client-auth/`, `agency-platforms/`, `internal-admin/`)
- **Route groups**: Parentheses for Next.js route groups (e.g., `(authenticated)/`, `(marketing)/`)
- **UI components**: `ui/` for shadcn base, feature dirs for specific components

**Types:**
- **Interfaces/types**: PascalCase (e.g., `PlatformConnector`, `NormalizedTokenResponse`)
- **Enums**: PascalCase with SCHEMA suffix for Zod schemas (e.g., `PlatformSchema`, `AccessLevelSchema`)
- **Type exports**: Export from `index.ts` in package root

## Where to Add New Code

**New Feature (Backend):**
- Routes: `apps/api/src/routes/<feature>.ts`
- Services: `apps/api/src/services/<feature>.service.ts`
- Tests: `apps/api/src/routes/__tests__/<feature>.test.ts`
- Types: Add to `packages/shared/src/types.ts`, export from `packages/shared/src/index.ts`

**New Feature (Frontend):**
- Pages: `apps/web/src/app/<route>/page.tsx`
- Components: `apps/web/src/components/<feature>/index.tsx`
- Query hooks: `apps/web/src/lib/query/<feature>.ts`
- Tests: `apps/web/src/components/<feature>/__tests__/`

**New Platform Connector:**
- Connector: `apps/api/src/services/connectors/<platform>.ts`
- Config: Add to `apps/api/src/services/connectors/registry.config.ts`
- Factory: Register in `apps/api/src/services/connectors/factory.ts`
- Env vars: Add to `apps/api/src/lib/env.ts` and `apps/api/.env.example`

**Utilities:**
- Shared helpers: `apps/web/src/lib/utils.ts` (frontend)
- Backend helpers: `apps/api/src/lib/<utility>.ts`

## Special Directories

**apps/web/src/app/:**
- Purpose: Next.js App Router directory with file-based routing
- Generated: No
- Committed: Yes
- Note: Parenthesized dirs like `(authenticated)` are route groups, not part of URL

**apps/api/src/routes/client-auth/:**
- Purpose: Client authorization flow routes (OAuth, asset selection, manual invite)
- Generated: No
- Committed: Yes
- Key routes: `oauth-state.routes.ts`, `oauth-exchange.routes.ts`, `assets.routes.ts`, `manual.routes.ts`

**apps/api/src/middleware/:**
- Purpose: Request processing middleware (auth, performance, logging)
- Generated: No
- Committed: Yes
- Key files: `auth.ts` (Clerk JWT verification), `performance.ts` (monitoring)

**apps/api/prisma/:**
- Purpose: Prisma ORM configuration and seed files
- Generated: Partially (`prisma generate` creates client)
- Committed: Yes (except `node_modules` in prisma dir)
- Key files: `schema.prisma`, `seed.ts`

**apps/api/src/jobs/:**
- Purpose: Background job handlers for pg-boss job queue
- Generated: No
- Committed: Yes
- Key files: `trial-expiration.ts`, `check-expired-requests.ts`, `annual-reset.ts`

**.cursor/ and .claude/:**
- Purpose: AI assistant configuration
- Generated: No
- Committed: Yes
- Note: Contains agent definitions, skills, and rules for Claude Code

---

*Structure analysis: 2026-03-29*
