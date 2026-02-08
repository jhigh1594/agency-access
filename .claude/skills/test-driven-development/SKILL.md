---
name: test-driven-development
description: Red-green-refactor TDD workflow. Use when implementing new features, fixing bugs, or refactoring code. Ensures tests are written before implementation.
---

# Test-Driven Development

## The TDD Cycle

### 1. Red: Write a Failing Test
- Write a test for the desired behavior
- The test MUST fail initially
- If it passes immediately, you're not testing anything new

### 2. Green: Make It Pass
- Write the MINIMUM code to pass the test
- Don't add features "for later"
- Keep implementation simple

### 3. Refactor: Improve the Code
- Clean up while keeping tests green
- Extract common patterns
- Improve naming and structure

### 4. Repeat
- One small behavior at a time
- Build up functionality incrementally

## TDD in Practice

### Starting a New Feature
```typescript
// 1. Write the test first
describe('ConnectionService', () => {
  it('should revoke connection and delete tokens', async () => {
    // Arrange
    const connectionId = 'conn-123';
    const service = new ConnectionService();
    
    // Act
    await service.revokeConnection(connectionId);
    
    // Assert
    expect(mockInfisical.deleteSecret).toHaveBeenCalled();
    expect(mockPrisma.connection.update).toHaveBeenCalledWith({
      where: { id: connectionId },
      data: { status: 'revoked' }
    });
  });
});

// 2. Run test - it fails (Red)
// npm test src/services/__tests__/connection.service.test.ts

// 3. Write minimum implementation (Green)
class ConnectionService {
  async revokeConnection(connectionId: string) {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    });
    
    await infisical.deleteSecret(connection.secretId);
    
    await prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'revoked' }
    });
  }
}

// 4. Refactor if needed
```

### Test Names Describe Behavior
```typescript
// Good: describes what should happen
it('should throw INVALID_TOKEN when token is expired')
it('should create audit log entry when token is accessed')
it('should refresh token before expiration')

// Bad: describes implementation
it('should call infisical.delete()')
it('should set status to revoked')
```

### One Test, One Behavior
```typescript
// Good: focused tests
it('should validate email format', () => {
  expect(() => validateEmail('invalid')).toThrow();
});

it('should accept valid email', () => {
  expect(validateEmail('user@example.com')).toBe(true);
});

// Bad: testing multiple things
it('should validate email', () => {
  expect(() => validateEmail('invalid')).toThrow();
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('')).toBe(false);
});
```

## TDD Anti-Patterns to Avoid

### Writing Code First
```typescript
// ❌ WRONG: Implementation before test
function calculateDiscount(price, discount) {
  return price * (1 - discount / 100);
}

// Later adding tests...
test('calculates discount', () => { ... });

// ✅ CORRECT: Test first
test('should apply 20% discount to $100', () => {
  expect(calculateDiscount(100, 20)).toBe(80);
});

// Then implement
function calculateDiscount(price, discount) {
  return price * (1 - discount / 100);
}
```

### Testing Implementation Details
```typescript
// ❌ WRONG: Testing how, not what
it('should call prisma.user.findUnique', () => {
  service.getUser('123');
  expect(prisma.user.findUnique).toHaveBeenCalled();
});

// ✅ CORRECT: Testing behavior
it('should return user by ID', async () => {
  const user = await service.getUser('123');
  expect(user.id).toBe('123');
});
```

### Skipping the Red Phase
If your test passes immediately:
- You're testing existing behavior (not new)
- Your test is too loose
- You need a more specific assertion

## When Tests Are Not Required

- Configuration files (tsconfig, vite.config)
- Type definitions without runtime validation
- Styling/CSS (use visual regression testing)

## TDD Workflow Commands

```bash
# Start TDD cycle
npm test -- --watch

# Run specific test file
npm test src/services/__tests__/connection.service.test.ts

# Check coverage
npm test -- --coverage
```

## Benefits of TDD

- Forces clear requirements before coding
- Catches bugs early
- Documents expected behavior
- Enables confident refactoring
- Reduces debugging time
