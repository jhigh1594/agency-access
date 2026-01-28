/**
 * Subscription Service Tests
 *
 * Tests for subscription management including checkout sessions,
 * portal access, and subscription synchronization.
 *
 * Following TDD principles.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionService } from '../subscription.service';
import { prisma } from '@/lib/prisma';
import { creem } from '@/lib/creem';
import { getProductId } from '@/config/creem.config';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: {
      findUnique: vi.fn().mockResolvedValue({ id: 'test-agency-id', subscriptionTier: 'STARTER' }),
      findFirst: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/creem', () => ({
  creem: {
    createCustomer: vi.fn(),
    retrieveCustomer: vi.fn(),
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
    retrieveSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    listInvoices: vi.fn(),
  },
}));

describe('SubscriptionService', () => {
  const mockAgencyId = 'test-agency-id';
  const mockSubscriptionId = 'test-subscription-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for new subscription', async () => {
      // Mock agency without Creem customer
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
      vi.mocked(creem.createCustomer).mockResolvedValue({
        data: { id: 'cus_test123' },
      });
      vi.mocked(creem.createCheckoutSession).mockResolvedValue({
        data: { url: 'https://checkout.creem.io/test' },
      });
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback(prisma);
      });

      const result = await subscriptionService.createCheckoutSession({
        agencyId: mockAgencyId,
        tier: 'PRO',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        checkoutUrl: 'https://checkout.creem.io/test',
      });
    });

    it('should handle existing Creem customer', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: mockSubscriptionId,
        creemCustomerId: 'cus_existing123',
      });
      vi.mocked(creem.createCheckoutSession).mockResolvedValue({
        data: { url: 'https://checkout.creem.io/test' },
      });
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback(prisma);
      });

      const result = await subscriptionService.createCheckoutSession({
        agencyId: mockAgencyId,
        tier: 'PRO',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.error).toBeNull();
      expect(creem.createCustomer).not.toHaveBeenCalled();
      expect(creem.createCheckoutSession).toHaveBeenCalled();
    });

    it('should return error for unknown agency', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

      const result = await subscriptionService.createCheckoutSession({
        agencyId: mockAgencyId,
        tier: 'PRO',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'AGENCY_NOT_FOUND',
        message: 'Agency not found',
      });
    });

    it('should handle Creem API errors', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.agency.findUnique).mockResolvedValue({
        id: mockAgencyId,
        email: 'test@example.com',
        name: 'Test Agency',
      });
      vi.mocked(creem.createCustomer).mockResolvedValue({
        data: null,
        error: { code: 'CREEM_ERROR', message: 'API error' },
      });

      const result = await subscriptionService.createCheckoutSession({
        agencyId: mockAgencyId,
        tier: 'PRO',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'CREEM_ERROR',
        message: 'API error',
      });
    });
  });

  describe('getSubscription', () => {
    it('should return subscription details', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: mockSubscriptionId,
        tier: 'PRO',
        status: 'active',
        currentPeriodStart: new Date('2025-01-01'),
        currentPeriodEnd: new Date('2025-02-01'),
        creemCustomerId: 'cus_test123',
        creemSubscriptionId: 'sub_test123',
        cancelAtPeriodEnd: false,
      });

      const result = await subscriptionService.getSubscription(mockAgencyId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: mockSubscriptionId,
        tier: 'PRO',
        status: 'active',
        currentPeriodStart: new Date('2025-01-01'),
        currentPeriodEnd: new Date('2025-02-01'),
        cancelAtPeriodEnd: false,
        creemCustomerId: 'cus_test123',
        creemSubscriptionId: 'sub_test123',
      });
    });

    it('should return null for agency without subscription', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      const result = await subscriptionService.getSubscription(mockAgencyId);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe('createPortalSession', () => {
    it('should create portal session for existing customer', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        creemCustomerId: 'cus_test123',
      });
      vi.mocked(creem.createPortalSession).mockResolvedValue({
        data: { url: 'https://portal.creem.io/test' },
      });

      const result = await subscriptionService.createPortalSession({
        agencyId: mockAgencyId,
        returnUrl: 'https://example.com/settings',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        portalUrl: 'https://portal.creem.io/test',
      });
    });

    it('should return error for agency without Creem customer', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      const result = await subscriptionService.createPortalSession({
        agencyId: mockAgencyId,
        returnUrl: 'https://example.com/settings',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'NO_SUBSCRIPTION',
        message: 'No subscription found for this agency',
      });
    });
  });

  describe('listInvoices', () => {
    it('should list invoices for subscription', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: mockSubscriptionId,
        creemCustomerId: 'cus_test123',
      });
      vi.mocked(creem.listInvoices).mockResolvedValue({
        data: [
          { id: 'inv_1', amount: 2900, status: 'paid', created: 1704067200000 },
          { id: 'inv_2', amount: 2900, status: 'paid', created: 1706745600000 },
        ],
      });
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        {
          id: 'local-inv-1',
          amount: 2900,
          currency: 'usd',
          status: 'paid',
          invoiceDate: new Date('2024-01-01'),
          invoiceUrl: 'https://creem.io/invoices/inv_1',
        },
        {
          id: 'local-inv-2',
          amount: 2900,
          currency: 'usd',
          status: 'paid',
          invoiceDate: new Date('2024-02-01'),
          invoiceUrl: 'https://creem.io/invoices/inv_2',
        },
      ]);

      const result = await subscriptionService.listInvoices({
        agencyId: mockAgencyId,
        limit: 10,
      });

      expect(result.error).toBeNull();
      expect(result.data?.invoices).toHaveLength(2);
    });

    it('should return empty array for agency without subscription', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      const result = await subscriptionService.listInvoices({
        agencyId: mockAgencyId,
        limit: 10,
      });

      expect(result.error).toBeNull();
      expect(result.data?.invoices).toEqual([]);
    });
  });

  describe('syncSubscription', () => {
    it('should sync subscription from Creem webhook', async () => {
      const mockCreemSubscription = {
        id: 'sub_creem123',
        customer: 'cus_test123',
        product_id: getProductId('PRO'),
        status: 'active',
        current_period_start: 1704067200,
        current_period_end: 1706745600,
        cancel_at_period_end: false,
      };

      vi.mocked(prisma.agency.findFirst).mockResolvedValue({
        id: mockAgencyId,
      });
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({
        id: mockSubscriptionId,
        tier: 'PRO',
        status: 'active',
      });

      const result = await subscriptionService.syncSubscription({
        creemSubscriptionId: 'sub_creem123',
        creemCustomerId: 'cus_test123',
        productId: getProductId('PRO'),
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: mockSubscriptionId,
        tier: 'PRO',
        status: 'active',
      });
    });

    it('should handle canceled subscriptions', async () => {
      const result = await subscriptionService.syncSubscription({
        creemSubscriptionId: 'sub_creem123',
        creemCustomerId: 'cus_test123',
        productId: getProductId('PRO'),
        status: 'canceled',
      });

      expect(result.error).toBeNull();
    });

    it('should return error for unknown product ID', async () => {
      const result = await subscriptionService.syncSubscription({
        creemSubscriptionId: 'sub_creem123',
        creemCustomerId: 'cus_test123',
        productId: 'prod_unknown',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'UNKNOWN_PRODUCT',
        message: 'Unknown Creem product ID',
      });
    });
  });
});
