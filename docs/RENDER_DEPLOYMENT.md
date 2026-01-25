# Render Deployment Guide

This guide covers deploying the Agency Access Platform to Render using the `render.yaml` blueprint.

## Architecture

- **Frontend**: Next.js (App Router) on Render Web Service
- **Backend**: Fastify API on Render Web Service
- **Database**: PostgreSQL (Neon)
- **Cache/Queue**: Redis (Upstash)
- **Secrets**: Infisical

## 1. Create Render Project (Blueprint)

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New** → **Blueprint**
3. Select your GitHub repo
4. Render reads `render.yaml` and creates:
   - `agency-access-api`
   - `agency-access-web`

## 2. Configure Environment Variables

Set environment variables for each service in the Render dashboard.

### Backend (API)

Required:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
FRONTEND_URL=https://your-app.onrender.com
API_URL=https://your-service.onrender.com
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=production
META_APP_ID=...
META_APP_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CREEM_API_KEY=...
CREEM_WEBHOOK_SECRET=...
```

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
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
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
2. Deploy the web service second.

Render will:
- Install dependencies at repo root
- Build shared package + app
- Start the service using `render.yaml` commands

## 4. Run Prisma Schema Push

If the database is new or the schema changed:

```bash
cd apps/api
npm run db:push
```

You can run this locally using the production `DATABASE_URL`, or use Render one-off command execution.

## 5. Update External Integrations

- **OAuth apps**: update redirect URLs to Render API domain
- **Clerk**: update allowed origins and redirect URLs to Render web domain
- **Creem**: update webhook endpoint to Render API domain

## 6. Health Checks

- API: `https://your-service.onrender.com/health`
- Web: load `https://your-app.onrender.com`

## 7. Logs

Use Render dashboard or CLI:

```bash
render logs
```

## Notes

- Keep Neon + Upstash as external managed services.
- `render.yaml` is the source of truth for build/start commands.
