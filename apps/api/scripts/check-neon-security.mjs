#!/usr/bin/env node

function parseUrl(raw) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function isPostgresProtocol(protocol) {
  return protocol === 'postgres:' || protocol === 'postgresql:';
}

function hasRequiredSslMode(url) {
  const mode = url.searchParams.get('sslmode');
  return mode === 'require' || mode === 'verify-ca' || mode === 'verify-full';
}

const DATABASE_URL = process.env.DATABASE_URL || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_ENFORCE_LEAST_PRIVILEGE = process.env.DB_ENFORCE_LEAST_PRIVILEGE === 'true';
const TRUST_PROXY_IPS = (process.env.TRUST_PROXY_IPS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!DATABASE_URL) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const url = parseUrl(DATABASE_URL);
if (!url) {
  console.error('DATABASE_URL is invalid');
  process.exit(1);
}

const dbUser = decodeURIComponent(url.username || '');
const checks = [
  {
    name: 'postgres_url_protocol',
    required: true,
    pass: isPostgresProtocol(url.protocol),
    details: `protocol=${url.protocol}`,
  },
  {
    name: 'sslmode_enforced',
    required: true,
    pass: hasRequiredSslMode(url),
    details: `sslmode=${url.searchParams.get('sslmode') || 'missing'}`,
  },
  {
    name: 'neon_host_detected',
    required: false,
    pass: url.hostname.includes('neon'),
    details: `host=${url.hostname}`,
  },
  {
    name: 'trust_proxy_configured',
    required: false,
    pass: TRUST_PROXY_IPS.length > 0,
    details: `trust_proxy_ips=${TRUST_PROXY_IPS.length}`,
  },
];

if (DB_ENFORCE_LEAST_PRIVILEGE) {
  const elevatedUsers = new Set(['postgres', 'neondb_owner', 'root', 'admin']);
  checks.push({
    name: 'least_privilege_user',
    required: true,
    pass: !elevatedUsers.has(dbUser.toLowerCase()),
    details: `db_user=${dbUser || 'missing'}`,
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  nodeEnv: NODE_ENV,
  dbUser,
  checks,
};

console.log(JSON.stringify(output, null, 2));

const hasFailures = checks.some((check) => check.required && !check.pass);
if (hasFailures) {
  process.exit(1);
}
