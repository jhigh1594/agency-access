/**
 * Pinterest Agency Platform Routes Tests
 *
 * Tests for Pinterest-specific platform connection operations.
 * Following TDD - tests written before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerPinterestRoutes } from '../pinterest.routes.js';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyPlatformConnection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    agency: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Pinterest Agency Platform Routes', () => {
  let app: FastifyInstance;
  let testAgency: any;
  let testConnection: any;

  beforeEach(async () => {
    // Setup Fastify app
    app = Fastify();
    await registerPinterestRoutes(app);

    // Create mock test data with valid UUIDs
    testAgency = {
      id: '01234567-0123-0123-0123-0123456789ab',
      name: 'Test Agency',
      clerkOrganizationId: 'test-org-123',
    };

    testConnection = {
      id: '01234567-0123-0123-0123-0123456789cd',
      agencyId: testAgency.id,
      platform: 'pinterest',
      secretId: 'test-secret-id',
      status: 'active',
      metadata: {},
    };

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('PATCH /agency-platforms/pinterest/business-id', () => {
    it('should save Pinterest Business ID to connection metadata', async () => {
      // Mock prisma calls
      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(testConnection);
      vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue({
        ...testConnection,
        metadata: { businessId: '664351519939856629' },
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/pinterest/business-id',
        payload: {
          agencyId: testAgency.id,
          businessId: '664351519939856629',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.data).toBeDefined();
      expect(json.data.metadata.businessId).toBe('664351519939856629');

      // Verify prisma calls
      expect(prisma.agencyPlatformConnection.findFirst).toHaveBeenCalledWith({
        where: {
          agencyId: testAgency.id,
          platform: 'pinterest',
        },
      });

      expect(prisma.agencyPlatformConnection.update).toHaveBeenCalledWith({
        where: { id: testConnection.id },
        data: {
          metadata: expect.objectContaining({
            businessId: '664351519939856629',
          }),
        },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agencyId: testAgency.id,
          action: 'AGENCY_CONNECTED',
          platform: 'pinterest',
          metadata: expect.objectContaining({
            businessId: '664351519939856629',
            connectionId: testConnection.id,
          }),
        }),
      });
    });

    it('should validate Business ID format (numbers only)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/pinterest/business-id',
        payload: {
          agencyId: testAgency.id,
          businessId: 'invalid-id-with-letters',
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate Business ID length (1-20 digits)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/pinterest/business-id',
        payload: {
          agencyId: testAgency.id,
          businessId: '123456789012345678901', // 21 digits
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate minimum Business ID length (at least 1 digit)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/pinterest/business-id',
        payload: {
          agencyId: testAgency.id,
          businessId: '', // 0 digits
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if connection does not exist', async () => {
      // Mock no connection found
      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/pinterest/business-id',
        payload: {
          agencyId: '99999999-9999-9999-9999-999999999999', // Valid UUID format but non-existent
          businessId: '664351519939856629',
        },
      });

      expect(response.statusCode).toBe(404);
      const json = response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('NOT_FOUND');
      expect(json.error.message).toContain('Pinterest connection not found');
    });

    it('should merge Business ID with existing metadata', async () => {
      const connectionWithExistingMetadata = {
        ...testConnection,
        metadata: {
          existingField: 'existing-value',
          anotherField: 'another-value',
        },
      };

      vi.mocked(prisma.agencyPlatformConnection.findFirst).mockResolvedValue(
        connectionWithExistingMetadata
      );
      vi.mocked(prisma.agencyPlatformConnection.update).mockResolvedValue({
        ...connectionWithExistingMetadata,
        metadata: {
          existingField: 'existing-value',
          anotherField: 'another-value',
          businessId: '664351519939856629',
        },
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/pinterest/business-id',
        payload: {
          agencyId: testAgency.id,
          businessId: '664351519939856629',
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify update preserves existing metadata
      expect(prisma.agencyPlatformConnection.update).toHaveBeenCalledWith({
        where: { id: testConnection.id },
        data: {
          metadata: {
            existingField: 'existing-value',
            anotherField: 'another-value',
            businessId: '664351519939856629',
          },
        },
      });
    });

    it('should validate agencyId is a valid UUID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/agency-platforms/pinterest/business-id',
        payload: {
          agencyId: 'not-a-valid-uuid',
          businessId: '664351519939856629',
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
