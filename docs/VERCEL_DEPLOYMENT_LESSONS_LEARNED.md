# Vercel Deployment Lessons Learned

**Date:** December 31, 2025  
**Project:** Agency Access Platform Frontend  
**Deployment:** Vercel Production  
**Status:** ✅ Successful

> **Deprecated:** This document describes the historical Vercel deployment. The current deployment target is Render for both frontend and backend. See `docs/RENDER_DEPLOYMENT.md` and `render.yaml`.

## Executive Summary

Successfully deployed a Next.js 16 monorepo frontend to Vercel after resolving multiple configuration challenges. Key learnings include monorepo setup, TypeScript strict mode requirements, and Vercel's rootDirectory behavior.

---

## Challenges & Solutions

### 1. Monorepo Root Directory Configuration

**Challenge:**
- Initially set `rootDirectory` to `apps/web` in Vercel dashboard
- Vercel automatically runs `npm install` from that directory before custom commands
- `apps/web` doesn't have workspace configuration, causing install failures

**Solution:**
- **Unset rootDirectory** in Vercel dashboard (set to empty/null)
- Link project from repository root using `vercel link --cwd .`
- Configure `vercel.json` to work from repository root
- Let Vercel auto-detect Next.js app location via `outputDirectory`

**Key Insight:**
When `rootDirectory` is set, Vercel runs commands from that directory and can't access the root `package.json` with workspaces. Unsetting it allows Vercel to work from the repository root while still detecting the Next.js app.

### 2. Build Command Configuration

**Challenge:**
- Need to build shared package before web app
- Build commands must run from repository root to access workspaces

**Solution:**
```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

**Key Insight:**
- Use npm workspace commands (`npm run build --workspace=...`) from root
- Create a `build:web` script in root `package.json` that builds shared + web
- Don't use `cd` commands in `vercel.json` when rootDirectory is unset

### 3. TypeScript Strict Mode Errors

**Challenge:**
Next.js 16 with TypeScript strict mode caught several type errors during build:
- Route type mismatches (`/access-requests` doesn't exist)
- `useSearchParams()` requires Suspense boundaries
- Union type mismatches (`authModel` type)

**Solutions:**

#### Route Type Errors
```typescript
// ❌ Wrong - route doesn't exist
<Link href="/access-requests">View All</Link>

// ✅ Fixed - use existing route
<Link href="/access-requests/new">Create New</Link>

// ✅ Or use explicit Route type for intentional non-existent routes
<Link href={"/about" as Route}>About</Link>
```

#### Suspense Boundaries
```typescript
// ❌ Wrong - useSearchParams() without Suspense
export default function Page() {
  const searchParams = useSearchParams();
  // ...
}

// ✅ Fixed - wrap in Suspense
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  // ...
}
```

#### Union Type Mismatches
```typescript
// ❌ Wrong - TypeScript infers string, not union type
authModel: state.authModel || 'client_authorization'

// ✅ Fixed - explicit type assertion
authModel: (state.authModel || 'client_authorization') as 'client_authorization' | 'delegated_access'
```

**Key Insight:**
Next.js 16 with typed routes and strict TypeScript catches errors at build time. Always:
- Use existing routes or explicitly type non-existent routes
- Wrap `useSearchParams()` in Suspense boundaries
- Use explicit type assertions for union types when needed

### 4. Project Linking Location

**Challenge:**
- Initially linked project from `apps/web/` directory
- Created `.vercel` directory in subdirectory
- Caused confusion about where Vercel runs commands

**Solution:**
- Link project from repository root: `vercel link --cwd .`
- Creates `.vercel` directory in root
- Makes it clear Vercel works from repository root

**Key Insight:**
For monorepos, link from repository root, not from the app subdirectory. This aligns with how Vercel actually runs commands.

---

## Configuration Files

### vercel.json (Final Working Configuration)

```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

**Notes:**
- No `installCommand` needed - Vercel handles it automatically
- No `rootDirectory` in config - set to null in dashboard
- `outputDirectory` tells Vercel where Next.js output is
- `framework` helps Vercel optimize the build

### package.json (Root)

```json
{
  "scripts": {
    "build:web": "npm run build --workspace=packages/shared && npm run build --workspace=apps/web"
  }
}
```

**Notes:**
- Create workspace-specific build scripts in root
- Build shared packages first, then dependent apps
- Use npm workspace commands (`--workspace=`)

---

## Best Practices

### 1. Monorepo Deployment Checklist

- [ ] Unset `rootDirectory` in Vercel dashboard (or set to empty)
- [ ] Link project from repository root: `vercel link --cwd .`
- [ ] Create workspace build scripts in root `package.json`
- [ ] Configure `outputDirectory` in `vercel.json` to point to app's `.next`
- [ ] Test build locally: `npm run build:web`
- [ ] Verify TypeScript compiles: `npm run typecheck --workspace=apps/web`

### 2. TypeScript & Next.js 16

