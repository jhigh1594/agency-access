# Implementation Plan: Create Client & Create Request Features

**Date**: February 10, 2026
**Status**: Planning

---

## Overview

Two related features to improve client and access request management workflows:

1. **Create Client**: Add ability to create new clients directly from the Clients page
2. **Create Request**: Add ability to create access requests for a specific client from their detail page

---

## Feature 1: Create Client from Clients Page

### User Story
As an agency admin, I want to create a new client directly from the Clients page without going through the access request flow, so that I can onboard clients proactively.

### Current State
- Clients page (`/clients`) has search and filters but no "Add Client" button
- Client creation only happens inline within the access request wizard via `ClientSelector`
- API endpoint `POST /api/clients` already exists

### Proposed Design

```
┌─────────────────────────────────────────────────────────────┐
│  Clients                    [+ Create Client]              │
├─────────────────────────────────────────────────────────────┤
│  [Search]                                   [Filter ▼]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Client 1   │  │  Client 2   │  │  Client 3   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**Modal Design** (reuses EditClientModal pattern):
```
┌─────────────────────────────────────┐
│  Create Client              [X]     │
├─────────────────────────────────────┤
│  Name *                              │
│  [________________________]         │
│                                      │
│  Company *                           │
│  [________________________]         │
│                                      │
│  Email *                             │
│  [________________________]         │
│                                      │
│  Website                             │
│  [________________________]         │
│                                      │
│  Language                            │
│  [🇬🇧 English            ▼]         │
│                                      │
│  [Cancel]              [Create]      │
└─────────────────────────────────────┘
```

### Implementation Steps

#### 1. Frontend: CreateClientModal Component
**File**: `apps/web/src/components/client-detail/CreateClientModal.tsx`

```typescript
interface CreateClientModalProps {
  onClose: () => void;
  onSuccess?: (client: Client) => void; // Optional callback
}

export function CreateClientModal({ onClose, onSuccess }: CreateClientModalProps)
```

**Features**:
- Form fields: name, company, email (required), website (optional), language (dropdown)
- Validation: required fields, email format, URL format for website
- Loading state during creation
- Success feedback with auto-close
- Error message display
- Reuses styling from EditClientModal

#### 2. Frontend: Add Button to Clients Page
**File**: `apps/web/src/app/(authenticated)/clients/page.tsx`

**Changes**:
- Add "Create Client" button in header (right-aligned)
- Add state for modal open/close
- Add callback to refresh clients list after successful creation
- Query invalidation: `['clients-with-connections']`

#### 3. API: Verify Endpoint
**File**: `apps/api/src/routes/clients.routes.ts`

**Verify existing endpoint**:
```typescript
// POST /api/clients - Should already exist
fastify.post('/api/clients', async (request, reply) => {
  // Create client logic
});
```

**Expected behavior**:
- Validates input (name, company, email required)
- Checks email uniqueness within agency
- Sets language default to 'en' if not provided
- Returns created client object

---

## Feature 2: Create Request from Client Detail Page

### User Story
As an agency admin, I want to create an access request for a specific client from their detail page, so that I can quickly request access without re-selecting the client.

### Current State
- Client detail page (`/clients/[id]`) shows client info, stats, and access requests
- No "Create Request" action exists
- Access request creation happens via `/access-requests/new` 4-step wizard

### Proposed Design

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Clients                    [Create Request]      │
├─────────────────────────────────────────────────────────────┤
│  ┌────┐ John Smith                                [Edit]   │
│  │ 👤 │ john@acme.com                              [Delete] │
│  └────┘ Acme Corporation                                           │
│       Client since Jan 15, 2026                    [Active]  │
├─────────────────────────────────────────────────────────────┤
│  Stats Cards...                                               │
├─────────────────────────────────────────────────────────────┤
│  [Access Requests] [Activity]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Modal Design** (simplified access request creation):
```
┌─────────────────────────────────────────────────────────────┐
│  Create Access Request for John Smith               [X]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Select Platforms                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Recommended                                            │ │
│  │  [Google]  [Meta]  [LinkedIn]                          │ │
│  │                                                          │ │
│  │  Other Platforms                                        │ │
│  │  [Google Ads] [GA4] [Meta Ads] [TikTok]...            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 2: Access Level                                        │
│  ○ Admin - Full control                                     │
│  ● Standard - Create and edit                               │
│  ○ Read Only - View reports only                            │
│  ○ Email Only - Basic notifications                         │
│                                                              │
│  [Cancel]                              [Create & Send Link]  │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### 1. Frontend: CreateRequestModal Component
**File**: `apps/web/src/components/client-detail/CreateRequestModal.tsx`

**Props**:
```typescript
interface CreateRequestModalProps {
  client: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  onClose: () => void;
  onSuccess?: (request: AccessRequest) => void;
}
```

**Features**:
- Two-step simplified flow:
  1. **Platform Selection**: Reuse platform selector from access request wizard
  2. **Access Level**: Use `ACCESS_LEVEL_DESCRIPTIONS` from shared types
- Pre-fills client (no client selection needed)
- Shows client name in modal title for context
- Creates request and shows success message with link
- Optional: Advanced options collapse (templates, custom fields, branding)

#### 2. Frontend: Add Button to Client Detail Page
**File**: `apps/web/src/app/(authenticated)/clients/[id]/page.tsx`

