# Deployment Guide

This guide covers deploying the Agency Access Platform. The platform consists of a Next.js frontend and a Fastify backend.

## Architecture

- **Frontend**: Next.js (App Router), deployed to **Render**.
- **Backend**: Fastify API, deployed to **Render**.
- **Database**: PostgreSQL (Neon).
- **Cache/Queue**: Redis (Upstash).
- **Secrets**: Infisical.

## 1. Backend Deployment (Render)

The backend should be deployed first to obtain the API URL.

### Prerequisites

- Render account connected to your GitHub repo.
- PostgreSQL database (e.g., Neon).
- Redis instance (e.g., Upstash).
- Infisical project set up.

### Deployment Steps

1. Create a new project on Render using the `render.yaml` blueprint.
2. Configure the following environment variables for the API service:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `DATABASE_URL` (PostgreSQL connection string)
   - `REDIS_URL` (Redis connection string)
   - `FRONTEND_URL` (Your Render frontend URL)
   - `INFISICAL_CLIENT_ID` / `INFISICAL_CLIENT_SECRET` / `INFISICAL_PROJECT_ID` / `INFISICAL_ENV`
   - `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
   - Platform OAuth credentials (META_APP_ID, etc.)
3. Render will automatically build and deploy using the commands in `render.yaml`.

## 2. Frontend Deployment (Render)

### Prerequisites

- Render account connected to your GitHub repo.
- Deployed backend URL (from step 1).

### Deployment Steps

1. Use the same Render project and ensure the frontend service is created from `render.yaml`.
2. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g., `https://api.yourdomain.com`)
   - `NEXT_PUBLIC_APP_URL`: Your Render frontend URL (e.g., `https://app.yourdomain.com`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Deploy. Render will use the `render.yaml` commands to build the monorepo correctly.

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

- **Render**: Deployment logs and runtime metrics.
- **Sentry**: (Optional) For error tracking.
