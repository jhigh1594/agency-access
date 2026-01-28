# Render Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate both API and web from Railway/Vercel to Render, keeping Neon Postgres + Upstash Redis, and update docs/config accordingly.

**Architecture:** Two Render web services from the monorepo root: `apps/api` (Fastify) and `apps/web` (Next.js). External managed services (Neon + Upstash) remain, wired via env vars. Use `render.yaml` blueprint for repeatable infra.

**Tech Stack:** Render, Node 20, Fastify, Next.js, Prisma, Neon Postgres, Upstash Redis, Infisical, Clerk.

---

### Task 1: Confirm Render workspace context

**Files:** none

**Step 1: Verify CLI auth**

```bash
render whoami
```

Expected: your Render user details

**Step 2: Confirm active workspace**

```bash
render workspace list
```

Expected: see target workspace; switch if needed.

**Step 3: Commit**

No commit (no code changes).

---

### Task 2: Add `render.yaml` blueprint

**Files:**
- Create: `render.yaml`

**Step 1: Write the blueprint**

```yaml
services:
  - type: web
    name: agency-access-api
    env: node
    plan: free
    rootDir: .
    buildCommand: npm install && npm run build --workspace=packages/shared && cd apps/api && npm run db:generate && npm run build
    startCommand: cd apps/api && npm start
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        sync: false
      - key: API_URL
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: CLERK_PUBLISHABLE_KEY
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
      - key: INFISICAL_CLIENT_ID
        sync: false
      - key: INFISICAL_CLIENT_SECRET
        sync: false
      - key: INFISICAL_PROJECT_ID
        sync: false
      - key: INFISICAL_ENVIRONMENT
        value: production
      - key: META_APP_ID
        sync: false
      - key: META_APP_SECRET
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: LINKEDIN_CLIENT_ID
        sync: false
      - key: LINKEDIN_CLIENT_SECRET
        sync: false
      - key: TIKTOK_APP_ID
        sync: false
      - key: TIKTOK_APP_SECRET
        sync: false
      - key: MAILCHIMP_CLIENT_ID
        sync: false
      - key: MAILCHIMP_CLIENT_SECRET
        sync: false
      - key: PINTEREST_CLIENT_ID
        sync: false
      - key: PINTEREST_CLIENT_SECRET
        sync: false
      - key: KLAVIYO_CLIENT_ID
        sync: false
      - key: KLAVIYO_CLIENT_SECRET
        sync: false
      - key: SHOPIFY_API_KEY
        sync: false
      - key: SHOPIFY_API_SECRET_KEY
        sync: false
      - key: BEEHIIV_API_KEY
        sync: false
      - key: CREEM_API_KEY
        sync: false
      - key: CREEM_WEBHOOK_SECRET
        sync: false
      - key: CREEM_API_URL
        value: https://api.creem.io/v1
      - key: LOG_LEVEL
        value: info

  - type: web
    name: agency-access-web
    env: node
    plan: free
    rootDir: .
    buildCommand: npm install && npm run build --workspace=packages/shared && npm run build --workspace=apps/web
    startCommand: cd apps/web && npm run start
    autoDeploy: true
    envVars:
      - key: NEXT_PUBLIC_API_URL
        sync: false
      - key: NEXT_PUBLIC_APP_URL
        sync: false
      - key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
      - key: NEXT_PUBLIC_BRANDFETCH_CLIENT_ID
        sync: false
      - key: NEXT_PUBLIC_CREEM_PUBLISHABLE_KEY
        sync: false
```

**Step 2: Commit**

```bash
git add render.yaml
git commit -m "feat: add Render blueprint"
```

---

### Task 3: Update deployment docs to Render

**Files:**
- Modify: `README.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/PRODUCTION_CHECKLIST.md`
- Modify: `docs/PRODUCTION_OAUTH_SETUP.md`
- Modify: `docs/PRODUCTION_OAUTH_SUMMARY.md`
- Modify: `docs/VERCEL_DEPLOYMENT.md` (replace with Render web guidance)
- Modify: `docs/VERCEL_DEPLOYMENT_LESSONS_LEARNED.md` (mark deprecated or update)

**Step 1: Replace Railway/Vercel references with Render**
- Update deployment sections to “Render (API + Web)”
- Replace CLI examples with Render equivalents (dashboard + `render` CLI)
- Update env var instructions to set `FRONTEND_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` to Render URLs
- Update OAuth callback examples to Render API URL
- Note that Neon + Upstash remain external

**Step 2: Commit**

```bash
git add README.md docs/DEPLOYMENT.md docs/PRODUCTION_CHECKLIST.md docs/PRODUCTION_OAUTH_SETUP.md docs/PRODUCTION_OAUTH_SUMMARY.md docs/VERCEL_DEPLOYMENT.md docs/VERCEL_DEPLOYMENT_LESSONS_LEARNED.md
git commit -m "docs: migrate deployment guides to Render"
```

---

### Task 4: Remove Railway-specific artifacts

**Files:**
- Delete: `railway.json`
- Delete: `deploy-railway.sh`
- Delete: `setup-railway.sh`
- Modify or delete: `docs/RAILWAY_*` files (either remove or mark deprecated in a single “Legacy Railway” doc)

**Step 1: Delete/mark deprecated**
- If keeping, consolidate to one `docs/RAILWAY_DEPRECATED.md` stating Render is the new path.

**Step 2: Commit**

```bash
git add railway.json deploy-railway.sh setup-railway.sh docs/RAILWAY_*.md
git commit -m "chore: remove Railway deployment artifacts"
```

---

### Task 5: Add Render deployment guide (new)

**Files:**
- Create: `docs/RENDER_DEPLOYMENT.md`

**Step 1: Write guide**
Include:
- Create Render project from repo using `render.yaml`
- Set env vars for API + Web
- Add custom domains (if needed)
- Set `FRONTEND_URL` and `API_URL` to Render URLs
- Run Prisma `db:push` as a Render one-off command (dashboard or CLI)
- Health check at `/health`
- Logs via `render logs`

**Step 2: Commit**

```bash
git add docs/RENDER_DEPLOYMENT.md
git commit -m "docs: add Render deployment guide"
```

---

### Task 6: Verify build locally (optional but recommended)

**Files:** none

**Step 1: Run build to confirm monorepo commands**

```bash
npm run build
```

Expected: API and web build pass.

**Step 2: Commit**

No commit (verification only).

---

### Task 7: Create Render services (manual/dashboard)

**Files:** none

**Step 1: Import blueprint**
- Render dashboard → New → Blueprint → select repo
Expected: two services created (`agency-access-api`, `agency-access-web`)

**Step 2: Configure env vars**
- Set all `sync: false` vars in Render
- Ensure `API_URL` points to Render API service URL
- Ensure `FRONTEND_URL` points to Render web service URL
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL`

**Step 3: First deploy**
- Deploy API first; then update web env vars if needed

---

### Task 8: Update external integrations

**Files:** none

**Step 1: OAuth providers**
- Update redirect URIs to new Render API URL (Meta, Google, etc.)

**Step 2: Clerk**
- Update Clerk allowed origins + redirect URLs to Render web URL

**Step 3: Creem**
- Update webhook endpoint to Render API URL

---

### Task 9: Cutover and validate

**Files:** none

**Step 1: Smoke test**
- `GET /health` returns ok
- End-to-end auth flow
- OAuth callback completes
- Dashboard data loads

**Step 2: Decommission old services**
- Disable Railway + Vercel projects once confirmed stable
