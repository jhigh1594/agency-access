-- Delete access requests that have no linked client (client_id IS NULL).
-- Safe to run after cascade is in place; cleans up rows left from pre-cascade client deletes.

DELETE FROM access_requests WHERE client_id IS NULL;
