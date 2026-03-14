# Meta Business Portfolio Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Meta Manage Assets modal open quickly and ensure the Portfolio Manager dropdown always shows either the last known portfolios or a clear refresh error instead of a blank control.

**Architecture:** Use cached connection metadata from `/agency-platforms/available` to hydrate the modal immediately, then refresh the portfolio list in the background. On the backend, stop collapsing Meta Graph failures into `businesses: []` so the frontend can distinguish "no portfolios" from "refresh failed" and avoid overwriting valid cached metadata with empties.

**Tech Stack:** Next.js 16, React 19, TanStack Query, Fastify, Vitest, Meta Graph API

---

### Task 1: Lock In Backend Failure Semantics

**Files:**
- Modify: `apps/api/src/services/connectors/__tests__/meta.connector.test.ts`
- Modify: `apps/api/src/routes/__tests__/meta-assets.routes.test.ts`
- Modify: `apps/api/src/services/connectors/meta.ts`
- Modify: `apps/api/src/routes/agency-platforms/assets.routes.ts`

**Step 1: Write the failing connector test**

Add a test that proves Meta Graph failures are surfaced instead of converted into an empty `businesses` list.

```ts
it('throws when Meta business discovery fails', async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: false,
    text: async () => 'OAuthException',
  } as Response);

  await expect(connector.getBusinessAccounts(accessToken)).rejects.toThrow(
    /Failed to fetch business accounts/
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test -- --run src/services/connectors/__tests__/meta.connector.test.ts`

Expected: FAIL because `getBusinessAccounts()` currently catches the error and returns `{ businesses: [], hasAccess: false }`.

**Step 3: Write the failing route test**

Add a route test showing `GET /agency-platforms/meta/business-accounts?refresh=true` returns an error status when the Meta fetch fails, instead of a success payload with no businesses.

```ts
it('returns fetch failure when refreshed Meta portfolio discovery fails', async () => {
  mockAgencyPlatformService.getConnection.mockResolvedValue({
    data: { id: 'conn-1', metadata: { metaBusinessAccounts: { businesses: [{ id: 'biz-1', name: 'Cached Biz' }], hasAccess: true } } },
    error: null,
  });
  mockAgencyPlatformService.getValidToken.mockResolvedValue({ data: 'token', error: null });
  mockMetaConnectorInstance.getBusinessAccounts.mockRejectedValue(new Error('OAuthException'));

  const response = await app.inject({
    method: 'GET',
    url: '/agency-platforms/meta/business-accounts?agencyId=agency-1&refresh=true',
  });

  expect(response.statusCode).toBe(500);
  expect(response.json().error.code).toBe('FETCH_FAILED');
});
```

**Step 4: Run test to verify it fails**

Run: `cd apps/api && npm test -- --run src/routes/__tests__/meta-assets.routes.test.ts`

Expected: FAIL because the current connector swallows the failure.

**Step 5: Implement the minimal backend change**

- Remove the `try/catch` fallback in `apps/api/src/services/connectors/meta.ts` that returns an empty list on error.
- Keep pagination logic intact.
- Leave the route-level `try/catch` in `apps/api/src/routes/agency-platforms/assets.routes.ts` so the API returns `{ error: { code: 'FETCH_FAILED', ... } }`.
- Do not update cached `metaBusinessAccounts` metadata when the refresh throws.

**Step 6: Run backend tests**

