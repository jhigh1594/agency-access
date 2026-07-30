-- Google Client Offboarding tables. Additive only — no existing tables modified.

CREATE TABLE "google_offboarding_runs" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "credential_generation" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "final_outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "google_offboarding_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "google_offboarding_items" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "asset_label" TEXT NOT NULL,
    "grant_id" TEXT,
    "provider_outcome" TEXT,
    "provider_request_id" TEXT,
    "reason" TEXT,
    "attested_by_id" TEXT,
    "attested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "google_offboarding_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "google_offboarding_attempts" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "provider_outcome" TEXT,
    "request_id" TEXT,
    "response_classification" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "google_offboarding_attempts_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "google_offboarding_runs_idempotency_key_key"
  ON "google_offboarding_runs"("idempotency_key");

CREATE UNIQUE INDEX "google_offboarding_items_run_id_product_id_asset_label_key"
  ON "google_offboarding_items"("run_id", "product_id", "asset_label");

-- Partial unique index: one active run per connection
-- Terminal statuses are excluded from uniqueness enforcement
CREATE UNIQUE INDEX "google_offboarding_runs_one_active_per_connection"
  ON "google_offboarding_runs"("connection_id", "status")
  WHERE "status" NOT IN ('completed', 'completed_with_manual_follow_up', 'incomplete', 'canceled');

-- Run indexes
CREATE INDEX "google_offboarding_runs_agency_id_created_at_idx"
  ON "google_offboarding_runs"("agency_id", "created_at");
CREATE INDEX "google_offboarding_runs_connection_id_status_idx"
  ON "google_offboarding_runs"("connection_id", "status");

-- Item indexes
CREATE INDEX "google_offboarding_items_run_id_product_id_idx"
  ON "google_offboarding_items"("run_id", "product_id");
CREATE INDEX "google_offboarding_items_grant_id_idx"
  ON "google_offboarding_items"("grant_id");

-- Attempt indexes
CREATE INDEX "google_offboarding_attempts_item_id_created_at_idx"
  ON "google_offboarding_attempts"("item_id", "created_at");
CREATE INDEX "google_offboarding_attempts_run_id_created_at_idx"
  ON "google_offboarding_attempts"("run_id", "created_at");

-- Foreign keys
ALTER TABLE "google_offboarding_runs"
  ADD CONSTRAINT "google_offboarding_runs_agency_id_fkey"
  FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "google_offboarding_runs"
  ADD CONSTRAINT "google_offboarding_runs_connection_id_fkey"
  FOREIGN KEY ("connection_id") REFERENCES "client_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "google_offboarding_items"
  ADD CONSTRAINT "google_offboarding_items_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "google_offboarding_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "google_offboarding_items"
  ADD CONSTRAINT "google_offboarding_items_grant_id_fkey"
  FOREIGN KEY ("grant_id") REFERENCES "google_native_grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "google_offboarding_attempts"
  ADD CONSTRAINT "google_offboarding_attempts_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "google_offboarding_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "google_offboarding_attempts"
  ADD CONSTRAINT "google_offboarding_attempts_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "google_offboarding_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
