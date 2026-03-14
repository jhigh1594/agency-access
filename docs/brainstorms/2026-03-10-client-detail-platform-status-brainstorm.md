# 2026-03-10 Client Detail Platform Status Brainstorm

## Objective
Redesign the authenticated client detail page so an agency owner can immediately understand:
- which platform groups have been requested from a client
- the exact current status of each platform group
- how much of each platform group is fulfilled, such as `4/5 connected`
- what still needs follow-up

The page should remain useful for request history and troubleshooting, but the primary experience should shift from request chronology to platform operations.

## Repo Context (Observed)
- The current client detail page lives in [apps/web/src/app/(authenticated)/clients/[id]/page.tsx](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/clients/[id]/page.tsx).
- The current page structure is:
  - client header
  - four stat cards
  - tabs for `Overview` and `Activity`
- The current `Overview` tab in [apps/web/src/components/client-detail/OverviewTab.tsx](/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/OverviewTab.tsx) is request-centric. It renders one row per access request with a single rolled-up badge.
- The current backend client detail response in [apps/api/src/services/client.service.ts](/Users/jhigh/agency-access-platform/apps/api/src/services/client.service.ts) returns request-level data only:
  - request id
  - flattened platforms
  - request status
  - optional connection status
- Product-level fulfillment logic already exists elsewhere:
  - access request detail UI in [apps/web/src/components/access-request-detail/request-platforms-card.tsx](/Users/jhigh/agency-access-platform/apps/web/src/components/access-request-detail/request-platforms-card.tsx)
  - authorization progress evaluation in [apps/api/src/services/access-request.service.ts](/Users/jhigh/agency-access-platform/apps/api/src/services/access-request.service.ts)
- Existing progress semantics already model useful states such as:
  - fulfilled products
  - unresolved products
  - `selection_required`
  - `no_assets`

## Default Architecture Baseline Check
The default `workflow-discovery` baseline does not apply.

Applicable baseline for this repository:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- shared contracts in `@agency-platform/shared`
- Tailwind and existing design system components in `apps/web/src/components/ui`
- shadcn-style composition patterns already used on authenticated surfaces

## Primary User
Agency owner or operator reviewing one client and deciding:
- what access has already been granted
- what is still pending
- whether they need to follow up or create a new request

## Core Job To Be Done
When an agency owner opens a client, they should be able to answer in a few seconds:
1. Which platform groups have we asked this client for?
2. What is the current state of each group?
3. How complete is each group?
4. Where do I need to act next?

## Current UX Gaps
1. The page answers a history question before it answers an operations question.
2. Request-level status is too coarse for grouped platforms like Google or Meta.
3. Owners have to interpret multiple request rows to infer one platform group’s current state.
4. The page does not expose fulfillment progress such as `4/5 connected`.
5. Product-level blockers exist in the system, but they are not visible from the client detail surface.

## Discovery Decision
Make a new primary section on the client detail page: **Requested Access**.

This section should be platform-group first:
- one row or card per platform group
- one top-level status per group
- one progress metric per group, such as `4/5 connected`
- expandable detail to reveal product-level state

The existing request history should remain available, but as a secondary section instead of the main operational view.

## Approaches
### 1) Improve The Existing Request List Only
Scope:
- keep request rows as the main surface
- add more platform badges and denser status text

Pros:
- smallest interaction change
- lowest implementation cost

Cons:
- still forces the user to mentally translate request history into platform state
- still weak for repeated requests against the same platform group
- does not create a strong “current truth” view

### 2) Add A Primary Platform-Group Status Board Above Request History (Recommended)
Scope:
- add a new top-level `Requested Access` board
- keep request history and activity below it
- support expand/collapse for product-level detail within each platform group

Pros:
- directly answers the user’s operational question
- preserves request history for support and audit needs
- creates a clean path to show `4/5 connected`
- minimizes disruption to the rest of the page

Cons:
- requires additive backend aggregation
- needs a clear status model to avoid contradiction between group-level and product-level states

### 3) Replace Request-Centric Navigation With A Full Platform Dashboard
Scope:
- re-orient the entire page around platform groups and product fulfillment
- request history becomes tertiary or hidden behind drill-in

Pros:
- clearest operational model
- strongest information hierarchy for agencies

Cons:
- biggest interaction change
- higher risk of obscuring chronology and support context
- unnecessary for the first iteration

## Recommendation
Adopt **Approach 2**.

This gives the client page a strong operational summary without discarding the current request and activity surfaces. It is the best balance of clarity, implementation risk, and compatibility with the existing page structure.

## Proposed Information Architecture
1. Breadcrumb
2. Client header
3. Existing stat cards
4. New primary section: `Requested Access`
5. Secondary section: `Request History`
6. Secondary section: `Activity`

Two implementation-friendly variants are acceptable:
- keep tabs, but make `Overview` begin with the new `Requested Access` board and move request history below it
- replace the current tabs with stacked sections if that reads more clearly on the page

The first variant is lower risk and fits the current component structure better.

