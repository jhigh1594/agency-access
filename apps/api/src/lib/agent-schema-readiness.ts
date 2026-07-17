import { prisma } from '@/lib/prisma';

interface MissingSchemaRequirement {
  kind: 'table' | 'column' | 'index' | 'foreign key';
  name: string;
}

const AGENT_SCHEMA_READINESS_SQL = `
WITH
  required_tables(name) AS (
    VALUES ('agent_grants'), ('agent_operations')
  ),
  required_columns(table_name, column_name) AS (
    VALUES
      ('agent_grants', 'agency_id'),
      ('agent_grants', 'owner_subject'),
      ('agent_grants', 'oauth_client_id'),
      ('agent_grants', 'permissions'),
      ('agent_grants', 'state'),
      ('agent_operations', 'grant_id'),
      ('agent_operations', 'agency_id'),
      ('agent_operations', 'idempotency_key'),
      ('agent_operations', 'input_hash'),
      ('agent_operations', 'status'),
      ('audit_logs', 'actor_type'),
      ('audit_logs', 'actor_id'),
      ('audit_logs', 'agent_grant_id'),
      ('audit_logs', 'agent_operation_id'),
      ('audit_logs', 'oauth_client_id')
  ),
  required_indexes(name) AS (
    VALUES
      ('agent_grants_agency_id_state_idx'),
      ('agent_grants_agency_id_owner_subject_oauth_client_id_key'),
      ('agent_operations_grant_id_idempotency_key_key'),
      ('agent_operations_agency_id_status_created_at_idx'),
      ('agent_operations_status_expires_at_idx')
  ),
  required_foreign_keys(name) AS (
    VALUES
      ('agent_grants_agency_id_fkey'),
      ('agent_operations_grant_id_fkey'),
      ('agent_operations_agency_id_fkey'),
      ('audit_logs_agent_grant_id_fkey'),
      ('audit_logs_agent_operation_id_fkey')
  ),
  missing AS (
    SELECT 'table'::text AS kind, name
    FROM required_tables
    WHERE to_regclass('public.' || name) IS NULL
    UNION ALL
    SELECT 'column'::text AS kind, table_name || '.' || column_name AS name
    FROM required_columns required
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns columns
      WHERE columns.table_schema = 'public'
        AND columns.table_name = required.table_name
        AND columns.column_name = required.column_name
    )
    UNION ALL
    SELECT 'index'::text AS kind, name
    FROM required_indexes required
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_indexes indexes
      WHERE indexes.schemaname = 'public'
        AND indexes.indexname = required.name
    )
    UNION ALL
    SELECT 'foreign key'::text AS kind, name
    FROM required_foreign_keys required
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_constraint constraints
      JOIN pg_namespace namespaces ON namespaces.oid = constraints.connamespace
      WHERE namespaces.nspname = 'public'
        AND constraints.contype = 'f'
        AND constraints.conname = required.name
    )
  )
SELECT kind, name FROM missing ORDER BY kind, name
`;

export async function assertAgentSchemaReady(): Promise<void> {
  let missing: MissingSchemaRequirement[];

  try {
    missing = await prisma.$queryRawUnsafe<MissingSchemaRequirement[]>(
      AGENT_SCHEMA_READINESS_SQL
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Agent schema readiness probe failed: ${detail}. Run committed Prisma migrations before enabling agent-native access.`
    );
  }

  if (missing.length === 0) return;

  const detail = missing.map((requirement) => `${requirement.kind} ${requirement.name}`).join(', ');
  throw new Error(`Agent schema is not ready for this deployment: missing ${detail}.`);
}
