/**
 * Subscription Service
 *
 * Business logic for subscription management including:
 * - Checkout sessions for new subscriptions and upgrades
 * - Customer portal access for self-service management
 * - Subscription synchronization from Creem webhooks
 * - Invoice history and management
 *
 * Following TDD principles - tests written first.
 */

import { prisma } from '@/lib/prisma';
import { creem } from '@/lib/creem';
import { getProductId, getTierFromProductId } from '@/config/creem.config';
import type { SubscriptionTier } from '@agency-platform/shared';

interface CheckoutSessionParams {
  agencyId: string;
  tier: SubscriptionTier;
  successUrl: string;
  cancelUrl: string;
}

interface PortalSessionParams {
  agencyId: string;
  returnUrl: string;
}

interface ListInvoicesParams {
  agencyId: string;
  limit?: number;
}

interface SyncSubscriptionParams {
  creemSubscriptionId: string;
  creemCustomerId: string;
  productId: string;
  status?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

interface ServiceResult<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

class SubscriptionService {
  /**
   * Create a checkout session for a new subscription or upgrade
   */
  async createCheckoutSession(params: CheckoutSessionParams): Promise<
    ServiceResult<{ checkoutUrl: string }>
  > {
    const { agencyId, tier, successUrl, cancelUrl } = params;

    // Get agency
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, email: true, name: true },
    });

    if (!agency) {
      return {
        data: null,
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' },
      };
    }

    // Get existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { agencyId },
    });

    let creemCustomerId = existingSubscription?.creemCustomerId ?? undefined;

    // Create new Creem customer if needed
    if (!creemCustomerId) {
      const customerResult = await creem.createCustomer({
        email: agency.email,
        name: agency.name,
        metadata: { agencyId },
      });

      if (customerResult.error || !customerResult.data) {
        return {
          data: null,
          error: {
            code: customerResult.error?.code || 'CREEM_ERROR',
            message: customerResult.error?.message || 'Failed to create customer',
          },
        };
      }

      creemCustomerId = customerResult.data.id;
    }

    if (!creemCustomerId) {
      return {
        data: null,
        error: { code: 'CREEM_ERROR', message: 'Missing customer ID' },
      };
    }

    // Create checkout session
    const productId = getProductId(tier);
    const checkoutResult = await creem.createCheckoutSession({
      customer: creemCustomerId,
      customerEmail: agency.email,
      productId,
      successUrl,
      cancelUrl,
      metadata: { agencyId, tier },
    });

    if (checkoutResult.error || !checkoutResult.data) {
      return {
        data: null,
        error: {
          code: checkoutResult.error?.code || 'CHECKOUT_ERROR',
          message: checkoutResult.error?.message || 'Failed to create checkout session',
        },
      };
    }

    // Update subscription record with customer ID
    await prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { agencyId },
        create: {
          agencyId,
          creemCustomerId,
          tier: 'STARTER', // Will be updated by webhook
          status: 'incomplete',
        },
        update: {
          creemCustomerId,
        },
      });
    });

    return {
      data: { checkoutUrl: checkoutResult.data.url },
      error: null,
    };
  }

  /**
   * Get subscription details for an agency
   */
  async getSubscription(agencyId: string): Promise<
    ServiceResult<{
      id: string;
      tier: SubscriptionTier;
      status: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd: boolean;
      creemCustomerId?: string;
      creemSubscriptionId?: string;
    }>
  > {
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
    });

    if (!subscription) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: subscription.id,
        tier: subscription.tier as SubscriptionTier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart || undefined,
        currentPeriodEnd: subscription.currentPeriodEnd || undefined,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        creemCustomerId: subscription.creemCustomerId || undefined,
        creemSubscriptionId: subscription.creemSubscriptionId || undefined,
      },
      error: null,
    };
  }

  /**
   * Create a portal session for self-service subscription management
   */
  async createPortalSession(params: PortalSessionParams): Promise<
    ServiceResult<{ portalUrl: string }>
  > {
    const { agencyId, returnUrl } = params;

    // Get subscription with Creem customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
      select: { creemCustomerId: true },
    });

    if (!subscription || !subscription.creemCustomerId) {
      return {
        data: null,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No subscription found for this agency',
        },
      };
    }

    // Create portal session
    const portalResult = await creem.createPortalSession({
      customer: subscription.creemCustomerId,
      returnUrl,
    });

    if (portalResult.error || !portalResult.data) {
      return {
        data: null,
        error: {
          code: portalResult.error?.code || 'PORTAL_ERROR',
          message: portalResult.error?.message || 'Failed to create portal session',
        },
      };
    }

    return {
      data: { portalUrl: portalResult.data.url },
      error: null,
    };
  }

  /**
   * List invoices for an agency's subscription
   */
  async listInvoices(params: ListInvoicesParams): Promise<
    ServiceResult<{ invoices: Array<{ id: string; amount: number; currency: string; status: string; invoiceDate: Date; invoiceUrl?: string }> }>
  > {
    const { agencyId, limit = 10 } = params;

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
      select: { id: true, creemCustomerId: true },
    });

    if (!subscription || !subscription.creemCustomerId) {
      return { data: { invoices: [] }, error: null };
    }

    // Get local invoice records
    const localInvoices = await prisma.invoice.findMany({
      where: {
        subscriptionId: subscription.id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      data: {
        invoices: localInvoices.map((inv) => ({
          id: inv.id,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
          invoiceDate: inv.invoiceDate!,
          invoiceUrl: inv.invoiceUrl || undefined,
        })),
      },
      error: null,
    };
  }

  /**
   * Sync subscription from Creem webhook
   * Called when subscription events are received from Creem
   */
  async syncSubscription(params: SyncSubscriptionParams): Promise<
    ServiceResult<{
      id: string;
      tier: SubscriptionTier;
      status: string;
    } | null>
  > {
    const { creemSubscriptionId, creemCustomerId, productId, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd } = params;

    let tier: SubscriptionTier;

    try {
      tier = getTierFromProductId(productId);
    } catch {
      return {
        data: null,
        error: { code: 'UNKNOWN_PRODUCT', message: 'Unknown Creem product ID' },
      };
    }

    // Find agency by Creem customer ID
    const agency = await prisma.agency.findFirst({
      where: {
        subscription: {
          creemCustomerId,
        },
      },
      select: { id: true },
    });

    if (!agency) {
      // Agency not found, but this might be a new subscription
      // Return success without error - webhook was processed
      return { data: null, error: null };
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { agencyId: agency.id },
      create: {
        agencyId: agency.id,
        creemCustomerId,
        creemSubscriptionId,
        tier,
        status: status || 'active',
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        cancelAtPeriodEnd: cancelAtPeriodEnd || false,
      },
      update: {
        creemSubscriptionId,
        tier,
        status: status || undefined,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
        cancelAtPeriodEnd: cancelAtPeriodEnd || undefined,
      },
    });

    return {
      data: {
        id: subscription.id,
        tier: subscription.tier as SubscriptionTier,
        status: subscription.status,
      },
      error: null,
    };
  }
}

// Singleton export
export const subscriptionService = new SubscriptionService();
