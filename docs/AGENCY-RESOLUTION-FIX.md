# Agency Resolution Fix - Preventing Duplicate Agencies

## Problem

Connections were being created with incorrect agency IDs, causing:
- Connections stored with Clerk user IDs instead of agency UUIDs
- Multiple agencies created for the same user
- Access requests failing because connections couldn't be found

## Root Cause

Different parts of the application resolved agencies inconsistently:
1. OAuth callbacks sometimes used Clerk IDs directly as agency IDs
2. Some routes created new agencies without checking for existing ones
3. No centralized logic to ensure consistent resolution

## Solution

### 1. Centralized Agency Resolution Service

Created `apps/api/src/services/agency-resolution.service.ts`:
- **Single source of truth** for all agency resolution
- Always returns UUIDs (never Clerk IDs)
- Prevents duplicate agencies
- Handles edge cases (email conflicts, missing agencies)

### 2. Updated All Routes

Migrated all routes to use the centralized service:
- ✅ `agency-platforms.ts` - OAuth callbacks now use resolved UUIDs
- ✅ `access-requests.ts` - Access request creation uses resolved UUIDs
- ✅ `clients.ts` - Client management uses resolved UUIDs
- ✅ `agency-platforms.ts` - `/available` endpoint uses resolved UUIDs

### 3. Database Constraints

The Prisma schema already has:
- `clerkUserId` is `@unique` (prevents duplicate Clerk IDs)
- `email` is `@unique` (prevents duplicate emails)

The service handles constraint violations gracefully.

## Key Changes

### Before
```typescript
// ❌ Inconsistent - could create duplicates
const agency = await prisma.agency.findUnique({
  where: { id: clerkUserId }, // Wrong! Clerk ID used as UUID
});

if (!agency) {
  await prisma.agency.create({
    data: { id: clerkUserId }, // Creates with Clerk ID as ID
  });
}
```

### After
```typescript
// ✅ Consistent - always uses UUID
const { agencyResolutionService } = await import('../services/agency-resolution.service');
const result = await agencyResolutionService.getOrCreateAgency(clerkUserId, {
  userEmail: 'user@example.com',
});

const agencyId = result.data!.agencyId; // Always UUID
```

## Migration

Existing connections were migrated to the correct agency:
- Found connections stored with wrong agency ID
- Migrated to correct agency UUID
- Verified connections are now accessible

## Prevention

To prevent this from happening again:

1. **Always use `agencyResolutionService`** - Never query agencies directly with Prisma
2. **Always use UUIDs for connections** - Never store Clerk IDs as `agencyId` in connections
3. **Test agency resolution** - Ensure new code uses the service
4. **Monitor for duplicates** - Add alerts if multiple agencies found for same Clerk ID

## Testing

After these changes:
- ✅ OAuth callbacks create connections with correct agency UUID
- ✅ Access requests find connections correctly
- ✅ No duplicate agencies created
- ✅ All routes use consistent resolution

## Future Improvements

1. Add database migration to clean up any remaining duplicate agencies
2. Add monitoring/alerting for agency resolution failures
3. Consider making `clerkUserId` required (not nullable) for new agencies
4. Add audit logging for agency creation/resolution

