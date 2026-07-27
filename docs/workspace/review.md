# Review

## Review standard

Review the result against the requested outcome, the authority order, and observable evidence. Separate hard failures from softer notes.

### Hard failures

- The result contradicts a current user instruction or higher-authority source.
- A security invariant is weakened: token storage, auth, tenant ownership, OAuth state, audit logging, or secret handling.
- A behavior change lacks a failing-first test without a documented exception.
- An API response, error, route, shared type, or database contract is silently broken.
- Unrelated work is overwritten, reverted, staged, or included.
- Completion is claimed without appropriate verification.
- An approval-required action occurred without approval.

### Review notes

- Stale or conflicting documentation.
- Missing owner, deadline, metric, evidence, or rollback path.
- Verification that is adequate locally but not yet confirmed in production.
- Maintainability, usability, accessibility, performance, or clarity improvements that do not block the requested outcome.

## Knowledge-work checklist

- Are factual claims traceable to an authoritative and sufficiently current source?
- Are observation, inference, recommendation, and decision clearly distinguished?
- Were contradictory sources named and resolved, or left visibly open?
- Are priorities confirmed rather than inferred from filenames or activity?
- Is anything important missing or hard to locate?

## Engineering checklist

- Does the change solve the requested behavior at the narrowest sensible scope?
- Are tests descriptive, focused, and passing?
- Are auth, ownership, token, audit, and error contracts preserved?
- Are public routes, environment changes, and schema changes handled in all required places?
- Does the working-tree diff contain only intended changes?

## Handoff checklist

- Outcome and user impact.
- Files/surfaces changed.
- Commands or live checks run and their results.
- Known gaps, contradictions, risks, and unverified assumptions.
- Approval needed for any proposed next action.
