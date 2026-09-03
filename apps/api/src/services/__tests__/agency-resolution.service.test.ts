import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { resolveAgency } from '../agency-resolution.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(async ({ fetch }: any) => fetch()),
  invalidateCache: vi.fn(),
  CacheKeys: {
    agencyByClerkId: (id: string) => `agency:clerk:${id}`,
  },
  CacheTTL: { EXTENDED: 1800 },
}));

describe('resolveAgency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaces a placeholder agency email with the Clerk user email', async () => {
    const agency = {
      id: 'agency_1',
      clerkUserId: 'user_1',
      name: 'Mindbent Media',
      email: 'user_1@clerk.temp',
    };
    vi.mocked(prisma.agency.findUnique)
      .mockResolvedValueOnce(agency as any)
      .mockResolvedValueOnce(null as any);
    vi.mocked(prisma.agency.update).mockResolvedValue({
      ...agency,
      email: 'ben@mindbentmedia.com',
    } as any);

    const result = await resolveAgency('user_1', {
      createIfMissing: true,
      userEmail: 'ben@mindbentmedia.com',
    });

    expect(result.error).toBeNull();
    expect(result.data?.agency.email).toBe('ben@mindbentmedia.com');
    expect(prisma.agency.update).toHaveBeenCalledWith({
      where: { id: 'agency_1' },
      data: { email: 'ben@mindbentmedia.com' },
    });
  });

  it('normalizes the Clerk email case before the placeholder replacement lookup', async () => {
    const agency = {
      id: 'agency_1',
      clerkUserId: 'user_1',
      name: 'Mindbent Media',
      email: 'user_1@clerk.temp',
    };
    vi.mocked(prisma.agency.findUnique)
      .mockResolvedValueOnce(agency as any)
      .mockResolvedValueOnce(null as any);
    vi.mocked(prisma.agency.update).mockResolvedValue({
      ...agency,
      email: 'ben@mindbentmedia.com',
    } as any);

    const result = await resolveAgency('user_1', {
      createIfMissing: true,
      userEmail: '  Ben@MindbentMedia.COM ',
    });

    expect(result.error).toBeNull();
    expect(prisma.agency.findUnique).toHaveBeenNthCalledWith(2, {
      where: { email: 'ben@mindbentmedia.com' },
    });
    expect(prisma.agency.update).toHaveBeenCalledWith({
      where: { id: 'agency_1' },
      data: { email: 'ben@mindbentmedia.com' },
    });
  });
});
