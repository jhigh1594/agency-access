---
title: "feat: Webhook V2 — Per-Asset Payload & Event Expansion"
type: feat
status: completed
date: 2026-03-18
---

# feat: Webhook V2 — Per-Asset Payload & Event Expansion

## Overview

Evolve AuthHub's outbound webhook system from connection-level notifications to rich per-asset payloads that match or exceed Leadsie V2. Ship this as `apiVersion: "2026-03-19"` alongside the existing V1 (`2026-03-08`) for backward compatibility. Add new lifecycle event types and multiple endpoint support.

**Origin:** Competitive SWOT analysis of Leadsie V2 webhooks (2026-03-18 session). AuthHub's webhook infrastructure (signing, retries, delivery tracking, admin tools) is genuinely superior to Leadsie's, but the payload is significantly behind in richness — the single highest-impact gap.

## Problem Statement

AuthHub currently sends **connection-level summaries** in webhook payloads: `{ connectionId, status, platforms[] }`. Leadsie V2 sends **per-asset detail** — every ad account, page, pixel, and catalog with individual status, permissions, access levels, and deep links. This blocks three critical agency use cases:

1. **CRM automation** — "Add the specific ad accounts my client granted to their CRM record" requires per-asset IDs and names, not just "Meta connection succeeded."
2. **Team-aware workflows** — Agencies with multiple team members need to know who was assigned to each asset.
3. **Lifecycle monitoring** — Agencies need notification when access is revoked or expires, not just when it's granted.

Additionally, only 3 of 5 planned event types are implemented (`access_request.partial`, `access_request.completed`, `webhook.test`). The deferred events (`revoked`, `expired`, `connection.*`) leave agencies blind to post-grant lifecycle changes.

## Proposed Solution

### Three-Phase Delivery

**Phase 1: Payload Parity** (Week 1-2) — Close the critical competitive gap by enriching the `access_request.completed` payload with per-asset detail.

**Phase 2: Event Expansion** (Week 3-4) — Add the deferred lifecycle events (`revoked`, `expired`, `connection.status_changed`) and bump `subscribedEvents` max.

**Phase 3: Platform Differentiation** (Month 2) — Ship multiple endpoints per agency, replay/backfill, and native Zapier integration.

### Key Architectural Decision: Dual apiVersion Coexistence

