import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock('pg-boss', () => ({
  PgBoss: vi.fn(function PgBossMock() {
    return {
      on: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
      send: sendMock,
    };
  }),
}));

vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { enqueueJob } from '../pg-boss.js';

describe('enqueueJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue('job-1');
  });

  it('omits optional pg-boss options instead of passing undefined values', async () => {
    await enqueueJob('google-native-grant', { grantId: 'grant-1' }, {
      singletonKey: 'google-native-grant-grant-1',
      retryLimit: 5,
      retryDelay: 30,
      retryBackoff: true,
    });

    expect(sendMock).toHaveBeenCalledWith(
      'google-native-grant',
      { grantId: 'grant-1' },
      {
        singletonKey: 'google-native-grant-grant-1',
        retryLimit: 5,
        retryDelay: 30,
        retryBackoff: true,
      }
    );
    expect(Object.keys(sendMock.mock.calls[0][2])).toEqual([
      'singletonKey',
      'retryLimit',
      'retryDelay',
      'retryBackoff',
    ]);
  });

  it('preserves an explicitly configured priority', async () => {
    await enqueueJob('token-refresh', {
      connectionId: 'connection-1',
      platform: 'google',
    }, {
      priority: 1,
    });

    expect(sendMock).toHaveBeenCalledWith(
      'token-refresh',
      {
        connectionId: 'connection-1',
        platform: 'google',
      },
      expect.objectContaining({ priority: 1 })
    );
  });
});
