import { describe, expect, it } from 'vitest';
import { resolveInternalAdminUser } from '../internal-admin-auth.js';

describe('resolveInternalAdminUser', () => {
  it('returns UNAUTHORIZED when user context is missing', () => {
    const result = resolveInternalAdminUser(undefined, {
      userIds: ['user_1'],
      emails: [],
    });

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns FORBIDDEN when authenticated user is not allowlisted', () => {
    const result = resolveInternalAdminUser({ sub: 'user_2' }, {
      userIds: ['user_1'],
      emails: ['admin@example.com'],
    });

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('allows access when user ID is allowlisted', () => {
    const result = resolveInternalAdminUser({ sub: 'user_1' }, {
      userIds: ['user_1'],
      emails: [],
    });

    expect(result.error).toBeNull();
    expect(result.data?.userId).toBe('user_1');
  });

  it('allows access when email is allowlisted (case-insensitive)', () => {
    const result = resolveInternalAdminUser({
      sub: 'user_3',
      email: 'Admin@Example.com',
    }, {
      userIds: [],
      emails: ['admin@example.com'],
    });

    expect(result.error).toBeNull();
    expect(result.data?.email).toBe('admin@example.com');
  });
});
