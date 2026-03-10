# Client Detail Platform Status Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a platform-group-first status board to the client detail page so agency owners can see requested platform groups, progress like `4/5 connected`, and expandable product-level status without losing request history.

**Architecture:** Keep the existing client detail route and tabs, but extend `ClientDetailResponse` with an additive `platformGroups` collection derived on the backend from access request history plus fulfillment/progress semantics. Render a new `Requested Access` board at the top of the overview tab, then keep the current request list below it as secondary content.

**Tech Stack:** Next.js App Router, React, TypeScript, Fastify, Prisma, Vitest, React Testing Library, shared types in `@agency-platform/shared`

---

### Task 1: Add Shared Client Detail Platform Status Types

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/__tests__/types.test.ts`

**Step 1: Write the failing test**

Add a test case in `packages/shared/src/__tests__/types.test.ts` that asserts the new client detail platform-group types are exported and accept a platform-group status payload.

```ts
it('exports client detail platform group types', async () => {
  const shared = await import('../index');

  expect(shared).toHaveProperty('ClientDetailPlatformGroupStatusSchema');
  expect(shared.ClientDetailPlatformGroupStatusSchema.parse('partial')).toBe('partial');
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/shared && npm test src/__tests__/types.test.ts`

Expected: FAIL because the schema/type export does not exist yet.

**Step 3: Write minimal implementation**

In `packages/shared/src/types.ts`, add additive types alongside the existing client detail contracts:

```ts
export const ClientDetailPlatformGroupStatusSchema = z.enum([
  'connected',
  'partial',
  'pending',
  'expired',
  'revoked',
  'needs_follow_up',
]);

export const ClientDetailProductStatusSchema = z.enum([
  'connected',
  'pending',
  'selection_required',
  'no_assets',
  'expired',
  'revoked',
]);

export interface ClientDetailPlatformProduct {
  product: string;
  status: z.infer<typeof ClientDetailProductStatusSchema>;
  note?: string;
  latestRequestId?: string;
}

export interface ClientDetailPlatformGroup {
  platformGroup: Platform;
  status: z.infer<typeof ClientDetailPlatformGroupStatusSchema>;
  fulfilledCount: number;
  requestedCount: number;
  latestRequestId?: string;
  latestRequestName?: string;
  latestRequestedAt?: Date;
  products: ClientDetailPlatformProduct[];
}
```

Update `ClientDetailResponse` to include:

```ts
platformGroups: ClientDetailPlatformGroup[];
```

Then export the new schemas and types from `packages/shared/src/index.ts`.

**Step 4: Run test to verify it passes**

Run: `cd packages/shared && npm test src/__tests__/types.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/src/index.ts packages/shared/src/__tests__/types.test.ts
git commit -m "feat: add client detail platform status shared types"
```

### Task 2: Add Backend Aggregation For Platform-Group Status

**Files:**
- Modify: `apps/api/src/services/client.service.ts`
- Test: `apps/api/src/services/__tests__/client.service.test.ts`

**Step 1: Write the failing test**

Add focused unit tests around `getClientDetail` in `apps/api/src/services/__tests__/client.service.test.ts`.

Test 1 should verify grouped aggregation:

```ts
it('aggregates client detail into platform groups with progress and product statuses', async () => {
  vi.mocked(mockPrisma.client.findUnique).mockResolvedValue({
    id: 'client-1',
    agencyId: 'agency-1',
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    accessRequests: [
      {
        id: 'request-1',
        clientName: 'Acme',
        status: 'partial',
        createdAt: new Date('2026-03-08T00:00:00.000Z'),
        authorizedAt: new Date('2026-03-08T01:00:00.000Z'),
        platforms: { google: ['google_ads', 'ga4'] },
        connection: {
          id: 'connection-1',
          status: 'active',
          grantedAssets: {
            google_ads: { adAccounts: [{ id: '1', name: 'Main' }] },
          },
          authorizations: [{ platform: 'google', status: 'active' }],
        },
      },
    ],
  } as any);

  const result = await clientService.getClientDetail({
    clientId: 'client-1',
    agencyId: 'agency-1',
  });

  expect(result?.platformGroups).toEqual([
    expect.objectContaining({
      platformGroup: 'google',
      status: 'partial',
      fulfilledCount: 1,
      requestedCount: 2,
      products: expect.arrayContaining([
        expect.objectContaining({ product: 'google_ads', status: 'connected' }),
        expect.objectContaining({ product: 'ga4', status: 'selection_required' }),
      ]),
    }),
  ]);
});
```

Test 2 should verify revoked or expired groups are surfaced correctly from request/connection state.

**Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test src/services/__tests__/client.service.test.ts`

Expected: FAIL because `platformGroups` is missing and the service does not aggregate group/product status.

**Step 3: Write minimal implementation**

In `apps/api/src/services/client.service.ts`:

1. Add local helper types and helpers near the client detail section:

```ts
interface ClientDetailPlatformGroupSummary {
  platformGroup: string;
  status: 'connected' | 'partial' | 'pending' | 'expired' | 'revoked' | 'needs_follow_up';
  fulfilledCount: number;
  requestedCount: number;
  latestRequestId?: string;
  latestRequestName?: string;
  latestRequestedAt?: Date;
  products: Array<{
    product: string;
    status: 'connected' | 'pending' | 'selection_required' | 'no_assets' | 'expired' | 'revoked';
    note?: string;
    latestRequestId?: string;
  }>;
}
```

2. Reuse existing ideas from `access-request.service.ts`:
- flatten requested products by group
- inspect `connection.authorizations`
- inspect `connection.grantedAssets`
- map unresolved reasons to product statuses:
  - `selection_required` -> `selection_required`
  - `no_assets` -> `no_assets`

3. Add an internal aggregator such as:

```ts
function buildClientDetailPlatformGroups(
  accessRequests: Array<...>
): ClientDetailPlatformGroupSummary[] { ... }
```

4. Inside `getClientDetail`, compute:

```ts
const platformGroups = buildClientDetailPlatformGroups(client.accessRequests);
```

5. Return `platformGroups` in the response while preserving existing `stats`, `accessRequests`, and `activity`.

Recommended status derivation order:
- all requested products connected -> `connected`
- any revoked product or revoked connection with prior fulfillment -> `revoked`
- any unresolved product plus some fulfilled -> `partial`
- any unresolved `no_assets` or `selection_required` that should stand out -> `needs_follow_up`
- latest request expired with no superseding fulfillment -> `expired`
- otherwise requested but not fulfilled -> `pending`

Keep the first implementation simple and deterministic; do not introduce a new persistence model.

**Step 4: Run test to verify it passes**

Run: `cd apps/api && npm test src/services/__tests__/client.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/services/client.service.ts apps/api/src/services/__tests__/client.service.test.ts
git commit -m "feat: aggregate client detail platform group statuses"
```

### Task 3: Add A Client Detail Requested Access Board

**Files:**
- Create: `apps/web/src/components/client-detail/RequestedAccessBoard.tsx`
- Create: `apps/web/src/components/client-detail/__tests__/requested-access-board.test.tsx`
- Modify: `apps/web/src/components/client-detail/index.ts`
- Modify: `apps/web/src/components/client-detail/__tests__/client-detail-surface.design.test.tsx`

**Step 1: Write the failing test**

Create `apps/web/src/components/client-detail/__tests__/requested-access-board.test.tsx` with two behaviors:

1. it renders platform-group progress and status
2. it expands to show product-level rows

```tsx
it('renders platform-group progress and expands product details', async () => {
  render(
    <RequestedAccessBoard
      platformGroups={[
        {
          platformGroup: 'google',
          status: 'partial',
          fulfilledCount: 4,
          requestedCount: 5,
          latestRequestId: 'request-1',
          latestRequestName: 'Q1 access refresh',
          latestRequestedAt: new Date('2026-03-08T00:00:00.000Z'),
          products: [
            { product: 'google_ads', status: 'connected' },
            { product: 'ga4', status: 'connected' },
            { product: 'merchant_center', status: 'no_assets', note: 'No assets found' },
          ],
        },
      ]}
    />
  );

  expect(screen.getByText(/4\\/5 connected/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /expand google details/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /expand google details/i }));

  expect(screen.getByText(/merchant center/i)).toBeInTheDocument();
  expect(screen.getByText(/no assets found/i)).toBeInTheDocument();
});
```

Also update the design-surface test list so the new component is checked for palette/shadow compliance.

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test src/components/client-detail/__tests__/requested-access-board.test.tsx`

Expected: FAIL because the component does not exist yet.

**Step 3: Write minimal implementation**

Create `RequestedAccessBoard.tsx` with:
- board heading: `Requested Access`
- one row per platform group
- `StatusBadge` mapping:
  - `connected` -> `active`
  - `partial` or `needs_follow_up` -> `pending` or custom text badge if needed
  - `expired` -> `expired`
  - `revoked` -> `revoked`
  - `pending` -> `pending`
- explicit progress label:

```tsx
<p className="text-sm font-medium text-foreground">
  {group.fulfilledCount}/{group.requestedCount} connected
</p>
```

- explicit expand/collapse button using `aria-expanded`
- compact product rows inside expanded content
- optional note text per product

Suggested component shape:

```tsx
interface RequestedAccessBoardProps {
  platformGroups: ClientDetailPlatformGroup[];
}
```

Export it from `apps/web/src/components/client-detail/index.ts`.

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/client-detail/__tests__/requested-access-board.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/client-detail/RequestedAccessBoard.tsx apps/web/src/components/client-detail/__tests__/requested-access-board.test.tsx apps/web/src/components/client-detail/index.ts apps/web/src/components/client-detail/__tests__/client-detail-surface.design.test.tsx
git commit -m "feat: add requested access board to client detail"
```

### Task 4: Integrate The Requested Access Board Into The Overview Tab

**Files:**
- Modify: `apps/web/src/components/client-detail/OverviewTab.tsx`
- Modify: `apps/web/src/components/client-detail/ClientTabs.tsx`
- Modify: `apps/web/src/app/(authenticated)/clients/[id]/page.tsx`
- Create: `apps/web/src/components/client-detail/__tests__/overview-tab.test.tsx`

**Step 1: Write the failing test**

Create a focused test for `OverviewTab` that verifies:
- `Requested Access` renders above the request list
- the request list still renders beneath it

```tsx
it('shows requested access summary before access request history', () => {
  render(
    <OverviewTab
      platformGroups={[
        {
          platformGroup: 'meta',
          status: 'connected',
          fulfilledCount: 1,
          requestedCount: 1,
          products: [{ product: 'meta_ads', status: 'connected' }],
        },
      ]}
      accessRequests={[
        {
          id: 'request-1',
          name: 'Initial setup',
          platforms: ['meta_ads'],
          status: 'completed',
          createdAt: new Date('2026-03-08T00:00:00.000Z'),
          connectionStatus: 'active',
        },
      ]}
    />
  );

  const requestedAccess = screen.getByText(/requested access/i);
  const accessRequests = screen.getByText(/access requests/i);

  expect(requestedAccess.compareDocumentPosition(accessRequests)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test src/components/client-detail/__tests__/overview-tab.test.tsx`

Expected: FAIL because `OverviewTab` does not accept `platformGroups` yet.

**Step 3: Write minimal implementation**

1. Update `OverviewTabProps`:

```tsx
interface OverviewTabProps {
  platformGroups: ClientDetailPlatformGroup[];
  accessRequests: ClientAccessRequest[];
}
```

2. Render the board at the top of `OverviewTab`:

```tsx
<div className="space-y-6">
  <RequestedAccessBoard platformGroups={platformGroups} />
  <section>{/* existing request history UI */}</section>
</div>
```

3. Thread `platformGroups` through:
- `ClientTabs`
- client detail page route

Use the existing fetched `ClientDetailResponse` data directly.

Do not remove request filtering or activity behavior in this step.

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/client-detail/__tests__/overview-tab.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/client-detail/OverviewTab.tsx apps/web/src/components/client-detail/ClientTabs.tsx apps/web/src/app/'(authenticated)'/clients/[id]/page.tsx apps/web/src/components/client-detail/__tests__/overview-tab.test.tsx
git commit -m "feat: surface platform status board in client overview"
```

### Task 5: Verify End-To-End Type Safety And Affected Tests

**Files:**
- Modify as needed based on failures from prior tasks

**Step 1: Run targeted package tests**

Run:

```bash
cd packages/shared && npm test src/__tests__/types.test.ts
cd /Users/jhigh/agency-access-platform/apps/api && npm test src/services/__tests__/client.service.test.ts
cd /Users/jhigh/agency-access-platform/apps/web && npm test src/components/client-detail/__tests__/requested-access-board.test.tsx
cd /Users/jhigh/agency-access-platform/apps/web && npm test src/components/client-detail/__tests__/overview-tab.test.tsx
```

Expected: PASS

**Step 2: Run broader safety checks**

Run:

```bash
cd /Users/jhigh/agency-access-platform && npm run typecheck
cd /Users/jhigh/agency-access-platform && npm run lint
```

Expected: PASS

If these fail because of unrelated workspace issues, record exactly which failures are unrelated and stop there rather than editing unrelated files.

**Step 3: Commit**

```bash
git add .
git commit -m "chore: verify client detail platform status rollout"
```

Use judgment here:
- if unrelated dirty changes make `git add .` unsafe, add only the files from this plan

## Notes For The Implementer
- Reuse existing progress semantics from `access-request.service.ts` rather than inventing a second interpretation model.
- Keep the new API contract additive.
- Prefer a dense operational layout over large decorative cards.
- Do not collapse request history into the new board; preserve it as secondary context.
- Maintain the repository’s design-system compliance test expectations.

## Manual QA Checklist
- Open a client with one fully connected platform group and confirm the board shows `1/1 connected`.
- Open a client with a mixed Google request and confirm the board shows a partial status plus product-level unresolved detail on expand.
- Confirm the request history still renders and links to request detail pages.
- Confirm expand/collapse works on mobile-width layouts without hiding progress text.

Plan complete and saved to `docs/plans/2026-03-10-client-detail-platform-status.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
