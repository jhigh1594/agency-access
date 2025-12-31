# Meta Client Connection Reference

## Overview

This document summarizes the implementation of Meta (Facebook) integration for client authorization. Clients can authorize their Meta accounts through a single link, allowing agencies to access their Ad Accounts, Facebook Pages, and Instagram Business accounts.

## Core Flow

1. **Initiate**: Client clicks "Connect Meta" in the access request wizard.
2. **Authorize**: Client is redirected to Meta's OAuth dialog with required Marketing API scopes.
3. **Callback**: Meta redirects back with an authorization code.
4. **Exchange**: Backend exchanges code for a short-lived token, then immediately for a **long-lived token (60 days)**.
5. **Storage**: Tokens are stored securely in Infisical; metadata is stored in PostgreSQL.
6. **Asset Selection**: Client selects specific Ad Accounts, Pages, and Instagram accounts to share.
7. **Confirmation**: Selections are saved to the `ClientConnection` record.

## Required OAuth Scopes

The integration uses Marketing API scopes (not standard Facebook Login scopes):

- `ads_management`: Create and manage ads
- `ads_read`: Read ad account data
- `business_management`: Access Business Manager assets (includes Pages and Instagram)
- `pages_read_engagement`: Read page content and insights

Note: Instagram Business accounts are accessed through Facebook Pages via `business_management` scope. No Instagram-specific OAuth scopes are needed.

## Backend Implementation

### OAuth Scopes Extraction
In `apps/api/src/routes/client-auth.ts`, scopes are set for Meta/Meta Ads:
- Marketing API scopes: `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`
- Instagram Business accounts are accessed via `business_management` (no separate OAuth scopes needed)

### Token Management
- **Long-lived Tokens**: Meta tokens are exchanged for 60-day versions.
- **Refresh**: Meta does NOT support refresh tokens. Re-authorization is required before expiration.
- **Storage**: Secret name format: `meta_client_{connectionId}`.

### Asset Fetching
Uses `ClientAssetsService` with the following Graph API endpoints:
- **Ad Accounts**: `GET /v21.0/me/adaccounts`
- **Pages**: `GET /v21.0/me/accounts`
- **Instagram**: Two-step process:
  1. `GET /v21.0/me/businesses`
  2. `GET /v21.0/{business_id}/instagram_accounts` for each business.

## Frontend Components

### MetaAssetSelector
Located at `apps/web/src/components/client-auth/MetaAssetSelector.tsx`:
- Fetches assets from `GET /api/client-assets/:connectionId/meta_ads`.
- Grouped by Ad Accounts, Pages, and Instagram Accounts.
- Uses `AssetGroup` for a consistent look and feel with Google.

## Key Files

- `apps/api/src/services/connectors/meta.ts`: Core OAuth logic and Meta-specific API calls.
- `apps/api/src/routes/client-auth.ts`: Public endpoints for the client authorization flow.
- `apps/api/src/services/client-assets.service.ts`: Backend service for fetching user-scoped assets.
- `apps/web/src/components/client-auth/MetaAssetSelector.tsx`: Frontend selection UI.

## Common Issues & Troubleshooting

### Invalid Scopes
- Ensure the Meta App has "Marketing API" added as a product.
- Verify that requested scopes are approved for the app in the Meta Developer Console.
- Test with a user who has roles (Admin/Advertiser) on the target assets.

### Missing Instagram Accounts
- Instagram accounts must be linked to a Meta Business Manager.
- The user must have permissions to the Business Manager owning the Instagram account.
- "Instagram Graph API" must be added as a product in the Meta App settings.

### Token Expiration
- Long-lived tokens last 60 days.
- Agencies should be notified when a client's token is nearing expiration (e.g., at 50 days).
- Clients must click the original link (or a new one) to re-authorize and refresh the token.

