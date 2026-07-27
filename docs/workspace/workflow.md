# Workflow

## 1. Orient

- Read `AGENTS.md`, `docs/workspace/status.md`, and the relevant source-map row.
- Inspect branch, working tree, recent history, and the exact files or live surface in scope.
- Separate confirmed facts, observed evidence, assumptions, and open decisions.

## 2. Define the work

- Restate the outcome and smallest safe scope.
- Identify the authoritative source and appropriate verification before editing.
- Check the approval gate below. If a decision would materially alter scope or external state, get approval first.

## 3. Execute

- Preserve unrelated changes.
- For behavior changes, follow red → green → refactor unless an allowed exception applies.
- Use shared contracts and existing patterns; do not weaken auth, ownership, audit, token-storage, or error-handling rules.
- Keep plans and status honest: do not mark inferred or unverified work complete.

## 4. Verify

Use the smallest checks that prove the claim, expanding with risk:

- Knowledge work: trace claims to current sources, check dates/conflicts, and identify unsupported conclusions.
- Code: focused tests, then relevant typecheck/lint/build; inspect the diff and run `git diff --check`.
- Database/API: verify schema, migrations, ownership/auth behavior, response contracts, and failure paths.
- UI: focused component/proxy tests and, when material, the real browser flow at relevant sizes.
- Production: confirm deployment/log/health/live behavior and monitoring; local success alone is insufficient.

Report checks that failed, were skipped, or could not run.

## 5. Handoff

- State the outcome first.
- List material files or surfaces changed.
- Report verification evidence.
- Call out remaining risks, contradictions, and the next decision or action.
- Update `docs/workspace/status.md` only when the user asks or the scoped work explicitly includes status maintenance.

## Approval gate

Approval is required before:

- deploying, publishing, sending external messages, or changing a public/live service;
- changing production environment variables, infrastructure, data, or database schema;
- destructive or difficult-to-reverse actions, including deleting data or discarding work;
- spending money, starting paid services, or changing billing;
- entering, rotating, moving, or exposing sensitive credentials beyond an already approved local setup;
- committing, pushing, opening/merging a PR, or staging unrelated files;
- choosing a new product direction, priority, deadline, metric, or scope not already authorized.

No additional approval is needed for read-only inspection, local research, proportionate tests, or reversible scoped local edits explicitly requested by the user.