- [ ] Wrap all `useSearchParams()` usage in Suspense boundaries
- [ ] Use existing routes or explicitly type non-existent routes with `as Route`
- [ ] Use explicit type assertions for union types when TypeScript can't infer
- [ ] Run `npm run build` locally before deploying to catch type errors

### 3. Vercel Configuration

- [ ] Keep `vercel.json` minimal - let Vercel auto-detect when possible
- [ ] Don't override `installCommand` unless necessary
- [ ] Use `outputDirectory` to specify where Next.js output is
- [ ] Set `framework` to help Vercel optimize builds

### 4. Debugging Failed Deployments

1. **Check build logs in Vercel dashboard** - most detailed error info
2. **Test build locally** - `npm run build:web` should match Vercel
3. **Verify project linking** - `.vercel` directory location
4. **Check rootDirectory setting** - should be null/empty for monorepos
5. **Verify workspace scripts** - ensure they work from repository root

---

## Common Pitfalls

### ❌ Don't Set rootDirectory for Monorepos

**Problem:**
```json
// In Vercel dashboard
rootDirectory: "apps/web"
```

**Why it fails:**
- Vercel runs `npm install` from `apps/web` before custom commands
- Can't access root `package.json` with workspaces
- Workspace dependencies fail to install

**Solution:**
- Unset rootDirectory in dashboard
- Link from repository root
- Use `outputDirectory` in `vercel.json` instead

### ❌ Don't Use cd Commands in vercel.json

**Problem:**
```json
{
  "buildCommand": "cd ../.. && npm run build:web"
}
```

**Why it fails:**
- When rootDirectory is unset, Vercel already runs from root
- `cd ../..` goes up too many directories
- Commands fail with "directory not found"

**Solution:**
- When rootDirectory is null, run commands directly from root
- No `cd` needed - Vercel is already in the right place

### ❌ Don't Forget Suspense Boundaries

**Problem:**
```typescript
export default function Page() {
  const searchParams = useSearchParams(); // ❌ Error in production build
}
```

**Why it fails:**
- Next.js 16 requires Suspense for `useSearchParams()` during static generation
- Build fails with "should be wrapped in a suspense boundary"

**Solution:**
- Always wrap components using `useSearchParams()` in Suspense
- Provide a loading fallback

### ❌ Don't Link Project from Subdirectory

**Problem:**
```bash
cd apps/web
vercel link  # Creates .vercel in apps/web/
```

**Why it's confusing:**
- Vercel actually runs from repository root
- `.vercel` location doesn't match where commands run
- Harder to debug configuration issues

**Solution:**
```bash
cd /path/to/repo/root
vercel link --cwd .  # Creates .vercel in root
```

---

## Deployment Timeline

1. **Initial Setup** - Linked project, set rootDirectory to `apps/web`
2. **First Failure** - npm install failed (workspace issue)
3. **Configuration Changes** - Tried various `vercel.json` configurations
4. **TypeScript Errors** - Fixed route, Suspense, and type issues
5. **Root Directory Fix** - Unset rootDirectory, linked from root
6. **Success** - Build completed and deployed

**Total Time:** ~2 hours  
**Key Breakthrough:** Unsetting rootDirectory and linking from repository root

---

## Environment Variables Setup

After successful deployment, configure:

```bash
# Required
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Optional
NEXT_PUBLIC_BYPASS_AUTH=false
```

**Via CLI:**
```bash
cd /path/to/repo/root
vercel env add NEXT_PUBLIC_API_URL production
# Enter value when prompted
```

**Via Dashboard:**
- Go to Project Settings → Environment Variables
- Add each variable for Production, Preview, and/or Development

---

## Testing Checklist

After deployment:

- [ ] Visit production URL
- [ ] Test authentication flow (Clerk)
- [ ] Verify API connectivity (check browser console)
- [ ] Test key user flows (dashboard, access requests, etc.)
- [ ] Check for console errors
- [ ] Verify environment variables are set correctly
- [ ] Test on mobile devices
- [ ] Check Lighthouse scores

---

## Key Takeaways

1. **Monorepos need special handling** - Unset rootDirectory, link from root
2. **Next.js 16 is stricter** - TypeScript errors must be fixed, Suspense required
3. **Test locally first** - `npm run build:web` should match Vercel exactly
4. **Keep config minimal** - Let Vercel auto-detect when possible
5. **Check build logs** - Vercel dashboard has the most detailed error info

---

## Resources

- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Next.js 16 Deployment](https://nextjs.org/docs/deployment)
- [Next.js Suspense Boundaries](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

---

## Future Improvements

1. **CI/CD Integration** - Automate deployments on git push
2. **Preview Deployments** - Test PRs before merging
3. **Environment Management** - Use Vercel CLI for env var management
4. **Monitoring** - Set up error tracking (Sentry) and analytics
5. **Performance** - Optimize bundle size and Core Web Vitals

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Maintained By:** Development Team
