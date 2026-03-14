-- Focused auth_model cleanup
-- Purpose: remove the legacy access_requests.auth_model column
-- without applying broader Prisma drift changes to unrelated tables.

BEGIN;

ALTER TABLE access_requests
  DROP COLUMN IF EXISTS auth_model;

COMMIT;
