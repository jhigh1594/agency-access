/**
 * Webhook Service Tests
 *
 * Tests for handling Creem webhook events including signature verification
 * and event processing for subscription updates, invoice payments, and cancellations.
 *
 * Following TDD principles.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webhookService } from '../webhook.service';
import { creem } from '@/lib/creem';
import { subscriptionService } from '../subscription.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/creem', () => ({
  creem: {
    verifyWebhookSignature: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      create: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'test-subscription-id',
      }),
    },
  },
}));

vi.mock('../subscription.service', () => ({
  subscriptionService: {
    syncSubscription: vi.fn(),
  },
}));

describe('WebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      vi.mocked(creem.verifyWebhookSignature).mockReturnValue(true);

      const result = webhookService.verifyWebhookSignature(
        '{"test": "payload"}',
        't=1234567890,v1=abc123'
      );

      expect(result).toBe(true);
      expect(creem.verifyWebhookSignature).toHaveBeenCalledWith(
        '{"test": "payload"}',
        't=1234567890,v1=abc123'
      );
    });

    it('should reject invalid webhook signature', () => {
      vi.mocked(creem.verifyWebhookSignature).mockReturnValue(false);

      const result = webhookService.verifyWebhookSignature(
        '{"test": "payload"}',
        'invalid_signature'
      );

      expect(result).toBe(false);
    });

    it('should handle empty signature', () => {
      const result = webhookService.verifyWebhookSignature(
        '{"test": "payload"}',
        ''
      );

      expect(result).toBe(false);
    });
  });

  describe('handleWebhookEvent', () => {
    const mockPayload = {
      id: 'evt_test123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          customer: 'cus_test123',
          subscription: 'sub_test123',
          product_id: 'prod_12lDKXew8bJqbUmTGpLZbR', // PRO
          metadata: { agencyId: 'test-agency-id' },
        },
      },
    };

    it('should handle checkout.session.completed event', async () => {
      vi.mocked(subscriptionService.syncSubscription).mockResolvedValue({
        data: { id: 'sub-id', tier: 'PRO', status: 'active' },
        error: null,
      });

      const result = await webhookService.handleWebhookEvent(mockPayload);

      expect(result.error).toBeNull();
      expect(subscriptionService.syncSubscription).toHaveBeenCalledWith({
        creemSubscriptionId: 'sub_test123',
        creemCustomerId: 'cus_test123',
        productId: 'prod_12lDKXew8bJqbUmTGpLZbR',
        status: 'active',
      });
    });

    it('should handle customer.subscription.updated event', async () => {
      const subscriptionUpdatePayload = {
        id: 'evt_test456',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test456',
            customer: 'cus_test456',
            product_id: 'prod_79jS6KXv2wilYkPQQjmGVP', // STARTER
            status: 'past_due',
            current_period_start: 1704067200,
            current_period_end: 1706745600,
            cancel_at_period_end: false,
          },
        },
      };

      vi.mocked(subscriptionService.syncSubscription).mockResolvedValue({
        data: { id: 'sub-id', tier: 'STARTER', status: 'past_due' },
        error: null,
      });

      const result = await webhookService.handleWebhookEvent(subscriptionUpdatePayload);

      expect(result.error).toBeNull();
      expect(subscriptionService.syncSubscription).toHaveBeenCalledWith({
        creemSubscriptionId: 'sub_test456',
        creemCustomerId: 'cus_test456',
        productId: 'prod_79jS6KXv2wilYkPQQjmGVP',
        status: 'past_due',
        currentPeriodStart: 1704067200,
        currentPeriodEnd: 1706745600,
        cancelAtPeriodEnd: false,
      });
    });

    it('should handle customer.subscription.deleted event (cancellation)', async () => {
      const cancellationPayload = {
        id: 'evt_test789',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test789',
            customer: 'cus_test789',
            product_id: 'prod_79jS6KXv2wilYkPQQjmGVP', // STARTER
            status: 'canceled',
          },
        },
      };

      vi.mocked(subscriptionService.syncSubscription).mockResolvedValue({
        data: { id: 'sub-id', tier: 'STARTER', status: 'canceled' },
        error: null,
      });

      const result = await webhookService.handleWebhookEvent(cancellationPayload);

      expect(result.error).toBeNull();
      expect(subscriptionService.syncSubscription).toHaveBeenCalledWith({
        creemSubscriptionId: 'sub_test789',
        creemCustomerId: 'cus_test789',
        productId: 'prod_79jS6KXv2wilYkPQQjmGVP',
        status: 'canceled',
      });
    });

    it('should handle invoice.paid event', async () => {
      const invoicePayload = {
        id: 'evt_invoice123',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            amount_paid: 9900,
            currency: 'usd',
            status: 'paid',
            created: 1704067200,
            hosted_invoice_url: 'https://creem.io/invoices/in_test123',
            pdf_url: 'https://creem.io/invoices/in_test123.pdf',
          },
        },
      };

      vi.mocked(prisma.invoice.create).mockResolvedValue({
        id: 'local-inv-1',
      });
      vi.mocked(subscriptionService.syncSubscription).mockResolvedValue({
        data: { id: 'sub-id', tier: 'PRO', status: 'active' },
        error: null,
      });

      const result = await webhookService.handleWebhookEvent(invoicePayload);

      expect(result.error).toBeNull();
      expect(prisma.invoice.create).toHaveBeenCalled();
    });

    it('should handle invoice.payment_failed event', async () => {
      const invoiceFailedPayload = {
        id: 'evt_invoice_failed',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_failed123',
            customer: 'cus_failed123',
            subscription: 'sub_failed123',
            product_id: 'prod_79jS6KXv2wilYkPQQjmGVP',
            status: 'open',
            created: 1704067200,
          },
        },
      };

      vi.mocked(subscriptionService.syncSubscription).mockResolvedValue({
        data: { id: 'sub-id', tier: 'STARTER', status: 'past_due' },
        error: null,
      });

      const result = await webhookService.handleWebhookEvent(invoiceFailedPayload);

      expect(result.error).toBeNull();
      expect(subscriptionService.syncSubscription).toHaveBeenCalledWith({
        creemSubscriptionId: 'sub_failed123',
        creemCustomerId: 'cus_failed123',
        productId: 'prod_79jS6KXv2wilYkPQQjmGVP',
        status: 'past_due',
      });
    });

    it('should ignore unknown event types', async () => {
      const unknownPayload = {
        id: 'evt_unknown',
        type: 'unknown.event',
        data: {},
      };

      const result = await webhookService.handleWebhookEvent(unknownPayload);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ received: true });
    });

    it('should handle syncSubscription errors gracefully', async () => {
      vi.mocked(subscriptionService.syncSubscription).mockResolvedValue({
        data: null,
        error: { code: 'SYNC_ERROR', message: 'Failed to sync subscription' },
      });

      const result = await webhookService.handleWebhookEvent(mockPayload);

      // Webhooks should not fail even if sync fails - just log and return
      expect(result.error).toBeNull();
    });
  });
});
