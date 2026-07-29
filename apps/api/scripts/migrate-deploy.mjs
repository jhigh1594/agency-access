#!/usr/bin/env node
import { execSync } from 'child_process';

const rawUrl = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL || '';
if (!rawUrl) {
  console.error('[db:migrate:deploy] Error: Neither MIGRATE_DATABASE_URL nor DATABASE_URL is set.');
  process.exit(1);
}

// Automatically strip "-pooler" from Neon database URLs so Prisma Migrate connects
// directly to the PostgreSQL compute instance rather than PgBouncer pooler.
const directUrl = rawUrl.replace('-pooler', '');

console.log('[db:migrate:deploy] Running prisma migrate deploy using direct endpoint...');

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: directUrl,
      DIRECT_URL: directUrl,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1',
    },
  });
} catch (error) {
  console.error('[db:migrate:deploy] Migration failed:', error.message);
  process.exit(error.status || 1);
}
