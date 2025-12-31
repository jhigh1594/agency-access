# Meta OAuth Implementation - Session Summary

**Date:** 2025-12-30

## Problem Solved

Fixed Meta OAuth integration that was failing with "Invalid Scopes" and redirect issues.

## Root Causes Identified

1. **Wrong Permission Type:** Connector was using Facebook Login permissions (`email`, `public_profile`) instead of Marketing API permissions (`ads_management`, `business_management`)

2. **Deprecated Instagram Scopes:** The `instagram_basic` and `instagram_manage_insights` scopes are no longer valid OAuth scopes - Instagram Business accounts are accessed through Facebook Pages via `business_management`

3. **Default Parameter `this` Binding Issue:** Using `this.DEFAULT_SCOPES` as a default parameter value caused transpilation/runtime issues where `scopes` was undefined

4. **Wrong Callback Endpoint:** Redirect URI pointed to test endpoint (`/api/oauth/meta/callback`) which returned HTML instead of redirecting to frontend

## Changes Made

### 1. `apps/api/src/services/connectors/meta.ts`

**Changed default scopes from Facebook Login to Marketing API:**
```typescript
// BEFORE (Facebook Login - wrong)
getAuthUrl(state: string, scopes: string[] = ['email', 'public_profile'])

// AFTER (Marketing API - correct)
static readonly DEFAULT_SCOPES = [
  'ads_management',      // Create and manage ads
  'ads_read',            // Read ads data
  'business_management', // Access Business Manager assets
  'pages_read_engagement', // Read page content and insights
  'pages_show_list',     // Show list of pages user manages
];
```

**Fixed default parameter binding issue:**
```typescript
// BEFORE (this binding issue with default params)
getAuthUrl(state: string, scopes: string[] = this.DEFAULT_SCOPES): string {
  scope: scopes.join(','), // threw "Cannot read properties of undefined"

// AFTER (explicit null check)
getAuthUrl(state: string, scopes?: string[]): string {
  const scopesToUse = scopes ?? MetaConnector.DEFAULT_SCOPES;
  scope: scopesToUse.join(','),
```

**Updated getUserInfo to remove email (not available with Marketing API)**
```typescript
// BEFORE
async getUserInfo(accessToken: string): Promise<{
  id: string; name: string; email?: string;
}>

// AFTER
async getUserInfo(accessToken: string): Promise<{
  id: string; name: string;
}>
```

**Changed redirect URI from test to production endpoint:**
```typescript
// BEFORE
this.redirectUri = `${env.API_URL}/api/oauth/meta/callback`;

// AFTER
this.redirectUri = `${env.API_URL}/agency-platforms/meta/callback`;
```

### 2. `apps/api/src/routes/oauth-test.ts`

Fixed display string to handle missing email:
```typescript
// BEFORE
<p><strong>User:</strong> ${userInfo.name} (${userInfo.email || 'no email'})</p>

// AFTER
<p><strong>User:</strong> ${userInfo.name} (Marketing API - email not available)</p>
```

## Key Learnings

### Meta Has Two Separate Permission Systems

1. **Facebook Login Permissions** (`email`, `public_profile`)
   - For user authentication/identity
   - Used by consumer apps
   - NOT for ads management

2. **Marketing API Permissions** (`ads_management`, `business_management`)
   - For ads and business management
   - Used by agency/business tools
   - What agencies actually need

### Default Parameter `this` Binding in TypeScript

Using `this` in default parameter values can cause issues:
```typescript
// Problematic - transpilation may bind `this` incorrectly
getAuthUrl(state: string, scopes: string[] = this.DEFAULT_SCOPES)

// Better pattern - explicit null coalescing
getAuthUrl(state: string, scopes?: string[]) {
  const scopesToUse = scopes ?? ClassName.DEFAULT_SCOPES;
}
```

### OAuth Callback Architecture

- **Test endpoint** (`/api/oauth/meta/callback`): Returns HTML for debugging, no redirect
- **Production endpoint** (`/agency-platforms/meta/callback`): Processes OAuth and redirects to frontend

## Meta App Configuration Required

### Permissions to Add (Standard Access - Auto-Approved)
- `ads_management`
- `ads_read`
- `business_management`
- `pages_read_engagement`

### Features to Add
- **Ads Management Standard Access**
- **Business Management Basic Access**

### Redirect URIs
- Development: `http://localhost:3001/agency-platforms/meta/callback`
- Production: `https://your-api-domain.com/agency-platforms/meta/callback`

### Instagram Access
Instagram Business accounts are accessed through Facebook Pages via the `business_management` scope. No additional Instagram-specific OAuth scopes are required.

## Testing the Flow

1. Initiate: `POST /agency-platforms/meta/initiate`
2. User authorizes with Meta
3. Callback: `GET /agency-platforms/meta/callback?code=...&state=...`
4. Backend:
   - Exchanges code for short-lived token
   - Exchanges for long-lived token (60 days)
   - Stores in Infisical (secrets management)
   - Creates AgencyPlatformConnection record
5. Redirect to frontend: `FRONTEND_URL/?success=true&platform=meta`

## Related Files

- `apps/api/src/services/connectors/meta.ts` - Meta OAuth connector
- `apps/api/src/routes/agency-platforms.ts` - Agency OAuth flow routes
- `apps/api/src/routes/oauth-test.ts` - Test OAuth flow (debugging)
- `apps/api/src/services/agency-platform.service.ts` - Connection management
- `packages/shared/src/types.ts` - Platform type definitions and scopes

## Sources

- [Meta Marketing API Authorization](https://developers.facebook.com/docs/marketing-api/get-started/authorization/)
- [Ads Management Standard Access](https://developers.facebook.com/docs/features-reference/ads-management-standard-access/)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/)
