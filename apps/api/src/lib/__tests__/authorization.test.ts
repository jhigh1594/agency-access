import { describe, it, expect, beforeEach, vi } from 'vitest';

const { resolveAgencyMock } = vi.hoisted(() => ({
  resolveAgencyMock: vi.fn(),
}));

vi.mock('@/services/agency-resolution.service', () => ({
  agencyResolutionService: {
    resolveAgency: resolveAgencyMock,
  },
}));

import { resolvePrincipalAgency } from '../authorization';

describe('resolvePrincipalAgency', () => {
  beforeEach(() => {
    resolveAgencyMock.mockReset();
  });

  it('returns agency details from agency resolution', async () => {
    resolveAgencyMock.mockResolvedValue({
      data: {
        agencyId: 'agency_123',
        agency: {
          id: 'agency_123',
          clerkUserId: 'user_123',
          name: 'Acme Agency',
          email: 'owner@acme.test',
        },
      },
      error: null,
    });

    const request: any = {
      user: {
        sub: 'user_123',
      },
    };

    const result = await resolvePrincipalAgency(request);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      agencyId: 'agency_123',
      principalId: 'user_123',
      agency: {
        id: 'agency_123',
        name: 'Acme Agency',
        email: 'owner@acme.test',
      },
    });
  });
});