Run:
- `cd apps/api && npm test -- --run src/services/connectors/__tests__/meta.connector.test.ts`
- `cd apps/api && npm test -- --run src/routes/__tests__/meta-assets.routes.test.ts`

Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/services/connectors/meta.ts apps/api/src/services/connectors/__tests__/meta.connector.test.ts apps/api/src/routes/agency-platforms/assets.routes.ts apps/api/src/routes/__tests__/meta-assets.routes.test.ts
git commit -m "fix: preserve Meta portfolio refresh errors"
```

### Task 2: Lock In Cached-First Modal Behavior

**Files:**
- Modify: `apps/web/src/components/__tests__/meta-unified-settings.test.tsx`
- Modify: `apps/web/src/components/meta-unified-settings.tsx`

**Step 1: Write the failing modal test for fast initial render**

Add a test that proves the modal renders from cached connection metadata without waiting for the live Meta refresh to finish.

```tsx
it('renders the stored portfolio immediately while refresh is still pending', async () => {
  const deferredBusinesses = new Promise(() => {});

  vi.stubGlobal('fetch', vi.fn(async (input) => {
    const url = String(input);
    if (url.includes('/agency-platforms/meta/business-accounts')) {
      return deferredBusinesses as never;
    }
    if (url.includes('/agency-platforms/available')) {
      return {
        ok: true,
        json: async () => ({
          data: [{
            platform: 'meta',
            connected: true,
            metadata: {
              selectedBusinessId: 'biz_1',
              selectedBusinessName: 'Business One',
              metaBusinessAccounts: {
                businesses: [{ id: 'biz_1', name: 'Business One' }],
                hasAccess: true,
              },
            },
          }],
        }),
      } as Response;
    }
    return settingsResponse as Response;
  }));

  renderWithQueryClient(<MetaUnifiedSettings agencyId="agency-1" />);

  expect(screen.getByText('Meta Business Portfolio')).toBeInTheDocument();
  expect(screen.getByDisplayValue('biz_1')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test -- --run src/components/__tests__/meta-unified-settings.test.tsx`

Expected: FAIL because the current component gates the whole modal on `isLoadingBusinesses`.

**Step 3: Write the failing modal test for blank-dropdown prevention**

Add a test that proves a stored selection remains visible even if the live refresh fails or returns no matching options.

```tsx
it('keeps the stored portfolio visible when refresh fails', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input) => {
    const url = String(input);
    if (url.includes('/agency-platforms/meta/business-accounts')) {
      return {
        ok: false,
        json: async () => ({
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch Meta business accounts' },
        }),
      } as Response;
    }
    if (url.includes('/agency-platforms/available')) {
      return cachedConnectionResponse as Response;
    }
    return settingsResponse as Response;
  }));

  renderWithQueryClient(<MetaUnifiedSettings agencyId="agency-1" />);

  await waitFor(() => {
    expect(screen.getByText(/showing last synced portfolios/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Business One/ })).toBeInTheDocument();
  });
});
```

**Step 4: Run test to verify it fails**

Run: `cd apps/web && npm test -- --run src/components/__tests__/meta-unified-settings.test.tsx`

Expected: FAIL because the current component throws on refresh failure and renders a blank select when the stored value is missing from the options array.

**Step 5: Implement the minimal frontend change**

- In `apps/web/src/components/meta-unified-settings.tsx`, derive `cachedBusinesses` from `connectionData.metadata.metaBusinessAccounts?.businesses`.
- Seed the select options from cached businesses immediately.
- Stop using `isLoadingBusinesses` as a global modal blocker; only block on asset settings if needed.
- Run the Meta refresh as a background query and merge refreshed businesses into local options when it succeeds.
- If refresh fails, keep cached businesses and show a small inline warning such as `Showing last synced portfolios. Couldn't refresh from Meta just now.`
- If a stored `selectedBusinessId` is not present in either cached or refreshed businesses, inject a fallback option using `selectedBusinessName` so the control never renders blank.

**Step 6: Run web tests**

Run: `cd apps/web && npm test -- --run src/components/__tests__/meta-unified-settings.test.tsx`

Expected: PASS

**Step 7: Commit**

```bash
git add apps/web/src/components/meta-unified-settings.tsx apps/web/src/components/__tests__/meta-unified-settings.test.tsx
git commit -m "fix: hydrate Meta portfolio modal from cached data"
```

### Task 3: Tighten API Error Messaging in the Modal

**Files:**
- Modify: `apps/web/src/components/meta-unified-settings.tsx`
- Optional reference: `apps/web/src/lib/api/extract-error.ts`

**Step 1: Write the failing test**

Extend the existing modal test to assert the inline warning uses the backend message when available.

```tsx
expect(screen.getByText(/failed to fetch meta business accounts/i)).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test -- --run src/components/__tests__/meta-unified-settings.test.tsx`

Expected: FAIL because the component currently throws a generic `Failed to fetch businesses`.

**Step 3: Implement the minimal change**

- Parse the backend error payload instead of throwing a generic message.
- Prefer `extractApiErrorMessage()` if it fits cleanly.
- Keep the warning inline near the portfolio selector instead of replacing the modal.

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test -- --run src/components/__tests__/meta-unified-settings.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/meta-unified-settings.tsx apps/web/src/components/__tests__/meta-unified-settings.test.tsx
git commit -m "fix: surface Meta portfolio refresh warnings"
```

### Task 4: Verification

**Files:**
- No new files

**Step 1: Run targeted backend verification**

Run:
- `cd apps/api && npm test -- --run src/services/connectors/__tests__/meta.connector.test.ts`
- `cd apps/api && npm test -- --run src/routes/__tests__/meta-assets.routes.test.ts`
- `cd apps/api && npm run typecheck`

Expected: PASS

**Step 2: Run targeted frontend verification**

Run:
- `cd apps/web && npm test -- --run src/components/__tests__/meta-unified-settings.test.tsx`

Expected: PASS

**Step 3: Run broader connection-page verification if feasible**

Run:
- `cd apps/web && npm test -- --run src/app/(authenticated)/connections/__tests__/page.test.tsx`

Expected: PASS or known unrelated failures documented

**Step 4: Record any unrelated failures**

If `apps/web` typecheck still fails due unrelated pre-existing errors, document exact files and do not fold them into this fix.

**Step 5: Commit verification notes if needed**

```bash
git status --short
```
