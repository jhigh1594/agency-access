import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { agencyRoutes } from '../agencies.js';
import { agencyService } from '../../services/agency.service.js';
import * as authorization from '../../lib/authorization.js';

vi.mock('../../lib/authorization.js');
vi.mock('../../services/agency.service.js', () => ({
  agencyService: {
    getAgencyByEmail: vi.fn(),
    listAgencies: vi.fn(),
    getAgency: vi.fn(),
    createAgency: vi.fn(),
    createAgencyWithCheckout: vi.fn(),
    updateAgency: vi.fn(),
    getAgencyMembers: vi.fn(),
    inviteMember: vi.fn(),
    bulkInviteMembers: vi.fn(),
    getOnboardingStatus: vi.fn(),
    updateOnboardingProgress: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    updateMemberRoleForAgency: vi.fn(),
    removeMemberForAgency: vi.fn(),
  },
}));
vi.mock('../../middleware/auth.js', () => ({
  authenticate: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' },
      });
    }
    request.user = { sub: 'user_123' };
  },
}));
vi.mock('../../middleware/quota.middleware.js', () => ({
  quotaMiddleware: () => async () => {},
}));

describe('Agency Routes - Onboarding', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(agencyRoutes);
    vi.clearAllMocks();

    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: {
        agencyId: 'agency-owner',
        principalId: 'user_123',
        agency: {
          id: 'agency-owner',
          name: 'Owner Agency',
          email: 'owner@example.com',
        },
      },
      error: null,
    });

    vi.mocked(authorization.assertAgencyAccess).mockImplementation((requested, principal) => {
      if (requested !== principal) {
        return {
          code: 'FORBIDDEN',
          message: 'You do not have access to this agency resource',
        };
      }
      return null;
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns onboarding lifecycle status for the principal agency', async () => {
    vi.mocked(agencyService.getOnboardingStatus).mockResolvedValue({
      data: {
        completed: false,
        status: 'in_progress',
        lifecycle: {
          status: 'in_progress',
          startedAt: '2026-03-04T10:00:00.000Z',
          lastVisitedStep: 2,
        },
        step: {
          profile: true,
          members: false,
          firstRequest: false,
        },
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/agencies/agency-owner/onboarding-status',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe('in_progress');
    expect(agencyService.getOnboardingStatus).toHaveBeenCalledWith('agency-owner');
  });

  it('returns 404 when onboarding status is requested for a missing agency', async () => {
    vi.mocked(agencyService.getOnboardingStatus).mockResolvedValue({
      data: null,
      error: {
        code: 'AGENCY_NOT_FOUND',
        message: 'Agency not found',
      },
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/agencies/agency-owner/onboarding-status',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('AGENCY_NOT_FOUND');
  });

  it('returns 400 for invalid onboarding progress payload', async () => {
    vi.mocked(agencyService.updateOnboardingProgress).mockResolvedValue({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid onboarding progress payload',
      },
    } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/agencies/agency-owner/onboarding-progress',
      headers: { authorization: 'Bearer token' },
      payload: {
        status: 'invalid_status',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when onboarding progress update targets a missing agency', async () => {
    vi.mocked(agencyService.updateOnboardingProgress).mockResolvedValue({
      data: null,
      error: {
        code: 'AGENCY_NOT_FOUND',
        message: 'Agency not found',
      },
    } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/agencies/agency-owner/onboarding-progress',
      headers: { authorization: 'Bearer token' },
      payload: {
        status: 'in_progress',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('AGENCY_NOT_FOUND');
  });

  it('updates onboarding progress for the principal agency', async () => {
    vi.mocked(agencyService.updateOnboardingProgress).mockResolvedValue({
      data: {
        agencyId: 'agency-owner',
        lifecycle: {
          status: 'activated',
          accessRequestId: 'req-1',
        },
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'PATCH',
      url: '/agencies/agency-owner/onboarding-progress',
      headers: { authorization: 'Bearer token' },
      payload: {
        status: 'activated',
        accessRequestId: 'req-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.lifecycle.status).toBe('activated');
    expect(agencyService.updateOnboardingProgress).toHaveBeenCalledWith(
      'agency-owner',
      expect.objectContaining({
        status: 'activated',
        accessRequestId: 'req-1',
      })
    );
  });
});
