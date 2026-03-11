import { afterEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };
const redisClientMocks = {
  on: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  ping: vi.fn().mockResolvedValue('PONG'),
  set: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue('ok'),
  del: vi.fn().mockResolvedValue(1),
  quit: vi.fn().mockResolvedValue('OK'),
  status: 'wait',
};

const RedisMock = vi.fn(function RedisConstructor(this: Record<string, unknown>) {
  return redisClientMocks;
});

vi.mock('ioredis', () => ({
  default: RedisMock,
}));

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

function withRequiredBase(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: 'production',
    PORT: '3001',
    DATABASE_URL: 'postgresql://app_user:password@db.example.com:5432/app?sslmode=require',
    FRONTEND_URL: 'https://app.example.com',
    API_URL: 'https://api.example.com',
    CLERK_PUBLISHABLE_KEY: 'pk_live_example',
    CLERK_SECRET_KEY: 'sk_live_example',
    INFISICAL_CLIENT_ID: 'infisical-client-id',
    INFISICAL_CLIENT_SECRET: 'infisical-client-secret',
    INFISICAL_PROJECT_ID: 'infisical-project-id',
    INFISICAL_ENVIRONMENT: 'production',
    REDIS_URL: 'rediss://default:password@cache.example.com:6380',
    META_APP_ID: 'meta-app-id',
    META_APP_SECRET: 'meta-app-secret',
    CREEM_API_KEY: 'creem_live_example',
    CREEM_WEBHOOK_SECRET: 'whsec_live_example',
    ...overrides,
  };
}

async function importRedisWith(envValues: Record<string, string | undefined>) {
  vi.resetModules();
  RedisMock.mockReset();
  redisClientMocks.on.mockReset();
  redisClientMocks.connect.mockReset();
  redisClientMocks.ping.mockReset();
  redisClientMocks.set.mockReset();
  redisClientMocks.get.mockReset();
  redisClientMocks.del.mockReset();
  redisClientMocks.quit.mockReset();
  redisClientMocks.connect.mockResolvedValue(undefined);
  redisClientMocks.ping.mockResolvedValue('PONG');
  redisClientMocks.set.mockResolvedValue('OK');
  redisClientMocks.get.mockResolvedValue('ok');
  redisClientMocks.del.mockResolvedValue(1);
  redisClientMocks.quit.mockResolvedValue('OK');
  redisClientMocks.status = 'wait';

  RedisMock.mockImplementation(function RedisConstructor(this: Record<string, unknown>) {
    return redisClientMocks;
  });

  process.env = { ...ORIGINAL_ENV };

  for (const [key, value] of Object.entries(envValues)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return import('../redis.ts');
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  RedisMock.mockReset();
});

describe('redis config', () => {
  it('defaults to TLS for managed redis:// endpoints in production', async () => {
    await importRedisWith(withRequiredBase({
      REDIS_URL: 'redis://cache.internal.example.com:6379',
    }));

    expect(RedisMock).toHaveBeenCalledTimes(1);
    expect(RedisMock.mock.calls[0]?.[1]).toMatchObject({
      lazyConnect: true,
      tls: {},
    });
  });

  it('enables TLS when REDIS_URL uses rediss:// in production', async () => {
    await importRedisWith(withRequiredBase({
      REDIS_URL: 'rediss://default:password@cache.example.com:6380',
    }));

    expect(RedisMock).toHaveBeenCalledTimes(1);
    expect(RedisMock.mock.calls[0]?.[1]).toMatchObject({
      lazyConnect: true,
      tls: {},
    });
  });

  it('ensures Redis is reachable before continuing startup checks', async () => {
    const module = await importRedisWith(withRequiredBase({
      REDIS_URL: 'rediss://default:password@cache.example.com:6380',
    }));

    const connectCallsBeforeReadyCheck = redisClientMocks.connect.mock.calls.length;
    await module.ensureRedisReady();

    expect(redisClientMocks.connect.mock.calls.length).toBeGreaterThan(connectCallsBeforeReadyCheck);
    expect(redisClientMocks.ping).toHaveBeenCalledTimes(1);
    expect(redisClientMocks.set).toHaveBeenCalledTimes(1);
    expect(redisClientMocks.get).toHaveBeenCalledTimes(1);
    expect(redisClientMocks.del).toHaveBeenCalledTimes(1);
  });

  it('does not force TLS for localhost redis:// URLs outside managed production endpoints', async () => {
    await importRedisWith(withRequiredBase({
      NODE_ENV: 'development',
      REDIS_URL: 'redis://localhost:6379',
    }));

    expect(RedisMock).toHaveBeenCalledTimes(1);
    expect(RedisMock.mock.calls[0]?.[1]).toMatchObject({
      lazyConnect: true,
      tls: undefined,
    });
  });
});
