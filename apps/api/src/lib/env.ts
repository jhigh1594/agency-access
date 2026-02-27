import { z } from 'zod';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config();

function isLocalhostUrl(value: string): boolean {
  const hostname = new URL(value).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function parseCsvList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseUrlSafely(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isPostgresProtocol(protocol: string): boolean {
  return protocol === 'postgres:' || protocol === 'postgresql:';
}

function hasRequiredSslMode(url: URL): boolean {
  const sslMode = url.searchParams.get('sslmode');
  return sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url().optional(),
  // Backend API URL (for OAuth callbacks)
  API_URL: z.string().url().optional(),

  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),

  // Infisical (Secrets Management)
  INFISICAL_CLIENT_ID: z.string(),
  INFISICAL_CLIENT_SECRET: z.string(),
  INFISICAL_PROJECT_ID: z.string(),
  INFISICAL_ENVIRONMENT: z.string().default('dev'),

  // Redis (Upstash)
  REDIS_URL: z.string().url(),

  // Meta OAuth
  META_APP_ID: z.string(),
  META_APP_SECRET: z.string(),

  // Kit (ConvertKit) OAuth
  KIT_CLIENT_ID: z.string().optional(),
  KIT_CLIENT_SECRET: z.string().optional(),

  // Beehiiv API (Agency's API key for team access)
  BEEHIIV_API_KEY: z.string().optional(),

  // Google OAuth (unified - covers all Google products)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Legacy: Google Ads-specific credentials (optional, for API access)
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),

  // TikTok OAuth
  TIKTOK_APP_ID: z.string().optional(),
  TIKTOK_APP_SECRET: z.string().optional(),

  // Mailchimp OAuth
  MAILCHIMP_CLIENT_ID: z.string().optional(),
  MAILCHIMP_CLIENT_SECRET: z.string().optional(),

  // Pinterest OAuth
  PINTEREST_CLIENT_ID: z.string().optional(),
  PINTEREST_CLIENT_SECRET: z.string().optional(),

  // Klaviyo OAuth
  KLAVIYO_CLIENT_ID: z.string().optional(),
  KLAVIYO_CLIENT_SECRET: z.string().optional(),

  // Shopify OAuth
  SHOPIFY_API_KEY: z.string().optional(),
  SHOPIFY_API_SECRET_KEY: z.string().optional(),

  // Zapier OAuth
  ZAPIER_CLIENT_ID: z.string().optional(),
  ZAPIER_CLIENT_SECRET: z.string().optional(),

  // LinkedIn OAuth
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // Notifications
  RESEND_API_KEY: z.string().optional(),

  // Creem Payments
  CREEM_API_KEY: z.string(),
  CREEM_WEBHOOK_SECRET: z.string(),
  CREEM_API_URL: z.string().url().default('https://api.creem.io'),

  LOG_LEVEL: z.string().default('info'),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z.boolean().default(true),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW_SECONDS: z.coerce.number().default(60),
  RATE_LIMIT_SKIP_AUTHENTICATED: z.boolean().default(true),
  TRUST_PROXY_IPS: z.string().optional(),
  DB_ENFORCE_LEAST_PRIVILEGE: z.boolean().default(false),

  // OAuth State Security
  OAUTH_STATE_HMAC_SECRET: z.string().default(() => {
    return randomBytes(32).toString('hex');
  }),

  // Internal Admin Access Control (comma-separated allowlists)
  INTERNAL_ADMIN_USER_IDS: z.string().optional(),
  INTERNAL_ADMIN_EMAILS: z.string().optional(),
});

const rawEnv = {
  ...process.env,
  INFISICAL_ENVIRONMENT: process.env.INFISICAL_ENVIRONMENT ?? process.env.INFISICAL_ENV,
};

const parsedEnv = envSchema.parse(rawEnv);

if (parsedEnv.NODE_ENV === 'production') {
  if (!parsedEnv.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is required in production');
  }

  if (!parsedEnv.API_URL) {
    throw new Error('API_URL is required in production');
  }

  if (isLocalhostUrl(parsedEnv.FRONTEND_URL)) {
    throw new Error('FRONTEND_URL cannot point to localhost in production');
  }

  if (isLocalhostUrl(parsedEnv.API_URL)) {
    throw new Error('API_URL cannot point to localhost in production');
  }

  const databaseUrl = parseUrlSafely(parsedEnv.DATABASE_URL);
  if (!databaseUrl || !isPostgresProtocol(databaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use postgres:// or postgresql:// in production');
  }

  if (!hasRequiredSslMode(databaseUrl)) {
    throw new Error('DATABASE_URL must set sslmode=require (or verify-ca/verify-full) in production');
  }

  if (parsedEnv.DB_ENFORCE_LEAST_PRIVILEGE) {
    const dbUser = decodeURIComponent(databaseUrl.username || '').toLowerCase();
    const disallowedElevatedUsers = new Set(['postgres', 'neondb_owner', 'root', 'admin']);
    if (disallowedElevatedUsers.has(dbUser)) {
      throw new Error('DATABASE_URL must use a least-privilege runtime DB role in production');
    }
  }
}

const FRONTEND_URL = parsedEnv.FRONTEND_URL ?? 'http://localhost:3000';
const API_URL = parsedEnv.API_URL ?? `http://localhost:${parsedEnv.PORT}`;
const INTERNAL_ADMIN_USER_IDS = parseCsvList(parsedEnv.INTERNAL_ADMIN_USER_IDS);
const INTERNAL_ADMIN_EMAILS = parseCsvList(parsedEnv.INTERNAL_ADMIN_EMAILS);
const TRUST_PROXY_IPS = parseCsvList(parsedEnv.TRUST_PROXY_IPS);

// Parse Redis URL into components for IORedis
const redisUrl = new URL(parsedEnv.REDIS_URL);

export const env = {
  ...parsedEnv,
  FRONTEND_URL,
  API_URL,
  REDIS_HOST: redisUrl.hostname,
  REDIS_PORT: parseInt(redisUrl.port || '6379', 10),
  REDIS_PASSWORD: redisUrl.password || undefined,
  INTERNAL_ADMIN_USER_IDS,
  INTERNAL_ADMIN_EMAILS,
  TRUST_PROXY_IPS,
};
