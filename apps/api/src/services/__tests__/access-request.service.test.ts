/**
 * Access Request Service Unit Tests
 *
 * Tests for access request creation and management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as accessRequestService from '@/services/access-request.service';

// Mock crypto for token generation
let cryptoCallCount = 0;
vi.mock('crypto', () => ({
  randomBytes: (size: number) => ({
    toString: (encoding: string) => {
      if (encoding === 'hex') {
        cryptoCallCount++;
        // Return different values for different calls to test uniqueness
        const hex = cryptoCallCount.toString(16).padStart(12, '0').slice(0, 12);
        return hex;
      }
      return '';
    },
  }),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
    },
    clientConnection: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    platformAuthorization: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('AccessRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAccessRequest', () => {
    it('should create a new access request with unique token', async () => {
      const mockAgency = {
        id: 'agency-1',
        name: 'Test Agency',
      };

      const mockRequest = {
        id: 'request-1',
        agencyId: 'agency-1',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        uniqueToken: 'a1b2c3d4e5f6',
        platforms: ['meta_ads', 'google_ads'],
        intakeFields: [],
        branding: {},
        status: 'pending',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.agency.findUnique).mockResolvedValue(mockAgency as any);
      vi.mocked(prisma.accessRequest.create).mockResolvedValue(mockRequest as any);

      const result = await accessRequestService.createAccessRequest({
        agencyId: 'agency-1',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        platforms: [{ platform: 'meta_ads', accessLevel: 'manage' }],
        intakeFields: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.uniqueToken).toBe('a1b2c3d4e5f6');
      expect(result.data?.status).toBe('pending');
    });

    it('should return error for invalid input', async () => {
      const result = await accessRequestService.createAccessRequest({
        agencyId: '', // Invalid
        clientName: '', // Invalid
        clientEmail: 'invalid-email', // Invalid email
        platforms: [], // Invalid - empty platforms
        intakeFields: [],
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error if agency not found', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

      const result = await accessRequestService.createAccessRequest({
        agencyId: 'non-existent',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        platforms: [{ platform: 'meta_ads', accessLevel: 'manage' }],
        intakeFields: [],
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('AGENCY_NOT_FOUND');
    });

    it('should generate unique token (retry on collision)', async () => {
      const mockAgency = { id: 'agency-1' };
      vi.mocked(prisma.agency.findUnique).mockResolvedValue(mockAgency as any);

      // First call returns existing request (collision), second call returns null (unique)
      vi.mocked(prisma.accessRequest.findUnique)
        .mockResolvedValueOnce({ id: 'existing' } as any)
        .mockResolvedValueOnce(null);

      vi.mocked(prisma.accessRequest.create).mockResolvedValue({
        id: 'request-1',
        uniqueToken: 'a1b2c3d4e5f6',
      } as any);

      const result = await accessRequestService.createAccessRequest({
        agencyId: 'agency-1',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        platforms: [{ platform: 'meta_ads', accessLevel: 'manage' }],
        intakeFields: [],
      });

      expect(result.error).toBeNull();
      expect(result.data?.uniqueToken).toBeTruthy();
    });
  });

  describe('getAccessRequestByToken', () => {
    it('should return access request by token', async () => {
      const mockRequest = {
        id: 'request-1',
        uniqueToken: 'a1b2c3d4e5f6',
        clientName: 'Test Client',
        platforms: [{ platform: 'meta_ads', accessLevel: 'manage' }],
        intakeFields: [],
        branding: {},
      };

      vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue(mockRequest as any);

      const result = await accessRequestService.getAccessRequestByToken('a1b2c3d4e5f6');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockRequest);
    });

    it('should return error if request not found', async () => {
      vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue(null);

      const result = await accessRequestService.getAccessRequestByToken('invalid-token');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('REQUEST_NOT_FOUND');
    });

    it('should return error for expired request', async () => {
      vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({
        id: 'request-1',
        expiresAt: new Date(Date.now() - 100000), // Expired
      } as any);

      const result = await accessRequestService.getAccessRequestByToken('expired-token');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('REQUEST_EXPIRED');
    });
  });

  describe('getAgencyAccessRequests', () => {
    it('should return all access requests for an agency', async () => {
      const mockRequests = [
        { id: 'request-1', clientName: 'Client 1', status: 'pending' },
        { id: 'request-2', clientName: 'Client 2', status: 'completed' },
      ];

      vi.mocked(prisma.accessRequest.findMany).mockResolvedValue(mockRequests as any);

      const result = await accessRequestService.getAgencyAccessRequests('agency-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockRequests);
    });
  });

  describe('markRequestAuthorized', () => {
    it('should mark request as completed', async () => {
      const mockRequest = {
        id: 'request-1',
        status: 'completed',
        authorizedAt: new Date(),
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
      };

      vi.mocked(prisma.accessRequest.update).mockResolvedValue(mockRequest as any);

      const result = await accessRequestService.markRequestAuthorized('request-1');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe('completed');
      expect(prisma.accessRequest.update).toHaveBeenCalledWith({
        where: { id: 'request-1' },
        data: {
          status: 'completed',
          authorizedAt: expect.any(Date),
        },
      });
    });

    it('should return error if request not found', async () => {
      vi.mocked(prisma.accessRequest.update).mockRejectedValue(
        new Error('Record to update not found')
      );

      const result = await accessRequestService.markRequestAuthorized('non-existent');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('REQUEST_NOT_FOUND');
    });
  });

  describe('generateUniqueToken', () => {
    it('should generate a 12-character hex string', () => {
      const token = accessRequestService.generateUniqueToken();

      expect(token).toHaveLength(12);
      expect(token).toMatch(/^[a-f0-9]{12}$/);
    });

    it('should generate different tokens on multiple calls', () => {
      const tokens = new Set();

      for (let i = 0; i < 100; i++) {
        tokens.add(accessRequestService.generateUniqueToken());
      }

      // With crypto.randomBytes, collisions should be extremely rare
      expect(tokens.size).toBeGreaterThan(95);
    });
  });
});
