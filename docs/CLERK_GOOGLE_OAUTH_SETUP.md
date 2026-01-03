# Clerk Google OAuth Setup

## Problem

When trying to sign in with Clerk using Google, you're getting:
```
Missing required parameter: client_id
Error 400: invalid_request
```

This means Clerk needs Google OAuth credentials configured in the Clerk dashboard.

## Solution

Clerk requires separate Google OAuth credentials for user authentication (signing in to your app). This is **different** from the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` used for platform connectors.

### Step 1: Create Google OAuth Credentials for Clerk

**Important:** You need a **separate** Google OAuth client ID for Clerk authentication. This is different from the one used for platform connectors.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**

**Application Type:** Web application

**Name:** `Clerk Authentication` (or similar)

**Authorized redirect URIs:**
```
https://accounts.clerk.dev/v1/oauth_callback
https://accounts.clerk.com/v1/oauth_callback
https://[your-clerk-frontend-api].clerk.accounts.dev/v1/oauth_callback
```

**Note:** Clerk will provide the exact redirect URI in the dashboard. Use that exact URI.

### Step 2: Configure Google in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to **User & Authentication** → **Social Connections**
4. Find **Google** in the list
5. Click **Configure** or toggle it **ON**

### Step 3: Add Google OAuth Credentials

In the Google provider configuration:

1. **Client ID:** Paste your Google OAuth Client ID
2. **Client Secret:** Paste your Google OAuth Client Secret
3. Click **Save**

### Step 4: Verify Configuration

1. Go to your app's sign-in page
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth consent screen
4. After authorizing, you should be signed in

## Important Notes

### Two Different Google OAuth Apps

You need **two separate** Google OAuth client IDs:

1. **Clerk Authentication** (for users signing in to your app)
   - Used by Clerk for user authentication
   - Configured in Clerk Dashboard → Social Connections
   - Redirect URI: Clerk's callback URL

2. **Platform Connectors** (for connecting agency/client Google accounts)
   - Used by your platform connectors (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
   - Configured in Railway environment variables
   - Redirect URI: `https://your-service.railway.app/agency-platforms/google/callback`

### Why Two Separate Apps?

- **Clerk OAuth:** Handles user authentication (signing in to your app)
- **Platform OAuth:** Handles connecting Google accounts for platform access (Ads, GA4, etc.)

These serve different purposes and need different redirect URIs.

## Troubleshooting

### "Missing required parameter: client_id"

**Causes:**
- Google provider not enabled in Clerk
- Client ID not set in Clerk dashboard
- Client ID is empty or incorrect

**Solution:**
1. Go to Clerk Dashboard → Social Connections
2. Verify Google is enabled
3. Verify Client ID and Client Secret are filled in
4. Save and try again

### "redirect_uri_mismatch"

**Causes:**
- Redirect URI in Google Cloud Console doesn't match Clerk's callback URL

**Solution:**
1. Go to Clerk Dashboard → Social Connections → Google
2. Copy the exact redirect URI shown
3. Go to Google Cloud Console → Credentials → Your OAuth Client
4. Add the exact redirect URI to "Authorized redirect URIs"
5. Save and try again

### "Access blocked: This app's request is invalid"

**Causes:**
- OAuth consent screen not configured
- App not published or test users not added

**Solution:**
1. Go to Google Cloud Console → OAuth consent screen
2. Configure required fields (app name, support email, etc.)
3. Add test users OR publish the app
4. Try again

## Quick Checklist

- [ ] Created Google OAuth client ID in Google Cloud Console
- [ ] Added Clerk redirect URI to "Authorized redirect URIs"
- [ ] Enabled Google provider in Clerk Dashboard
- [ ] Added Client ID to Clerk Dashboard
- [ ] Added Client Secret to Clerk Dashboard
- [ ] Tested sign-in flow

## Reference

- [Clerk Social Connections Documentation](https://clerk.com/docs/authentication/social-connections)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

