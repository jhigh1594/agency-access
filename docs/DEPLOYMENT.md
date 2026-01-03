# Deployment Guide

This guide covers deploying the Agency Access Platform. The platform consists of a Next.js frontend and a Fastify backend.

## Architecture

- **Frontend**: Next.js (App Router), deployed to **Vercel**.
- **Backend**: Fastify API, deployed to **Railway** (or Render/Heroku).
- **Database**: PostgreSQL (Neon).
- **Cache/Queue**: Redis (Upstash).
- **Secrets**: Infisical.

## 1. Backend Deployment (Railway)

The backend should be deployed first to obtain the API URL.

### Prerequisites

- Railway account connected to your GitHub repo.
- PostgreSQL database (e.g., Neon).
- Redis instance (e.g., Upstash).
- Infisical project set up.

### Deployment Steps

1. Create a new project on Railway.
2. Add a service from your GitHub repository.
3. Set the **Root Directory** to `apps/api`.
4. Configure the following environment variables:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `DATABASE_URL` (PostgreSQL connection string)
   - `REDIS_URL` (Redis connection string)
   - `FRONTEND_URL` (Your Vercel deployment URL)
   - `INFISICAL_CLIENT_ID` / `INFISICAL_CLIENT_SECRET` / `INFISICAL_PROJECT_ID` / `INFISICAL_ENV`
   - `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
   - Platform OAuth credentials (META_APP_ID, etc.)
5. Railway will automatically build and deploy using the `build` and `start` scripts in `apps/api/package.json`.

## 2. Frontend Deployment (Vercel)

### Prerequisites

- Vercel account connected to your GitHub repo.
- Deployed backend URL (from step 1).

### Deployment Steps

1. Create a new project on Vercel.
2. Select your repository.
3. Configure the **Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
4. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g., `https://api.yourdomain.com`)
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (e.g., `https://app.yourdomain.com`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Deploy. Vercel will use the `vercel.json` in the root to build the monorepo correctly.

## 3. Post-Deployment Configuration

### OAuth Callbacks

Ensure your OAuth applications (Meta, Google, etc.) have the correct callback URLs:
- `https://api.yourdomain.com/agency-platforms/meta/callback`
- `https://api.yourdomain.com/agency-platforms/google/callback`

### Clerk Configuration

Update your Clerk dashboard with the production URLs:
- **Home URL**: `https://app.yourdomain.com`
- **Redirect URLs**: After sign-in/sign-up.

## Monitoring

- **Vercel**: Deployment logs and Vercel Analytics.
- **Railway**: Runtime logs and service health.
- **Sentry**: (Optional) For error tracking.

