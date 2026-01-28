/**
 * Webhook Routes Tests
 *
 * Test-Driven Development for Creem.io webhook handler.
 * Following Red-Green-Refactor cycle.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { webhookRoutes } from '../webhooks';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    agency: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/services/clerk-metadata.service', () => ({
  clerkMetadataService: {
    setSubscriptionTier: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { clerkMetadataService } from '@/services/clerk-metadata.service';

describe('Webhook Routes - TDD Tests', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(webhookRoutes, { prefix: '/api' });
    vi.clearAllMocks();

    // Default mock responses
    (prisma.auditLog.findFirst as any).mockResolvedValue(null);
    (prisma.auditLog.create as any).mockResolvedValue({ id: 'log-123' });
    (prisma.agency.findFirst as any).mockResolvedValue({
      id: 'agency-123',
      clerkUserId: 'clerk_user_123',
      settings: { creemCustomerId: 'cus_123' },
    });
    (clerkMetadataService.setSubscriptionTier as any).mockResolvedValue({
      data: { tier: 'AGENCY' },
      error: null,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/webhooks/creem', () => {
    const validPayload = {
      id: 'evt_123',
      type: 'subscription.created',
      data: {
        subscription: {
          id: 'sub_123',
          status: 'active',
          customer_id: 'cus_123',
          price_id: 'price_agency_monthly',
          current_period_start: '2024-01-01T00:00:00.000Z',
          current_period_end: '2024-02-01T00:00:00.000Z',
        },
      },
    };

    it('should handle subscription.created event', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.received).toBe(true);
      expect(payload.processed).toBe(true);
    });

    it('should handle subscription.updated event', async () => {
      const updatePayload = {
        ...validPayload,
        type: 'subscription.updated',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.received).toBe(true);
      expect(payload.processed).toBe(true);
    });

    it('should map price_agency_monthly to AGENCY tier', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: validPayload,
      });

      expect(clerkMetadataService.setSubscriptionTier).toHaveBeenCalledWith(
        'clerk_user_123',
        'AGENCY',
        expect.objectContaining({
          subscriptionId: 'sub_123',
          subscriptionStatus: 'active',
        })
      );
    });

    it('should map price_pro_yearly to PRO tier', async () => {
      const proPayload = {
        ...validPayload,
        data: {
          subscription: {
            ...validPayload.data.subscription,
            price_id: 'price_pro_yearly',
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: proPayload,
      });

      expect(clerkMetadataService.setSubscriptionTier).toHaveBeenCalledWith(
        'clerk_user_123',
        'PRO',
        expect.anything()
      );
    });

    it('should return duplicate=true for idempotent requests', async () => {
      (prisma.auditLog.findFirst as any).mockResolvedValue({ id: 'existing-log' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.duplicate).toBe(true);
      expect(payload.received).toBe(true);
      // Should not process duplicates
      expect(clerkMetadataService.setSubscriptionTier).not.toHaveBeenCalled();
    });

    it('should return 400 for unknown price ID', async () => {
      const invalidPayload = {
        ...validPayload,
        data: {
          subscription: {
            ...validPayload.data.subscription,
            price_id: 'price_unknown',
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
      const payload = JSON.parse(response.payload);
      expect(payload.error).toBeDefined();
    });

    it('should log webhook to audit log', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: validPayload,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREEM_WEBHOOK_subscription.created',
          resourceId: 'evt_123',
          resourceType: 'webhook',
        }),
      });
    });

    it('should update agency subscriptionTier in database', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: validPayload,
      });

      expect(prisma.agency.update).toHaveBeenCalledWith({
        where: { id: 'agency-123' },
        data: { subscriptionTier: 'AGENCY' },
      });
    });

    it('should handle subscription.canceled event', async () => {
      const cancelPayload = {
        ...validPayload,
        type: 'subscription.canceled',
        data: {
          subscription: {
            ...validPayload.data.subscription,
            status: 'canceled',
            price_id: 'price_starter_monthly',
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: cancelPayload,
      });

      expect(response.statusCode).toBe(200);
      expect(clerkMetadataService.setSubscriptionTier).toHaveBeenCalledWith(
        'clerk_user_123',
        'STARTER',
        expect.objectContaining({
          subscriptionStatus: 'canceled',
        })
      );
    });

    it('should handle agency not found gracefully', async () => {
      (prisma.agency.findFirst as any).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.received).toBe(true);
      // Should not crash, just log and return
    });

    it('should handle trial_end in subscription', async () => {
      const trialPayload = {
        ...validPayload,
        data: {
          subscription: {
            ...validPayload.data.subscription,
            trial_end: '2024-01-15T00:00:00.000Z',
          },
        },
      };

      await app.inject({
        method: 'POST',
        url: '/api/webhooks/creem',
        payload: trialPayload,
      });

      expect(clerkMetadataService.setSubscriptionTier).toHaveBeenCalledWith(
        'clerk_user_123',
        'AGENCY',
        expect.objectContaining({
          trialEndsAt: expect.any(Date),
        })
      );
    });
  });

  describe('Price ID to Tier Mapping', () => {
    const baseValidPayload = {
      id: 'evt_123',
      type: 'subscription.created' as const,
      data: {
        subscription: {
          id: 'sub_123',
          status: 'active' as const,
          customer_id: 'cus_123',
          price_id: 'price_agency_monthly',
          current_period_start: '2024-01-01T00:00:00.000Z',
          current_period_end: '2024-02-01T00:00:00.000Z',
        },
      },
    };

    it('should map all starter price IDs', async () => {
      const starterPrices = ['price_starter_monthly', 'price_starter_yearly'];

      for (const priceId of starterPrices) {
        const payload = {
          ...baseValidPayload,
          data: {
            subscription: {
              ...baseValidPayload.data.subscription,
              price_id: priceId,
            },
          },
        };

        await app.inject({
          method: 'POST',
          url: '/api/webhooks/creem',
          payload,
        });

        expect(clerkMetadataService.setSubscriptionTier).toHaveBeenCalledWith(
          'clerk_user_123',
          'STARTER',
          expect.anything()
        );
      }
    });

    it('should map all agency price IDs', async () => {
      const agencyPrices = ['price_agency_monthly', 'price_agency_yearly'];

      for (const priceId of agencyPrices) {
        vi.clearAllMocks();
        const payload = {
          ...baseValidPayload,
          data: {
            subscription: {
              ...baseValidPayload.data.subscription,
              price_id: priceId,
            },
          },
        };

        await app.inject({
          method: 'POST',
          url: '/api/webhooks/creem',
          payload,
        });

        expect(clerkMetadataService.setSubscriptionTier).toHaveBeenCalledWith(
          'clerk_user_123',
          'AGENCY',
          expect.anything()
        );
      }
    });

    it('should map all pro price IDs', async () => {
      const proPrices = ['price_pro_monthly', 'price_pro_yearly'];

      for (const priceId of proPrices) {
        vi.clearAllMocks();
        const payload = {
          ...baseValidPayload,
          data: {
            subscription: {
              ...baseValidPayload.data.subscription,
              price_id: priceId,
            },
          },
        };

        await app.inject({
          method: 'POST',
          url: '/api/webhooks/creem',
          payload,
        });

        expect(clerkMetadataService.setSubscriptionTier).toHaveBeenCalledWith(
          'clerk_user_123',
          'PRO',
          expect.anything()
        );
      }
    });
  });
});
