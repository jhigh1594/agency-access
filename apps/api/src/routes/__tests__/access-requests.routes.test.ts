/**
 * Access Requests Routes Tests
 *
 * Tests for enforcing platform connection requirements.
 * Following TDD - tests for new validation logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { accessRequestRoutes } from '../access-requests.js';
import * as accessRequestService from '@/services/access-request.service';
import * as agencyPlatformService from '@/services/agency-platform.service';
import * as authorization from '@/lib/authorization.js';

// Mock services
vi.mock('@/services/access-request.service');
vi.mock('@/services/agency-platform.service');
vi.mock('@/lib/authorization.js');
vi.mock('@/services/quota.service', () => ({
  quotaService: {
    checkQuota: vi.fn().mockResolvedValue({
      allowed: true,
      current: 0,
      limit: 100,
      remaining: 100,
      metric: 'access_requests',
    }),
  },
  QuotaExceededError: class extends Error {
    toJSON() {
      return { error: { code: 'QUOTA_EXCEEDED', message: 'Quota exceeded' } };
    }
  },
}));
vi.mock('@/middleware/auth.js', () => ({
  authenticate: () => async (request: any) => {
    request.user = { sub: 'user_123' };
  },
}));

// Mock Redis to prevent connection attempts in tests
vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
  },
}));

describe('Access Requests Routes - Platform Connection Validation', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(accessRequestRoutes);
    vi.clearAllMocks();
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-1', principalId: 'user_123' },
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

  describe('POST /access-requests - delegated access validation', () => {
    it('should accept Record<string, string[]> platform payloads for client authorization', async () => {
      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: { id: 'req-1', agencyId: 'agency-1' } as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'client_authorization',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: {
            google: ['google_ads', 'ga4'],
            meta: ['meta_ads'],
          },
        },
      });

      expect(response.statusCode).toBe(201);
      expect(accessRequestService.createAccessRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: expect.arrayContaining([
            { platform: 'google_ads', accessLevel: 'manage' },
            { platform: 'ga4', accessLevel: 'manage' },
            { platform: 'meta_ads', accessLevel: 'manage' },
          ]),
        })
      );
    });

    it('should accept flat platform payloads for client authorization', async () => {
      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: { id: 'req-1', agencyId: 'agency-1' } as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'client_authorization',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platform: 'google_ads', accessLevel: 'admin' },
            { platform: 'meta_ads', accessLevel: 'read_only' },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      expect(accessRequestService.createAccessRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: expect.arrayContaining([
            { platform: 'google_ads', accessLevel: 'manage' },
            { platform: 'meta_ads', accessLevel: 'view_only' },
          ]),
        })
      );
    });

    it('should return 400 when normalized platforms are empty', async () => {
      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: null as any,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one platform must be selected',
        } as any,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'client_authorization',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: {},
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('should ignore empty groups in object payload for delegated access checks', async () => {
      vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({
        data: [{ id: 'conn-1', platform: 'google', status: 'active' }] as any,
        error: null,
      });
      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: { id: 'req-1', agencyId: 'agency-1' } as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'delegated_access',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: {
            google: ['google_ads'],
            meta: [],
          },
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().error).toBeNull();
      expect(agencyPlatformService.getConnections).toHaveBeenCalledWith('agency-1');
      expect(accessRequestService.createAccessRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: [{ platform: 'google_ads', accessLevel: 'manage' }],
        })
      );
    });

    it('should allow creating delegated access request when platforms are connected', async () => {
      const mockConnections = [
        { id: 'conn-1', platform: 'google', status: 'active' },
        { id: 'conn-2', platform: 'meta', status: 'active' },
      ];

      const mockAccessRequest = {
        id: 'req-1',
        agencyId: 'agency-1',
        authModel: 'delegated_access',
        platforms: [
          { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
          { platformGroup: 'meta', products: [{ product: 'meta_ads', accessLevel: 'admin' }] },
        ],
      };

      vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({
        data: mockConnections as any,
        error: null,
      });

      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: mockAccessRequest as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'delegated_access',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
            { platformGroup: 'meta', products: [{ product: 'meta_ads', accessLevel: 'admin' }] },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().data).toEqual(mockAccessRequest);

      // Verify platform connections were checked
      expect(agencyPlatformService.getConnections).toHaveBeenCalledWith('agency-1');

      // Verify access request was created
      expect(accessRequestService.createAccessRequest).toHaveBeenCalled();
    });

    it('should reject delegated access request if platforms are not connected', async () => {
      const mockConnections = [
        { id: 'conn-1', platform: 'google', status: 'active' },
        // Meta is NOT connected
      ];

      vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({
        data: mockConnections as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'delegated_access',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
            { platformGroup: 'meta', products: [{ product: 'meta_ads', accessLevel: 'admin' }] }, // Not connected
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('PLATFORMS_NOT_CONNECTED');
      expect(response.json().error.missingPlatforms).toEqual(['meta']);

      // Should NOT create access request
      expect(accessRequestService.createAccessRequest).not.toHaveBeenCalled();
    });

    it('should reject delegated access request if platform status is not active', async () => {
      const mockConnections = [
        { id: 'conn-1', platform: 'google', status: 'active' },
        { id: 'conn-2', platform: 'meta', status: 'expired' }, // Expired
      ];

      vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({
        data: mockConnections as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'delegated_access',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platformGroup: 'meta', products: [{ product: 'meta_ads', accessLevel: 'admin' }] },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('PLATFORMS_NOT_CONNECTED');
      expect(response.json().error.missingPlatforms).toEqual(['meta']);
    });

    it('should allow client authorization without checking platform connections', async () => {
      const mockAccessRequest = {
        id: 'req-1',
        agencyId: 'agency-1',
        authModel: 'client_authorization',
        platforms: [
          { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
        ],
      };

      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: mockAccessRequest as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'client_authorization', // Client auth - no platform check needed
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
          ],
        },
      });

      expect(response.statusCode).toBe(201);

      // Should NOT check platform connections for client authorization
      expect(agencyPlatformService.getConnections).not.toHaveBeenCalled();

      // Should create access request directly
      expect(accessRequestService.createAccessRequest).toHaveBeenCalled();
    });

    it('should default to client_authorization if authModel not specified', async () => {
      const mockAccessRequest = {
        id: 'req-1',
        agencyId: 'agency-1',
      };

      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: mockAccessRequest as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          // No authModel specified - should default to client_authorization
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
          ],
        },
      });

      expect(response.statusCode).toBe(201);

      // Should NOT check platform connections (defaults to client auth)
      expect(agencyPlatformService.getConnections).not.toHaveBeenCalled();
    });

    it('should handle hierarchical platform structure (platformGroup)', async () => {
      const mockConnections = [
        { id: 'conn-1', platform: 'google', status: 'active' },
      ];

      vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({
        data: mockConnections as any,
        error: null,
      });

      vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({
        data: {} as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'delegated_access',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            {
              platformGroup: 'google', // Platform group level
              products: [
                { product: 'google_ads', accessLevel: 'admin' },
                { product: 'ga4', accessLevel: 'read_only' },
              ],
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);

      // Should check connection at platformGroup level (google), not product level
      expect(agencyPlatformService.getConnections).toHaveBeenCalledWith('agency-1');
    });

    it('should reject if multiple platforms requested but only some connected', async () => {
      const mockConnections = [
        { id: 'conn-1', platform: 'google', status: 'active' },
        { id: 'conn-2', platform: 'linkedin', status: 'active' },
        // Meta is missing
      ];

      vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({
        data: mockConnections as any,
        error: null,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'delegated_access',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
            { platformGroup: 'meta', products: [{ product: 'meta_ads', accessLevel: 'admin' }] },
            { platformGroup: 'linkedin', products: [{ product: 'linkedin_ads', accessLevel: 'admin' }] },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('PLATFORMS_NOT_CONNECTED');
      expect(response.json().error.missingPlatforms).toEqual(['meta']);
    });

    it('should handle service errors when checking connections', async () => {
      vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve connections',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/access-requests',
        payload: {
          agencyId: 'agency-1',
          authModel: 'delegated_access',
          clientName: 'John Doe',
          clientEmail: 'john@client.com',
          platforms: [
            { platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] },
          ],
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBeDefined();
    });
  });
});
