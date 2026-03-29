# Coding Conventions

**Analysis Date:** 2026-03-29

## Naming Patterns

**Files:**
- **Source files**: `kebab-case.ts` or `kebab-case.tsx` (e.g., `access-request-context.tsx`, `oauth-state.service.ts`)
- **Test files**: `*.test.ts` or `*.test.tsx` co-located in `__tests__/` directories (e.g., `access-request-context.test.tsx`)
- **Spec files**: `*.spec.ts` (less common, preferred pattern is `*.test.ts`)
- **Config files**: `*.config.ts` or `*.config.mjs` (e.g., `vitest.config.ts`, `eslint.config.mjs`)
- **Type definition files**: `*.d.ts` (e.g., `fastify-raw-body.d.ts`)

**Functions:**
- **camelCase** for function names (e.g., `sendSuccess`, `createAccessRequest`, `generateUniqueToken`)
- **Prefix verbs**: `get` (retrieve), `create` (new), `update` (modify), `delete` (remove), `set` (assign)
- **Boolean functions**: prefix with `is`, `has`, `should` (e.g., `hasConnector`, `isAuthorized`)
- **Async functions**: always marked with `async`, no naming convention difference

**Variables:**
- **camelCase** for variables and parameters (e.g., `agencyId`, `accessToken`, `reply`)
- **UPPER_SNAKE_CASE** for constants (e.g., `STATE_EXPIRY_SECONDS`, `SLOW_REQUEST_THRESHOLD`)
- **PascalCase** for React components and classes (e.g., `AccessRequestProvider`, `QueryClient`)
- **Leading underscore** for intentionally unused parameters (e.g., `_request` when using `argsIgnorePattern: '^_'` in ESLint)

**Types:**
- **PascalCase** for interfaces and type aliases (e.g., `ApiResponse`, `OAuthState`, `QuotaCheckOptions`)
- **PascalCase** for enums (e.g., `Platform`, `SubscriptionTier`)
- **Generic type parameters**: Single-letter uppercase (e.g., `<T>`, `<T = unknown>`)
- **Zod schemas**: `PascalSchema` suffix (e.g., `PlatformSchema`, `AccessLevelSchema`)

## Code Style

**Formatting:**
- No explicit Prettier configuration detected
- ESLint used as primary style enforcer
- TypeScript strict mode enabled across all workspaces
- 2-space indentation (inferred from code samples)
- Single quotes preferred (inferred from import statements)
- Semicolons required

**Linting:**
- **Tool**: ESLint with TypeScript ESLint
- **Config files**: `eslint.config.mjs` in `apps/web/` and `apps/api/`
- **Frontend rules**: Extends `next/core-web-vitals` and `next/typescript`
- **Backend rules**: Extends `typescript-eslint` recommended
- **Common overrides**:
  - `@typescript-eslint/no-explicit-any: 'off'` - Any types allowed
  - `@typescript-eslint/no-unused-vars: ['warn', { argsIgnorePattern: '^_' }]` - Unused params with `_` prefix are warnings
  - `prefer-const: 'off'` - Let/const choice left to developer
- **Ignored patterns**:
  - Test files (`**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`)
  - Build artifacts (`.next/**`, `dist/**`, `node_modules/**`)
  - Templates (`src/services/connectors/TEMPLATE.ts`)

**TypeScript Configuration:**
- **Strict mode**: Enabled in all workspaces
- **Target**: ES2022 (API), ES2017 (Web)
- **Module**: ESNext with Node resolution
- **Path aliases**: `@/*` maps to `./src/*` in all workspaces
- **Test exclusion**: Test files excluded from compilation via tsconfig

## Import Organization

**Order:**
1. React/Next.js core imports
2. Third-party package imports
3. Shared workspace imports (`@agency-platform/shared`)
4. Local workspace imports (`@/...` for path aliases)
5. Type-only imports (`import type { ... }`)

**Path Aliases:**
- `@/*`: Maps to `./src/*` in all workspaces (apps/web, apps/api, packages/shared)
- `@agency-platform/shared`: Shared types package

**Import Patterns:**
```typescript
// Core imports
import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

// Third-party
import { renderHook, act } from '@testing-library/react';

// Shared types
import { Client, AccessLevel, Platform } from '@agency-platform/shared';
import type { CreateAccessRequestPayload } from '@/lib/api/access-requests';

// Local imports
import { sendSuccess, sendError } from '@/lib/response';
```

**Named exports preferred**: Export individual functions/classes, not default exports

## Error Handling

