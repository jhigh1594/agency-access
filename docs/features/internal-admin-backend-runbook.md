# Internal Admin Backend Runbook

## Purpose
Operational guide for the internal admin backend at:
- Web: `/internal/admin`, `/internal/admin/agencies`, `/internal/admin/subscriptions`
- API: `/api/internal-admin/*`

## Access Model
- Internal admin access is enforced server-side in API middleware.
- A request must pass both:
  - `authenticate()` (valid Clerk JWT)
  - `requireInternalAdmin()` (allowlisted principal)

## Environment Setup

Backend env (`apps/api/.env`):
- `INTERNAL_ADMIN_USER_IDS`:
  - Comma-separated Clerk user IDs.
  - Example: `user_abc,user_def`
- `INTERNAL_ADMIN_EMAILS`:
  - Comma-separated emails (case-insensitive match).
  - Example: `admin@company.com,ops@company.com`

Rules:
- Leave both empty to deny all internal-admin access.
- Prefer user ID allowlisting for deterministic identity matching.

## Endpoint Inventory and Permissions

Read endpoints (internal admin only):
- `GET /api/internal-admin/overview`
- `GET /api/internal-admin/agencies`
- `GET /api/internal-admin/agencies/:agencyId`
- `GET /api/internal-admin/subscriptions`

Mutation endpoints (internal admin only):
- `POST /api/internal-admin/subscriptions/:agencyId/upgrade`
- `POST /api/internal-admin/subscriptions/:agencyId/cancel`

Expected error responses:
- `401` when JWT is missing/invalid.
- `403` when user is authenticated but not allowlisted.
- `400` for validation errors.

## Rollback Procedure

Fast disable (recommended):
1. Set `INTERNAL_ADMIN_USER_IDS=` and `INTERNAL_ADMIN_EMAILS=` in API env.
2. Redeploy API.

Hard disable:
1. Remove route registration for `internalAdminRoutes` in `apps/api/src/index.ts`.
2. Redeploy API.
3. Optionally remove/hide frontend links to `/internal/admin*`.

## Verification Checklist
1. Allowlisted user can access `/api/internal-admin/overview` and receives `200`.
2. Non-allowlisted authenticated user receives `403`.
3. Missing auth receives `401`.
4. Upgrade/cancel mutation endpoints are blocked for non-allowlisted users.
