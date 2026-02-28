import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscriptionService } from '../subscription.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

describe('SubscriptionService billing helpers', () => {
  const mockAgencyId = 'agency-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns saved billing details from agency settings', async () => {
    vi.mocked(prisma.agency.findUnique).mockResolvedValue({
      id: mockAgencyId,
      name: 'Agency Name',
      email: 'owner@example.com',
      settings: {
        billingDetails: {
          name: 'Billing Team',
          email: 'billing@example.com',
          address: { line1: '123 Main' },
        },
      },
    } as any);

    const result = await subscriptionService.getBillingDetails(mockAgencyId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      name: 'Billing Team',
      email: 'billing@example.com',
      address: { line1: '123 Main' },
    });
  });

  it('falls back to agency name/email when no billing details are saved', async () => {
    vi.mocked(prisma.agency.findUnique).mockResolvedValue({
      id: mockAgencyId,
      name: 'Agency Name',
      email: 'owner@example.com',
      settings: null,
    } as any);

    const result = await subscriptionService.getBillingDetails(mockAgencyId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      name: 'Agency Name',
      email: 'owner@example.com',
    });
  });

  it('persists billing details into agency settings', async () => {
    vi.mocked(prisma.agency.findUnique).mockResolvedValue({
      id: mockAgencyId,
      settings: { timezone: 'UTC' },
    } as any);
    vi.mocked(prisma.agency.update).mockResolvedValue({
      settings: {
        timezone: 'UTC',
        billingDetails: { name: 'Updated Agency', email: 'billing@example.com' },
      },
    } as any);

    const result = await subscriptionService.updateBillingDetails(mockAgencyId, {
      name: 'Updated Agency',
      email: 'billing@example.com',
    });

    expect(result.error).toBeNull();
    expect(prisma.agency.update).toHaveBeenCalledWith({
      where: { id: mockAgencyId },
      data: {
        settings: {
          timezone: 'UTC',
          billingDetails: {
            name: 'Updated Agency',
            email: 'billing@example.com',
          },
        },
      },
      select: {
        settings: true,
      },
    });
    expect(result.data).toEqual({
      name: 'Updated Agency',
      email: 'billing@example.com',
    });
  });

  it('returns empty payment methods when no subscription exists', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

    const result = await subscriptionService.getPaymentMethods(mockAgencyId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});
