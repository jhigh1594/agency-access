-- Keep Creem webhook idempotency atomic without reintroducing global audit
-- deduplication. Security audit events remain append-only; only marker rows
-- for processed Creem webhook IDs are unique.

CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_creem_webhook_marker_key
  ON audit_logs(action, resource_id)
  WHERE resource_type = 'creem_webhook_marker' AND resource_id IS NOT NULL;
