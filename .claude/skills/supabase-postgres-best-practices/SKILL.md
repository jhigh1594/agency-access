---
name: supabase-postgres-best-practices
description: Supabase and PostgreSQL patterns for schema design, RLS, queries, and migrations. Use when working with database schemas, writing queries, implementing row-level security, or optimizing database performance.
---

# Supabase & PostgreSQL Best Practices

## Schema Design

### Table Naming
- Use snake_case for table and column names
- Use plural nouns for table names (users, access_requests)
- Use singular for junction tables (user_role, not users_roles)

### Primary Keys
- Use UUID for primary keys (better for distributed systems)
- Generate with `gen_random_uuid()` or application-side

### Foreign Keys
- Always define foreign key constraints
- Use ON DELETE CASCADE sparingly - prefer ON DELETE RESTRICT
- Index foreign key columns

### Timestamps
- Include `created_at` and `updated_at` on all tables
- Use `timestamptz` (timestamp with time zone)
- Set defaults: `created_at DEFAULT now()`, `updated_at` via trigger

## Row Level Security (RLS)

### Enable RLS on All Tables
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

### Policy Patterns
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Agency members can see agency data
CREATE POLICY "Agency members can view" ON access_requests
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM agency_members 
      WHERE user_id = auth.uid()
    )
  );
```

### RLS Best Practices
- Always have at least one policy per table
- Use `auth.uid()` for user context
- Test policies with different user contexts
- Consider performance - avoid expensive subqueries in policies

## Query Optimization

### Indexing
- Index columns used in WHERE, JOIN, ORDER BY
- Use partial indexes for filtered queries
- Use composite indexes for multi-column queries
- Monitor with `pg_stat_user_indexes`

### Query Patterns
```sql
-- Use EXISTS instead of IN for subqueries
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM agency_members am 
  WHERE am.user_id = u.id AND am.agency_id = $1
);

-- Use LIMIT with ORDER BY
SELECT * FROM access_requests
WHERE agency_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

### Avoid N+1 Queries
- Use JOINs or Prisma includes
- Batch related queries
- Use database views for complex joins

## Migrations

### Migration Best Practices
- One migration per logical change
- Include both up and down migrations
- Test migrations on staging first
- Never modify deployed migrations

### Safe Schema Changes
- Add columns as nullable first, then add NOT NULL
- Create indexes CONCURRENTLY in production
- Use transactions for multi-step changes

## Supabase-Specific

### Edge Functions
- Keep functions small and focused
- Use environment variables for secrets
- Handle errors gracefully

### Realtime
- Enable realtime only on tables that need it
- Use filters to limit subscriptions
- Clean up subscriptions on unmount

### Storage
- Use RLS policies on storage buckets
- Organize files by user/agency ID
- Set appropriate file size limits
