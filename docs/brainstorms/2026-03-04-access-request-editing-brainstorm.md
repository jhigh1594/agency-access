# 2026-03-04 Access Request Editing UX Brainstorm

## Objective
Define the frontend experience and workflow for editing existing client access requests, using the current web design system and interaction patterns.

## Repo Context (Observed)
- Current request creation flow exists as a 4-step wizard at [`apps/web/src/app/(authenticated)/access-requests/new/page.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/access-requests/new/page.tsx).
- Existing flow primitives are already in place:
  - [`FlowShell`](/Users/jhigh/agency-access-platform/apps/web/src/components/flow/flow-shell.tsx)
  - shared UI components: [`Button`](/Users/jhigh/agency-access-platform/apps/web/src/components/ui/button.tsx), [`Card`](/Users/jhigh/agency-access-platform/apps/web/src/components/ui/card.tsx), [`StatusBadge`](/Users/jhigh/agency-access-platform/apps/web/src/components/ui/status-badge.tsx), [`EmptyState`](/Users/jhigh/agency-access-platform/apps/web/src/components/ui/empty-state.tsx)
- Access request read API exists (`GET /api/access-requests/:id`) and frontend client helper exists (`getAccessRequest`).
- Update API exists (`PATCH /api/access-requests/:id`) but currently supports only `clientName`, `clientEmail`, and `status`.
- Client detail currently links request rows to `/access-requests/:id`, but that page is not implemented (404 risk): [`OverviewTab.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/OverviewTab.tsx#L159).

## Default Architecture Baseline Check
The `workflow-discovery` default baseline (Rails + Phlex + Stimulus + Turbo/Hotwire) does **not** apply.

Applicable baseline for this repo:
- Next.js App Router (`apps/web`)
- Fastify API (`apps/api`)
- Tailwind + semantic design tokens in `globals.css`
- Shared UI primitives and existing brutalist-clean hybrid styling
- React Query + Clerk auth patterns

## Users, Jobs, and Success Criteria
### Primary user
Agency admin/member managing client onboarding requests.

### Core jobs to be done
- Correct mistakes in a pending request without recreating from scratch.
- Update requested platforms/access level before client completes auth.
- Maintain auditability and avoid confusing clients with broken/changed links.

### Success criteria
- User can locate and edit an eligible request in under 30 seconds.
- Save flow is understandable and explicit about link/client impact.
- No edit path is shown for non-editable lifecycle states (completed/expired/revoked), only safe alternatives.

## Constraints and Guardrails
- Keep API response contracts consistent (`{ data }` / `{ error }`).
- Keep behavior tenant-safe via existing agency ownership checks.
- Respect existing status model in shared types (`pending`, `partial`, `completed`, `expired`, `revoked`).
- Reuse design system tokens/utilities (`bg-paper`, `text-ink`, `border-border`, `shadow-brutalist`) and shared components.
- Preserve mobile usability (44px tap targets, clear step progression).

## Current UX Gaps
- No request detail page for `/access-requests/:id` in authenticated app.
- No edit entry point that is guaranteed to resolve.
- Backend update contract is too narrow for real request editing (platforms/intake/branding/auth model cannot be updated currently).
- Status vocabulary mismatch risk in service update schema (`authorized`, `cancelled`) vs shared/domain statuses (`completed`, `revoked`).

## Approaches
### 1) Minimal Edit Modal in Client Detail (Metadata only)
Scope:
- Add `Edit` action from client detail list row.
- Modal edits `clientName`, `clientEmail` only.
- Uses existing `PATCH /access-requests/:id` as-is.

Pros:
- Fastest delivery.
- Lowest backend change risk.
- Clear contained UI surface.

Cons:
- Does not solve primary need (editing platforms/request configuration).
- Inconsistent with 4-step request mental model.
- Limited long-term value.

### 2) “Replace Request” UX (clone-and-resend)
Scope:
- New edit screen prefilled from existing request.
- On save: create a new request and revoke/expire old one (or keep old with warning).
- Keeps existing backend update endpoint mostly untouched.

Pros:
- Enables full wizard-style edits immediately.
- Avoids risky in-place mutation of historical request data.
- Better audit trail semantics.

Cons:
- Changes request ID/token; user must resend new link.
- More cognitive overhead (“edit” is effectively “replace”).
- Requires explicit lifecycle handling and messaging.

### 3) True In-Place Edit for Eligible States (Recommended)
Scope:
- Add request detail/edit route with full wizard prefill.
- Extend backend update contract to support full editable fields for `pending`/`partial` requests only.
- Preserve request ID and keep token stable by default with automatic rotation only when recipient identity changes.

Pros:
- Best user mental model: edit means edit.
- Cleanest long-term domain behavior.
- Aligns with existing request wizard and design primitives.

Cons:
- Requires coordinated API + UI changes.
- Needs stricter lifecycle/business rules.
- Requires migration of update validation schemas and tests.

## Recommendation
Start with **Approach 3** (true in-place edit), but implement in **two controlled phases**:

1. **Phase A (UI + routing + read-only foundations)**
- Implement `/access-requests/[id]` request detail screen.
- Show status-aware actions:
  - `pending`/`partial`: `Edit Request`
  - `completed`/`expired`/`revoked`: `Create New Request from This`
- Fix existing broken link paths to this page.

2. **Phase B (full editing)**
- Implement `/access-requests/[id]/edit` using the same 4-step pattern as new request flow.
- Seed wizard with existing request values.
- Extend backend patch/update schema to support platforms, access level, intake fields, branding, auth model (with server-side eligibility checks).
- Apply an automatic token policy (no user-visible token toggle):
  - Keep existing token for non-recipient edits.
  - Auto-rotate token when client email changes.
  - After auto-rotation, show clear post-save notice that the prior link no longer works.

## Proposed Frontend Experience
### Entry points
- Client detail access-request row action:
  - Replace current `View details` target with `/access-requests/[id]`.
- Dashboard recent requests row:
  - Keep client-level navigation for now or add secondary menu action `Open Request`.

### New route: `/access-requests/[id]` (Request Detail)
Layout:
- Top: breadcrumb (`Dashboard` / `Clients` -> `Request Details`)
- Header card:
  - client name/email
  - request status (`StatusBadge`)
  - created date, expires date, authorized date (if present)
- Sections:
  - Requested Platforms
  - Access Model + Access Level
  - Intake Fields summary
  - Branding summary
  - Link actions (copy/preview)
- Right-side or footer action group:
  - Editable states: `Edit Request`, `Cancel Request`
  - Non-editable states: `Create New Request from This`

Design-system rules:
- Use `FlowShell` style spacing and heading hierarchy where applicable.
- Use tokenized color classes (no raw hex except data-bound branding preview).
- Use shared button variants, not bespoke CTA styling.

### New route: `/access-requests/[id]/edit` (Edit Wizard)
Reuse the same 4-step interaction model from `new/page.tsx`:
1. Fundamentals (client, auth model, template prefill optional)
2. Platforms + access level
3. Customize (intake + branding)
4. Review + save

Behavioral differences from create flow:
- Page title: `Edit Access Request`.
- Primary CTA in step 4: `Save Changes`.
- Add `Discard Changes` secondary action.
- Add unsaved-changes guard before navigation.
- Keep immutable metadata visible in review (`Request ID`, current status, original created date).

### Status-based editing rules
- `pending`, `partial`: editable.
- `completed`, `expired`, `revoked`: read-only; surface replacement flow CTA.
- If request becomes ineligible while editing (race condition), show blocking warning and redirect to detail with preserved draft optional.

### Save confirmation UX
On successful save:
- Show inline success toast/banner: `Request updated`.
- If auto-rotation occurred, show `Link updated. Resend this link to your client.` and emphasize copy action.
- Offer actions: `Copy Link`, `Back to Client`, `View Request`.

## Component Proposal
### New components
- `apps/web/src/components/access-request-detail/request-overview-card.tsx`
- `apps/web/src/components/access-request-detail/request-platforms-card.tsx`
- `apps/web/src/components/access-request-detail/request-actions-bar.tsx`
- `apps/web/src/components/access-request-detail/request-edit-shell.tsx`

### Route files
- `apps/web/src/app/(authenticated)/access-requests/[id]/page.tsx`
- `apps/web/src/app/(authenticated)/access-requests/[id]/edit/page.tsx`

### Reuse existing components
- `FlowShell`
- `HierarchicalPlatformSelector`
- `AccessLevelSelector`
- `ClientSelector` (if client is editable)

## API and Data Requirements for Recommended UX
Required for Phase B:
- Extend request update payload support in API/service for:
  - `platforms`
  - `globalAccessLevel` (or normalized mapping)
  - `intakeFields`
  - `branding`
- Enforce editability by status server-side.
- Harmonize update status enum with shared/domain statuses.
- Return updated request in hierarchical format expected by web.

## Scope Boundaries
### In scope
- Request detail and edit UX in authenticated app.
- Status-aware action gating.
- Design-system conformant UI.

### Out of scope (for this discovery)
- Re-architecting onboarding flow.
- Multi-user collaborative editing.
- Version history UI beyond simple audit notes.
- Email automation changes beyond link copying/sending hooks.

## Instrumentation
Track events:
- `access_request_detail_viewed`
- `access_request_edit_started`
- `access_request_edit_saved`
- `access_request_edit_discarded`
- `access_request_edit_blocked_status`

## Open Questions
1. Should client identity fields (name/email) remain editable from request edit, or be locked to client profile updates only?
2. Do we want `cancel request` available directly on detail page in phase A?

## Validation Check
- Clarity: objective, entry points, state rules, and phased recommendation are explicit.
- Scope boundaries: in-scope/out-of-scope clearly separated.
- Open questions: unresolved product decisions are listed and prioritized.

## Handoff
Ready for `workflow-plan` after confirming Open Question 1 (client identity field ownership).
