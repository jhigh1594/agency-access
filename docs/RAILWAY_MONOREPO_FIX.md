# Railway Monorepo Fix

## Problem
Railway was trying to install `@agency-platform/shared` from npm registry, but it's a local workspace package. This happened because the root directory was set to `apps/api`, so Railway couldn't see the monorepo structure.

## Solution

**Remove the Root Directory setting in Railway dashboard:**

1. Go to Railway dashboard → `@agency-platform/api` service
2. Go to **Settings** → **Source**
3. If "Root Directory" is set to `apps/api`, **remove it** (click the X or delete button)
4. Leave it empty (repo root)

## Why This Works

Our `railway.json` build commands already handle the monorepo:
- `npm run build --workspace=packages/shared` - runs from repo root
- `cd apps/api && npm run build` - navigates to apps/api
- `cd apps/api && npm start` - starts from apps/api

Railway will:
1. Start from repo root (where `package.json` with workspaces is)
2. Run `npm install` - this installs all workspace packages correctly
3. Run our custom build command - builds shared, then API
4. Run start command - starts from apps/api

## After Removing Root Directory

1. Railway will detect the monorepo structure
2. `npm install` will install all workspace dependencies
3. Build will succeed with access to `@agency-platform/shared`
4. Deployment will work correctly

