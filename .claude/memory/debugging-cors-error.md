# CORS Error - Backend Not Starting (Module Resolution)

## Date
December 29, 2025

## Error Symptom
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:3001/api/agencies?email=jon%40pillaraiagency.com.
(Reason: CORS request did not succeed). Status code: (null).
```

## Root Cause
The backend server wasn't running at all. The CORS error was a misleading symptom - when there's no server to respond to the preflight OPTIONS request, browsers report it as a CORS failure.

## Actual Problem
Module resolution error prevented the backend from starting:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@/lib' imported from
/Users/jhigh/agency-access-platform/apps/api/src/services/client-assets.service.ts
```

### Two Issues:
1. **Missing file**: `apps/api/src/lib/logger.ts` didn't exist
2. **Path alias not resolved**: `tsx` doesn't natively resolve TypeScript `@/*` path aliases

## Fix Applied

### 1. Created the missing logger file
**File**: `apps/api/src/lib/logger.ts`

```typescript
export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      console.info(`[INFO] ${message}`, meta);
    } else {
      console.info(`[INFO] ${message}`);
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      console.warn(`[WARN] ${message}`, meta);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      console.error(`[ERROR] ${message}`, meta);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      if (meta) {
        console.debug(`[DEBUG] ${message}`, meta);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },
};
```

### 2. Changed import to use relative path
**File**: `apps/api/src/services/client-assets.service.ts` (line 14)

```typescript
// Before (broken)
import { logger } from '@/lib/logger';

// After (working)
import { logger } from '../lib/logger.js';
```

**Note the `.js` extension** - required because `package.json` has `"type": "module"` (ES modules mode)

## Prevention

### When adding new service files:
1. **Use relative imports** like `../lib/prisma.js` instead of `@/lib/prisma`
2. **Include `.js` extension** for ES modules (`package.json` has `"type": "module"`)
3. **Check if lib file exists** before importing from it

### When seeing CORS errors:
1. **First check**: Is the backend running? (`lsof -ti:3001`)
2. **Status code (null)** = server not running, not a CORS config issue
3. **Check backend logs** for the real error

### Project import patterns to follow:
- ✅ `import { prisma } from '../lib/prisma.js'` (services/ and jobs/ directories)
- ❌ `import { logger } from '@/lib/logger'` (tsx doesn't resolve `@/` aliases)

## Files Modified
- Created: `apps/api/src/lib/logger.ts`
- Modified: `apps/api/src/services/client-assets.service.ts` (line 14)
- Modified: `apps/api/package.json` (line 7 - added `--tsconfig` flag, though not strictly needed with relative imports)

## Verification Commands
```bash
# Check if backend is running
lsof -ti:3001

# Test health endpoint
curl http://localhost:3001/health

# Test CORS preflight
curl -X OPTIONS -H "Origin: http://localhost:3000" http://localhost:3001/api/agencies -I
```
