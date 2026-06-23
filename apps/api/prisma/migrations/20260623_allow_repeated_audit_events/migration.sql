-- Allow repeated security/audit events for the same action and resource.
-- Audit logs are append-only evidence, so token access/refresh/revoke events
-- must not be deduplicated by a unique constraint.

ALTER TABLE audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_action_resource_id_key;

CREATE INDEX IF NOT EXISTS audit_logs_action_resource_id_idx
  ON audit_logs(action, resource_id);

CREATE INDEX IF NOT EXISTS audit_logs_agency_id_created_at_idx
  ON audit_logs(agency_id, created_at);
