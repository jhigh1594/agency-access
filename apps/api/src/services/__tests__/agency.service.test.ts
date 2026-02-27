/**
 * Agency Service Unit Tests
 *
 * Tests for agency CRUD operations and member management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as agencyService from '@/services/agency.service';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    agencyMember: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('AgencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAgency', () => {
    it('should create a new agency with admin member', async () => {
      const mockAgency = {
        id: 'agency-1',
        name: 'Test Agency',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMember = {
        id: 'member-1',
        agencyId: 'agency-1',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback({
          agency: {
            create: vi.fn().mockResolvedValue(mockAgency),
          },
          agencyMember: {
            create: vi.fn().mockResolvedValue(mockMember),
          },
        } as any);
      });

      const result = await agencyService.createAgency({
        name: 'Test Agency',
        email: 'admin@test.com',
        clerkUserId: 'user_123',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAgency);
    });

    it('should return error for invalid input', async () => {
      const result = await agencyService.createAgency({
        name: '', // Invalid - empty name
        email: 'invalid-email', // Invalid email
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should return error if agency already exists', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({
        id: 'existing-agency',
        name: 'Test Agency',
      } as any);

      const result = await agencyService.createAgency({
        name: 'Test Agency',
        email: 'admin@test.com',
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('AGENCY_EXISTS');
    });
  });

  describe('getAgency', () => {
    it('should return agency by id', async () => {
      const mockAgency = {
        id: 'agency-1',
        name: 'Test Agency',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.agency.findUnique).mockResolvedValue(mockAgency as any);

      const result = await agencyService.getAgency('agency-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAgency);
    });

    it('should return error if agency not found', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

      const result = await agencyService.getAgency('non-existent');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('AGENCY_NOT_FOUND');
    });
  });

  describe('inviteMember', () => {
    it('should invite a new member to agency', async () => {
      const mockMember = {
        id: 'member-2',
        agencyId: 'agency-1',
        email: 'member@test.com',
        role: 'member',
        createdAt: new Date(),
      };

      vi.mocked(prisma.agencyMember.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.agencyMember.create).mockResolvedValue(mockMember as any);
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({ id: 'agency-1' } as any);

      const result = await agencyService.inviteMember('agency-1', {
        email: 'member@test.com',
        role: 'member',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockMember);
    });

    it('should return error if member already exists', async () => {
      vi.mocked(prisma.agencyMember.findFirst).mockResolvedValue({
        id: 'existing-member',
        email: 'member@test.com',
      });

      const result = await agencyService.inviteMember('agency-1', {
        email: 'member@test.com',
        role: 'member',
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('MEMBER_EXISTS');
    });

    it('should return error for invalid email', async () => {
      const result = await agencyService.inviteMember('agency-1', {
        email: 'invalid-email',
        role: 'member',
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const mockMember = {
        id: 'member-1',
        agencyId: 'agency-1',
        email: 'member@test.com',
        role: 'admin',
        updatedAt: new Date(),
      };

      vi.mocked(prisma.agencyMember.update).mockResolvedValue(mockMember as any);

      const result = await agencyService.updateMemberRole('member-1', 'admin');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockMember);
    });

    it('should return error for invalid role', async () => {
      const result = await agencyService.updateMemberRole('member-1', 'invalid-role' as any);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent changing last admin to member', async () => {
      vi.mocked(prisma.agencyMember.count).mockResolvedValue(1); // Only 1 admin
      vi.mocked(prisma.agencyMember.findFirst).mockResolvedValue({
        id: 'member-1',
        role: 'admin',
      });

      const result = await agencyService.updateMemberRole('member-1', 'member');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('LAST_ADMIN');
    });
  });

  describe('removeMember', () => {
    it('should remove member from agency', async () => {
      const mockMember = {
        id: 'member-1',
        email: 'member@test.com',
        role: 'member',
      };

      vi.mocked(prisma.agencyMember.findFirst).mockResolvedValue(mockMember as any);
      vi.mocked(prisma.agencyMember.delete).mockResolvedValue(mockMember as any);

      const result = await agencyService.removeMember('member-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockMember);
    });

    it('should prevent removing last admin', async () => {
      vi.mocked(prisma.agencyMember.count).mockResolvedValue(1); // Only 1 admin
      vi.mocked(prisma.agencyMember.findFirst).mockResolvedValue({
        id: 'member-1',
        role: 'admin',
      });

      const result = await agencyService.removeMember('member-1');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('LAST_ADMIN');
    });
  });

  describe('getAgencyMembers', () => {
    it('should return all members of an agency', async () => {
      const mockMembers = [
        { id: 'member-1', email: 'admin@test.com', role: 'admin' },
        { id: 'member-2', email: 'member@test.com', role: 'member' },
      ];

      vi.mocked(prisma.agencyMember.findMany).mockResolvedValue(mockMembers as any);

      const result = await agencyService.getAgencyMembers('agency-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockMembers);
    });
  });

  describe('scoped member mutation helpers', () => {
    it('should reject role updates for members outside principal agency', async () => {
      vi.mocked(prisma.agencyMember.findFirst).mockResolvedValue({
        id: 'member-1',
        agencyId: 'agency-other',
        role: 'member',
      } as any);

      const result = await agencyService.updateMemberRoleForAgency('member-1', 'agency-owner', 'admin');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(prisma.agencyMember.update).not.toHaveBeenCalled();
    });

    it('should reject member removal for members outside principal agency', async () => {
      vi.mocked(prisma.agencyMember.findFirst).mockResolvedValue({
        id: 'member-1',
        agencyId: 'agency-other',
        role: 'member',
      } as any);

      const result = await agencyService.removeMemberForAgency('member-1', 'agency-owner');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(prisma.agencyMember.delete).not.toHaveBeenCalled();
    });
  });
});
