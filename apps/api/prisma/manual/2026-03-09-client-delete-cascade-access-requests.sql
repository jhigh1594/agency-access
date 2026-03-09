-- Change access_requests.client_id FK from ON DELETE SET NULL to ON DELETE CASCADE
-- When a client is deleted, all associated access requests are now deleted (and cascade to connections/authorizations).
-- Run after schema change if db:push was not used.

ALTER TABLE access_requests
  DROP CONSTRAINT IF EXISTS access_requests_client_id_fkey,
  ADD CONSTRAINT access_requests_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
