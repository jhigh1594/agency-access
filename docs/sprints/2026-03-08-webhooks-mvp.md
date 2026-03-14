# Sprint: Webhooks MVP

- Date: 2026-03-08
- Status: Functionally Ready, Pending `WH-043` Visual Evidence
- Owners: API + Web
- Scope: Ship a first outbound webhook system for agencies with one endpoint per agency, signed deliveries, retries, test sends, recent delivery history, and support-ready observability.
- Discovery input: [`docs/brainstorms/2026-03-08-webhooks-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-08-webhooks-brainstorm.md)

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native
- Applicable baseline used for this sprint:
  - Next.js App Router
  - Fastify + Prisma
  - Clerk auth and agency-scoped authorization
  - Redis + BullMQ for async delivery
  - Infisical for secret storage
  - Shared types and Zod schemas in `@agency-platform/shared`
  - Tailwind semantic-token UI system and shared React primitives

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” map here to reusable React settings cards, webhook-status badges, delivery-log tables, and inspector panels.
- Token-system work is enforced through semantic token usage on new settings surfaces and inspector states rather than raw palette classes.
- Screenshot-polish verification applies to the authenticated settings shell and the internal-admin support shell, not a Rails/Hotwire surface.

## External Research Decision

No additional external research is required for this planning pass.

Reasoning:
- The decisive market comparison work is already complete in the discovery document via Leadsie v1 and v2 webhook docs.
- The remaining work is implementation planning against internal architecture, not unknown third-party protocol behavior.
- If execution later adds platform-specific payload enrichment, that enrichment should be researched against primary provider docs during implementation, not in this sprint plan.

## Product Decision Log (Locked)

1. Webhooks MVP supports **one endpoint per agency**.
2. Phase 1 is **outbound-only**; inbound customer webhooks or public replay APIs are out of scope.
3. The endpoint is configured at the agency level under authenticated settings, not under per-platform connection settings.
4. Secret material is stored in Infisical; Postgres stores only endpoint metadata and secret references.
5. Phase 1 event set is:
   - `webhook.test`
   - `access_request.partial`
   - `access_request.completed`
6. `access_request.revoked`, `connection.created`, and replay tooling are phase-2 items.
7. Payloads use a stable event envelope, not a Leadsie-clone snapshot schema.
8. `AccessRequest` gains an `externalReference` field for agency CRM correlation.
9. Delivery success means any `2xx` response.
10. Delivery retries are async and queue-backed; the request path that generates an event must not block on customer endpoint latency.
11. Endpoint health is represented through recent delivery history and consecutive failure counts; automatic endpoint disabling is allowed only after repeated failures and must remain visible to the agency.

## Requirement Definition

### Requirement 1: Agencies must be able to configure and verify a webhook endpoint
- An authenticated agency admin can create, update, disable, rotate, and test a single webhook endpoint.
- The UI must expose supported events, endpoint state, and the signing secret handoff clearly.

### Requirement 2: Access-request lifecycle changes must emit stable, signed webhook events
- Phase-1 lifecycle events must be generated from existing access-request domain transitions without leaking secrets or unstable connector internals.
- Events must use a versioned envelope and a documented signature scheme.

### Requirement 3: Delivery must be asynchronous, retryable, and observable
- Endpoint latency or failure must not block normal product flows.
- Delivery attempts must be persisted with status, attempt count, HTTP result, and retry state.

### Requirement 4: Support and internal ops must be able to diagnose failures
- Internal support/admin users must be able to inspect endpoint state and recent delivery attempts.
- Agencies must have enough self-serve visibility to fix common endpoint issues without engineering help.

### Requirement 5: Delivery must include test coverage, docs, and visual verification
- Backend contracts, queue behavior, and signed delivery logic must be covered by tests.
- Settings/support surfaces must use the existing tokenized UI system and be screenshot-verified on desktop and mobile.

## Architecture Approach

1. Add a first-class outbound webhook domain model.
   - Create dedicated Prisma tables for:
     - agency endpoint configuration
     - event records
     - delivery attempts
   - Keep endpoint metadata normalized instead of burying configuration in `Agency.settings`.
   - Add `externalReference` to `AccessRequest` so CRM correlation is first-class and future API-compatible.

2. Separate event generation from delivery.
   - Domain transitions produce `WebhookEvent` records plus queue jobs.
   - Delivery workers sign and POST serialized payloads independently of the request lifecycle that generated the event.
   - This avoids tying webhook behavior to the current email-notification path.

3. Use a versioned event envelope with explicit signing headers.
   - Event envelope:
     - `id`
     - `type`
     - `apiVersion`
     - `createdAt`
     - `data`
   - Delivery metadata belongs in headers and delivery-attempt records, not in the canonical event body.
   - Sign `${timestamp}.${rawBody}` with HMAC SHA-256 and ship `v1=<digest>` in `X-AgencyAccess-Signature`.

4. Reuse existing queue and audit patterns, but create a dedicated webhook-delivery queue.
   - Do not overload `notificationQueue`; delivery semantics, retry logic, and observability are materially different.
   - Audit endpoint CRUD, secret rotation, test sends, and replay-like internal actions.

5. Build agency and internal-admin surfaces on top of shared UI primitives.
   - Agency settings page:
     - endpoint form
     - event subscription controls
     - test-send action
     - recent deliveries table
   - Internal admin/support page:
     - searchable endpoint list
     - delivery inspector
     - customer-safe replay path deferred unless needed internally during execution

## Milestones

### Milestone 1: Domain Model + Contracts
- `WH-001`, `WH-010`, `WH-011`, `WH-012`, `WH-013`, `WH-014`

### Milestone 2: Event Generation + Delivery Engine
- `WH-020`, `WH-021`, `WH-022`, `WH-023`, `WH-024`, `WH-025`

### Milestone 3: Agency Settings + Support Surfaces
- `WH-030`, `WH-031`, `WH-032`, `WH-033`, `WH-034`

### Milestone 4: Verification, Docs, and Launch Readiness
- `WH-040`, `WH-041`, `WH-042`, `WH-043`, `WH-044`

## Ordered Task Board

- [x] `WH-001` Create sprint artifact with locked webhook scope and implementation guardrails.
  Dependency: none
  Acceptance criteria:
  - Sprint documents architecture, milestones, verification strategy, risks, and requirement mapping.
  - Scope explicitly states one endpoint per agency and phase-1 event set.

- [x] `WH-010` Add shared webhook event types and Zod runtime schemas.
  Dependency: `WH-001`
  Acceptance criteria:
  - `packages/shared/src/types.ts` includes:
    - webhook endpoint status
    - supported event type enum
    - event envelope DTO
    - delivery status DTO
    - agency settings request/response DTOs
  - Shared exports are added in `packages/shared/src/index.ts`.
  - Schemas cover `webhook.test`, `access_request.partial`, and `access_request.completed`.

- [x] `WH-011` Add Prisma webhook models and `AccessRequest.externalReference`.
  Dependency: `WH-010`
  Acceptance criteria:
  - Schema adds `WebhookEndpoint`, `WebhookEvent`, and `WebhookDelivery`.
  - Schema adds nullable `externalReference` to `AccessRequest`.
  - Tables include stable foreign keys, timestamps, endpoint status, subscribed events, response snippets, and retry metadata.
  - No secret material is stored directly in Postgres.

- [x] `WH-012` Extend env/config for webhook signing and delivery behavior.
  Dependency: `WH-011`
  Acceptance criteria:
  - API env includes bounded delivery timeout, failure-disable threshold, and retry/backoff configuration where needed.
  - `.env.example` and env tests are updated.
  - Config defaults are safe for development and production.

- [x] `WH-013` Define reusable React primitives and token-system contract for webhook surfaces.
  Dependency: `WH-001`
  Acceptance criteria:
  - Shared components/variants are defined for:
    - endpoint status badge
    - delivery status pill
    - settings card shell
    - delivery log table row
    - inspector/error summary block
  - New surfaces use semantic token classes and existing settings-shell patterns.
  - Desktop/mobile layout expectations are explicit before page implementation.

- [x] `WH-014` Add tests for shared contract integrity.
  Dependency: `WH-010`, `WH-011`
  Acceptance criteria:
  - Shared tests fail if event enums and DTO schemas drift from API expectations.
  - Tests cover event payload shape for the three phase-1 event types.

- [x] `WH-020` Implement webhook endpoint service and secret lifecycle.
  Dependency: `WH-011`, `WH-012`
  Acceptance criteria:
  - Service supports create, update, disable, rotate secret, get, and list for one agency endpoint.
  - Secret generation and rotation write secret material to Infisical and only persist references in Postgres.
  - Endpoint CRUD and secret actions emit audit logs.

- [x] `WH-021` Implement webhook event builder from access-request domain state.
  Dependency: `WH-010`, `WH-011`
  Acceptance criteria:
  - Service builds versioned payloads for:
    - `webhook.test`
    - `access_request.partial`
    - `access_request.completed`
  - Payloads are derived only from reliable repo-owned fields:
    - request status/timestamps/platform progress
    - client identity
    - connection summaries
    - `externalReference`
  - No connector secrets, secret IDs, or unstable provider-only fields are included.

- [x] `WH-022` Implement dedicated webhook-delivery queue and worker.
  Dependency: `WH-020`, `WH-021`
  Acceptance criteria:
  - New BullMQ queue/worker exists for webhook delivery.
  - Delivery attempts are persisted before and after HTTP execution.
  - Delivery success treats any `2xx` as success.
  - Retryable failures include network errors, timeouts, `429`, and `5xx`.
  - Worker startup requirements are wired into API bootstrap or documented if split-run.

- [x] `WH-023` Implement HMAC signing and HTTP delivery client.
  Dependency: `WH-020`, `WH-022`
  Acceptance criteria:
  - Requests include:
    - `X-AgencyAccess-Event`
    - `X-AgencyAccess-Delivery-Id`
    - `X-AgencyAccess-Timestamp`
    - `X-AgencyAccess-Signature`
  - Signature uses HMAC SHA-256 over `${timestamp}.${rawBody}` with `v1=` prefix.
  - Delivery client enforces timeout and captures response code/body snippet safely.

- [x] `WH-024` Wire event emission into access-request lifecycle transitions.
  Dependency: `WH-021`, `WH-022`
  Acceptance criteria:
  - `access_request.partial` is emitted when a request transitions into partial completion.
  - `access_request.completed` is emitted when a request transitions into full completion.
  - Emission points are idempotent for repeated status writes or duplicate lifecycle callbacks.
  - Normal request completion flows remain non-blocking even if queue/delivery fails.

- [x] `WH-025` Add internal support service/query path for endpoint and delivery inspection.
  Dependency: `WH-022`, `WH-023`
  Acceptance criteria:
  - Internal admin can query endpoint status and recent deliveries without manual SQL.
  - Support view exposes enough metadata to distinguish:
    - no endpoint configured
    - event not generated
    - event generated but not queued
    - queued but failed
    - delivered with endpoint error response

- [x] `WH-030` Implement agency-authenticated webhook settings API routes.
  Dependency: `WH-020`, `WH-021`, `WH-022`, `WH-023`
  Acceptance criteria:
  - Routes exist for:
    - get endpoint
    - create/update endpoint
    - disable endpoint
    - rotate secret
    - send test event
    - list recent deliveries
  - Routes preserve `{ data, error }` contract.
  - Authz enforces principal agency access and one-endpoint-per-agency semantics.

- [x] `WH-031` Build agency settings UI for endpoint configuration and test delivery.
  Dependency: `WH-013`, `WH-030`
  Acceptance criteria:
  - Authenticated settings surface lets an agency:
    - configure URL
    - select phase-1 events
    - save endpoint
    - see secret once on create/rotate
    - send test event
  - UI explains signature verification and supported events clearly.
  - Empty, active, disabled, and failure-warning states are covered.

- [x] `WH-032` Build recent delivery log and inspector in the agency settings surface.
  Dependency: `WH-013`, `WH-030`, `WH-031`
  Acceptance criteria:
  - Agencies can see recent deliveries with:
    - event type
    - status
    - attempt count
    - timestamp
    - response code
    - concise error summary
  - Inspector reveals safe response/debug detail without leaking secrets.
  - Log works well on desktop and mobile.

- [x] `WH-033` Build internal-admin webhook support views.
  Dependency: `WH-025`, `WH-013`
  Acceptance criteria:
  - Internal admin can search endpoints by agency and inspect recent deliveries.
  - Support surface uses existing internal-admin patterns and semantic tokens.
  - Customer-visible replay remains out of scope, but internal visibility is sufficient for support triage.

- [x] `WH-034` Add creation/edit support for `externalReference` on access requests.
  Dependency: `WH-011`
  Acceptance criteria:
  - Access-request create/update contracts support nullable `externalReference`.
  - Value is returned in request detail APIs and included in webhook payloads.
  - Validation keeps the field bounded and optional.

- [x] `WH-040` Add backend tests for models, routes, event emission, signing, queueing, and idempotency.
  Dependency: `WH-014`, `WH-022`, `WH-023`, `WH-024`, `WH-030`, `WH-034`
  Acceptance criteria:
  - Tests cover endpoint CRUD/authz and one-endpoint-per-agency enforcement.
  - Tests cover signed request headers and signature verification examples.
  - Tests cover retry classification and persisted delivery attempts.
  - Tests cover duplicate lifecycle transitions not emitting duplicate phase-1 events unintentionally.

- [x] `WH-041` Add web tests for settings UI, delivery log, and secret handoff.
  Dependency: `WH-031`, `WH-032`, `WH-034`
  Acceptance criteria:
  - Tests cover create, update, disable, rotate, and test-send flows.
  - Tests verify secret display only on create/rotate handoff.
  - Tests cover empty, success, and repeated-failure states.

- [x] `WH-042` Publish public docs and internal support runbook.
  Dependency: `WH-023`, `WH-031`, `WH-032`, `WH-033`
  Acceptance criteria:
  - Public docs include:
    - quickstart
    - event catalog
    - payload examples
    - signature verification snippets
    - retry behavior
    - troubleshooting
  - Internal runbook defines triage flow for common customer issues and support escalation paths.

- [ ] `WH-043` Capture screenshot-polish verification across required shells.
  Dependency: `WH-031`, `WH-032`, `WH-033`
  Acceptance criteria:
  - Capture desktop + mobile evidence for:
    - agency empty state
    - configured endpoint state
    - repeated-failure warning state
    - internal-admin delivery inspector
  - Save artifacts under `docs/images/webhooks/2026-03-08`.
  - Review confirms semantic token usage and consistency with settings/admin shells.

- [ ] `WH-044` Run quality gates and launch readiness checks.
  Dependency: `WH-040`, `WH-041`, `WH-042`, `WH-043`
  Acceptance criteria:
  - Targeted API tests pass.
  - Targeted web tests pass.
  - `npm run typecheck` outcome is documented.
  - `npm run lint` outcome is documented.
  - Launch notes cover queue startup, timeout defaults, support expectations, and follow-up backlog items.

## Verification Strategy

1. Domain and contract correctness:
   - shared-type tests for event enums and DTO schemas
   - Prisma/service tests for endpoint uniqueness, event persistence, and delivery record lifecycle

2. Delivery pipeline correctness:
   - worker tests for success, timeout, retryable failure, and terminal `4xx`
   - idempotency tests for repeated status writes and duplicate lifecycle callbacks

3. Security and observability:
   - tests for Infisical-backed secret lifecycle
   - audit-log tests for endpoint CRUD, secret rotation, and test sends
   - assertions that secret IDs/raw secrets do not appear in user-visible payloads or logs

4. API and UI behavior:
   - route tests for authz, one-endpoint-per-agency enforcement, and response-shape consistency
   - web tests for settings flows and delivery-log rendering

5. Visual verification:
   - desktop/mobile screenshot review for agency and internal-admin surfaces
   - confirm semantic token usage and consistency with existing settings shell

## Risks and Mitigations

1. Risk: event emission points are duplicated across completion and verification flows, causing accidental duplicate webhook events.
   Mitigation: centralize event emission behind `WH-024` and back it with idempotency tests in `WH-040`.

2. Risk: queue worker is implemented but not started consistently in production.
   Mitigation: make queue startup part of `WH-022` acceptance criteria and document runtime requirements in `WH-044`.

3. Risk: agencies expect Leadsie-like asset-level payload detail that this repo cannot normalize consistently.
   Mitigation: constrain phase-1 payloads to stable request/client/connection summaries, document scope in public docs, and keep richer asset payloads as a follow-up.

4. Risk: secret rotation UX leaks secrets repeatedly or stores them unsafely.
   Mitigation: require one-time display behavior in `WH-031`/`WH-041` and Infisical-only storage in `WH-020`.

5. Risk: settings UI becomes another bespoke pattern instead of using the existing design system.
   Mitigation: force reusable primitives and semantic token compliance in `WH-013`, then validate with screenshot review in `WH-043`.

## Release Sequencing

1. Foundation:
   - land models, shared types, and endpoint service behind non-linked settings routes
   - verify event generation and delivery end-to-end against a local test receiver

2. Internal readiness:
   - enable settings UI and internal-admin inspection for staff/test agencies
   - validate support runbook on failure scenarios

3. Limited rollout:
   - enable webhook settings for a small set of agencies
   - monitor delivery failures and payload support questions before broader exposure

4. Broad launch:
   - publish public docs
   - expose settings UI generally
   - defer replay/multi-endpoint/expanded event catalog to follow-up sprint(s)

## Release Disposition

- Recommendation adopted: do not add a screenshot-specific auth harness in this sprint.
- The feature is functionally ready based on targeted API/web tests, workspace typechecks, and docs build validation.
- Remaining launch blocker is visual evidence for authenticated webhook settings and internal-admin surfaces.
- `WH-043` should be closed with a real Clerk-authenticated capture session rather than local bypass-only infrastructure.

## Deferred Follow-Up Backlog

- Multiple endpoints per agency
- `access_request.revoked`
- `connection.created`
- `connection.revoked`
- Agency-visible replay action
- Public replay/backfill API
- Richer platform-specific asset payloads where normalization quality is strong

## Review Findings Queue

- `RF-001` Shared package tests are green, but `ts-jest` emits `TS151002` warnings because the shared Jest + TypeScript module configuration is still using a hybrid module mode without `isolatedModules`.
  Suggested follow-up:
  - either enable `isolatedModules` in the shared tsconfig path used by Jest
  - or suppress the warning intentionally in Jest config after confirming the transform setup is acceptable

Current state:
- focused webhook API tests pass for endpoint lifecycle, event building, signing, delivery, and queue worker behavior
- webhook acceptance coverage now explicitly includes one-endpoint-per-agency enforcement plus settings UI flows for create, update, disable, rotate, test-send, empty state, and repeated-failure rendering
- `apps/api` typecheck passes
  - Prisma client was regenerated successfully after schema edits
- `apps/web` typecheck passes
- `apps/docs` production build passes with the new public webhook docs page
- `packages/shared` was rebuilt so the exported dist bundle matches current webhook and affiliate schema source
- agency-authenticated webhook settings routes now cover get, create/update, disable, rotate, test-send, and recent deliveries
- internal-admin webhook support routes, query hooks, and `/internal/admin/webhooks` surface are implemented for endpoint search + delivery inspection
- access-request create/edit flows now support optional `externalReference`, including the main wizard, edit page, and client-detail quick-create modal
- public webhook docs are published in the docs app at `apps/docs/docs/automation/webhooks.md`, and the internal support runbook lives at `docs/features/webhooks-support-runbook.md`
- root `npm run typecheck` is not green because workspace `tools/design-os` has no `typecheck` script; workspace-level typechecks for `packages/shared`, `apps/api`, `apps/web`, and `apps/docs` are green
- `npm run lint` exits successfully with warnings only across API and web; no lint errors were introduced by the webhook work
- screenshot evidence for authenticated settings/internal-admin states is still pending `WH-043`; capture attempts are documented in `docs/images/webhooks/2026-03-08/README.md` and remain blocked without a real Clerk-backed session or a dedicated screenshot harness
- sprint disposition is to ship no additional screenshot harness work in this cycle and close visual verification later with a real authenticated test session
