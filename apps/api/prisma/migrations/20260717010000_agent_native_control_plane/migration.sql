-- Agent-native access operations are additive. Existing human workflows remain unchanged
-- when the feature is disabled, and rollback leaves these security records in place.

CREATE TABLE "agent_grants" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "owner_subject" TEXT NOT NULL,
    "oauth_client_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'active',
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_grants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_operations" (
    "id" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "risk_class" TEXT NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "input_hash" TEXT NOT NULL,
    "approval_preview" JSONB,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "execution_started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "result" JSONB,
    "failure_code" TEXT,
    "failure_message" TEXT,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_operations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "audit_logs"
    ADD COLUMN "actor_type" TEXT,
    ADD COLUMN "actor_id" TEXT,
    ADD COLUMN "agent_grant_id" TEXT,
    ADD COLUMN "agent_operation_id" TEXT,
    ADD COLUMN "oauth_client_id" TEXT;

CREATE UNIQUE INDEX "agent_grants_agency_id_owner_subject_oauth_client_id_key"
    ON "agent_grants"("agency_id", "owner_subject", "oauth_client_id");
CREATE INDEX "agent_grants_agency_id_state_idx"
    ON "agent_grants"("agency_id", "state");
CREATE INDEX "agent_grants_oauth_client_id_state_idx"
    ON "agent_grants"("oauth_client_id", "state");

CREATE UNIQUE INDEX "agent_operations_grant_id_idempotency_key_key"
    ON "agent_operations"("grant_id", "idempotency_key");
CREATE INDEX "agent_operations_agency_id_status_created_at_idx"
    ON "agent_operations"("agency_id", "status", "created_at");
CREATE INDEX "agent_operations_grant_id_status_created_at_idx"
    ON "agent_operations"("grant_id", "status", "created_at");
CREATE INDEX "agent_operations_status_expires_at_idx"
    ON "agent_operations"("status", "expires_at");
CREATE INDEX "access_requests_agency_id_external_reference_idx"
    ON "access_requests"("agency_id", "external_reference");
CREATE INDEX "audit_logs_agent_grant_id_created_at_idx"
    ON "audit_logs"("agent_grant_id", "created_at");
CREATE INDEX "audit_logs_agent_operation_id_created_at_idx"
    ON "audit_logs"("agent_operation_id", "created_at");

ALTER TABLE "agent_grants"
    ADD CONSTRAINT "agent_grants_agency_id_fkey"
    FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_operations"
    ADD CONSTRAINT "agent_operations_grant_id_fkey"
    FOREIGN KEY ("grant_id") REFERENCES "agent_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "agent_operations_agency_id_fkey"
    FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_agent_grant_id_fkey"
    FOREIGN KEY ("agent_grant_id") REFERENCES "agent_grants"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "audit_logs_agent_operation_id_fkey"
    FOREIGN KEY ("agent_operation_id") REFERENCES "agent_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
