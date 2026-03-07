import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClerk = {
  users: {
    getUser: vi.fn(),
  },
};

vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => mockClerk),
}));

vi.mock('@/lib/env', () => ({
  env: {
    CLERK_SECRET_KEY: 'sk_test_secret_key',
    HELPSCOUT_BEACON_SECRET: 'hs_secret_test',
  },
}));

import { helpScoutService } from '../help-scout.service';

describe('Help Scout Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a signed Beacon identity payload for the authenticated user', async () => {
    mockClerk.users.getUser.mockResolvedValue({
      fullName: 'Alex Johnson',
      firstName: 'Alex',
      lastName: 'Johnson',
      primaryEmailAddress: {
        emailAddress: 'alex@example.com',
      },
      emailAddresses: [],
    });

    const result = await helpScoutService.getBeaconIdentity('user_123');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      signature: createHmac('sha256', 'hs_secret_test').update('alex@example.com').digest('hex'),
    });
    expect(mockClerk.users.getUser).toHaveBeenCalledWith('user_123');
  });

  it('falls back to first and last name when full name is absent', async () => {
    mockClerk.users.getUser.mockResolvedValue({
      fullName: null,
      firstName: 'Casey',
      lastName: 'Morris',
      primaryEmailAddress: null,
      emailAddresses: [{ emailAddress: 'casey@example.com' }],
    });

    const result = await helpScoutService.getBeaconIdentity('user_456');

    expect(result.error).toBeNull();
    expect(result.data?.name).toBe('Casey Morris');
  });

  it('returns NOT_FOUND when the Clerk user has no email address', async () => {
    mockClerk.users.getUser.mockResolvedValue({
      fullName: 'Taylor Smith',
      primaryEmailAddress: null,
      emailAddresses: [],
    });

    const result = await helpScoutService.getBeaconIdentity('user_789');

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'NOT_FOUND',
      message: 'Authenticated user email not available for Help Scout Beacon',
    });
  });

  it('returns NOT_CONFIGURED when the Beacon secret is unavailable', async () => {
    vi.doMock('@/lib/env', () => ({
      env: {
        CLERK_SECRET_KEY: 'sk_test_secret_key',
        HELPSCOUT_BEACON_SECRET: undefined,
      },
    }));

    vi.resetModules();
    const { helpScoutService: unconfiguredService } = await import('../help-scout.service');

    const result = await unconfiguredService.getBeaconIdentity('user_123');

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: 'NOT_CONFIGURED',
      message: 'Help Scout Beacon secure mode is not configured',
    });
  });
});