Ship `apiVersion: "2026-03-19"` alongside `2026-03-08`. Existing integrations continue receiving V1 payloads unchanged. New integrations (or those that opt in via API header) receive V2. This leverages the versioned envelope that was explicitly designed for this purpose (sprint decision #6: "Stable event envelope").

The `subscribedEvents` field on `WebhookEndpoint` gets a new column `preferredApiVersion` (default: `"2026-03-08"`). Agencies upgrade by updating their endpoint to `"2026-03-19"`. No migration, no forced cutover.

## Technical Approach

### Architecture

```
Domain Transition
  → emitAccessRequestLifecycleWebhook()
    → webhookEventService.buildAccessRequestWebhookEvent(input, { apiVersion: endpoint.preferredApiVersion })
      → if V2: enrich with per-asset detail from PlatformAuthorization + grantedAssets
      → if V1: existing behavior unchanged
    → create WebhookEvent record (stores full payload as JSON)
    → queueWebhookDelivery(eventRecord.id)
```

### Implementation Phases

#### Phase 1: Payload Parity (apiVersion "2026-03-19")

##### 1A. Shared Types — New V2 Payload Schema

**File:** `packages/shared/src/types.ts`

- Add `WebhookApiVersionV2Schema = z.literal('2026-03-19')`
- Expand `WebhookApiVersionSchema` to union: `'2026-03-08' | '2026-03-19'`
- Add V2-specific asset type:

```typescript
// packages/shared/src/types.ts
export const WebhookConnectionAssetV2Schema = z.object({
  assetId: z.string(),
  assetName: z.string(),
  assetType: z.string(),        // "Ad Account", "Page", "Pixel", etc.
  platform: z.string(),         // "Meta", "Google", "LinkedIn"
  connectionStatus: z.enum(['Connected', 'Failed', 'Pending']),
  accessLevel: z.enum(['ViewOnly', 'Manage', 'Owner']).optional(),
  grantedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  linkToAsset: z.string().url().optional(),
  // Platform-specific extensions (future)
  platformMetadata: z.record(z.unknown()).optional(),
});
```

- Expand `WebhookAccessRequestEventDataSchema` with optional V2 fields (all optional for backward compat):
  - `connections[].assets: WebhookConnectionAssetV2Schema[]` — per-asset detail when available
  - `accessRequest.accessLevel: string` — request-level access level
- Add `WebhookAccessRequestCompletedV2EventEnvelopeSchema` discriminated on `type: 'access_request.completed'` with V2 data shape
- Expand `WebhookEventEnvelopeSchema` to include V2 variants

##### 1B. Database Schema — preferredApiVersion Column

**File:** `apps/api/prisma/schema.prisma`

- Add `preferredApiVersion` field to `WebhookEndpoint`:
  - Type: `String`, default: `"2026-03-08"`
  - Validated in service layer (not DB constraint — keeps it flexible)

##### 1C. Event Service — V2 Payload Builder

**File:** `apps/api/src/services/webhook-event.service.ts`

- Add `buildAccessRequestWebhookEventV2()` function that:
  - Takes same input as V1 plus `PlatformAuthorization[]` records
  - Maps each `PlatformAuthorization` to a `WebhookConnectionAssetV2` object
  - Pulls `grantedAssets` from `ClientConnection` to populate asset names/types
  - Uses platform registry config to derive `assetType` labels (e.g., `google_ads` → "Google Ads Account")
  - Includes `connectionStatus` from `PlatformAuthorization.status`
  - Includes `grantedAt` from `ClientConnection.createdAt` per connection
  - Derives `linkToAsset` from platform-specific URL patterns (Meta Business Manager, Google Ads console, etc.)

- Modify `buildAccessRequestWebhookEvent()` to accept `apiVersion` parameter:
  - If `"2026-03-08"` → existing V1 behavior
  - If `"2026-03-19"` → delegates to V2 builder

##### 1D. Emission — Pass apiVersion from Endpoint

**File:** `apps/api/src/services/access-request.service.ts`

- In `emitAccessRequestLifecycleWebhook()` (line ~816):
  - Read `endpoint.preferredApiVersion` alongside `endpoint.subscribedEvents`
  - Pass `apiVersion` to `buildAccessRequestWebhookEvent()`
  - Fetch `PlatformAuthorization` records for V2 payloads (join through `ClientConnection`)
  - V1 path remains unchanged — no additional queries for V1 consumers

##### 1E. Endpoint Service — Version Field CRUD

**File:** `apps/api/src/services/webhook-endpoint.service.ts`

- `createWebhookEndpoint()`: Accept optional `preferredApiVersion`, default to `"2026-03-08"`
- `updateWebhookEndpoint()`: Allow upgrading `preferredApiVersion` to `"2026-03-19"`
- Validate version is a known value

##### 1F. API Route — Version Field in Request/Response

**File:** `apps/api/src/routes/webhooks.ts` (webhook settings routes)

- `PUT /agencies/:id/webhook-endpoint`: Accept `preferredApiVersion` in request body
- `GET /agencies/:id/webhook-endpoint`: Include `preferredApiVersion` in response

##### 1G. Frontend — API Version Selector

**File:** `apps/web/src/components/settings/webhooks/webhook-settings-tab.tsx`

- Add a dropdown/selector for "Payload Version" with options:
  - "Standard (V1)" — current behavior
  - "Enhanced (V2)" — per-asset detail
- Show tooltip explaining V2 includes granular asset data
- Default to V1 for existing endpoints, V2 for new ones

**File:** `apps/web/src/lib/api/webhooks.ts`

- Update `updateWebhookEndpoint()` to accept `preferredApiVersion`

##### 1H. Tests

- `packages/shared/src/__tests__/webhook-types.test.ts` — Add V2 schema tests
- `apps/api/src/services/__tests__/webhook-event.service.test.ts` — V2 builder tests with realistic asset data per platform
- `apps/api/src/routes/__tests__/webhook-settings.routes.test.ts` — Version field CRUD tests
- `apps/web/src/components/settings/webhooks/__tests__/webhook-settings-tab.test.tsx` — Version selector tests

##### 1I. Documentation

**File:** `apps/docs/docs/automation/webhooks.md`

- Add V2 payload section with full examples
- Document per-asset fields and their sources
- Add migration guide: "Upgrading from V1 to V2"
- Update event catalog with field differences

---

#### Phase 2: Event Expansion

##### 2A. New Event Types

**File:** `packages/shared/src/types.ts`

- Expand `WebhookEventTypeSchema`:
  ```typescript
  export const WebhookEventTypeSchema = z.enum([
    'webhook.test',
    'access_request.partial',
    'access_request.completed',
    'access_request.revoked',      // NEW
    'access_request.expired',       // NEW
    'connection.status_changed',    // NEW
  ]);
  ```
- Update `subscribedEvents` max from 3 to 6 in Zod schema and endpoint service
- Add discriminated union variants for each new event type in `WebhookEventEnvelopeSchema`

##### 2B. access_request.revoked

**Trigger:** Agency calls revoke endpoint, or client connection is manually revoked.

**File:** `apps/api/src/services/access-request.service.ts`

- In revoke path (where status transitions to `revoked`):
  - Emit `access_request.revoked` event
  - Payload: same structure as completed but with `revokedAt` timestamp and `revokedBy` info
  - Include which connections/assets were affected

##### 2C. access_request.expired

**Trigger:** Cron job or status check finds expired uncompleted requests.

**File:** New cron job or scheduled check (e.g., `apps/api/src/jobs/check-expired-requests.ts`)

- Scan `AccessRequest` where `status = 'pending' AND expiresAt < now()`
- Transition status to `expired`
- Emit `access_request.expired` event
- Payload: request details with `expiredAt` timestamp

##### 2D. connection.status_changed

**Trigger:** Health check detects a platform authorization has become `invalid` or `expired`.

**File:** Health check service (wherever connection health is verified)

- When `PlatformAuthorization.status` transitions from `active` to `invalid`/`expired`/`revoked`:
  - Emit `connection.status_changed` event
  - Payload: connection details, affected platform(s), previous status, new status, detectedAt

##### 2E. Frontend — Event Subscription UI Update

**File:** `apps/web/src/components/settings/webhooks/webhook-settings-tab.tsx`

- Update event checkbox list to show all 6 event types
- Add descriptions for each event type
- Group: "Connection Events" (partial, completed, revoked, expired) and "Health Events" (status_changed)

##### 2F. Tests & Docs

- Unit tests for each new event builder
- Integration tests for emission triggers
- Update public docs with new event catalog

---

#### Phase 3: Platform Differentiation

##### 3A. Multiple Endpoints per Agency

**File:** `apps/api/prisma/schema.prisma`

- Remove `@@unique([agencyId])` constraint on `WebhookEndpoint`
- Add index on `[agencyId, status]` for efficient active endpoint lookup

**File:** `apps/api/src/services/webhook-endpoint.service.ts`

- Remove one-endpoint-per-agency enforcement
- `getActiveWebhookEndpoints(agencyId)` → returns all active endpoints
- Each endpoint has its own `url`, `secretId`, `subscribedEvents`, `preferredApiVersion`

**File:** `apps/api/src/services/access-request.service.ts`

- In `emitAccessRequestLifecycleWebhook()`:
  - Fetch ALL active endpoints for the agency
  - For each endpoint: check `subscribedEvents`, build payload with that endpoint's `preferredApiVersion`, create `WebhookEvent` + queue delivery
  - Each endpoint gets its own event record and delivery chain

**File:** `apps/api/src/services/webhook-management.service.ts`

- Update `listWebhookEndpoints()` to return paginated list
- Add `createWebhookEndpoint()` (no longer upsert — explicit create)
- Add `deleteWebhookEndpoint()` (soft delete or hard delete)

##### 3B. Agency-Visible Replay

**File:** `apps/api/src/routes/webhooks.ts`

- `POST /agencies/:id/webhook-endpoint/:endpointId/replay/:eventId`
- Fetches original `WebhookEvent` payload from DB
- Creates new `WebhookEvent` record (replay) + queues delivery
- Audit logs the replay action

**File:** `apps/web/src/components/settings/webhooks/webhook-delivery-inspector.tsx`

- Add "Replay" button on each delivery row
- Confirms replay action before sending

##### 3C. Webhook Delivery Analytics

**File:** `apps/api/src/services/webhook-management.service.ts`

- `getWebhookDeliveryStats(agencyId)` → aggregate stats:
  - Total events, successful deliveries, failed deliveries
  - Average delivery latency
  - Success rate over last 7/30 days
  - Most recent failure reason

**File:** Frontend dashboard component

- Show delivery health card in webhook settings tab
- Visual indicator: green/yellow/red based on success rate

## Alternative Approaches Considered

### A1: Replace V1 with V2 (Breaking Change)
**Rejected.** The versioned envelope was explicitly designed to prevent this. Existing integrations would break. V1 consumers should never see unexpected fields.

### A2: Always Send V2 Payload, Let Consumer Filter
**Rejected.** V2 payloads are larger (more data per asset). Agencies on metered endpoints or simple integrations shouldn't pay the payload size cost for data they don't use. The `preferredApiVersion` opt-in is cleaner.

### A3: Separate Event Types for V2 (e.g., `access_request.completed.v2`)
**Rejected.** Overloads the event type namespace. The `apiVersion` field in the envelope is the correct mechanism — it's how Stripe, GitHub, and every major webhook provider handles this.

### A4: Fetch Asset Data at Delivery Time
**Rejected.** The current architecture correctly builds the payload at event emission time and stores it as JSON in `WebhookEvent.payload`. This makes delivery idempotent and replayable. Fetching at delivery time would make payloads non-deterministic.

## System-Wide Impact

### Interaction Graph

```
Access request status transition (e.g., pending → completed)
  → setAccessRequestLifecycleStatus()
    → emitAccessRequestLifecycleWebhook()
      → Fetch WebhookEndpoint(s) for agency
      → For each endpoint:
        → Check subscribedEvents includes event type
        → Fetch ClientConnection + PlatformAuthorization records (V2 only)
        → Build event payload (V1 or V2 based on preferredApiVersion)
        → Create WebhookEvent record (payload stored as JSON)
        → queueWebhookDelivery(eventId)
          → pg-boss enqueues with singletonKey
            → webhookDeliveryService.deliverWebhookEvent()
              → Fetch event + endpoint + signing secret
              → Sign payload with HMAC-SHA256
              → POST to endpoint URL
              → On 2xx: mark delivered, reset failureCount
              → On 429/5xx: mark failed, schedule retry
              → On consecutive failures >= 5: disable endpoint
```

### Error & Failure Propagation

1. **Event generation failure** (e.g., DB query fails when building V2 payload):
   - Currently: `try/catch` with `logger.warn`, silently skips
   - V2 risk: V2 path fetches more data (PlatformAuthorization joins), more surface area for query failures
   - Mitigation: If V2 payload build fails, fall back to V1 payload with a `payloadBuildWarning` field. Never skip the webhook entirely.

2. **Delivery failure for one of multiple endpoints (Phase 3)**:
   - Each endpoint has independent delivery chain (separate WebhookEvent + WebhookDelivery records)
   - Failure on endpoint A does not affect delivery to endpoint B
   - Auto-disable is per-endpoint, not per-agency

3. **pg-boss singletonKey collision on replay**:
   - Current: `singletonKey: webhook-${eventId}` prevents duplicate delivery jobs
   - Replay creates a new `WebhookEvent` record (new eventId), so new singletonKey — no collision

### State Lifecycle Risks

1. **Partial V2 data for some platforms**: Not all platforms have rich `grantedAssets` data. If `ClientConnection.grantedAssets` is null/empty for a platform, the V2 payload should omit the `assets` array for that connection (not send empty array). This prevents the false impression that "no assets were granted" when in fact asset data simply isn't available.

2. **PlatformAuthorization status drift**: The `status` field in `PlatformAuthorization` may be stale (last health check was hours ago). V2 payload should include `statusLastCheckedAt` (from `PlatformAuthorization.lastRefreshedAt`) so consumers can gauge freshness. This mirrors Leadsie V2's approach.

3. **Connection revoked between partial and completed**: If a client revokes platform A after partially completing (platforms B and C done), the `access_request.completed` event fires with platform A's connection showing `status: 'revoked'`. V2 payload must accurately reflect this — not silently omit the revoked connection.

### API Surface Parity

| Interface | Change Required |
|-----------|----------------|
| `PUT /agencies/:id/webhook-endpoint` | Add `preferredApiVersion` field |
| `GET /agencies/:id/webhook-endpoint` | Include `preferredApiVersion` in response |
| `WebhookEndpointConfigInputSchema` (shared) | Add `preferredApiVersion` |
| `WebhookEndpointSummarySchema` (shared) | Add `preferredApiVersion` |
| `WebhookEventEnvelopeSchema` (shared) | Add V2 discriminated union variants |
| Frontend webhook settings tab | Add version selector |
| Frontend API client | Update types |
| Public webhook docs | Add V2 documentation section |
| `APP_OVERVIEW.md` | Update "Webhooks" status from "Not implemented" to "V1 MVP live, V2 in progress" |

### Integration Test Scenarios

1. **V1 consumer unchanged**: Agency with V1 endpoint receives identical payload after V2 ships. No extra fields, no structural changes.
2. **V2 consumer gets per-asset detail**: Agency upgrades to V2, creates access request, client completes with 3 Meta assets + 2 Google assets. Webhook payload includes all 5 assets with individual IDs, names, types, statuses.
3. **V2 fallback on missing asset data**: Client connects a platform where `grantedAssets` is null. V2 payload includes the connection but omits `assets` array. No error, no empty array.
4. **Multi-endpoint delivery independence**: Agency has 2 endpoints (one V1 for Slack, one V2 for CRM). Same event fires. Slack gets V1 payload, CRM gets V2. Slack endpoint fails — CRM delivery unaffected.
5. **Revocation event fires correctly**: Agency revokes access. `access_request.revoked` event fires with `revokedAt` and affected connections. Endpoint receives event with correct status.

## Acceptance Criteria

### Functional Requirements

- [ ] V2 payload (`apiVersion: "2026-03-19"`) includes per-asset detail: assetId, assetName, assetType, platform, connectionStatus, grantedAt
- [ ] V1 payload (`apiVersion: "2026-03-08"`) remains unchanged — no breaking changes
- [ ] `preferredApiVersion` field on WebhookEndpoint controls which payload format is sent
- [ ] Default `preferredApiVersion` is `"2026-03-08"` for all existing endpoints
- [ ] New endpoints can opt into V2 at creation time
- [ ] `access_request.revoked` event fires when request is revoked
- [ ] `access_request.expired` event fires when request expires
- [ ] `connection.status_changed` event fires when connection health degrades
- [ ] All 6 event types are subscribable per-endpoint
- [ ] `subscribedEvents` max increased to 6
- [ ] Multiple endpoints per agency supported (Phase 3)
- [ ] Agency-visible replay action for past events (Phase 3)
- [ ] `linkToAsset` deep links to native platform consoles where URL patterns are known

### Non-Functional Requirements

- [ ] V2 payload build adds < 200ms to event emission (extra DB query for PlatformAuthorization)
- [ ] V2 payload does not exceed 1MB for requests with up to 50 assets
- [ ] Existing V1 delivery latency is unchanged (no regression)
- [ ] All new event types follow existing retry/backoff/auto-disable behavior
- [ ] All new event types are audit-logged

### Quality Gates

- [ ] Backend test coverage: 80%+ for new/modified webhook services
- [ ] Shared package tests: 95%+ for new V2 types (existing bar)
- [ ] Frontend component tests: 70%+ for webhook settings changes
- [ ] Public docs updated before feature ships
- [ ] `APP_OVERVIEW.md` updated to reflect current webhook status

## Success Metrics

- **Competitive parity**: AuthHub webhook payload includes at least as much per-asset detail as Leadsie V2 for Meta, Google, and LinkedIn platforms
- **Backward compatibility**: Zero V1 consumer breakage after V2 ships
- **Adoption**: 50%+ of active webhook endpoints upgraded to V2 within 60 days of launch
- **Reliability**: Delivery success rate maintains > 95% for V2 payloads
- **Documentation**: Public webhook docs include V2 payload examples for all supported platforms

## Dependencies & Prerequisites

### Internal Dependencies
- `ClientConnection.grantedAssets` JSON structure must be consistent across platforms — audit which platforms populate this field reliably
- Platform registry (`apps/api/src/services/connectors/registry.config.ts`) — need `assetTypeLabel` mapping for human-readable asset type names
- `PlatformAuthorization.metadata` — may contain platform-specific data useful for `platformMetadata` field
- Health check infrastructure — needed for `connection.status_changed` event trigger

### External Dependencies
- None — this is a pure backend + shared types + frontend change

### Blocked By
- None — all dependencies exist in the codebase

### Blocks
- Onboarding Workflow Builder's `WEBHOOK` action type (should use V2 payload format)
- Competitive comparison page updates (can claim "per-asset webhook detail" feature)

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| V2 payload build fails for some platforms (missing grantedAssets) | High | Medium | Graceful degradation: omit `assets` array, include `warning` field |
| V1 consumers receive unexpected fields | Low | High | V1 and V2 are separate build paths — V1 code is untouched |
| Large payloads for clients with many assets | Medium | Low | Add `assetsSummary` count field; document payload size expectations |
| Multiple endpoints amplify delivery volume | Medium | Low | Per-endpoint failure tracking is independent; auto-disable is per-endpoint |
| Replay creates duplicate side effects in consumer systems | Medium | Medium | Include `isReplay: true` flag in replayed event payloads |
| `connection.status_changed` fires too frequently during health checks | Medium | Medium | Debounce: only fire if status actually changed since last event |

## Sources & References

### Internal References

- **Sprint artifact:** `/Users/jhigh/agency-access-platform/docs/sprints/2026-03-08-webhooks-mvp.md` — Phase 1 implementation, deferred backlog (lines 407-415), product decisions (lines 37-51)
- **Brainstorm doc:** `/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-08-webhooks-brainstorm.md` — Event catalog, architecture decisions (lines 100-133)
- **Event emission:** `/Users/jhigh/agency-access-platform/apps/api/src/services/access-request.service.ts:816-937` — `emitAccessRequestLifecycleWebhook()`
- **Event builder:** `/Users/jhigh/agency-access-platform/apps/api/src/services/webhook-event.service.ts` — `buildAccessRequestWebhookEvent()`
- **Delivery engine:** `/Users/jhigh/agency-access-platform/apps/api/src/services/webhook-delivery.service.ts` — signing, retry, auto-disable
- **Shared types:** `/Users/jhigh/agency-access-platform/packages/shared/src/types.ts:1416-1541` — all webhook Zod schemas
- **DB schema:** `/Users/jhigh/agency-access-platform/apps/api/prisma/schema.prisma:172-237` — WebhookEndpoint, WebhookEvent, WebhookDelivery
- **Platform registry:** `/Users/jhigh/agency-access-platform/apps/api/src/services/connectors/registry.config.ts` — OAuth config, scopes, asset type mappings
- **Support runbook:** `/Users/jhigh/agency-access-platform/docs/features/webhooks-support-runbook.md` — escalation rules, triage flow
- **Public docs:** `/Users/jhigh/agency-access-platform/apps/docs/docs/automation/webhooks.md` — current webhook documentation
- **Leadsie V1 docs:** https://help.leadsie.com/article/43-webhooks — payload structure, asset types
- **Leadsie V2 docs:** https://help.leadsie.com/article/128-whats-the-difference-between-webhook-v1-and-v2 — V2 enhancements, field changes
- **APP_OVERVIEW:** `/Users/jhigh/agency-access-platform/docs/APP_OVERVIEW.md:1004` — currently says "Not implemented (planned)" — needs update

### Competitive Intelligence

- **Leadsie V2 payload** adds: `platform`, `statusLastCheckedAt`, `linkToAsset`, `assignedUsers[]`, `connectedAccount{}`, `platformPermissionsGranted[]`, `accessLevel`, `notes`, Google Business Profile fields
- **Leadsie V2 removes**: `isSuccess` (→ `connectionStatus`), `message` (→ `notes`), `inviteSentTo` (→ `connectedAccount`)
- **Leadsie limitation**: No documented HMAC signatures, no secret rotation, no retry documentation, no delivery history, no admin tools — all areas where AuthHub is already superior
