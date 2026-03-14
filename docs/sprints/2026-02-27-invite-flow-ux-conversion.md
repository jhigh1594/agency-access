# Sprint: Invite Flow UX Conversion (All 5 Recommendations)

- Date: 2026-02-27
- Status: Completed
- Owners: Web
- Scope: `/invite/[token]` core page and manual invite subflows for Beehiiv, Kit, Pinterest.

## Decision Log (Locked)

1. Scope includes invite core and all manual flows (Beehiiv, Kit, Pinterest).
2. Rollout is direct replace (no feature flag).
3. Desktop connect/manual states use two-column sticky rail layout.
4. Backend contracts and endpoint behavior remain unchanged.

## Architecture Approach

1. Keep API topology and response shapes unchanged.
2. Add invite-specific layout primitives (`InviteFlowShell`, `InviteStickyRail`) instead of changing creator `FlowShell`.
3. Move manual pages to shared progressive checklist engine (`ManualChecklistWizard`).
4. Implement reliability state model (`loading`, `delayed`, `timeout`, retry) for invite/manual entry points.
5. Preserve tokenized styling and existing design compliance guards.

## Milestones

### Milestone 1: UX Foundation + Progress Hierarchy
- `INVUX-001`, `INVUX-010`, `INVUX-011`, `INVUX-012`

### Milestone 2: Progressive Checklist + Sticky Action Rail
- `INVUX-020`, `INVUX-021`, `INVUX-022`, `INVUX-023`, `INVUX-024`

### Milestone 3: Reliability + Recovery UX
- `INVUX-030`, `INVUX-031`, `INVUX-032`

### Milestone 4: Verification + Mapping
- `INVUX-040`, `INVUX-041`, `INVUX-042`, `INVUX-043`

## Ordered Task Board

- [x] `INVUX-001` Create sprint artifact with locked decisions, architecture, milestones, risks, verification strategy.
- [x] `INVUX-010` Add invite-specific shell primitives (`InviteFlowShell`, `InviteStickyRail`).
- [x] `INVUX-011` Implement phase-based screen-real-estate policy (focused setup, split connect/manual desktop, stacked mobile).
- [x] `INVUX-012` Simplify progress hierarchy (single primary hierarchy per page; manual pages own checklist progress only).
- [x] `INVUX-020` Build shared progressive checklist engine (`ManualChecklistWizard`) with typed config model.
- [x] `INVUX-021` Migrate Beehiiv manual flow to progressive checklist.
- [x] `INVUX-022` Migrate Kit manual flow to progressive checklist.
- [x] `INVUX-023` Migrate Pinterest manual flow to shared checklist with Business ID constraints.
- [x] `INVUX-024` Add sticky action rail behavior with blocked/disabled reasons.
- [x] `INVUX-030` Implement delayed-loading and timeout UX in invite/manual entry points.
- [x] `INVUX-031` Add retryable fetch orchestration with cancellation.
- [x] `INVUX-032` Add reliability + manual-step telemetry events.
- [x] `INVUX-040` Update and extend automated tests for new progress/checklist/reliability behavior.
- [x] `INVUX-041` Update design compliance coverage for new invite flow files.
- [x] `INVUX-042` Refresh screenshot evidence script/artifacts (desktop/mobile, invite/manual, delayed/timeout).
- [x] `INVUX-043` Refresh MVP requirement mapping for recommendation-to-task traceability.

## Verification Strategy

1. Unit/component tests:
- `ManualChecklistWizard` step advancement, completion gating, callback behavior.
- `InviteStickyRail` render of progress and blocked reason.
- `useInviteRequestLoader` delayed/timeout/retry transitions.

2. Integration tests:
- Invite page invalid token, delayed/timeout/retry recovery, completion call behavior.
- Beehiiv/Kit/Pinterest manual flows step progression + completion endpoint invocation + redirect.

3. Visual/Responsive checks:
- Desktop split layouts for connect/manual states.
- Mobile stacked layout with fixed manual action bar.
- Screenshot evidence script scenarios include delayed + timeout states.

## Risks and Mitigations

1. Direct replace could shift interaction expectations.
Mitigation: preserve endpoint behavior/copy intent and validate with tests + screenshot evidence.

2. Shared checklist abstraction could hide platform nuance.
Mitigation: platform-specific step config content on top of shared wizard engine.

3. Timeout UX could fire on slow networks.
Mitigation: delayed intermediate state, explicit retry, support path, cancel in-flight requests.

## Review Findings Queue

1. `InviteFlowShell` now renders rail content in mobile split mode; duplicate rail sections are expected in jsdom tests and assertions should use `getAllByText` when matching rail strings.
2. Manual page `parseData` callbacks for `useInviteRequestLoader` must remain memoized (`useCallback`) to avoid rerender-fetch loops.

## Verification Log (2026-02-27)

- `cd apps/web && npm test -- 'src/components/flow/__tests__/manual-checklist-wizard.test.tsx' 'src/components/flow/__tests__/invite-sticky-rail.test.tsx' 'src/lib/query/__tests__/use-invite-request-loader.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx' 'src/app/invite/[token]/__tests__/manual-flows.test.tsx' 'src/app/__tests__/client-request-flow.design.test.ts'`: pass (15 tests).
- `cd apps/web && npm run typecheck`: pass.
- `cd apps/web && npm run evidence:client-request-flow`: pass.

## Evidence Artifacts (INVUX-042)

- Evidence directory: `docs/images/client-request-flow/2026-02-27`
- Total screenshots: `40`
- Added reliability screenshots:
  - `desktop-*-invite-delayed.png`
  - `desktop-*-invite-timeout.png`
  - `mobile-*-invite-delayed.png`
  - `mobile-*-invite-timeout.png`
