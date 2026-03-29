# Testing Patterns

**Analysis Date:** 2026-03-29

## Test Framework

**Runner:**
- **Frontend**: Vitest with `@vitejs/plugin-react`
- **Backend**: Vitest with Node environment
- **Shared**: Jest with `ts-jest` preset

**Config Files:**
- `apps/web/vitest.config.ts` - jsdom environment, React plugin
- `apps/api/vitest.config.ts` - Node environment
- `apps/web/vitest.setup.ts` - Test setup with global mocks
- `packages/shared/jest.config.js` - Jest configuration for shared types

**Assertion Library:**
- **Built-in**: Vitest/Jest expect assertions
- **React Testing Library**: `@testing-library/react` for component testing

**Run Commands:**
```bash
# From root - runs all workspace tests
npm run test

# Frontend tests
cd apps/web && npm run test              # Watch mode
npm run test:run                         # Single run

# Backend tests
cd apps/api && npm run test              # Watch mode
npm run test:run                         # Single run
npm run test:ui                          # Vitest UI mode

# Shared package tests
cd packages/shared && npm run test       # Run tests
npm run test:watch                       # Watch mode
npm run test:coverage                    # Coverage report
```

## Test File Organization

**Location:**
- **Co-located**: Tests live in `__tests__/` directories next to source files
- **Pattern**: Each module has its own `__tests__/` subdirectory

**Naming:**
- **Unit tests**: `*.test.ts` or `*.test.tsx` (preferred)
- **Spec tests**: `*.spec.ts` (less common)
- **Design tests**: `*.design.test.tsx` or `*.design.test.ts` (visual/testing design system)
- **Behavior tests**: `*.behavior.test.tsx` or `*.behavior.test.ts` (interaction testing)

**Structure:**
```
apps/
  web/
    src/
      contexts/
        access-request-context.tsx
        __tests__/
          access-request-context.test.tsx
      app/
        (authenticated)/
          dashboard/
            page.tsx
            __tests__/
              page.design.test.tsx
              page.behavior.test.tsx
  api/
    src/
      lib/
        response.ts
        __tests__/
          response.test.ts
      routes/
        client-auth/
          assets.ts
          __tests__/
            assets.google.test.ts
            assets.security.test.ts
packages/
  shared/
    src/
      types.ts
      __tests__/
        types.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

describe('ComponentName/FeatureName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('functionName', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = { ... };

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Patterns:**
- **Setup**: `beforeEach()` hooks to clear mocks and reset state
- **Nesting**: Use nested `describe()` blocks to group related tests
- **Test naming**: `should [expected outcome] when [condition/state]`
- **AAA pattern**: Arrange, Act, Assert structure in test body
- **Teardown**: Rarely needed due to test isolation, but `afterEach()` available if needed

**Assertion patterns:**
```typescript
// Equality
expect(result).toEqual(expected);
expect(result.state).toBe(value);

// Presence
expect(function).toHaveBeenCalled();
expect(function).toHaveBeenCalledWith(arg1, arg2);

// Negation
expect(result).not.toBeNull();
expect(error).toBeUndefined();

// Matching
expect(payload).toMatchObject({ id: '123' });
expect(array).toHaveLength(3);
expect(string).toMatch(/regex/);
```

## Mocking

**Framework:** Vitest built-in mocking (vi.*)

**Patterns:**
```typescript
// Module mocking
vi.mock('@/lib/api/access-requests');

// Mock implementation
vi.mocked(accessRequestsApi.createAccessRequest).mockResolvedValue({
  data: mockAccessRequest,
});

// Mock return value
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Clear mocks
beforeEach(() => {
  vi.clearAllMocks();
});
```

**Global mocks** (from `vitest.setup.ts`):
```typescript
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user_123',
    getToken: vi.fn(() => Promise.resolve('mock-token')),
  }),
  useUser: () => ({
    user: { id: 'user_123' },
  }),
}));
```

**What to Mock:**
- External API calls (via vi.mocked)
- Third-party libraries (Next.js router, Clerk auth)
- Database queries (in service layer tests)
- Time-dependent operations (vi.useFakeTimers if needed)

**What NOT to Mock:**
- Pure functions (test them directly)
- UI components (use Testing Library to render)
- Business logic (test the actual implementation)

**Mock verification:**
```typescript
// Check if called
expect(accessRequestsApi.createAccessRequest).toHaveBeenCalled();

