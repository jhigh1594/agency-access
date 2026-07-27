import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { agencyPlatformsRoutes } from '../agency-platforms.js';
import { metaAssetsService } from '@/services/meta-assets.service';
import { metaReadinessService } from '@/services/meta-readiness.service';
import { prisma } from '@/lib/prisma';

// Mock metaAssetsService
vi.mock('@/services/meta-assets.service', () => ({
  metaAssetsService: {
    getAssetsForBusiness: vi.fn(),
    saveAssetSelections: vi.fn(),
    listDestinations: vi.fn(),
    registerDestination: vi.fn(),
    setDefaultDestination: vi.fn(),
  },
}));

vi.mock('@/services/meta-readiness.service', () => ({
  metaReadinessService: { checkDestination: vi.fn() },
}));

vi.mock('@/middleware/auth.js', () => ({
  authenticate: () => async (request: any) => {
    request.user = { sub: 'agency-1' };
  },
}));

vi.mock('@/services/agency-resolution.service', () => ({
  agencyResolutionService: {
    resolveAgency: vi.fn(async () => ({
      data: {
        agencyId: 'agency-1',
        agency: { id: 'agency-1', name: 'Agency', email: 'owner@agency.test' },
      },
      error: null,
    })),
  },
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: { findUnique: vi.fn() },
  },
}));

// Mock other services used by agencyPlatformsRoutes
vi.mock('@/services/agency-platform.service');
vi.mock('@/services/oauth-state.service');
vi.mock('@/services/identity-verification.service');
vi.mock('@/services/connectors/meta');
vi.mock('@/services/connectors/google');

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    FRONTEND_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3001',
    REDIS_URL: 'redis://localhost:6379',
    NODE_ENV: 'test',
  },
}));

describe('Meta Assets Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(agencyPlatformsRoutes);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /agency-platforms/meta/assets/:businessId', () => {
    it('should fetch all assets for a business', async () => {
      const mockAssets = {
        businessId: 'biz-1',
        businessName: 'Test Business',
        adAccounts: [],
        pages: [],
        instagramAccounts: [],
        productCatalogs: [],
      };

      vi.mocked(prisma.agency.findUnique).mockResolvedValue({ id: 'agency-1' } as any);
      vi.mocked(metaAssetsService.getAssetsForBusiness).mockResolvedValue({
        data: mockAssets,
        error: null,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/agency-platforms/meta/assets/biz-1?agencyId=agency-1',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ data: mockAssets, error: null });
      expect(metaAssetsService.getAssetsForBusiness).toHaveBeenCalledWith('agency-1', 'biz-1');
    });

    it('should return 400 if agencyId is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/agency-platforms/meta/assets/biz-1',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Meta receiving destinations', () => {
    it('lists agency-scoped destinations', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({ id: 'agency-1' } as any);
      vi.mocked(metaAssetsService.listDestinations).mockResolvedValue({
        data: [{ id: 'destination-1', businessId: 'biz-1', isDefault: true }],
        error: null,
      } as any);

      const response = await app.inject({
        method: 'GET',
        url: '/agency-platforms/meta/destinations?agencyId=agency-1',
      });

      expect(response.statusCode).toBe(200);
      expect(metaAssetsService.listDestinations).toHaveBeenCalledWith('agency-1');
    });

    it('registers and checks a destination', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({ id: 'agency-1' } as any);
      vi.mocked(metaAssetsService.registerDestination).mockResolvedValue({
        data: { id: 'destination-1', readinessStatus: 'action_needed' },
        error: null,
      } as any);
      vi.mocked(metaReadinessService.checkDestination).mockResolvedValue({
        data: { id: 'destination-1', readinessStatus: 'ready' },
        error: null,
      } as any);

      const createResponse = await app.inject({
        method: 'POST',
        url: '/agency-platforms/meta/destinations',
        payload: { agencyId: 'agency-1', businessId: 'biz-1', name: 'Portfolio 1' },
      });
      const readinessResponse = await app.inject({
        method: 'POST',
        url: '/agency-platforms/meta/destinations/destination-1/readiness',
        payload: { agencyId: 'agency-1' },
      });

      expect(createResponse.statusCode).toBe(201);
      expect(readinessResponse.statusCode).toBe(200);
      expect(metaReadinessService.checkDestination).toHaveBeenCalledWith('agency-1', 'destination-1');
    });

    it('rejects destination operations without an agency id', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/agency-platforms/meta/destinations/destination-1/readiness',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(metaReadinessService.checkDestination).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /agency-platforms/meta/selections', () => {
    it('should save asset selections', async () => {
      const selections = [
        { assetType: 'ad_account', assetId: 'act_1', permissionLevel: 'advertise', selected: true },
      ];

      vi.mocked(metaAssetsService.saveAssetSelections).mockResolvedValue({
        data: { success: true },
        error: null,
      } as any);

      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/meta/selections',
        payload: {
          agencyId: 'agency-1',
          selections,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(metaAssetsService.saveAssetSelections).toHaveBeenCalledWith('agency-1', selections);
    });

    it('should return 400 if agencyId is missing', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/meta/selections',
        payload: {
          selections: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
