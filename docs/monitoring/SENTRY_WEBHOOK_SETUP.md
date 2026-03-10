# Sentry Webhook Integration Setup Guide

## Current Status

✅ **Backend Webhook Endpoint**: Implemented at `/api/webhooks/sentry`
✅ **Signature Verification**: HMAC SHA-256 with `SENTRY_WEBHOOK_SECRET`
✅ **Task File Generation**: Creates markdown files in `.claude/tasks/sentry-issues/`
✅ **Test Endpoints**: Available at `/api/test/sentry/*` for verification

❌ **Sentry-Side Integration**: Requires manual setup in Sentry UI

---

## Step 1: Create Sentry Webhook Integration (Sentry UI)

The Sentry API doesn't allow programmatic creation of webhook integrations without an existing configured integration. You'll need to set this up through the Sentry UI.

### Option A: Using Sentry Integration Platform

1. Go to: https://sentry.io/settings/authhub/integrations/
2. Click "Add Integration" → Search for "Webhooks"
3. Click "Configure" on the Webhooks integration
4. Enter webhook details:
   - **Name**: Agency Platform Webhook
   - **Webhook URL**: `https://agency-access.onrender.com/api/webhooks/sentry`
   - **Secret**: (Leave empty - we use environment variable for verification)
5. Enable events:
   - ✅ Issue Alert
   - ✅ New Issue
6. Click "Save Integration"

### Option B: Using Project-Specific Alert Rules

If Option A doesn't work, create alert rules directly on projects:

1. Navigate to: https://sentry.io/organizations/authhub/alerts/new/
2. Configure alert rule:
   - **Name**: Agency Platform Webhook Alert
   - **Project**: `node` (backend) or `javascript-nextjs` (frontend)
   - **Condition**: Every new event
   - **Action**: Send webhook to `https://agency-access.onrender.com/api/webhooks/sentry`
3. Click "Save Rule"

Repeat for both projects (`node` and `javascript-nextjs`).

---

## Step 2: Configure Environment Variable (Render)

Ensure `SENTRY_WEBHOOK_SECRET` is set in your Render deployment:

1. Go to Render Dashboard → Your API Service
2. Click "Environment" tab
3. Add/verify environment variable:
   ```
   SENTRY_WEBHOOK_SECRET=0775a88a3a02ab6049c6423136ff5f3f1d08c9f47c05949999df501ce4a63ca7
   ```
4. Click "Save Changes" and wait for redeployment

---

## Step 3: Test the Integration

### Method 1: Trigger a Test Error

Visit the test endpoint (will create a real Sentry error):
```
https://agency-access.onrender.com/api/test/sentry/error
```

Then check if a task file was created:
```bash
ls -la .claude/tasks/sentry-issues/
```

### Method 2: Check Webhook Health

```
https://agency-access.onrender.com/api/test/sentry/health
```

### Method 3: Verify in Sentry UI

1. Go to: https://sentry.io/organizations/authhub/issues/
2. Look for test errors
3. Check if webhook was triggered (may show in integration logs)

---

## Step 4: Verify Task Files

After triggering a test error, a task file should appear:

```bash
# List task files
ls -la .claude/tasks/sentry-issues/

# View a task file
cat .claude/tasks/sentry-issues/sentry-TEST-*.md
```

Task files contain:
- Issue details (ID, title, level, stack trace)
- User context (who was affected)
- Request context (URL, method)
- Breadcrumbs (recent events leading to error)
- Suggested investigation steps

---

## How AI Agents Use These Task Files

### Claude Code Integration

1. **Automatic Detection**: Claude Code monitors `.claude/tasks/` directory
2. **Task Assignment**: When a new Sentry task appears, agents can:
   - Read the issue details
   - Investigate the error
   - Propose fixes
   - Update the task file with findings

### Example Workflow

```bash
# 1. Error occurs in production
# 2. Sentry sends webhook → API endpoint
# 3. Task file created: .claude/tasks/sentry-issues/sentry-PROJ-123-reference-error.md
# 4. Claude Code detects new task
# 5. Agent investigates stack trace, proposes fix
# 6. Task file updated with resolution notes
```

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check API logs: `render logs --follow agency-access-platform`
2. Verify webhook URL is accessible
3. Check Sentry integration logs in UI

### Task Files Not Created

1. Verify `.claude/tasks/sentry-issues/` directory exists
2. Check API has write permissions
3. Look for errors in API logs

### Signature Verification Failing

1. Ensure `SENTRY_WEBHOOK_SECRET` matches between Sentry and API
2. Check webhook configuration in Sentry UI

---

## Security Considerations

- **HMAC Signature**: All webhooks verified using SHA-256 HMAC
- **Idempotency**: Duplicate webhook deliveries are ignored (audit log check)
- **Audit Trail**: All webhook deliveries logged to `AuditLog` table
- **Secret Rotation**: Rotate `SENTRY_WEBHOOK_SECRET` quarterly (use `openssl rand -hex 32`)

---

## Next Steps After Setup

1. **Verify**: Trigger test error and confirm task file creation
2. **Monitor**: Check `.claude/tasks/sentry-issues/` for new issues
3. **Automate**: Consider adding automated agent to investigate and resolve issues
4. **Refine**: Adjust alert conditions (e.g., only critical issues, specific environments)

---

## Additional Resources

- **Sentry Webhook Docs**: https://docs.sentry.io/organization/integrations/integration-platform/webhooks/
- **Sentry Alert Rules**: https://docs.sentry.io/product/alerts/alert-rules/
- **API Source**: `apps/api/src/routes/sentry-webhooks.ts`
- **Test Routes**: `apps/api/src/routes/sentry-test.routes.ts`
