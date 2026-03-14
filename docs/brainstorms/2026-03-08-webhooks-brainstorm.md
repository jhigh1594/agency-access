# 2026-03-08 Webhooks Brainstorm

## Objective
Define a production-ready outbound webhook feature for agencies, plus the support surface required to make it operable, debuggable, and low-friction to adopt.

## Repo Context (Observed)
- The current stack is Next.js App Router in `apps/web`, Fastify + Prisma in `apps/api`, and shared types in `packages/shared`.
- The product already has the core lifecycle objects a webhook feature would publish:
  - `AccessRequest` state (`pending`, `partial`, `completed`, `expired`, `revoked`) in [`packages/shared/src/types.ts`](/Users/jhigh/agency-access-platform/packages/shared/src/types.ts)
  - `ClientConnection` + `PlatformAuthorization` + `grantedAssets` in [`apps/api/prisma/schema.prisma`](/Users/jhigh/agency-access-platform/apps/api/prisma/schema.prisma)
- The backend already receives third-party webhooks and has an idempotency pattern via audit logs:
  - inbound Creem route in [`apps/api/src/routes/webhooks.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/webhooks.ts)
  - webhook service in [`apps/api/src/services/webhook.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/webhook.service.ts)
- The backend already has background-job infrastructure via BullMQ in [`apps/api/src/lib/queue.ts`](/Users/jhigh/agency-access-platform/apps/api/src/lib/queue.ts).
- The notification flow already hints at webhook support as a future channel, but it is not implemented and should not be treated as the final architecture:
  - [`apps/api/src/services/notification.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/notification.service.ts)
- `Agency` already has a `settings` JSON column and notification preferences, but no first-class webhook configuration model today:
  - [`apps/api/prisma/schema.prisma`](/Users/jhigh/agency-access-platform/apps/api/prisma/schema.prisma)

## Default Architecture Baseline Check
The `workflow-discovery` default baseline (Rails + Phlex + Stimulus + Turbo/Hotwire) does **not** apply.

Applicable baseline for this repo:
- Next.js App Router frontend
- Fastify API backend
- Prisma + PostgreSQL
- BullMQ + Redis for async delivery
- Clerk-authenticated agency settings UI

## Users, Jobs, and Success Criteria
### Primary users
- Agency operators who want to push access-request outcomes into CRMs, Slack, internal ops tools, or automation tools like Zapier/Make.
- Internal support/admin users who need delivery visibility and a safe replay/debug workflow.

### Core jobs to be done
- Trigger downstream automation when a client partially or fully completes an access request.
- Correlate webhook payloads to an external CRM/customer record without brittle parsing.
- Diagnose delivery failures without engineering intervention.

### Success criteria
- An agency can configure a webhook endpoint and verify a test delivery in under 10 minutes.
- Production deliveries are signed, retried, and auditable.
- Support can answer “was the event generated, was it delivered, and what did the endpoint return?” from product data.
- The v1 payload is stable enough for Zapier/Make users, without promising platform fields the product cannot reliably normalize.

## External Research Summary (Leadsie)
Sources reviewed:
- Legacy v1 docs: `https://help.leadsie.com/article/43-webhooks`
- Current v2 docs: `https://help.leadsie.com/article/127-webhooks`

### Observed behavior in Leadsie
- Leadsie’s legacy v1 page explicitly says it is historical and points to the newer v2 documentation.
- Both versions are outbound webhooks triggered when a request gets a new connection.
- Leadsie supports an external correlation field via `customUserId`, passed on the request URL and echoed back as `user`.
- Leadsie’s payload is snapshot-oriented rather than event-envelope-first:
  - top-level request/client fields
  - a `status` like `SUCCESS`, `PARTIAL_SUCCESS`, `FAILED`
  - a `connectionAssets` array with per-asset details
- v2 expands the payload substantially with `apiVersion: 2` and richer asset fields such as:
  - `platform`
  - `connectionStatus`
  - `statusLastCheckedAt`
  - `linkToAsset`
  - `assignedUsers`
  - `connectedAccount`
  - platform-specific fields like Shopify collaborator code and Google Business Profile URIs

### Implications for this product
- Leadsie parity is useful as a market reference, but copying its full payload shape would over-promise data this repo does not normalize consistently across all platforms today.
- The strongest reusable idea is not the exact payload schema; it is the product pattern:
  - agency-configurable endpoint
  - external correlation field
  - useful snapshot of what was connected
- The public Leadsie docs do not prominently document signature verification, retries, delivery logs, or replay behavior. Those are exactly the areas where this product should be stronger to reduce support burden.

## Constraints and Guardrails
- Preserve API response shape: success `{ data: T }`, error `{ error: { code, message, details? } }`.
- Do not store OAuth tokens in PostgreSQL.
- Do not include secret material or token references in outbound webhook payloads.
- Treat webhook secrets as sensitive credentials. Store only references/metadata in Postgres and keep secret material in Infisical.
- Keep v1 payload grounded in data the current domain can emit reliably from `AccessRequest`, `ClientConnection`, `PlatformAuthorization`, `AuthorizationVerification`, and `grantedAssets`.
- Do not couple outbound webhooks to the existing email notification implementation.

## What Already Exists vs Missing
### Reusable
- Access request lifecycle state.
- Connection and granted-asset persistence.
- Audit logging service and patterns.
- BullMQ queue infrastructure.
- Agency settings surface and authenticated route patterns.

### Missing
- First-class webhook endpoint model and secret management.
- Event generation service for access-request lifecycle changes.
- Dedicated delivery queue/worker for outbound webhooks.
- Agency-facing settings UI for configuration and delivery inspection.
- Internal support tooling and docs.
- Shared webhook event types/schema definitions.

## Approaches
### 1) Leadsie-Parity Snapshot Webhook
Scope:
- One agency webhook URL.
- One delivery per new connection.
- Payload shaped closely after Leadsie v1/v2.

Pros:
- Easy competitive parity story.
- Familiar for agencies migrating from Leadsie.
- Simple marketing comparison.

Cons:
- Forces normalization work the current product does not support cleanly.
- Payload becomes platform-heavy and hard to version.
- Higher support risk because consumers will depend on fields that are sparse or inconsistent by platform.

### 2) Event Envelope + AuthHub Snapshot (Recommended)
Scope:
- Signed outbound webhook system with a stable event envelope.
- Small launch event catalog tied to access-request and connection lifecycle.
- Each event includes a normalized snapshot of request/client/connection state the system already owns.

Pros:
- Fits the current domain model and queue architecture.
- Easier to version, test, and support.
- More secure and extensible than a raw callback.
- Still lets agencies automate against concrete request/connection outcomes.

Cons:
- Less “drop-in Leadsie clone” positioning.
- Requires a bit more up-front design around event names and delivery semantics.

### 3) Full Developer Platform
Scope:
- Multiple endpoints per agency.
- Event subscriptions, replay UI, endpoint health, API backfill, sandbox/test mode, docs portal.

Pros:
- Best long-term platform story.
- Strong enterprise/devtools positioning.

Cons:
- Too much scope for a first release.
- Large support and product surface before core demand is validated.

## Recommendation
Start with **Approach 2**.

The v1 goal should be:
- one outbound webhook endpoint per agency
- signed requests
- async delivery with retries
- recent delivery history
- test delivery
- a compact event catalog focused on access-request and connection outcomes

This gives the product a credible webhook feature without inventing a giant developer platform or promising Leadsie-level asset detail that the backend cannot yet normalize.

## Recommended Product Scope
### In scope for v1
- Agency-configurable webhook endpoint URL
- Secret generation + rotation
- Event subscriptions via a small checkbox list
- Test delivery action
- Recent delivery log per endpoint
- Automatic retries on non-2xx/timeouts
- Event payload docs + sample receiver code
- Internal admin/support visibility into deliveries

### Explicit non-goals for v1
- Multiple webhook endpoints per agency
- Per-endpoint custom transformations/templates
- Public replay API
- Billing, affiliate, and token-refresh events in the same first release
- Guaranteed Leadsie field parity for every platform asset type

## Proposed v1 Event Catalog
- `access_request.partial`
  - emitted when at least one requested platform is verified/connected but the request is not fully complete
- `access_request.completed`
  - emitted when all requested platforms are complete
- `access_request.revoked`
  - emitted when an agency revokes/cancels a request
- `connection.created`
  - emitted when a client connection record is created for an access request
- `connection.revoked`
  - emitted when a client connection is revoked or becomes unusable due to explicit product action

### Events to defer
- `access_request.expired`
- `connection.health_changed`
- `authorization.refreshed`
- billing/admin/internal events

Reasoning:
- `partial` and `completed` map directly to current status semantics.
- `connection.created` gives agencies a lower-level hook if they want asset-specific workflows later.
- Deferring health/refresh events avoids noisy operational traffic in v1.

## Payload Design Recommendation
### Envelope
Use a generic event envelope:

```json
{
  "id": "evt_01H...",
  "type": "access_request.completed",
  "apiVersion": "2026-03-08",
  "createdAt": "2026-03-08T18:00:00.000Z",
  "deliveryAttempt": 1,
  "data": {}
}
```

### Headers
- `X-AgencyAccess-Event`
- `X-AgencyAccess-Delivery-Id`
- `X-AgencyAccess-Timestamp`
- `X-AgencyAccess-Signature`

### Signature
- HMAC SHA-256 over `${timestamp}.${rawBody}`
- Header format: `v1=<hex digest>`
- Store secret material in Infisical; store only `secretId`, `lastUsedAt`, and a non-sensitive preview in Postgres

### Event data shape
For `access_request.completed` and `access_request.partial`, include:
- `accessRequest`
  - `id`
  - `status`
  - `createdAt`
  - `authorizedAt`
  - `expiresAt`
  - `requestUrl`
  - `clientPortalUrl` or summary URL if available
  - `requestedPlatforms`
  - `completedPlatforms`
  - `externalReference` (recommended new field)
- `client`
  - `id`
  - `name`
  - `email`
  - `company` when available
- `connections`
  - list of connection summaries for this request
  - `connectionId`
  - `status`
  - `platforms`
  - `grantedAssets` summary
- `metadata`
  - versioned room for future additions

### Why not copy Leadsie’s payload directly
- Current repo can reliably emit request status, platform completion, and granted-assets summaries.
- It cannot yet guarantee rich per-asset fields like `assignedUsers`, `linkToAsset`, or platform-specific connection metadata for every connector.
- A normalized AuthHub snapshot is more defensible than a faux-universal asset schema.

## External Correlation Design
Leadsie’s `customUserId` idea is worth adopting, but model it more explicitly.

Recommendation:
- add an `externalReference` string to `AccessRequest`
- allow agencies to set it when creating/updating a request
- echo it in webhook payloads

Why:
- avoids overloading request URLs with query-only metadata
- creates a stable CRM key for agencies
- works for API-created requests later if an API is added

## Data Model Proposal
### New tables
- `WebhookEndpoint`
  - `id`
  - `agencyId`
  - `url`
  - `secretId`
  - `status` (`active`, `disabled`)
  - `subscribedEvents` JSON/string[]
  - `lastDeliveredAt`
  - `lastFailedAt`
  - `failureCount`
  - `createdBy`
  - `createdAt`
  - `updatedAt`
- `WebhookEvent`
  - `id`
  - `agencyId`
  - `type`
  - `resourceType`
  - `resourceId`
  - `payload`
  - `createdAt`
- `WebhookDelivery`
  - `id`
  - `endpointId`
  - `eventId`
  - `attemptNumber`
  - `status` (`pending`, `delivered`, `failed`)
  - `requestHeaders`
  - `responseStatus`
  - `responseBodySnippet`
  - `errorCode`
  - `errorMessage`
  - `nextAttemptAt`
  - `deliveredAt`
  - `createdAt`

### Existing model changes
- `AccessRequest.externalReference` string nullable
- optional `Agency.settings.webhooksEnabled` flag is acceptable, but endpoint configuration should not live entirely inside the generic `settings` JSON

## Backend Architecture Proposal
### Services
- `webhook-endpoint.service.ts`
  - create/update/disable/rotate/test/list endpoints
- `webhook-event.service.ts`
  - construct payloads from domain models
  - persist event records
  - enqueue deliveries
- `webhook-delivery.service.ts`
  - sign requests
  - send HTTP POST
  - record attempts/results
  - classify retryable vs terminal failures

### Queue
- Create a dedicated `webhook-delivery` BullMQ queue instead of piggybacking on `notificationQueue`
- Reason:
  - webhook delivery has different retry semantics
  - it needs delivery-attempt persistence
  - it will likely grow into replay and support tooling

### Delivery semantics
- Consider any `2xx` a success
- Timeout after 5 seconds for v1
- Retry on timeout/network/`429`/`5xx`
- Do not retry on most `4xx` except optionally `408`/`409`/`429`
- Disable endpoint after repeated consecutive failures, but do not silently delete it

### Suggested retry schedule
- Attempt immediately
- Retry after 1 minute
- Retry after 5 minutes
- Retry after 30 minutes
- Retry after 2 hours
- Retry after 24 hours

## API Surface Proposal
### Agency-authenticated routes
- `GET /api/webhook-endpoints`
- `POST /api/webhook-endpoints`
- `PATCH /api/webhook-endpoints/:id`
- `POST /api/webhook-endpoints/:id/test`
- `POST /api/webhook-endpoints/:id/rotate-secret`
- `GET /api/webhook-endpoints/:id/deliveries`

### Internal admin/support routes
- `GET /api/internal-admin/webhooks`
- `GET /api/internal-admin/webhooks/:endpointId/deliveries`
- `POST /api/internal-admin/webhooks/:deliveryId/replay`

All routes should preserve the repo’s standard success/error response shape.

## Frontend / UX Proposal
### Location
- Add a `Webhooks` section or tab under authenticated `Settings`
- Do not bury this in platform connections; this is an agency-level developer/integration setting

### v1 UI states
- Empty state:
  - explain what webhooks are for
  - show supported events
  - let user add endpoint
- Config state:
  - endpoint URL
  - event subscriptions
  - generated signing secret shown once
  - copy sample payload
  - send test webhook button
- Delivery log:
  - status
  - event type
  - delivery timestamp
  - response code
  - short error summary

### Important UX requirements
- Show the secret only once on create/rotate.
- Provide a copyable sample verification snippet.
- Surface “last successful delivery” and “consecutive failures” clearly.
- Include a warning when disabling an endpoint after repeated failures.

## Support and Documentation Requirements
### Public docs
- Overview: what webhooks are and what they are for
- Quickstart with a sample receiver
- Signature verification examples:
  - Node/Next.js
  - Python/FastAPI
  - Zapier/Make guidance
- Event catalog and payload examples
- Retry behavior and timeout expectations
- Troubleshooting guide for `401`, `404`, `410`, `429`, and `5xx`

### In-app support
- Test delivery button
- Copyable recent payload example
- Delivery inspector with response details
- Secret rotation flow

### Internal support runbook
- How to determine whether:
  - no event was generated
  - event was generated but not queued
  - delivery was queued but failed
  - customer endpoint returned an error
- How and when to replay
- When to advise endpoint rotation vs customer-side fix

## Testing Requirements
### Backend
- service tests for event generation per lifecycle transition
- route tests for endpoint CRUD + auth
- signing verification tests
- retry classification tests
- worker tests for successful delivery, timeout, and terminal `4xx`
- idempotency tests to ensure the same domain transition does not emit duplicate events unintentionally

### Frontend
- settings UI tests for create/test/rotate flows
- delivery log rendering tests

### Contract
- shared payload Zod schemas in `packages/shared` for emitted event envelopes

## Phased Rollout
### Phase 1
- one endpoint per agency
- `access_request.partial` + `access_request.completed`
- test delivery
- signed delivery
- delivery logs

### Phase 2
- `connection.created`, `connection.revoked`, `access_request.revoked`
- support replay UI
- internal admin delivery tooling

### Phase 3
- multiple endpoints per agency
- filtered subscriptions per endpoint
- richer payloads for platforms with strong normalization
- public replay/backfill API if demand exists

## Open Questions
1. Should v1 support only a single endpoint per agency, or is multi-endpoint support important enough to justify the extra model/UI complexity now?
2. Is `externalReference` enough for CRM correlation, or do we also want a more Leadsie-like request-link query parameter passthrough for migration convenience?
3. Do we want to emit `access_request.partial` in v1, or keep launch semantics simpler with only `completed` plus test events?

## Validation Check
- Clarity: objective, architecture, payload direction, and support requirements are explicit.
- Scope boundaries: v1, deferred scope, and phased rollout are separated.
- Open questions: implementation-impacting choices are listed and narrow enough for planning.

## Handoff
Ready for `workflow-plan` once Open Question 1 is decided.

## Sources
- Leadsie legacy webhooks: https://help.leadsie.com/article/43-webhooks
- Leadsie current webhooks: https://help.leadsie.com/article/127-webhooks
- Repo webhook ingestion pattern: [`apps/api/src/routes/webhooks.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/webhooks.ts)
- Repo queue pattern: [`apps/api/src/lib/queue.ts`](/Users/jhigh/agency-access-platform/apps/api/src/lib/queue.ts)
- Repo notification placeholder for webhook channel: [`apps/api/src/services/notification.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/notification.service.ts)
