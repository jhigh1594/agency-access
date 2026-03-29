# Technology Stack

**Analysis Date:** 2026-03-29

## Languages

**Primary:**
- TypeScript 5.7.2 - All applications (web, api, shared)
- Node.js 20.x - Runtime environment

**Secondary:**
- JSON - Configuration files, Prisma schema
- MDX - Documentation content
- YAML - GitHub Actions workflows, Render configuration

## Runtime

**Environment:**
- Node.js 20.x - Required runtime (specified in package.json engines)
- npm 10.0+ - Package manager

**Package Manager:**
- npm with workspaces - Monorepo management
- Lockfile: package-lock.json (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - Frontend framework (App Router, React Server Components)
- Fastify 5.7.4 - Backend web framework
- Prisma 6.2.1 - Database ORM
- React 19.0.0 - UI library

**Testing:**
- Vitest 4.0.16 - Test runner (api, web)
- Jest 29.7.0 - Test runner (shared package)
- Testing Library - React testing utilities
- Playwright 1.58.2 - E2E browser testing

**Build/Dev:**
- Turbopack - Next.js dev server bundler
- tsc - TypeScript compiler
- tsx - TypeScript execution for API
- concurrently - Run multiple dev servers
- tsc-alias - Path alias resolution for builds

## Key Dependencies

**Critical:**
- @agency-platform/shared - Internal shared types package
- Zod 3.24.1 - Runtime schema validation (across all packages)
- @clerk/nextjs 6.14.1 - Frontend authentication
- @clerk/backend 1.19.1 - Backend JWT verification

**Infrastructure:**
- @infisical/sdk 4.0.6 - OAuth token storage (never store tokens in DB)
- @prisma/client 6.2.1 - Database client
- @tanstack/react-query 5.64.2 - Data fetching and caching
- pg-boss 12.14.0 - Postgres-based job queue
- Pino 9.6.0 - Structured logging

**Frontend:**
- TailwindCSS 3.4.17 - Styling framework
- tailwindcss-animate 1.0.7 - Animation utilities
- Framer Motion 12.23.26 - Animation library
- Geist 1.5.1 - Font family
- Lucide React 0.562.0 - Icon library
- Radix UI - Component primitives (@radix-ui/react-slot, @radix-ui/react-icons)
- shadcn/ui - UI component system built on Radix

**Backend:**
- @fastify/cors 10.0.1 - CORS handling
- @fastify/compress 8.3.1 - Response compression
- @fastify/helmet 13.0.2 - Security headers
- @fastify/jwt 9.0.1 - JWT handling (not used for Clerk - see CLAUDE.md)
- @fastify/rate-limit 10.3.0 - Rate limiting
- fastify-raw-body 5.0.0 - Raw body parsing for webhooks
- Axios 1.13.5 - HTTP client (overridden for security)
- Resend 6.6.0 - Transactional email service

**Observability:**
- @sentry/nextjs 10.43.0 - Frontend error tracking
- @sentry/node 10.43.0 - Backend error tracking
- @sentry/profiling-node 10.43.0 - Performance profiling
- @vercel/analytics 1.6.1 - Web analytics
- @vercel/speed-insights 1.3.1 - Performance insights
- posthog-js 1.345.2 - Product analytics (web)

## Configuration

**Environment:**
- Zod schema validation in `apps/api/src/lib/env.ts`
- Backend: `apps/api/.env` (see `apps/api/.env.example`)
- Frontend: `apps/web/.env.local` (see `apps/web/.env.local.example`)
- TypeScript strict mode enabled across all packages

**Build:**
- `apps/web/next.config.ts` - Next.js configuration (Turbopack, image optimization, rewrites)
- `apps/web/tailwind.config.ts` - TailwindCSS configuration (brutalist design system)
- `tsconfig.base.json` - Shared TypeScript configuration
- Individual tsconfigs in each workspace

## Platform Requirements

**Development:**
- Node.js 20.x (enforced via package.json engines)
- npm 10.0+ (enforced via package.json engines)
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended - though migrated to Postgres for OAuth state)
- Infisical account for secrets management
- Clerk account for authentication

**Production:**
- Frontend: Vercel (configured via `vercel.json`)
- Backend: Railway (configured via `render.yaml`)
- Database: Neon PostgreSQL (external)
- Secrets: Infisical (external)
- Email: Resend (external)

---

*Stack analysis: 2026-03-29*
