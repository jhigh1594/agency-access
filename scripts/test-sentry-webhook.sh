#!/bin/bash

# Test Script for Sentry Webhook Integration
# Usage: ./scripts/test-sentry-webhook.sh [environment]
#   environment: "local" (default) or "production"

set -e

ENV="${1:-local}"
WEBHOOK_SECRET="${SENTRY_WEBHOOK_SECRET:-0775a88a3a02ab6049c6423136ff5f3f1d08c9f47c05949999df501ce4a63ca7}"

if [ "$ENV" = "local" ]; then
  BASE_URL="http://localhost:3001"
elif [ "$ENV" = "production" ]; then
  BASE_URL="https://agency-access.onrender.com"
else
  echo "Error: Invalid environment. Use 'local' or 'production'"
  exit 1
fi

echo "🧪 Testing Sentry Webhook Integration ($ENV)"
echo "═══════════════════════════════════════════"
echo ""

# 1. Health Check
echo "1️⃣  Health Check"
HEALTH=$(curl -s "$BASE_URL/api/test/sentry/health")
echo "   Status: $(echo "$HEALTH" | jq -r '.integration // .status // "unknown"')"
echo "   Tasks Directory: $(echo "$HEALTH" | jq -r '.tasksDirectory // "N/A"')"
echo "   Task Files: $(echo "$HEALTH" | jq -r '.taskFileCount // 0')"
echo ""

# 2. Trigger Test Error
echo "2️⃣  Triggering Test Error (will create Sentry event)"
echo "   This will send a real error to Sentry..."
read -p "   Continue? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  curl -s "$BASE_URL/api/test/sentry/error" > /dev/null
  echo "   ✅ Test error triggered"
  echo "   🔗 View: https://sentry.io/organizations/authhub/issues/"
  echo ""
  sleep 3
else
  echo "   ⏭️  Skipped error trigger"
  echo ""
fi

# 3. Check Task Files
echo "3️⃣  Checking for Task Files"
TASK_DIR=".claude/tasks/sentry-issues"
if [ -d "$TASK_DIR" ]; then
  TASK_COUNT=$(ls -1 "$TASK_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "   Found $TASK_COUNT task file(s)"

  if [ "$TASK_COUNT" -gt 0 ]; then
    echo ""
    echo "   📄 Recent Task Files:"
    ls -t "$TASK_DIR"/*.md 2>/dev/null | head -5 | while read -r file; do
      echo "      - $(basename "$file")"
    done
  fi
else
  echo "   ⚠️  Task directory not found: $TASK_DIR"
fi
echo ""

# 4. Generate Test Webhook Payload (for manual testing)
echo "4️⃣  Manual Webhook Test (Direct POST)"
echo "   You can manually test the webhook endpoint:"
echo ""
echo "   curl -X POST '$BASE_URL/api/webhooks/sentry' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'x-sentry-signature: sentry_timestamp=$(date +%s), sentry_signature=<SIGNATURE>' \\"
echo "     -d @- << EOF"
echo "   $(cat <<'EOF'
{
  "action": "created",
  "data": {
    "issue": {
      "id": "test-$(date +%s)",
      "shortId": "TEST-$(shuf -i 1000-9999 -n 1)",
      "title": "Manual Webhook Test",
      "level": "error",
      "type": "error",
      "culprit": "testFunction",
      "firstSeen": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
      "lastSeen": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
      "count": 1,
      "permalink": "https://sentry.io/test",
      "metadata": {
        "filename": "test.js",
        "lineno": 42,
        "function": "testFunction"
      },
      "tags": [
        { "key": "environment", "value": "test" },
        { "key": "test", "value": "true" }
      ]
    },
    "event": {
      "eventID": "evt-$(date +%s)",
      "receivedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
    },
    "trigger": {
      "type": "new_issue",
      "label": "New Issue"
    }
  }
}
EOF
)"
echo "   EOF"
echo ""

# 5. Summary
echo "═══════════════════════════════════════════"
echo "✅ Test Complete!"
echo ""
echo "Next Steps:"
echo "  1. Configure webhook in Sentry UI (see docs/monitoring/SENTRY_WEBHOOK_SETUP.md)"
echo "  2. Trigger a real error to verify end-to-end flow"
echo "  3. Check task files for new issues"
echo ""
echo "Documentation: docs/monitoring/SENTRY_WEBHOOK_SETUP.md"
