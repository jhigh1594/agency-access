# 2026-02-27 Admin Backend Brainstorm

## Objective
Define a very light internal admin backend for:
- managing users/agencies
- monitoring usage and subscriptions
- monitoring key billing metrics (including MRR)
- taking limited operational actions safely

## Repo Context (Observed)
- Stack is Next.js (`apps/web`) + Fastify (`apps/api`) + Prisma/Postgres + Clerk auth.
- Existing customer-facing settings/billing already exist in web (`/settings`) and API (`/api/subscriptions`, `/api/quota`, `/api/usage`).
- Subscription and invoice data already stored in Postgres (`Subscription`, `Invoice` models) and synced via Creem webhooks.
- No dedicated internal admin route/surface currently exists in web or API.
- Current auth resolves user -> principal agency; it is tenant-scoped, not internal-admin scoped.

## Default Architecture Baseline Check
The `workflow-discovery` default baseline (Rails + Phlex + Stimulus + Turbo) does **not** apply.

Applicable baseline for this repo:
- Next.js App Router frontend
- Fastify API backend
- Tailwind/shadcn-style UI patterns
- Clerk authentication + org/user context
- React Query data-fetching on frontend

## Constraints and Guardrails
- Keep implementation minimal and operationally safe.
- Preserve API response contract:
  - success: `{ data: T }`
  - error: `{ error: { code, message, details? } }`
- Follow security rules in AGENTS.md:
  - never store OAuth tokens in Postgres
  - continue auditing sensitive token access
- Avoid broad refactors; leverage existing services/routes/tables.

## What Already Exists vs Missing
### Reusable
- Agency/user/member data models (`Agency`, `AgencyMember`)
- Subscription + invoice data models and service layer
- Usage counters and quota services
- Authenticated frontend shell and data-fetch patterns

### Missing for Internal Admin
- Internal admin authentication/authorization model
- Internal admin API namespace and policy checks
- Unified operational dashboard with cross-agency visibility
- First-class MRR/churn aggregates (currently no dedicated metrics table)

## MVP Scope Proposal
- Admin overview page:
  - MRR (current), active subscriptions, past_due count, canceled this period
  - usage highlights (top agencies by usage)
- Agencies/users table:
  - search by email/name
  - view tier, status, created date
  - link to detail drawer/page
- Subscription operations:
  - view subscription + invoice history
  - trigger safe operations already supported (tier change, cancel-at-period-end)
- Usage monitoring:
  - per-agency usage snapshot (clientOnboards/platformAudits/teamSeats)

## Explicit Non-Goals (MVP)
- Building a separate design system for admin
- Complex RBAC matrix beyond “internal admin” gate
- Real-time streaming analytics
- Full CRM/support tooling

## Approaches
### 1) Extend existing app with `/internal/admin` + `/api/internal-admin/*`
Pros:
- Fastest to ship with least overhead
- Reuses Clerk session, React Query, shared components, and API infra
- Minimal deployment changes

Cons:
- Must implement strict auth guard to prevent tenant-user access
- Internal routes live beside product routes (needs careful isolation)

### 2) New `apps/admin` Next.js app in monorepo
Pros:
- Strong isolation boundary and cleaner long-term separation
- Easier to evolve independently

Cons:
- More setup (build/deploy/env/auth)
- Slower for “very light and minimal” first version

### 3) API-only admin endpoints + external BI tool for UI (Metabase/Retool)
Pros:
- Lowest frontend build effort
- Powerful analytics quickly

Cons:
- Split operational surface across tools
- Harder to enforce cohesive product workflows/actions

## Recommendation
Start with **Approach 1**.

Implementation guardrails:
- Add a dedicated internal-admin check in API middleware (allowlist by Clerk user ID/email from env, or Clerk role claim if already available).
- Put all admin routes under `/api/internal-admin/*`.
- Add web route group `/internal/admin/*` protected by server-side + API-level checks.
- Keep first version read-heavy, with only a few safe mutation actions.

## Data and Metric Design Notes
- MRR can be computed from active subscriptions + tier pricing map (shared types), but billing interval needs explicit handling.
- Today, billing interval is not stored clearly in `Subscription`; infer from Creem product ID short-term, then persist normalized interval for reliability.
- Add a small daily snapshot job/table if admin dashboard query cost grows.

## Suggested Phase 1 Deliverables
1. Admin auth policy + middleware.
2. Internal admin API endpoints:
   - `GET /api/internal-admin/overview`
   - `GET /api/internal-admin/agencies`
   - `GET /api/internal-admin/agencies/:agencyId`
   - `GET /api/internal-admin/subscriptions`
3. Web admin pages:
   - `/internal/admin` (overview)
   - `/internal/admin/agencies`
   - `/internal/admin/subscriptions`
4. Tests:
   - security tests for admin route protection
   - service tests for MRR/summary calculations

## Success Criteria (MVP)
- Internal admins can identify subscription issues in under 2 minutes.
- Internal admins can answer “current MRR and active subscriptions” in one page load.
- Zero tenant-user access to internal-admin routes.

## Open Questions
1. Who should access this admin backend on day one: only you/founders, or a broader internal ops/support team?
2. Is this strictly internal tooling, or should some controls be exposed to agency admins later?
3. Do you want MRR tracked by booked MRR (contracted) or collected MRR (paid invoices)?

## Validation Check
- Clarity: objectives, scope, and architecture choices are explicit.
- Scope boundaries: MVP and non-goals are separated.
- Open questions: listed and prioritized for planning handoff.

## Handoff
Ready to move to `workflow-plan` after clarifying the open questions, starting with Question 1.
