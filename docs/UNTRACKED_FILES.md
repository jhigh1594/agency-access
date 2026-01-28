# Untracked Files Documentation

This document describes all currently untracked files in the repository and their purpose.

## Background Jobs

### Annual Reset Job (`apps/api/src/jobs/annual-reset.ts`)

**Purpose:** Resets annual usage counters when the year rolls over.

**Functionality:**
- Finds all `current_year` usage counters where `resetAt <= now`
- Resets `count` to 0
- Updates `resetAt` to next year January 1st (UTC)
- Returns count of reset counters

**Usage:**
- Schedule to run daily (e.g., cron job at midnight)
- Can be run as standalone script: `node apps/api/src/jobs/annual-reset.ts`

**Test:** `apps/api/src/jobs/__tests__/annual-reset.test.ts`

---

### Clerk Metadata Sync Job (`apps/api/src/jobs/sync-clerk-metadata.ts`)

**Purpose:** Syncs usage counters from database to Clerk metadata to keep them in sync.

**Functionality:**
- Fetches all agencies with `clerkUserId`
- Syncs their usage counters to Clerk private metadata
- Limits to 100 agencies per run to avoid overwhelming Clerk API
- Returns success and failure counts

**Usage:**
- Schedule to run periodically (e.g., every hour)
- Can be run as standalone script: `node apps/api/src/jobs/sync-clerk-metadata.ts`

**Test:** `apps/api/src/jobs/__tests__/sync-clerk-metadata.test.ts`

---

## Frontend Components

### Usage Widget (`apps/web/src/components/usage-widget.tsx`)

**Purpose:** Displays current usage metrics for the agency's subscription tier.

**Features:**
- Shows progress bars for:
  - Client onboards
  - Platform audits
  - Team seats
- Includes upgrade prompts when approaching limits
- Auto-refreshes every 60 seconds
- Loading and error states

**Dependencies:**
- `@tanstack/react-query` for data fetching
- `@clerk/nextjs` for authentication
- `@agency-platform/shared` for types

**Test:** `apps/web/src/components/__tests__/usage-widget.test.tsx`

---

### Privacy Policy Page (`apps/web/src/app/(marketing)/privacy-policy/page.tsx`)

**Purpose:** Marketing page displaying the privacy policy for AuthHub.

**Content:**
- Privacy policy text
- Last updated date: January 27, 2026
- Covers data collection, usage, disclosure, and security practices

**Route:** `/privacy-policy`

---

## Test Files

### Usage Route Test (`apps/api/src/routes/__tests__/usage.test.ts`)

Tests for the usage API endpoint that returns current usage metrics for agencies.

### Quota Enforcement Middleware Test (`apps/api/src/middleware/__tests__/quota-enforcement.test.ts`)

Tests for the quota enforcement middleware that prevents actions exceeding subscription tier limits.

---

## Tools Directory (`tools/`)

### Design OS (`tools/design-os/`)

**Purpose:** Product planning and design tool that helps define product vision, structure data models, design UI, and export production-ready components.

**Description:**
Design OS is a separate tool for product planning and design. It provides a guided process for:
1. Product Planning - Define vision, roadmap, and data model
2. Design System - Choose colors, typography, and design application shell
3. Section Design - Specify requirements, generate sample data, and design screens
4. Export - Generate complete handoff package for implementation

**Key Files:**
- `README.md` - Main documentation
- `README-AGENCY-PLATFORM.md` - Agency Platform specific documentation
- `docs/` - Comprehensive documentation
- `.claude/commands/` - Claude Code commands for Design OS workflows
- `.claude/skills/` - Frontend design skill

**Usage:**
Design OS is used *before* building features. It helps capture what you're building and why, then exports everything needed for implementation.

**Note:** This is a planning tool, not part of the main application codebase.

---

## Documentation Files

### Code Refactoring Best Practices (`docs/CODE_REFACTORING_BEST_PRACTICES_LLM.md`)

**Purpose:** Comprehensive guide for LLM coding agents on how to safely refactor code.

**Key Principles:**
- Tests must pass BEFORE AND AFTER each change
- Small, atomic, revertible steps
- No behavior changes during refactoring
- Run tests after each step; rollback on failure

**Sections:**
- Core mandates and red lines
- Refactor vs rewrite decision matrix
- Rule of three (when to refactor)
- Step-by-step refactoring process
- Common patterns and anti-patterns

**Target Audience:** LLM coding agents working on refactoring tasks

---

### Plans Directory (`docs/plans/`)

Contains implementation plans for major features and migrations.

#### Render Migration Plan (`docs/plans/2026-01-24-render-migration.md`)

**Purpose:** Step-by-step plan for migrating from Railway/Vercel to Render.

**Scope:**
- Migrate API (Fastify) to Render web service
- Migrate Web (Next.js) to Render web service
- Keep external services: Neon Postgres, Upstash Redis
- Use `render.yaml` blueprint for infrastructure
- Update documentation and configuration

**Status:** Implementation plan (not yet executed)

#### Pinterest Business ID Collection (`docs/plans/2025-01-27-pinterest-business-id-collection.md`)

**Purpose:** Plan for collecting Pinterest business IDs during OAuth flow.

**Status:** Implementation plan (not yet executed)

---

## Configuration Files (Not Committed)

### Claude Settings (`.claude/settings.json`)

**Purpose:** Claude Code editor settings and preferences.

**Note:** Typically not committed to version control as it contains personal preferences.

### Git Worktrees (`.worktrees/`)

**Purpose:** Git worktree directory for parallel development branches.

**Note:** Not committed to version control as it's a local development tool.

---

## Summary

### Files Ready to Commit

1. **Background Jobs** (2 files + 2 tests)
   - `apps/api/src/jobs/annual-reset.ts`
   - `apps/api/src/jobs/sync-clerk-metadata.ts`
   - `apps/api/src/jobs/__tests__/annual-reset.test.ts`
   - `apps/api/src/jobs/__tests__/sync-clerk-metadata.test.ts`

2. **Usage Widget** (1 file + 1 test)
   - `apps/web/src/components/usage-widget.tsx`
   - `apps/web/src/components/__tests__/usage-widget.test.tsx`

3. **Privacy Policy Page** (1 file)
   - `apps/web/src/app/(marketing)/privacy-policy/page.tsx`

4. **Test Files** (2 files)
   - `apps/api/src/routes/__tests__/usage.test.ts`
   - `apps/api/src/middleware/__tests__/quota-enforcement.test.ts`

5. **Documentation** (3+ files)
   - `docs/CODE_REFACTORING_BEST_PRACTICES_LLM.md`
   - `docs/plans/2026-01-24-render-migration.md`
   - `docs/plans/2025-01-27-pinterest-business-id-collection.md`

### Files Not to Commit

- `.claude/settings.json` - Personal editor settings
- `.worktrees/` - Local development tool
- `tools/design-os/` - Separate tool, may have its own repo

---

## Next Steps

1. Review each file to ensure it's production-ready
2. Group related files into logical commits
3. Commit following the project's commit message guidelines
4. Update this documentation as files are committed
