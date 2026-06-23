# Render Deployment Guide

This guide covers deploying the Agency Access Platform to Render using the `render.yaml` blueprint.

## Architecture

- **Frontend**: Next.js (App Router) on Vercel
- **Backend**: Fastify API on Render Web Service
- **Database**: PostgreSQL (Neon) - also used for job queues (pg-boss)
- **Secrets**: Infisical

## 1. Create Render Project (Blueprint)

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New** → **Blueprint**
3. Select your GitHub repo
4. Render reads `render.yaml` and creates `agency-access-api`. The web app deploys from Vercel.

## 2. Configure Environment Variables

Set environment variables for each service in the Render dashboard.

### Backend (API)

Required:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://runtime_user:...@.../neondb?sslmode=require
MIGRATE_DATABASE_URL=postgresql://migration_owner:...@.../neondb?sslmode=require
FRONTEND_URL=https://your-app.vercel.app
API_URL=https://your-service.onrender.com
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=prod
META_APP_ID=...
META_APP_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CREEM_API_KEY=...
CREEM_WEBHOOK_SECRET=...
OAUTH_STATE_HMAC_SECRET=$(openssl rand -hex 32)
SENTRY_WEBHOOK_SECRET=$(openssl rand -hex 32)
DB_ENFORCE_LEAST_PRIVILEGE=true
BACKGROUND_WORKERS_ENABLED=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_SKIP_AUTHENTICATED=true
TRUST_PROXY_IPS=<Render trusted proxy CIDRs>
```

Pre-launch deploys should keep `BACKGROUND_WORKERS_ENABLED=false` to avoid background polling cost while there is no customer traffic. Turn it on only when token refresh, notifications, scheduled webhooks, and other background jobs are intentionally part of the launch posture.

Production startup fails when `OAUTH_STATE_HMAC_SECRET` is missing or shorter than 32 characters. Sentry webhook delivery also fails closed in production unless `SENTRY_WEBHOOK_SECRET` is configured and incoming requests include a valid signature.

Optional:

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=...
RESEND_API_KEY=...
LOG_LEVEL=info
```

### Frontend (Web)

Required:

```bash
NEXT_PUBLIC_API_URL=https://your-service.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

Optional:

```bash
NEXT_PUBLIC_BRANDFETCH_CLIENT_ID=...
NEXT_PUBLIC_CREEM_PUBLISHABLE_KEY=pk_live_...
```

## 3. Deploy

1. Deploy the API service first.
2. Deploy the web app from Vercel second.

Render will:
- Install dependencies at repo root
- Build shared package + app
- Run `DATABASE_URL="${MIGRATE_DATABASE_URL:-$DATABASE_URL}" PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 npx prisma migrate deploy` during service startup
- Start the service using `render.yaml` commands

## 4. Prisma Migrations

Production schema changes must use committed Prisma migrations. Because this service stays on Render Free, migrations run from the `startCommand` before `npm start`:

```bash
cd apps/api
DATABASE_URL="${MIGRATE_DATABASE_URL:-$DATABASE_URL}" PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 npx prisma migrate deploy
```

`MIGRATE_DATABASE_URL` should use a migration-capable database role. `DATABASE_URL` should use the least-privilege runtime role used by the API after migrations finish.

The advisory lock is disabled for this Free-plan startup path because the previous live process can still hold pg-boss advisory locks while Render is starting the replacement process. Keep Render at one instance while using this startup migration pattern.

If the service later moves to a paid instance type, prefer Render's `preDeployCommand` for migrations so database changes complete before the new web process starts.

Do not use `prisma db push` against production. Use it only for local development experiments where migration history is not being preserved.

## 5. Update External Integrations

- **OAuth apps**: update redirect URLs to Render API domain
- **Clerk**: update allowed origins and redirect URLs to Render web domain
- **Creem**: update webhook endpoint to Render API domain

## 6. Health Checks

- API: `https://your-service.onrender.com/health`
- Web: load `https://your-app.vercel.app`

## 7. Logs

Use Render dashboard or CLI:

```bash
render logs
```

## Notes

- Keep Neon as external managed PostgreSQL service.
- Job queues use pg-boss (Postgres-backed) - no separate Redis required.
- `render.yaml` is the source of truth for build, migration, and start commands.
