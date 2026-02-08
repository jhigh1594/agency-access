---
name: webapp-testing
description: Comprehensive testing strategies for web applications. Use when writing tests, setting up test infrastructure, debugging test failures, or improving test coverage.
---

# Web Application Testing

## Testing Pyramid

### Unit Tests (70%)
- Test individual functions, hooks, utilities
- Fast, isolated, no external dependencies
- Mock external services

### Integration Tests (20%)
- Test component interactions
- Test API routes with database
- Test service layer with mocked externals

### E2E Tests (10%)
- Test critical user journeys
- Run against real (staging) environment
- Focus on happy paths + critical error paths

## React Component Testing

### Setup
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

### Component Test Patterns
```typescript
describe('AccessRequestCard', () => {
  it('should display request status', () => {
    render(<AccessRequestCard request={mockRequest} />, {
      wrapper: createWrapper()
    });
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should call onRevoke when revoke button clicked', async () => {
    const onRevoke = vi.fn();
    render(<AccessRequestCard request={mockRequest} onRevoke={onRevoke} />);
    
    fireEvent.click(screen.getByRole('button', { name: /revoke/i }));
    
    await waitFor(() => {
      expect(onRevoke).toHaveBeenCalledWith(mockRequest.id);
    });
  });
});
```

### Testing Async Behavior
```typescript
it('should show loading state while fetching', async () => {
  render(<ConnectionsList />);
  
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
```

## API Route Testing

### Fastify Route Tests
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';

describe('POST /api/access-requests', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp({ testing: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create access request with valid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/access-requests',
      headers: { authorization: `Bearer ${mockToken}` },
      payload: { clientId: 'uuid', platforms: ['meta_ads'] }
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toHaveProperty('data.id');
  });

  it('should return 400 for invalid platforms', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/access-requests',
      headers: { authorization: `Bearer ${mockToken}` },
      payload: { clientId: 'uuid', platforms: ['invalid'] }
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });
});
```

## Mocking Strategies

### Mock External Services
```typescript
// Mock Infisical
vi.mock('@/lib/infisical', () => ({
  infisical: {
    storeOAuthTokens: vi.fn().mockResolvedValue('secret-id'),
    getOAuthTokens: vi.fn().mockResolvedValue({ accessToken: 'token' }),
    deleteSecret: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock Platform APIs
vi.mock('@/services/connectors/factory', () => ({
  getConnector: vi.fn().mockReturnValue({
    verifyToken: vi.fn().mockResolvedValue(true),
    getUserInfo: vi.fn().mockResolvedValue({ id: 'user-123' })
  })
}));
```

### Mock Database
```typescript
// Use Prisma mock or test database
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>()
}));
```

## Test Data Factories

```typescript
// factories/access-request.ts
export const createMockAccessRequest = (overrides = {}) => ({
  id: 'ar-123',
  agencyId: 'agency-123',
  clientId: 'client-123',
  status: 'pending',
  platforms: { meta: ['meta_ads'] },
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ...overrides
});
```

## Coverage Requirements

- Backend: 80% minimum, 90% for OAuth/token paths
- Frontend: 70% for components, 90% for hooks/utilities
- Shared: 95%+ for types and schemas

Run coverage: `npm test -- --coverage`
