import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

const ORIGINAL_ENV = { ...process.env };

function withRequiredBase(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: 'postgresql://app_user:password@db.example.com:5432/app?sslmode=require',
    CLERK_PUBLISHABLE_KEY: 'pk_live_example',
    CLERK_SECRET_KEY: 'sk_live_example',
    INFISICAL_CLIENT_ID: 'infisical-client-id',
    INFISICAL_CLIENT_SECRET: 'infisical-client-secret',
    INFISICAL_PROJECT_ID: 'infisical-project-id',
    REDIS_URL: 'https://example.com/redis',
    META_APP_ID: 'meta-app-id',
    META_APP_SECRET: 'meta-app-secret',
    CREEM_API_KEY: 'creem_live_example',
    CREEM_WEBHOOK_SECRET: 'whsec_live_example',
    ...overrides,
  };
}

async function importEnvWith(envValues: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };

  for (const [key, value] of Object.entries(envValues)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return import('../env.ts');
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe('env contract', () => {
  it('fails in production when FRONTEND_URL is missing', async () => {
    await expect(importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: undefined,
      API_URL: 'https://api.example.com',
      INFISICAL_ENVIRONMENT: 'production',
    }))).rejects.toThrow();
  });

  it('fails in production when API_URL is missing', async () => {
    await expect(importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
      API_URL: undefined,
      INFISICAL_ENVIRONMENT: 'production',
    }))).rejects.toThrow();
  });

  it('fails in production when FRONTEND_URL is localhost', async () => {
    await expect(importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: 'http://localhost:3000',
      API_URL: 'https://api.example.com',
      INFISICAL_ENVIRONMENT: 'production',
    }))).rejects.toThrow();
  });

  it('fails in production when API_URL is localhost', async () => {
    await expect(importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
      API_URL: 'http://localhost:3001',
      INFISICAL_ENVIRONMENT: 'production',
    }))).rejects.toThrow();
  });

  it('fails in production when DATABASE_URL is not a postgres URL', async () => {
    await expect(importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
      API_URL: 'https://api.example.com',
      DATABASE_URL: 'https://example.com/db',
      INFISICAL_ENVIRONMENT: 'production',
    }))).rejects.toThrow();
  });

  it('fails in production when DATABASE_URL does not enforce sslmode', async () => {
    await expect(importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
      API_URL: 'https://api.example.com',
      DATABASE_URL: 'postgresql://app_user:password@db.example.com:5432/app',
      INFISICAL_ENVIRONMENT: 'production',
    }))).rejects.toThrow();
  });

  it('fails in production for elevated DB user when DB_ENFORCE_LEAST_PRIVILEGE is true', async () => {
    await expect(importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
      API_URL: 'https://api.example.com',
      DATABASE_URL: 'postgresql://postgres:password@db.example.com:5432/app?sslmode=require',
      DB_ENFORCE_LEAST_PRIVILEGE: 'true',
      INFISICAL_ENVIRONMENT: 'production',
    }))).rejects.toThrow();
  });

  it('supports legacy INFISICAL_ENV when INFISICAL_ENVIRONMENT is not provided', async () => {
    const module = await importEnvWith(withRequiredBase({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
      API_URL: 'https://api.example.com',
      INFISICAL_ENVIRONMENT: undefined,
      INFISICAL_ENV: 'production',
    }));

    expect(module.env.INFISICAL_ENVIRONMENT).toBe('production');
  });

  it('keeps development defaults for FRONTEND_URL and API_URL', async () => {
    const module = await importEnvWith(withRequiredBase({
      NODE_ENV: 'development',
      FRONTEND_URL: undefined,
      API_URL: undefined,
      INFISICAL_ENVIRONMENT: 'dev',
    }));

    expect(module.env.FRONTEND_URL).toBe('http://localhost:3000');
    expect(module.env.API_URL).toBe('http://localhost:3001');
  });

  it('parses INTERNAL_ADMIN_USER_IDS and INTERNAL_ADMIN_EMAILS as trimmed arrays', async () => {
    const module = await importEnvWith(withRequiredBase({
      INTERNAL_ADMIN_USER_IDS: ' user_1, user_2 ,,',
      INTERNAL_ADMIN_EMAILS: ' admin@example.com,ops@example.com ,, ',
    }));

    expect(module.env.INTERNAL_ADMIN_USER_IDS).toEqual(['user_1', 'user_2']);
    expect(module.env.INTERNAL_ADMIN_EMAILS).toEqual(['admin@example.com', 'ops@example.com']);
  });

  it('defaults internal admin allowlists to empty arrays when unset', async () => {
    const module = await importEnvWith(withRequiredBase({
      INTERNAL_ADMIN_USER_IDS: undefined,
      INTERNAL_ADMIN_EMAILS: undefined,
    }));

    expect(module.env.INTERNAL_ADMIN_USER_IDS).toEqual([]);
    expect(module.env.INTERNAL_ADMIN_EMAILS).toEqual([]);
  });

  it('defaults DB_ENFORCE_LEAST_PRIVILEGE to false when unset', async () => {
    const module = await importEnvWith(withRequiredBase({
      DB_ENFORCE_LEAST_PRIVILEGE: undefined,
    }));

    expect(module.env.DB_ENFORCE_LEAST_PRIVILEGE).toBe(false);
  });
});
