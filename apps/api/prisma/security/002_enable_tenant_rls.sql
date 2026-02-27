-- Neon Postgres Hardening: Tenant Row-Level Security
-- IMPORTANT:
-- 1) Run only after role hardening and staging verification.
-- 2) Runtime requests must set app.current_agency_id for each DB session/transaction.
-- 3) This script intentionally excludes the "agencies" table to avoid bootstrap breakage.

BEGIN;

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_agency_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.rls_bypass()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT pg_has_role(current_user, 'aap_app_migrator', 'member')
$$;

DO $$
DECLARE
  table_name text;
  tenant_tables text[] := ARRAY[
    'agency_members',
    'agency_platform_connections',
    'clients',
    'access_request_templates',
    'access_requests',
    'client_connections',
    'platform_authorizations',
    'agency_usage_counters',
    'subscriptions'
  ];
BEGIN
  FOREACH table_name IN ARRAY tenant_tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I', table_name, table_name);

    IF table_name = 'platform_authorizations' THEN
      EXECUTE format(
        'CREATE POLICY %I_tenant_isolation ON public.%I
         USING (
           app.rls_bypass()
           OR EXISTS (
             SELECT 1
             FROM public.client_connections cc
             WHERE cc.id = %I.connection_id
               AND cc.agency_id = app.current_agency_id()
           )
         )
         WITH CHECK (
           app.rls_bypass()
           OR EXISTS (
             SELECT 1
             FROM public.client_connections cc
             WHERE cc.id = %I.connection_id
               AND cc.agency_id = app.current_agency_id()
           )
         )',
        table_name,
        table_name,
        table_name,
        table_name
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I_tenant_isolation ON public.%I
         USING (app.rls_bypass() OR agency_id = app.current_agency_id())
         WITH CHECK (app.rls_bypass() OR agency_id = app.current_agency_id())',
        table_name,
        table_name
      );
    END IF;
  END LOOP;
END $$;

-- audit_logs has nullable agency_id; allow only tenant rows for runtime role.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON public.audit_logs;
CREATE POLICY audit_logs_tenant_isolation
  ON public.audit_logs
  USING (app.rls_bypass() OR agency_id = app.current_agency_id())
  WITH CHECK (app.rls_bypass() OR agency_id = app.current_agency_id());

COMMIT;