// Check call count
expect(mockPush).toHaveBeenCalledTimes(1);

// Check call arguments
const callArgs = vi.mocked(api.function).mock.calls[0];
const [payload] = callArgs;
expect(payload).toMatchObject({ id: '123' });
```

## Fixtures and Factories

**Test Data:**
```typescript
// Inline fixtures (common pattern)
const mockAccessRequest = {
  id: 'request-123',
  agencyId: 'agency-123',
  clientId: 'client-123',
  clientName: 'Test Client',
  clientEmail: 'test@example.com',
  platforms: [...],
  status: 'pending' as const,
  uniqueToken: 'abc-def-ghi',
  expiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

**Location:**
- Inline within test files (preferred)
- No centralized fixture directory detected
- Each test file defines its own mock data

**Helper functions:**
```typescript
// Wrapper for context providers
const wrapper = ({ children }: { children: ReactNode }) => (
  <AccessRequestProvider agencyId="agency-123">{children}</AccessRequestProvider>
);

// Render hooks with providers
const { result } = renderHook(() => useAccessRequest(), { wrapper });
```

**Factory pattern:** Not extensively used, but inline object creation is common

## Coverage

**Requirements:**
- **Shared package**: 80% minimum (branches, functions, lines, statements)
- **Backend**: 80% minimum (90% for OAuth/token paths)
- **Frontend**: 70% components, 90% utils/hooks

**View Coverage:**
```bash
# Shared package (Jest)
cd packages/shared && npm run test:coverage

# Vitest coverage (add --coverage flag)
cd apps/web && npx vitest --coverage
cd apps/api && npx vitest --coverage
```

**Coverage configuration** (from jest.config.js):
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

**Current state:** 243 test files across 469 source files (~52% test-to-source ratio)

## Test Types

**Unit Tests:**
- **Scope**: Individual functions, hooks, utilities
- **Approach**: Isolated logic, mocked dependencies
- **Examples**: `response.test.ts`, `access-request-context.test.tsx`
- **Focus**: Business logic, state management, data transformation

**Integration Tests:**
- **Scope**: Multiple components or services working together
- **Approach**: Real database connections (for API tests), real service interactions
- **Examples**: Route tests, middleware tests
- **Focus**: API endpoints, service orchestration, OAuth flows

**E2E Tests:**
- **Framework**: Not detected in current codebase
- **Status**: Manual testing via `dev-browser` skill per CLAUDE.md
- **Note**: Frontend changes require visual testing before completion

**Design Tests:**
- **Purpose**: Visual regression and design system validation
- **Naming**: `*.design.test.tsx`
- **Focus**: Component styling, layout, visual tokens

**Behavior Tests:**
- **Purpose**: User interaction and behavior validation
- **Naming**: `*.behavior.test.tsx`
- **Focus**: User flows, event handling, state changes

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operations', async () => {
  // Use async/await
  await act(async () => {
    await result.current.submitRequest();
  });

  // Wait for assertions
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/success');
  });
});
```

**Error Testing:**
```typescript
it('should handle API errors', async () => {
  // Mock error response
  vi.mocked(api.createAccessRequest).mockResolvedValue({
    error: {
      code: 'NETWORK_ERROR',
      message: 'Failed to create access request',
    },
  });

  // Act and assert
  await act(async () => {
    await result.current.submitRequest();
  });

  expect(result.current.state.error).toBe('Failed to create access request');
});
```

**React Hook Testing:**
```typescript
const { result } = renderHook(() => useAccessRequest(), { wrapper });

// Update state via act
act(() => {
  result.current.updateClient(client);
});

// Assert state changes
expect(result.current.state.client).toEqual(client);
```

**Component Testing:**
```typescript
const { getByText, getByRole } = render(<Component />);

// User interactions
fireEvent.click(getByRole('button'));

// Assertions
expect(getByText('Success')).toBeInTheDocument();
```

**Security Testing:**
- Dedicated security test files: `assets.security.test.ts`
- CSRF protection tests
- Token validation tests
- Authentication flow tests

---

*Testing analysis: 2026-03-29*
