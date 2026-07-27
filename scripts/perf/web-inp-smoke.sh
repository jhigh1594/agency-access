#!/usr/bin/env bash
# Vitest smoke for INP-related UI paths and browser API URL reliability.
# Run from repo root: bash scripts/perf/web-inp-smoke.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/apps/web"
exec npx vitest run \
  "src/lib/api/__tests__/api-url-usage.test.ts" \
  "src/app/(authenticated)/dashboard/__tests__/page.behavior.test.tsx" \
  "src/app/invite/[token]/__tests__/page.test.tsx" \
  "src/app/invite/[token]/__tests__/page-route.test.tsx" \
  "src/app/(authenticated)/access-requests/[id]/edit/__tests__/page.test.tsx"
