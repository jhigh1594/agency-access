# Sentry Webhook Troubleshooting Guide

## Current Status

✅ **Webhook endpoint is deployed and healthy**
- Health check: `https://agency-access.onrender.com/api/webhooks/sentry/health`
- Returns 200 OK with tasks directory path

✅ **Signature verification is working**
- Rejects unsigned requests with 401 INVALID_SIGNATURE
- This proves the endpoint is reachable and processing requests

❓ **Issue: Sentry webhooks not arriving**

## Sentry-Side Checklist

### 1. Verify Webhook URL in Sentry

Go to **Sentry → Settings → Integrations → Webhooks**:

- [ ] Webhook URL is exactly: `https://agency-access.onrender.com/api/webhooks/sentry`
- [ ] No trailing slash
- [ ] Using HTTPS (not HTTP)
- [ ] Webhook is **enabled** (toggle is on)

### 2. Check Alert Rules

Go to **Sentry → Alerts**:

- [ ] Alert rule exists for the project
- [ ] Alert rule has **Webhook action** configured
- [ ] Alert rule conditions are being met (e.g., "is new issue", "level is error")
- [ ] Alert rule is **enabled**

**To test alerts:**
1. Go to Alerts → [Your Rule] → Test Rule
2. OR trigger a real error in the application

### 3. Check Sentry Audit Log

Go to **Sentry → Settings → Audit Log**:

Look for webhook delivery attempts:
- [ ] Webhook POST events appear in the log
- [ ] Check for failed deliveries (4xx/5xx responses)
- [ ] Check for successful deliveries (200 responses)

### 4. Check Project Integration Settings

Go to **Sentry → [Project] → Settings → Integrations**:

- [ ] Webhooks integration is **enabled for this specific project**
- [ ] The project is subscribed to webhook events

### 5. Verify Webhook Secret (if configured)

If using signature verification:

- [ ] `SENTRY_WEBHOOK_SECRET` is set in Render environment
- [ ] The same secret is configured in Sentry's webhook settings
- [ ] Secret matches exactly (no extra spaces/newlines)

## Common Issues

### Issue: "Test Alert" button in Sentry doesn't send webhook

**Cause:** Sentry's "Test Alert" may not trigger webhooks for all rule types.

**Fix:** Trigger a real error instead:
```bash
curl -X GET "https://agency-access.onrender.com/test/sentry/error"
```

### Issue: Webhooks work locally but not in production

**Cause:** Firewall, CORS, or network restrictions.

**Fix:**
- Verify production URL is accessible from internet
- Check if Sentry can reach the endpoint (no IP allowlisting)

### Issue: Signature verification fails

**Cause:** Secret mismatch or HMAC encoding issue.

**Fix:**
- Verify `SENTRY_WEBHOOK_SECRET` environment variable
- Check Sentry sends signature in `x-sentry-signature` header
- Verify signature format (base64-encoded HMAC-SHA256)

## How to Verify Webhook Receipt

### Option 1: Check Render Logs

1. Go to Render Dashboard → Your Service → Logs
2. Filter for: `[SENTRY WEBHOOK]`
3. Look for log entries like:
   ```
   [SENTRY WEBHOOK] Received webhook request { action: "created", ... }
   ```

### Option 2: Check Task Files Directory

```bash
# List recent task files (requires auth)
curl -s "https://agency-access.onrender.com/api/webhooks/sentry/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 3: Check Audit Log in Database

Query the audit log for webhook events:
```sql
SELECT * FROM "AuditLog"
WHERE action = 'SENTRY_WEBHOOK_ISSUE_CREATED'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Next Steps

1. **Verify Sentry webhook URL** is correct and enabled
2. **Check Sentry audit log** for webhook delivery attempts
3. **Trigger a real error** in the application
4. **Watch Render logs** for `[SENTRY WEBHOOK]` entries
5. **If still not working**, temporarily disable signature verification by removing `SENTRY_WEBHOOK_SECRET` from environment

## Expected Log Output

When Sentry sends a webhook, you should see in Render logs:

```
INFO [SENTRY WEBHOOK] Received webhook request {
  "action": "created",
  "issueId": "12345",
  "issueTitle": "ReferenceError: myUndefinedFunction is not defined",
  "hasSignature": true,
  "hasRawBody": true
}

INFO [SENTRY WEBHOOK] Processing action {
  "action": "created",
  "issueId": "12345",
  "issueTitle": "ReferenceError: myUndefinedFunction is not defined"
}

INFO Sentry issue task file created {
  "issueId": "12345",
  "shortId": "AGENCY-ACCESS-ABC",
  "filePath": "/opt/render/project/src/apps/api/.claude/tasks/sentry-issues/sentry-AGENCY-ACCESS-ABC-referenceerror-myundefinedfunction-is-not-defined.md"
}
```
