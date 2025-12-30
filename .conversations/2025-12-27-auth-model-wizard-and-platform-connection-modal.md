# 2025-12-27: Auth Model Wizard & Platform Connection Modal

## Session Overview

Implemented major frontend features for the access request creation flow, including:
1. **Auth Model Selection** - Choose between Delegated Access (recommended) and Client Authorization
2. **Platform Connection Modal** - Inline management of agency platform connections
3. **Route Alias** - `/authorize/[token]` now redirects to `/invite/[token]`
4. **Auth Model Flip** - Changed default from client_authorization to delegated_access (80%+ use case)

---

## Files Created

### Frontend Components

#### `apps/web/src/components/auth-model-selector.tsx`
- Card-based UI for selecting authorization model
- Shows **Delegated Access** first (recommended, 80%+ use case)
- Shows **Client Authorization** second (for API integrations)
- Features:
  - ⭐ "RECOMMENDED" badge on Delegated Access
  - Icons: Building2 (Delegated), Users (Client Auth)
  - Color coding: indigo for Delegated, blue for Client Auth
  - Validation: disables Delegated Access if agency has no connected platforms
  - Info banner explaining the difference

#### `apps/web/src/components/platform-connection-modal.tsx`
- Modal for managing agency platform connections inline
- Features:
  - List connected platforms with status badges (active, expired, invalid)
  - Refresh token button for each platform
  - Disconnect button with confirmation dialog
  - "Connect Another Platform" button (redirects to onboarding)
  - Empty state with call-to-action
  - AnimatePresence animations for smooth UX
- Used by: Access Request Wizard when Delegated Access is selected

#### `apps/web/src/app/authorize/[token]/page.tsx`
- Route alias that redirects to `/invite/[token]`
- Server-side redirect (307) for better performance
- Provides alternative URL for client authorization links

### Shared Types

