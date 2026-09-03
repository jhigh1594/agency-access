# Technical Decisions

Record significant technical choices so future sessions (and humans) understand why something was done.

**When to add an entry:** Architecture choices, technology picks, approach tradeoffs, or anything that would be non-obvious to someone reading the code later.

**Format:** One DEC per decision. Newest first.

---

## Template (copy for new entries)

```markdown
### DEC-XXX: [Short title]
**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded | Deprecated

**Context:** [What situation required a decision?]
**Decision:** [What was decided?]
**Rationale:** [Why this choice?]

**Alternatives considered:**
1. [Alternative A] — why rejected
2. [Alternative B] — why rejected

**Consequences:**
- Positive: [benefits]
- Negative: [tradeoffs]
```

---

## Decisions

### DEC-002: Business selection persisted by the creation service, not save-assets
**Date:** 2026-09-03
**Status:** Accepted

**Context:** The Meta Business Portfolio creation flow (`meta-asset-creation.service.createBusiness`) must make the newly created business immediately usable by `grant-meta-access` in the same wizard pass. The frontend sends the business selection as extra fields on `save-assets`, but `saveAssetsSchema` is a plain `z.object` that strips unknown keys.

**Decision:** `createBusiness` persists the selection server-side into `PlatformAuthorization.metadata.meta.selection` (with `source: 'created'`) and merges the business into `discovery.availableBusinesses` at creation time. The frontend refetch of `/assets/meta_ads?businessId=` is UX only.

**Rationale:** `grant-meta-access` reads the business exclusively from `metadata.meta.selection.clientBusinessId` (assets.routes.ts). Persisting in the service keeps one source of truth and avoids widening `saveAssetsSchema` for a field only Meta business creation needs.

**Alternatives considered:**
1. Extend `saveAssetsSchema` to carry `selectedBusinessId` — rejected: widens a shared cross-platform schema for one platform's need and invites inconsistent states between the two writes.
2. Have the frontend pass the business id to `grant-meta-access` directly — rejected: the grant route's contract is server-side state; mixing client-supplied business ids weakens authorization scoping.

**Consequences:**
- Positive: one-pass UX (create → share) works with zero wizard changes; refetch re-stamping `source` from `'created'` to `'user_selection'` is harmless.
- Negative: two writers to `metadata.meta` (asset-discovery route and creation service); both must keep using the shared Zod schema for reads.

### DEC-001: Sentry Webhook Integration via Manual UI Setup
**Date:** 2026-03-10
**Status:** Accepted

**Context:** Attempted to set up Sentry webhook integration programmatically via the Sentry API to automatically send error alerts to the Cursor project for AI agent processing.

**Decision:** Use manual UI configuration for Sentry webhook integration instead of programmatic API setup.

**Rationale:** After extensive API exploration, discovered that Sentry's API doesn't allow direct creation of webhook integrations without an existing configured integration. The organization (authhub) has no existing integrations, sentry-apps, or alert rules. Creating integrations requires the Sentry UI or specific admin endpoints not available through the standard API.

**Alternatives considered:**
1. Continue trying different API endpoints — reached API limitations
2. Use Sentry CLI — not available in the environment
3. Wait for Sentry to add programmatic webhook support — delays implementation

**Consequences:**
- Positive: Allows immediate implementation with clear documentation
- Positive: Provides visibility into integration setup through UI
- Negative: Requires manual one-time setup in Sentry UI
- Negative: Cannot automate the initial integration creation

---

_(Add DEC-002, DEC-003, … here; newest first.)_
