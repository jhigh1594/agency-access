# Agency Resolution Service

## Overview

The `agency-resolution.service.ts` is the **single source of truth** for agency resolution in the application. It ensures:

1. **Consistent agency resolution** - All parts of the application use the same logic
2. **Prevents duplicate agencies** - Checks for existing agencies before creating new ones
3. **Always returns UUIDs** - Never returns Clerk IDs, ensuring connections are stored correctly
4. **Handles edge cases** - Email conflicts, missing agencies, etc.

## Usage

### Basic Resolution

```typescript
import { agencyResolutionService } from '@/services/agency-resolution.service';

// Resolve agency (won't create if missing)
const result = await agencyResolutionService.resolveAgency('user_123');

if (result.error) {
  // Handle error
  return;
}

const { agencyId, agency } = result.data;
// agencyId is always a UUID, never a Clerk ID
```

### Get or Create

```typescript
// Always creates if missing
const result = await agencyResolutionService.getOrCreateAgency('user_123', {
  userEmail: 'user@example.com',
  agencyName: 'My Agency',
});
```

## Why This Exists

Previously, different parts of the application resolved agencies differently:
- Some used Clerk IDs directly as agency IDs
- Some created new agencies without checking for duplicates
- Some used UUIDs, some used Clerk IDs

This led to:
- **Duplicate agencies** for the same user
- **Connections stored with wrong agency IDs**
- **Inconsistent data** across the application

## Migration

All routes should be migrated to use this service:

- ✅ `agency-platforms.ts` - OAuth callbacks
- ✅ `access-requests.ts` - Access request creation
- ✅ `clients.ts` - Client management
- ⚠️ Other routes should be migrated as needed

## Database Constraints

The Prisma schema has:
- `clerkUserId` is `@unique` but nullable (allows agencies without Clerk IDs)
- `email` is `@unique` (prevents duplicate emails)

The service handles conflicts gracefully and provides detailed error messages.