**Patterns:**
- **API responses**: Use standardized `{ data, error }` shape via `sendSuccess()` and `sendError()` helpers
- **Error codes**: String constants (e.g., `INVALID_TOKEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `PLATFORM_ERROR`)
- **Throwing errors**: Use `throw new Error()` or custom error classes
- **Backend**: Throw errors, let Fastify error handler catch and format via `sendError()`
- **Frontend**: Check `'error' in json` pattern, throw with `json.error.message`

**Response Helper Functions** (`apps/api/src/lib/response.ts`):
```typescript
sendSuccess(reply, data, statusCode?) // 200 by default
sendError(reply, code, message, statusCode?, details?)
sendValidationError(reply, message) // 400
sendNotFound(reply, message?) // 404
sendUnauthorized(reply, message?) // 401
sendForbidden(reply, message?) // 403
sendConflict(reply, message) // 409
```

**Custom Error Classes:**
- `QuotaServiceUnavailableError` (apps/api/src/middleware/quota-enforcement.ts)
- `QuotaExceededError` (used in quota middleware)
- `AuthorizedApiError` (frontend API client errors)

## Logging

**Framework:** Pino (structured logging for Node.js)

**Logger Import:** `import { logger } from '@/lib/logger.js';`

**Patterns:**
- **Info level**: `logger.info('message', { metadata })`
- **Error level**: `logger.error('message', { error })`
- **Debug level**: `logger.debug('message', { details })`
- **Warn level**: `logger.warn('message', { warning })`

**When to log:**
- Authentication/authorization failures
- OAuth flow steps and errors
- Token storage/retrieval operations
- Background job execution
- Performance metrics (slow requests)
- External API call failures

**Logging patterns from codebase:**
```typescript
logger.info('pg-boss started successfully');
logger.error('Failed to schedule recurring job', { name, error });
logger.debug(`Job enqueued: ${name}`, { jobId, singletonKey });
logger.warn(`Queue creation warning for ${name}:`, { error: errorMessage });
```

**Console usage:** Limited to development-only warnings or error output

## Comments

**When to Comment:**
- Complex business logic explanations
- Security-sensitive operations (OAuth, token handling)
- Algorithm non-obviousness
- File/module purpose (header JSDoc comments)
- Public API documentation

**JSDoc/TSDoc:**
- **Pattern**: `/** */` block comments for file headers and public functions
- **Format**: Multi-line with asterisk alignment
- **Content**: Purpose, parameters, return values, usage examples

**Header comment pattern:**
```typescript
/**
 * OAuth State Service
 *
 * Manages OAuth state tokens for CSRF protection during OAuth flows.
 * State tokens are stored in Postgres with 10-minute expiry and are single-use.
 *
 * Security enhancements:
 * - HMAC SHA-256 signatures prevent state token tampering
 * - Single-use tokens prevent replay attacks
 * - Automatic expiration limits attack window
 */
```

**Function comment pattern:**
```typescript
/**
 * Send successful response with data
 */
export function sendSuccess<T>(
  reply: any,
  data: T,
  statusCode: number = 200
): any
```

**Inline comments:** Minimal, used only for "why" not "what"

## Function Design

**Size:** No strict limit, but preference for single-responsibility functions under 50 lines

**Parameters:**
- **Preferred**: 3 or fewer parameters
- **Many parameters**: Use options object pattern
- **Options pattern**: `interface FunctionOptions { param1: string; param2: number; }`
- **Destructuring**: Preferred for options objects

**Return Values:**
- **Success responses**: `{ data: T }` shape
- **Error responses**: `{ error: { code, message, details? } }` shape
- **Service functions**: Return `{ data, error }` union type or throw
- **Void returns**: Used for side effects (middleware, response senders)

**Async patterns:**
- Always mark with `async`
- Use `await` for promises (no promise chaining)
- Error handling via try/catch or let bubble up

**Function signature examples:**
```typescript
// Simple function
export function generateUniqueToken(): string

// Async function with options
export async function createAccessRequest(input: CreateAccessRequestInput)

// Function with type parameter
export function sendSuccess<T>(reply: any, data: T, statusCode?: number): any
```

## Module Design

**Exports:**
- **Named exports preferred**: `export function foo()`, `export const bar = 1`
- **Default exports**: Rare, used mostly for React components and configuration
- **Type exports**: Export types alongside implementations using `export type`

**Barrel Files:**
- **Index pattern**: `index.ts` files re-export from subdirectories
- **Shared package**: `packages/shared/src/index.ts` exports all types
- **API organization**: Group related exports in index files

**Module structure patterns:**
```typescript
// types.ts - Define interfaces
export interface Foo { }

// foo.service.ts - Implement logic
export async function doFoo(): Promise<Foo>

// index.ts - Re-export
export * from './types.js';
export * from './foo.service.js';
```

**File extensions:** Use `.js` extensions in imports for ES module compatibility (e.g., `import { foo } from './bar.js'`)

---

*Convention analysis: 2026-03-29*
