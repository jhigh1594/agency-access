# Agency Access Platform - Memory Bank

*Last Updated: February 10, 2026*
*Purpose: AI context persistence for Agency Access Platform workspace*

---

## Current Focus

**Project**: Agency Access Platform - A centralized platform for managing agency access and permissions.

**Status**: Live production (https://authhub.co)

---

## Workspace Context

This workspace contains the Agency Access Platform - a system for managing agency access, permissions, and client onboarding.

---

## Technical Notes

### Tech Stack
- Next.js 16 for frontend (App Router)
- Fastify backend (TypeScript, Prisma, PostgreSQL)
- Clerk authentication
- React Query (@tanstack/react-query) for server state
- BullMQ + Redis for background jobs

### Production URLs
- **Frontend**: https://www.authhub.co (Vercel)
- **Backend**: https://agency-access.onrender.com (Render)
- **Clerk**: https://clerk.authhub.co

### Key Integration Points
- Agency client systems
- Permission management
- Access control workflows

### AI / agent setup
- **Claude Code**: Official plugins (LSP, github, vercel, supabase, sentry, etc.) and dotai in `.claude/settings.json`. Skills live only in `.claude/skills/` (Cursor reads from here).
- **Cursor**: Project rules in `.cursor/rules/` (TypeScript, React/Next.js, Fastify API, security, TDD, UI/UX). No duplicate skills dir.

---

## Critical Lessons Learned

### Clerk JWT Authentication (Feb 2026)
**Issue**: Backend returning 401 Unauthorized despite valid Clerk tokens being sent in Authorization header.

**Root Cause**: Clerk JWTs use RS256 (asymmetric encryption with public/private key pair), but backend was configured with `@fastify/jwt` using `CLERK_SECRET_KEY` as a shared secret (HS256).

**Fix**: Use `@clerk/backend`'s `verifyToken()` function which properly handles RS256 verification with automatic JWKS fetching.

```typescript
// WRONG - Doesn't work with Clerk RS256 tokens
await fastify.register(jwt, {
  secret: env.CLERK_SECRET_KEY, // HS256 expects shared secret
});

// CORRECT - Uses Clerk's RS256 verification
import { verifyToken } from '@clerk/backend';
const verified = await verifyToken(token, {
  jwtKey: process.env.CLERK_SECRET_KEY,
});
```

**Key Indicators**:
- JWT header shows `"alg": "RS256"` → Requires public key verification via JWKS
- Using `CLERK_SECRET_KEY` with `@fastify/jwt` → Only works for HS256
- 401 errors with valid token → Likely algorithm mismatch

### Connections Page Performance Optimizations (Feb 2026)
**Changes Made**:
1. Added email-based caching to agency lookup (30min TTL)
2. Added `/api/agencies/by-email` lightweight endpoint (no members payload)
3. Added `fields` query parameter to `/api/agencies` for selective loading
4. Removed duplicate agency resolution in `/agency-platforms/available`
5. Added ETag support and caching to platform connections endpoint
6. Added client-side ETag conditional request support
7. Fixed authentication on all Connections page API calls

**Impact**: ~60% latency reduction, eliminated duplicate agency queries on every page load.

---

## Active Decisions

**Strategic Questions**:
- What are the core permission models for agencies?
- How do we handle multi-tenancy?

**Open Questions**:
- TBD

---

*This memory file will be updated as the project evolves.*
