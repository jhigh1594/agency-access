import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { resolvePrincipalAgency, assertAgencyAccess } from '../authorization';
import { agencyResolutionService } from '@/services/agency-resolution.service';

vi.mock('@/services/agency-resolution.service', () => ({
  agencyResolutionService: {
    resolveAgency: vi.fn(),
  },
}));

describe('authorization helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves agency using orgId when present', async () => {
    vi.mocked(agencyResolutionService.resolveAgency).mockResolvedValue({
      data: {
        agencyId: 'agency-org',
        agency: {
          id: 'agency-org',
          clerkUserId: 'org_123',
          name: 'Org Agency',
          email: 'org@example.com',
        },
      },
      error: null,
    });

    const request = {
      user: { sub: 'user_123', orgId: 'org_123' },
    } as FastifyRequest;

    const result = await resolvePrincipalAgency(request);

    expect(result.error).toBeNull();
    expect(result.data?.agencyId).toBe('agency-org');
    expect(agencyResolutionService.resolveAgency).toHaveBeenCalledWith('org_123', {
      createIfMissing: false,
    });
  });

  it('returns unauthorized when request has no verified user', async () => {
    const request = {} as FastifyRequest;

    const result = await resolvePrincipalAgency(request);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns forbidden when agency does not match principal', () => {
    const denied = assertAgencyAccess('agency-a', 'agency-b');
    const allowed = assertAgencyAccess('agency-a', 'agency-a');

    expect(denied).toEqual({
      code: 'FORBIDDEN',
      message: 'You do not have access to this agency resource',
    });
    expect(allowed).toBeNull();
  });
});

