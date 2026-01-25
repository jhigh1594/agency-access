# AGENTS.md

Guidance for agentic coding tools working in this repository. Follow these rules to stay consistent with existing architecture, security, and quality expectations.

## Repo Structure
- apps/web: Next.js 16 frontend (App Router, TypeScript, TailwindCSS, Clerk)
- apps/api: Fastify backend (TypeScript, Prisma, PostgreSQL, BullMQ, Redis)
- packages/shared: Shared TypeScript types and Zod schemas

## Commands (run from repo root unless noted)
### Development
- npm run dev: start web (3000) + api (3001)
- npm run dev:web: start frontend only
- npm run dev:api: start backend only

### Build / Lint / Typecheck
- npm run build: build shared, api, web
- npm run lint: lint all workspaces
- npm run typecheck: type-check all workspaces

### Tests
- npm run test: run all workspace tests
- npm run test --workspace=apps/api
- npm run test --workspace=apps/web
- npm run test --workspace=packages/shared

### Single Test Examples
- apps/api: cd apps/api && npm test src/services/__tests__/connection.service.test.ts
- apps/web: cd apps/web && npm test src/app/(authenticated)/connections/__tests__/page.test.tsx
- packages/shared: cd packages/shared && npm test src/__tests__/types.test.ts

### Watch / Coverage
- apps/api: cd apps/api && npm test -- --watch
- packages/shared: cd packages/shared && npm run test:coverage

## Cursor / Copilot Rules
- No .cursor/rules, .cursorrules, or .github/copilot-instructions.md found in this repo.

## Test-Driven Development (MUST FOLLOW)
- Write failing tests before implementation code (Red → Green → Refactor).
- One test per behavior; keep tests descriptive of behavior.
- Exceptions: config files, type-only definitions (no runtime validation), and styling/CSS changes.

## API Contracts and Error Handling
- Success response shape:
  { data: T }
- Error response shape:
  { error: { code: string; message: string; details?: any } }
- In Fastify routes, return 400 for validation errors and throw unexpected errors to Fastify’s error handler.
- On the frontend, check for error in the response and throw with the error message.

## Security and Architecture (Non-Negotiable)
- NEVER store OAuth tokens in PostgreSQL. Always use Infisical and store only secretId references.
- Log all token access in AuditLog with user email, IP, timestamp, action, and metadata.
- Use Redis-backed OAuth state tokens for CSRF protection (oauth-state.service.ts).
- Access requests expire after 7 days by default.

## Shared Types and Schemas
- Use shared types from @agency-platform/shared in both frontend and backend.
- When adding a shared type:
  1) Update packages/shared/src/types.ts
  2) Export from packages/shared/src/index.ts
  3) Add Zod runtime validation where needed

## Code Style Guidelines
### Imports
- Prefer workspace aliases when available (e.g., @/lib/..., @/services/...).
- Use @agency-platform/shared for shared types instead of duplicating enums.
- Group imports by: external libs, internal aliases, relative paths.

### Formatting
- Follow existing TypeScript/TSX style; keep lines readable and functions focused.
- Avoid unnecessary comments; add only when logic is non-obvious.

### Types
- Prefer explicit types on public functions and exported values.
- Use Zod schemas for runtime validation of inputs and env vars.
- Avoid any when possible; if necessary, document why.

### Naming
- camelCase for variables/functions, PascalCase for components/classes, UPPER_SNAKE for constants.
- Name files after their primary export or feature (e.g., access-request.service.ts).

### Error Handling
- Return typed error objects with code/message in services where applicable.
- Preserve existing error codes (INVALID_TOKEN, VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, PLATFORM_ERROR).

### Logging
- Backend should use structured logging (Pino) via the existing logger utilities.
- Avoid console.log in production paths; allowed in one-off scripts.

## OAuth and Connectors
- Connector configs live in apps/api/src/services/connectors/registry.config.ts.
- Extend BaseConnector for standard OAuth flows; override only platform-specific behavior.
- Store platform metadata in PlatformAuthorization.metadata as JSON.

## Database and Env Changes
- For new env vars: update apps/api/src/lib/env.ts and apps/api/.env.example.
- Prisma changes: update schema, then run db:push and db:generate (apps/api).

## UI / Frontend Notes
- Use @tanstack/react-query for server data.
- Keep UI flows consistent with existing patterns (shadcn/ui components).
- For UI testing, use the dev-browser skill for automated browser flows.

## Workflow Expectations
- Don’t edit or revert unrelated changes in a dirty worktree.
- Keep refactors behavior-preserving unless explicitly requested.
- Keep modifications scoped, and add tests when behavior changes.
