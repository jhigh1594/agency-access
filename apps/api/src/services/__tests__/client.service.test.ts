/**
 * Client Service Tests
 *
 * Test-Driven Development for Phase 5 Client Management
 * Following Red-Green-Refactor cycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as clientService from '@/services/client.service';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);

describe('Phase 5: Client Service - TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a client with valid data', async () => {
      const mockClient = {
        id: 'client-1',
        agencyId: 'agency-1',
        name: 'John Smith',
        company: 'Acme Corporation',
        email: 'john@acme.com',
        website: 'https://acme.com',
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue(null);
      vi.mocked(mockPrisma.client.create).mockResolvedValue(mockClient);

      const result = await clientService.createClient({
        agencyId: 'agency-1',
        name: 'John Smith',
        company: 'Acme Corporation',
        email: 'john@acme.com',
        website: 'https://acme.com',
        language: 'en',
      });

      expect(result).toEqual(mockClient);
      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          agencyId: 'agency-1',
          name: 'John Smith',
          company: 'Acme Corporation',
          email: 'john@acme.com',
          website: 'https://acme.com',
          language: 'en',
        },
      });
    });

    it('should create a client with default language en', async () => {
      const mockClient = {
        id: 'client-2',
        agencyId: 'agency-1',
        name: 'Jane Doe',
        company: 'TechCo',
        email: 'jane@techco.com',
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue(null);
      vi.mocked(mockPrisma.client.create).mockResolvedValue(mockClient);

      const result = await clientService.createClient({
        agencyId: 'agency-1',
        name: 'Jane Doe',
        company: 'TechCo',
        email: 'jane@techco.com',
      });

      expect(result.language).toBe('en');
      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ language: 'en' }),
      });
    });

    it('should prevent duplicate email per agency', async () => {
      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue({
        id: 'existing-client',
        email: 'john@acme.com',
      });

      await expect(
        clientService.createClient({
          agencyId: 'agency-1',
          name: 'John Smith',
          company: 'Acme Corp',
          email: 'john@acme.com',
        })
      ).rejects.toThrow('CLIENT_EMAIL_EXISTS');

      expect(mockPrisma.client.create).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue(null);

      await expect(
        clientService.createClient({
          agencyId: 'agency-1',
          name: 'Test',
          company: 'Test',
          email: 'invalid-email',
        })
      ).rejects.toThrow();
    });
  });

  describe('getClients', () => {
    it('should return all clients for an agency', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Alice Anderson',
          company: 'AAA Inc',
          email: 'alice@aaa.com',
          language: 'en',
        },
        {
          id: 'client-2',
          name: 'Bob Brown',
          company: 'BBB LLC',
          email: 'bob@bbb.com',
          language: 'es',
        },
      ];

      vi.mocked(mockPrisma.client.findMany).mockResolvedValue(mockClients);
      vi.mocked(mockPrisma.client.count).mockResolvedValue(2);

      const result = await clientService.getClients({
        agencyId: 'agency-1',
      });

      expect(result.data).toEqual(mockClients);
      expect(result.pagination.total).toBe(2);
    });

    it('should support pagination with limit and offset', async () => {
      const mockClients = [
        { id: 'client-2', name: 'Bob Brown' },
      ];

      vi.mocked(mockPrisma.client.findMany).mockResolvedValue(mockClients);
      vi.mocked(mockPrisma.client.count).mockResolvedValue(3);

      const result = await clientService.getClients({
        agencyId: 'agency-1',
        limit: 2,
        offset: 1,
      });

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency-1' },
        take: 2,
        skip: 1,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should search clients by name, company, or email', async () => {
      const mockClients = [
        { id: 'client-1', name: 'Alice Anderson' },
      ];

      vi.mocked(mockPrisma.client.findMany).mockResolvedValue(mockClients);
      vi.mocked(mockPrisma.client.count).mockResolvedValue(1);

      const result = await clientService.getClients({
        agencyId: 'agency-1',
        search: 'Alice',
      });

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency-1',
          OR: [
            { name: { contains: 'Alice', mode: 'insensitive' } },
            { company: { contains: 'Alice', mode: 'insensitive' } },
            { email: { contains: 'Alice', mode: 'insensitive' } },
          ],
        },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getClientById', () => {
    it('should return client by id', async () => {
      const mockClient = {
        id: 'client-1',
        agencyId: 'agency-1',
        name: 'Find Me',
        company: 'Findable Inc',
        email: 'findme@test.com',
      };

      vi.mocked(mockPrisma.client.findUnique).mockResolvedValue(mockClient);

      const result = await clientService.getClientById('client-1', 'agency-1');

      expect(result).toEqual(mockClient);
      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-1' },
      });
    });

    it('should return null for non-existent client', async () => {
      vi.mocked(mockPrisma.client.findUnique).mockResolvedValue(null);

      const result = await clientService.getClientById('non-existent', 'agency-1');

      expect(result).toBeNull();
    });
  });

  describe('updateClient', () => {
    it('should update client fields', async () => {
      const mockUpdatedClient = {
        id: 'client-1',
        name: 'Updated Name',
        company: 'Original Company',
        email: 'original@test.com',
        website: 'https://updated.com',
        language: 'es',
      };

      vi.mocked(mockPrisma.client.findUnique).mockResolvedValue({
        id: 'client-1',
        agencyId: 'agency-1',
        email: 'original@test.com',
      });
      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue(null);
      vi.mocked(mockPrisma.client.update).mockResolvedValue(mockUpdatedClient);

      const result = await clientService.updateClient('client-1', 'agency-1', {
        name: 'Updated Name',
        website: 'https://updated.com',
        language: 'es',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.website).toBe('https://updated.com');
      expect(result.language).toBe('es');
    });

    it('should not allow updating email to duplicate', async () => {
      vi.mocked(mockPrisma.client.findUnique).mockResolvedValue({
        id: 'client-1',
        agencyId: 'agency-1',
      });
      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue({
        id: 'different-client',
        email: 'existing@test.com',
      });

      await expect(
        clientService.updateClient('client-1', 'agency-1', {
          email: 'existing@test.com',
        })
      ).rejects.toThrow('CLIENT_EMAIL_EXISTS');
    });
  });

  describe('findClientByEmail', () => {
    it('should find client by email', async () => {
      const mockClient = {
        id: 'client-1',
        email: 'searchable@test.com',
      };

      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue(mockClient);

      const result = await clientService.findClientByEmail('agency-1', 'searchable@test.com');

      expect(result).toEqual(mockClient);
    });

    it('should return null for non-existent email', async () => {
      vi.mocked(mockPrisma.client.findFirst).mockResolvedValue(null);

      const result = await clientService.findClientByEmail('agency-1', 'nonexistent@test.com');

      expect(result).toBeNull();
    });
  });

  describe('deleteClient', () => {
    it('should delete a client', async () => {
      vi.mocked(mockPrisma.client.findUnique).mockResolvedValue({
        id: 'client-1',
        agencyId: 'agency-1',
      });
      vi.mocked(mockPrisma.client.delete).mockResolvedValue({ id: 'client-1' });

      const result = await clientService.deleteClient('client-1', 'agency-1');

      expect(result).toBe(true);
      expect(mockPrisma.client.delete).toHaveBeenCalledWith({
        where: { id: 'client-1' },
      });
    });

    it('should return false for non-existent client', async () => {
      vi.mocked(mockPrisma.client.findUnique).mockResolvedValue(null);

      const result = await clientService.deleteClient('non-existent', 'agency-1');

      expect(result).toBe(false);
    });
  });
});
