# Agency Access Codex Workspace

This is the working repository and knowledge base for AuthHub, an agency client-access and onboarding product. Use it to research, plan, implement, review, and verify work without losing the distinction between current facts and historical plans.

Start with:

- `docs/workspace/context.md` — product and user context
- `docs/workspace/preferences.md` — collaboration preferences
- `docs/workspace/status.md` — current priorities, active work, and gaps
- `docs/workspace/source-map.md` — authority order and where facts live
- `docs/workspace/workflow.md` — inspect, execute, and verify loop
- `docs/workspace/review.md` — review and handoff standard

Current user instructions and approvals outrank every file. For current behavior, verify live state when available, then code, schema, configuration, and tests; do not treat an old plan or status document as proof.

Before claiming important work is complete, run checks proportionate to the change, inspect the resulting diff, and report failures or unverified assumptions. Preserve unrelated changes in the dirty worktree.

Get approval before deployments, production configuration/data/schema changes, destructive actions, spending, external communications, credential handling beyond approved local configuration, or git commit/push/PR actions. Also ask before making a product or scope decision that is not already authorized. Read-only inspection, research, and scoped local edits or tests explicitly requested by the user do not need a second approval.