**Changes**:
- Add "Create Request" button in header (next to Edit/Delete)
- Pass client data to modal
- Invalidate queries on success:
  - `['client-detail', client.id]`
  - `['clients-with-connections']`
  - `['access-requests']`

#### 3. API: Verify/Create Endpoint
**File**: `apps/api/src/routes/access-requests.routes.ts`

**Verify existing endpoint**:
```typescript
// POST /api/access-requests - Should already exist
fastify.post('/api/access-requests', async (request, reply) => {
  // Create access request logic
});
```

**Expected request body**:
```typescript
{
  agencyId: string;
  clientId: string;        // Pre-filled from detail page
  authModel: 'delegated_access';
  platforms: {
    google?: ('google_ads' | 'ga4')[];
    meta?: ('meta_ads')[];
    linkedin?: ('linkedin')[];
    // ... other platforms
  };
  globalAccessLevel: AccessLevel;
  status: 'pending';
}
```

---

## Shared Components & Utilities

### Reusable Patterns

#### 1. Modal Component Pattern
Both modals follow the established pattern:
- `m.div` with backdrop (Framer Motion)
- Header with title and close button
- Form content
- Action buttons (Cancel + Primary)
- Loading states
- Error/success messages

#### 2. Form Validation
```typescript
// Client-side validation
const validateClient = (data: CreateClientData) => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.company.trim()) errors.company = 'Company is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(data.email)) errors.email = 'Invalid email format';
  if (data.website && !URL_REGEX.test(data.website)) errors.website = 'Invalid URL';

  return errors;
};
```

#### 3. API Call Pattern
```typescript
const createMutation = useMutation({
  mutationFn: async (data: T) => {
    const response = await fetch(`${API_URL}/endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agency-id': orgId || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create');
    }

    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
    onSuccess?.(result);
  },
});
```

---

## File Structure

### New Files to Create

```
apps/web/src/components/client-detail/
├── CreateClientModal.tsx          # NEW - Client creation modal
├── CreateRequestModal.tsx         # NEW - Access request creation modal
├── EditClientModal.tsx            # EXISTING - Reference for styling
└── DeleteClientModal.tsx          # EXISTING - Reference for pattern

apps/web/src/components/platform-selector/
├── PlatformSelectorGrid.tsx       # EXISTING - Reuse for CreateRequestModal
└── AccessLevelSelector.tsx        # EXISTING - Reuse for CreateRequestModal
```

### Files to Modify

```
apps/web/src/app/(authenticated)/clients/
├── page.tsx                       # ADD - Create Client button + modal
└── [id]/
    └── page.tsx                   # ADD - Create Request button + modal

apps/api/src/routes/
├── clients.routes.ts              # VERIFY - POST /api/clients exists
└── access-requests.routes.ts      # VERIFY - POST /api/access-requests exists
```

---

## Testing Checklist

### Feature 1: Create Client
- [ ] Modal opens when clicking "Create Client" button
- [ ] Form validation works (required fields, email format)
- [ ] Client is created successfully
- [ ] Clients list refreshes after creation
- [ ] Modal closes after successful creation
- [ ] Error messages display correctly
- [ ] Loading state shows during creation
- [ ] Email uniqueness is enforced (API level)

### Feature 2: Create Request
- [ ] Modal opens when clicking "Create Request" button
- [ ] Client is pre-filled and read-only
- [ ] Platform selection works
- [ ] Access level selection works
- [ ] Request is created successfully
- [ ] Success message shows with link
- [ ] Client detail page refreshes after creation
- [ ] New request appears in access requests tab

### Integration Tests
- [ ] Created client appears in clients list
- [ ] Created request appears in client's access requests
- [ ] Permission checks work (only admins can create)
- [ ] Agency isolation works (can't access other agencies)

---

## Open Questions

1. **Templates in CreateRequestModal**: Should the simplified flow support templates, or keep it minimal?
   - **Recommendation**: Keep minimal initially, add "Advanced Options" collapse later

2. **Default Access Level**: What should be the default access level for requests created from client detail?
   - **Recommendation**: `standard` - most common use case

3. **Platform Defaults**: Should any platforms be pre-selected?
   - **Recommendation**: No - let user select explicitly

4. **Post-Creation Flow**: After creating a request, where should the user go?
   - **Recommendation**: Stay on page, show success with link to copy

---

## Implementation Order

1. **Phase 1**: Create Client Modal (simpler, isolated)
   - Create CreateClientModal component
   - Add button to Clients page
   - Test end-to-end

2. **Phase 2**: Create Request Modal (more complex, depends on existing patterns)
   - Create CreateRequestModal component
   - Add button to Client Detail page
   - Test end-to-end

---

## Dependencies

### External
- None (uses existing API endpoints)

### Internal
- `EditClientModal.tsx` - styling reference
- `PlatformSelectorGrid.tsx` - platform selection pattern
- `AccessRequestContext.tsx` - may need to extract patterns
- `packages/shared/src/types.ts` - type definitions

---

## Success Metrics

- **Feature 1**: Agencies can create clients in < 30 seconds
- **Feature 2**: Agencies can create access requests in < 60 seconds
- **Adoption**: Track usage of both buttons after launch
- **Error Rate**: < 1% for both creation flows
