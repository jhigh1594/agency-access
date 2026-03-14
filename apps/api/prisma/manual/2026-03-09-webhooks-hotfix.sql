-- Webhooks production hotfix
-- Purpose: add the webhook schema and access_requests.external_reference
-- without dropping unrelated tables such as onboarding_workflows/workflow_actions.

BEGIN;

ALTER TABLE access_requests
  ADD COLUMN IF NOT EXISTS external_reference TEXT;

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_id TEXT NOT NULL,
  status TEXT NOT NULL,
  subscribed_events JSONB NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_delivered_at TIMESTAMPTZ NULL,
  last_failed_at TIMESTAMPTZ NULL,
  disabled_at TIMESTAMPTZ NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'webhook_endpoints_agency_id_key'
  ) THEN
    ALTER TABLE webhook_endpoints
      ADD CONSTRAINT webhook_endpoints_agency_id_key UNIQUE (agency_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS webhook_endpoints_agency_id_status_idx
  ON webhook_endpoints (agency_id, status);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  resource_type TEXT NULL,
  resource_id TEXT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_events_agency_id_type_idx
  ON webhook_events (agency_id, type);

CREATE INDEX IF NOT EXISTS webhook_events_endpoint_id_created_at_idx
  ON webhook_events (endpoint_id, created_at);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  request_headers JSONB NULL,
  response_status INTEGER NULL,
  response_body_snippet TEXT NULL,
  error_code TEXT NULL,
  error_message TEXT NULL,
  next_attempt_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'webhook_deliveries_event_id_attempt_number_key'
  ) THEN
    ALTER TABLE webhook_deliveries
      ADD CONSTRAINT webhook_deliveries_event_id_attempt_number_key UNIQUE (event_id, attempt_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint_id_status_created_at_idx
  ON webhook_deliveries (endpoint_id, status, created_at);

CREATE INDEX IF NOT EXISTS webhook_deliveries_event_id_status_idx
  ON webhook_deliveries (event_id, status);

COMMIT;
