-- Outcome-based Meta access foundation. This migration is additive and does not
-- rewrite existing connection metadata or request platform JSON.
ALTER TABLE "access_requests" ADD COLUMN "meta_access_config" JSONB;

CREATE TABLE "meta_agency_destinations" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "agency_connection_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "readiness_status" TEXT NOT NULL DEFAULT 'action_needed',
    "readiness_details" JSONB,
    "last_readiness_check_at" TIMESTAMP(3),
    "last_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "meta_agency_destinations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_asset_grants" (
    "id" TEXT NOT NULL,
    "access_request_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "authorization_id" TEXT,
    "destination_id" TEXT NOT NULL,
    "client_business_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "recipe_version" INTEGER NOT NULL,
    "asset_kind" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "asset_name" TEXT,
    "requested_tasks" JSONB NOT NULL,
    "verified_tasks" JSONB,
    "grant_method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt_version" INTEGER NOT NULL DEFAULT 1,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "next_actor" TEXT,
    "last_attempt_at" TIMESTAMP(3),
    "granted_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "meta_asset_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meta_agency_destinations_agency_id_business_id_key"
  ON "meta_agency_destinations"("agency_id", "business_id");
CREATE UNIQUE INDEX "meta_agency_destinations_one_default_per_agency"
  ON "meta_agency_destinations"("agency_id") WHERE "is_default" = true;
CREATE INDEX "meta_agency_destinations_agency_id_readiness_status_idx"
  ON "meta_agency_destinations"("agency_id", "readiness_status");
CREATE INDEX "meta_agency_destinations_agency_connection_id_idx"
  ON "meta_agency_destinations"("agency_connection_id");

CREATE UNIQUE INDEX "meta_asset_grants_idempotency_key"
  ON "meta_asset_grants"("access_request_id", "destination_id", "client_business_id", "asset_kind", "asset_id");
CREATE INDEX "meta_asset_grants_access_request_id_status_idx"
  ON "meta_asset_grants"("access_request_id", "status");
CREATE INDEX "meta_asset_grants_connection_id_status_idx"
  ON "meta_asset_grants"("connection_id", "status");
CREATE INDEX "meta_asset_grants_destination_id_status_idx"
  ON "meta_asset_grants"("destination_id", "status");
CREATE INDEX "meta_asset_grants_authorization_id_idx"
  ON "meta_asset_grants"("authorization_id");

ALTER TABLE "meta_agency_destinations"
  ADD CONSTRAINT "meta_agency_destinations_agency_id_fkey"
  FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_agency_destinations"
  ADD CONSTRAINT "meta_agency_destinations_agency_connection_id_fkey"
  FOREIGN KEY ("agency_connection_id") REFERENCES "agency_platform_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_asset_grants"
  ADD CONSTRAINT "meta_asset_grants_access_request_id_fkey"
  FOREIGN KEY ("access_request_id") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_asset_grants"
  ADD CONSTRAINT "meta_asset_grants_connection_id_fkey"
  FOREIGN KEY ("connection_id") REFERENCES "client_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_asset_grants"
  ADD CONSTRAINT "meta_asset_grants_authorization_id_fkey"
  FOREIGN KEY ("authorization_id") REFERENCES "platform_authorizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meta_asset_grants"
  ADD CONSTRAINT "meta_asset_grants_destination_id_fkey"
  FOREIGN KEY ("destination_id") REFERENCES "meta_agency_destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