#### `packages/shared/src/types.ts` (updates)
Added:
```typescript
// Authorization models
export const AuthModelSchema = z.enum(['client_authorization', 'delegated_access']);
export type AuthModel = z.infer<typeof AuthModelSchema>;

export const AUTH_MODEL_DESCRIPTIONS: Record<AuthModel, {
  title: string;
  description: string;
  useCase: string;
  recommendation: string;
}> = {
  delegated_access: {
    title: 'Delegated Access',
    description: 'Use your agency\'s platform accounts to manage client campaigns directly in the UI',
    useCase: 'Recommended for most agencies - gives you full UI access to manage campaigns',
    recommendation: 'RECOMMENDED',
  },
  client_authorization: {
    title: 'Client Authorization',
    description: 'Client authorizes their own platform accounts to your agency via OAuth',
    useCase: 'Use when you need API access for reporting, automation, or custom integrations',
    recommendation: 'OPTIONAL',
  },
};

// Client type
export interface Client {
  id: string;
  agencyId: string;
  name: string;
  company: string;
  email: string;
  website: string | null;
  language: ClientLanguage;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Files Modified

### `apps/web/src/contexts/access-request-context.tsx`
- Added `authModel: AuthModel | null` to form state
- Added `updateAuthModel` callback method
- Changed default: `authModel: 'delegated_access'` (was `null`)
- Updated validation steps (now 5 steps total)
- Updated submit logic to use selected auth model

### `apps/web/src/app/access-requests/new/page.tsx`
- **Expanded wizard from 4 steps → 5 steps:**
  1. Template (optional)
  2. Client Selection
  3. **Auth Model Selection** ⭐ NEW
  4. Platforms & Access Level
  5. Form Fields
  6. Branding
- Added `AuthModelSelector` component to Step 2
- Added delegated access helper with "Manage Platforms" button
- Added `PlatformConnectionModal` integration
- Added `useQueryClient` import
- Fixed `AccessLevelSelector` prop (null → undefined conversion)

---

## Auth Model Understanding (Clarified)

### Delegated Access (Recommended, 80%+ use case)
- **Agency uses their own platform accounts**
- **Agency logs into Meta/Google UI directly** to manage client campaigns
- Full UI access to create/edit campaigns, ad sets, ads, audiences
- Requires agency to have platform connections first
- Tokens stored in `AgencyPlatformConnection`

### Client Authorization (Optional, API use case)
- **Client OAuths their accounts to agency**
- Agency gets API access to client's data
- Good for: reporting, automation, custom integrations
- Cannot log into platform UI as the client
- Tokens stored in `PlatformAuthorization` (linked to `ClientConnection`)

---

## Current Onboarding Flow

1. **Sign up** → Clerk authentication
2. **Platform connections** → `/onboarding/platforms`
   - Connect Meta, Google, LinkedIn, TikTok, etc.
   - These become agency platform connections (for Delegated Access)
3. **Dashboard** → `/dashboard`
   - Main landing after onboarding
   - Create access requests, manage clients, view token health

### Creating Access Request (`/access-requests/new`)

**Step 1:** Client Selection
- Choose existing client or create new one

**Step 2:** Auth Model Selection ⭐ NEW
- **Delegated Access** (recommended) - Use agency's platform accounts
- **Client Authorization** (optional) - Client OAuths for API access

**Step 3:** Platforms & Access Level
- Select platforms: Meta Ads, Google Ads, GA4, LinkedIn, TikTok, Snapchat
- Select access level: Admin, Standard, Read Only, Email Only

**Step 4:** Form Fields
- Customize intake questions for clients

**Step 5:** Branding
- Add logo, colors, subdomain (optional)

**Client receives link:** `/invite/[token]` or `/authorize/[token]`

---

## Backend TODOs (Remaining)

### Token Refresh Implementation (4 TODOs)

**Files:**
- `apps/api/src/lib/queue.ts:72` - Call appropriate connector to refresh tokens
- `apps/api/src/jobs/token-refresh.ts:80` - Call platform-specific refresh
- `apps/api/src/services/agency-platform.service.ts:352` - Call platform refresh method
- `apps/api/src/services/connection.service.ts:366` - Implement token refresh with connectors

**What needs to happen:**
```typescript
// In token-refresh job, for each platform:
const connector = getPlatformConnector(platform); // MetaConnector, GoogleConnector, etc.
await connector.refreshToken(refreshToken);
```

**Platform connectors to wire up:**
- MetaConnector (60-day token exchange)
- GoogleConnector (OAuth refresh flow)
- LinkedInConnector
- TikTokConnector
- SnapchatConnector

### OAuth State Management (3 TODOs)

**Files:**
- `apps/api/src/routes/oauth-test.ts:24` - Store state token for verification
- `apps/api/src/routes/oauth-test.ts:69` - Verify state token matches
- `apps/api/src/routes/client-auth.ts:97` - Exchange OAuth code for tokens

**What needs to happen:**
- Store CSRF tokens in Redis with TTL
- Verify state on callback to prevent CSRF attacks
- Implement code → token exchange using platform connectors

### Notification System (2 TODOs)

**File:**
- `apps/api/src/routes/client-auth.ts:178` - Send notification to agency

**What needs to happen:**
- When client completes authorization, notify agency
- Could be: email, webhook, Slack message, in-app notification

---

## Type Errors Status

### Pre-existing (not addressed in this session)
- Backend test mocks need Client interface updates
- Some Next.js route type issues (turbopack related)
- Component prop type mismatches in test files

### Fixed
- Added `Client` type export to shared types
- Added `useQueryClient` import to wizard page
- Fixed `AccessLevelSelector` null → undefined conversion

---

## Next Actions

1. **Implement Token Refresh** (highest priority)
   - Wire up MetaConnector for 60-day token exchange
   - Wire up GoogleConnector for OAuth refresh
   - Test refresh job in BullMQ
   - Add monitoring for expiring tokens

2. **Complete OAuth State Management**
   - Implement CSRF token storage in Redis
   - Add state verification on callbacks
   - Test full OAuth flow end-to-end

3. **Build Notification System**
   - Design notification format (email/webhook)
   - Implement notification trigger on client authorization
   - Add notification preferences for agencies

---

## Session Stats

- **Files created:** 4
- **Files modified:** 3
- **Lines of code added:** ~800
- **TODOs completed:** 7
- **TODOs remaining:** 9 (all backend)
- **Session duration:** ~2 hours
