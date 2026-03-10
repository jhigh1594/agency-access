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
