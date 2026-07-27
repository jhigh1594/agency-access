# Preferences

## Collaboration

- Inspect the real repository, branch, dirty tree, configuration, and relevant live surface before acting.
- Execute concrete setup, repair, verification, and release tasks through the safe in-scope finish line.
- Keep changes narrow. Do not edit, revert, stage, or absorb unrelated work.
- State assumptions and uncertainty plainly; do not polish over contradictions.
- Prefer direct, plain-language summaries with evidence and actionable next steps.

## Planning and decisions

- Separate confirmed priorities from priorities inferred from plans, file activity, or uncommitted code.
- Treat plans as intent until activated or confirmed; compare them with current code and live state.
- When several logical changes could be committed, keep them atomic and ask which scope to publish.
- Do not invent owners, dates, metrics, customer evidence, or roadmap commitments.

## Engineering

- Follow test-driven development for behavior changes: failing test, implementation, refactor. Config, type-only, and styling-only work are exceptions.
- Reuse shared types and established API, error, auth, and connector helpers.
- Verify proportionately: focused tests first, then typecheck/lint/build or live checks as risk warrants.
- For public Next.js routes, verify Clerk allowlisting and focused proxy coverage.

## Handoffs

- Lead with the outcome, then verification, changed files, and unresolved risks.
- Distinguish a verified result from a recommendation or memory-derived claim.
- Flag missing, contradictory, stale, or hard-to-find information explicitly.