## Proposed Requested Access Board
Each platform-group row or card should show:
- platform group name and icon
- top-level status badge
- progress metric, such as `4/5 connected`
- supporting metadata:
  - latest request date
  - latest request name if useful
  - optional follow-up note
- affordance to expand product-level detail
- action affordance:
  - `View request`
  - `Create request`
  - `Follow up`

### Recommended row structure
- Left:
  - platform icon
  - platform group name
  - small helper text like `Last requested Mar 8, 2026`
- Middle:
  - status badge
  - progress text
- Right:
  - expand control
  - contextual link button

### Expanded detail
On expand, show one row per product with:
- product name
- exact status
- optional short blocker or note

Examples:
- `Google Ads` -> `Connected`
- `GA4` -> `Connected`
- `Google Tag Manager` -> `Selection required`
- `Merchant Center` -> `No assets found`

## Status Model
### Platform-group status
These are the recommended top-level states:
- `Connected`
  - all requested products in the group are fulfilled
- `Partial`
  - some requested products are fulfilled and some are unresolved
- `Pending`
  - the group has been requested but no requested products are yet fulfilled
- `Expired`
  - the latest relevant request expired and nothing newer supersedes it
- `Revoked`
  - previously fulfilled access was revoked
- `Needs follow-up`
  - presentation variant of partial when the unresolved reason is operationally important

### Product-level status
- `Connected`
- `Pending`
- `Selection required`
- `No assets found`
- `Expired`
- `Revoked`

## Aggregation Rules
The client detail page needs a grouped current-truth summary derived from request history and fulfillment data.

Per platform group:
1. Gather all requests associated with the client that include that group.
2. Determine the latest relevant request for chronology and CTA linking.
3. Count requested products in the group.
4. Count fulfilled products in the group.
5. Count unresolved products in the group.
6. Derive the group status from the strongest current state, not just the latest request badge.

Recommended progress display:
- numerator: fulfilled products in the platform group
- denominator: total requested products in the platform group
- label: `connected`

Example:
- Google requested products: `google_ads`, `ga4`, `google_tag_manager`, `google_search_console`, `merchant_center`
- Fulfilled: 4
- Display: `4/5 connected`

## Data/Contract Implications
The current `ClientDetailResponse` contract is too request-centric for this UX.

Recommended additive response shape:
- keep existing `accessRequests` and `activity`
- add a new aggregated collection, for example `platformGroups`

Each entry should include fields along these lines:
- `platformGroup`
- `status`
- `fulfilledCount`
- `requestedCount`
- `latestRequestId`
- `latestRequestName`
- `latestRequestedAt`
- `products`

Each product entry should include:
- `product`
- `status`
- `note?`
- `latestRequestId?`

This should remain additive so the existing client page can migrate incrementally.

## UX Details From Frontend Design Review
### What to emphasize
- Current status and progress should visually dominate.
- Request chronology should be supporting context, not the headline.
- Expanded product detail should be compact and structured, not card-heavy.

### Density guidance
- Use a dense row layout rather than large marketing-style cards.
- Keep the top-level scan optimized for 5-10 platform groups without excessive vertical height.
- Use expansion for product detail instead of showing every product by default.

### Interaction guidance
- Entire row should not be a link if it conflicts with expansion.
- Expansion should be explicit and accessible.
- Mobile should stack status and progress beneath the title while preserving the expand affordance.

### Accessibility baseline
- status cannot rely on color alone
- expansion control must expose state with `aria-expanded`
- progress text must be explicit, not icon-only

## Suggested Visual Hierarchy
1. Platform group name
2. Status badge
3. Progress metric
4. Supporting note and latest request context
5. Actions

This keeps the top scan focused on operational readiness rather than chronology.

## Scope Boundaries
### In scope
- client detail page information architecture
- platform-group summary board
- expandable product-level detail
- additive backend aggregation needed to support this view
- preserving request history and activity as secondary surfaces

### Out of scope
- redesigning the access request detail page
- changing client authorization flow behavior
- introducing new request lifecycle states beyond what the system already supports
- broad dashboard changes outside the client detail page

## Risks
1. Mixed historical requests may create ambiguous “current truth” if aggregation rules are vague.
2. Group-level status can be misleading if it is derived only from latest request status instead of product fulfillment.
3. Reusing request-centric status badges without a new mapping may confuse `partial` versus `needs follow-up`.

## Recommended Validation
- Design review against real clients with repeated requests for the same platform group
- Verify that a user can answer platform status questions without opening request detail pages
- Confirm that mobile layout still makes `status + progress + expand` easy to scan

## Open Questions
1. Should `Needs follow-up` be a separate badge or only supporting text under `Partial`?
2. Should request history stay in tabs or move to stacked sections once the new board exists?
3. Should platform-group actions always route to the latest request, or sometimes to the most incomplete request?

## Handoff
Next step: planning and implementation breakdown for:
- shared contract additions for grouped platform status
- backend aggregation rules on client detail response
- frontend `Requested Access` board and expandable product rows
- focused tests for grouped status derivation and client detail rendering

Expected handoff skill: `workflow-plan`

Practical fallback in this repository: `writing-plans`, since a local `workflow-plan` skill file was not found during discovery.
