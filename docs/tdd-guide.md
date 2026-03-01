# TDD Guide (Test-Driven Development)

This guide provides detailed tutorial content for Test-Driven Development in this repository. For the mandatory rules and coverage targets, see [CLAUDE.md](../CLAUDE.md) — Test-Driven Development section.

## The TDD Cycle (Red-Green-Refactor)

1. **Red**: Write a failing test for the desired behavior
2. **Green**: Write the MINIMUM code to make the test pass
3. **Refactor**: Improve the code while keeping tests green
4. **Repeat** for each small piece of functionality

## TDD Workflow by Code Type

### Backend Services (`apps/api/src/services/`)

```typescript
// 1. First, create the test file: src/services/__tests__/my-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyService } from '../my-service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should validate platform authorization', async () => {
    // Arrange
    const token = 'valid-token';

    // Act
    const result = await service.verifyToken(token);

    // Assert
    expect(result).toBe(true);
  });

  it('should throw error for invalid token', async () => {
    await expect(service.verifyToken('invalid'))
      .rejects.toThrow('INVALID_TOKEN');
  });
});

// 2. Run the test - it WILL fail (Red)
// npm test src/services/__tests__/my-service.test.ts

// 3. Write MINIMUM code to pass (Green)
export class MyService {
  async verifyToken(token: string): Promise<boolean> {
    if (!token || token === 'invalid') {
      throw new Error('INVALID_TOKEN');
    }
    return true;
  }
}

// 4. Refactor if needed, keeping tests green
```

### Frontend Components (`apps/web/src/components/`)

```typescript
// 1. Write test first: components/__tests__/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should display user greeting', () => {
    render(<MyComponent name="Claude" />);
    expect(screen.getByText('Hello, Claude!')).toBeInTheDocument();
  });

  it('should show loading state while fetching', () => {
    render(<MyComponent name="Claude" loading />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});

// 2. Run test - it fails (Red)
// 3. Write minimal component (Green)
export function MyComponent({ name, loading }: { name: string; loading?: boolean }) {
  if (loading) return <div data-testid="loading-spinner">Loading...</div>;
  return <div>Hello, {name}!</div>;
}

// 4. Refactor as needed
```

### Shared Types (`packages/shared/src/`)

```typescript
// 1. Write validation tests first
import { describe, it, expect } from 'vitest';
import { PlatformSchema, AccessLevelSchema } from '../types';

describe('Shared Types Validation', () => {
  it('should validate valid platform enum', () => {
    const result = PlatformSchema.safeParse('meta_ads');
    expect(result.success).toBe(true);
  });

  it('should reject invalid platform', () => {
    const result = PlatformSchema.safeParse('invalid_platform');
    expect(result.success).toBe(false);
  });

  it('should validate access levels', () => {
    expect(AccessLevelSchema.safeParse('admin').success).toBe(true);
    expect(AccessLevelSchema.safeParse('super_admin').success).toBe(false);
  });
});

// 2. Define types to pass tests
export const PlatformSchema = z.enum(['meta_ads', 'google_ads', 'ga4']);
export const AccessLevelSchema = z.enum(['admin', 'standard', 'read_only', 'email_only']);
```

## TDD Rules for This Project

1. **Never write implementation code without a failing test**
   - The test MUST fail initially (Red phase)
   - If the test passes immediately, you're not testing anything new

2. **Write the MINIMUM code to pass**
   - Don't add features "for later" - only what the test requires
   - Keep implementation simple until refactoring phase

3. **One test, one small piece of behavior**
   - Each test should verify ONE specific behavior
   - Break complex features into multiple small tests

4. **Test names describe behavior, not implementation**
   ```typescript
   // Good: describes behavior
   it('should revoke OAuth token and log audit entry')

   // Bad: describes implementation
   it('should call infisical.delete() and prisma.auditLog.create()')
   ```

5. **Run tests continuously during development**
   ```bash
   # Watch mode - tests run on every save
   npm test -- --watch

   # Run specific test file during TDD cycle
   npm test src/services/__tests__/my-service.test.ts
   ```

## What NOT to Do (Anti-Patterns)

```typescript
// ❌ WRONG: Writing code first, then tests
function calculateDiscount(price: number, discount: number) {
  return price * (1 - discount / 100);
}

// Later adding tests...
test('calculates discount', () => { ... });

// ✅ CORRECT: Test first
test('should apply 20% discount to $100', () => {
  expect(calculateDiscount(100, 20)).toBe(80);
});

// Then write implementation
function calculateDiscount(price: number, discount: number) {
  return price * (1 - discount / 100);
}
```

## Integration with Existing Test Setup

This project uses:
- **Vitest** for backend and frontend tests
- **Testing Library** for React components
- **Test location**: `__tests__/` directories next to source files

```bash
# Before starting any new feature work:
# 1. Create test file
touch apps/api/src/services/__tests__/new-feature.test.ts

# 2. Write first failing test
# 3. Run: npm test apps/api/src/services/__tests__/new-feature.test.ts
# 4. Write minimum implementation
# 5. Refactor
# 6. Repeat for next behavior
```

## When Tests Are Not Required

The only exceptions to TDD are:
- **Configuration files** (tsconfig, vite.config, etc.)
- **Type definitions** (without runtime validation logic)
- **Styling/CSS files** (use visual regression testing via dev-browser skill instead)

**Everything else MUST follow TDD:**
- Services, utilities, helpers
- React components and hooks
- API routes and endpoints
- Database migrations (write test for migration behavior)
- Background jobs
