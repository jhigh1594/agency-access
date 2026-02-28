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

interface UpgradeSubscriptionParams {
  agencyId: string;
  newTier: SubscriptionTier;
  updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
}

interface CancelSubscriptionParams {
  agencyId: string;
  cancelAtPeriodEnd?: boolean;
}

interface UpdateSeatCountParams {
  agencyId: string;
  seatCount: number;
  updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
}

interface ServiceResult<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

interface BillingDetails {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isObject(value) ? (value as Record<string, unknown>) : {};
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
    let productId: string;
    try {
      productId = getProductId(tier);
    } catch (error) {
      return {
        data: null,
        error: { code: 'INVALID_TIER', message: 'Tier is not available for checkout' },
      };
    }
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
      trialEnd?: Date;
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
        trialEnd: subscription.trialEnd || undefined,
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
   * Get payment methods for an agency subscription.
   * Returns an empty array when unavailable.
   */
  async getPaymentMethods(agencyId: string): Promise<ServiceResult<PaymentMethod[]>> {
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
      select: { creemCustomerId: true },
    });

    if (!subscription?.creemCustomerId) {
      return { data: [], error: null };
    }

    const customerResult = await creem.retrieveCustomer(subscription.creemCustomerId);
    if (customerResult.error || !customerResult.data) {
      return { data: [], error: null };
    }

    const rawMethods = customerResult.data.payment_methods || customerResult.data.paymentMethods || [];
    if (!Array.isArray(rawMethods)) {
      return { data: [], error: null };
    }

    const paymentMethods: PaymentMethod[] = rawMethods.map((method: any, index: number) => ({
      id: String(method.id || `pm_${index}`),
      brand: String(method.brand || method.card?.brand || 'card'),
      last4: String(method.last4 || method.card?.last4 || '****'),
      expMonth: Number(method.exp_month || method.expMonth || method.card?.exp_month || 0),
      expYear: Number(method.exp_year || method.expYear || method.card?.exp_year || 0),
      isDefault: Boolean(method.is_default || method.isDefault || false),
    }));

    return { data: paymentMethods, error: null };
  }

  /**
   * Get billing details from agency settings.
   */
  async getBillingDetails(agencyId: string): Promise<ServiceResult<BillingDetails>> {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        name: true,
        email: true,
        settings: true,
      },
    });

    if (!agency) {
      return {
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      };
    }

    const settings = asRecord(agency.settings);
    const storedBilling = asRecord(settings['billingDetails']);
    const address = asRecord(storedBilling['address']);

    return {
      data: {
        name: String(storedBilling['name'] || agency.name || ''),
        email: String(storedBilling['email'] || agency.email || ''),
        ...(Object.keys(address).length > 0
          ? { address: address as BillingDetails['address'] }
          : {}),
        ...(storedBilling['taxId'] ? { taxId: String(storedBilling['taxId']) } : {}),
      },
      error: null,
    };
  }

  /**
   * Update billing details in agency settings.
   */
  async updateBillingDetails(
    agencyId: string,
    details: BillingDetails
  ): Promise<ServiceResult<BillingDetails>> {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { settings: true },
    });

    if (!agency) {
      return {
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      };
    }

    const currentSettings = asRecord(agency.settings);
    const nextBillingDetails: Record<string, unknown> = {};
    if (details.name !== undefined) nextBillingDetails.name = details.name;
    if (details.email !== undefined) nextBillingDetails.email = details.email;
    if (details.address !== undefined) nextBillingDetails.address = details.address as Record<string, unknown>;
    if (details.taxId !== undefined) nextBillingDetails.taxId = details.taxId;

    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: {
        settings: {
          ...currentSettings,
          billingDetails: nextBillingDetails,
        } as any,
      },
      select: { settings: true },
    });

    const updatedSettings = asRecord(updated.settings);
    const storedBilling = asRecord(updatedSettings['billingDetails']);
    const address = asRecord(storedBilling['address']);

    return {
      data: {
        ...(storedBilling['name'] ? { name: String(storedBilling['name']) } : {}),
        ...(storedBilling['email'] ? { email: String(storedBilling['email']) } : {}),
        ...(Object.keys(address).length > 0
          ? { address: address as BillingDetails['address'] }
          : {}),
        ...(storedBilling['taxId'] ? { taxId: String(storedBilling['taxId']) } : {}),
      },
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
   * Upgrade or downgrade a subscription to a different tier
   * Uses Creem's dedicated upgrade endpoint with proration options
   */
  async upgradeSubscription(params: UpgradeSubscriptionParams): Promise<
    ServiceResult<{
      tier: SubscriptionTier;
      status: string;
      effectiveDate?: Date;
    }>
  > {
    const { agencyId, newTier, updateBehavior = 'proration-charge' } = params;

    // Get subscription with Creem subscription ID
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
      select: {
        id: true,
        tier: true,
        creemSubscriptionId: true,
        creemCustomerId: true,
      },
    });

    if (!subscription || !subscription.creemSubscriptionId) {
      return {
        data: null,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No active subscription found for this agency',
        },
      };
    }

    // Get the new product ID
    let productId: string;
    try {
      productId = getProductId(newTier);
    } catch {
      return {
        data: null,
        error: { code: 'INVALID_TIER', message: 'Invalid subscription tier' },
      };
    }

    // Validate tier transition (can't upgrade to same tier)
    if (subscription.tier === newTier) {
      return {
        data: null,
        error: {
          code: 'SAME_TIER',
          message: 'New tier must be different from current tier',
        },
      };
    }

    // Call Creem upgrade API
    const upgradeResult = await creem.upgradeSubscription(
      subscription.creemSubscriptionId,
      {
        productId,
        updateBehavior,
      }
    );

    if (upgradeResult.error || !upgradeResult.data) {
      return {
        data: null,
        error: {
          code: upgradeResult.error?.code || 'UPGRADE_ERROR',
          message: upgradeResult.error?.message || 'Failed to upgrade subscription',
        },
      };
    }

    // Update local subscription record
    const updated = await prisma.subscription.update({
      where: { agencyId },
      data: {
        tier: newTier,
      },
      select: {
        tier: true,
        status: true,
        currentPeriodEnd: true,
      },
    });

    // Determine effective date based on update behavior
    let effectiveDate: Date | undefined;
    if (updateBehavior === 'proration-charge-immediately') {
      effectiveDate = new Date();
    } else if (updated.currentPeriodEnd) {
      effectiveDate = updated.currentPeriodEnd;
    }

    return {
      data: {
        tier: updated.tier as SubscriptionTier,
        status: updated.status,
        effectiveDate,
      },
      error: null,
    };
  }

  /**
   * Cancel a subscription
   * Can cancel immediately or at the end of the current billing period
   */
  async cancelSubscription(params: CancelSubscriptionParams): Promise<
    ServiceResult<{
      status: string;
      cancelAtPeriodEnd: boolean;
      effectiveDate?: Date;
    }>
  > {
    const { agencyId, cancelAtPeriodEnd = true } = params;

    // Get subscription with Creem subscription ID
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
      select: {
        id: true,
        creemSubscriptionId: true,
        currentPeriodEnd: true,
      },
    });

    if (!subscription || !subscription.creemSubscriptionId) {
      return {
        data: null,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No active subscription found for this agency',
        },
      };
    }

    // Call Creem cancel API
    const cancelResult = await creem.cancelSubscription(
      subscription.creemSubscriptionId,
      { cancelAtPeriodEnd }
    );

    if (cancelResult.error || !cancelResult.data) {
      return {
        data: null,
        error: {
          code: cancelResult.error?.code || 'CANCEL_ERROR',
          message: cancelResult.error?.message || 'Failed to cancel subscription',
        },
      };
    }

    // Update local subscription record
    const updated = await prisma.subscription.update({
      where: { agencyId },
      data: {
        cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
      },
      select: {
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    });

    // Determine effective date
    let effectiveDate: Date | undefined;
    if (cancelAtPeriodEnd && updated.currentPeriodEnd) {
      effectiveDate = updated.currentPeriodEnd;
    } else if (!cancelAtPeriodEnd) {
      effectiveDate = new Date();
    }

    return {
      data: {
        status: updated.status,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        effectiveDate,
      },
      error: null,
    };
  }

  /**
   * Update seat count for seat-based subscriptions (future-ready)
   * This method is prepared for future seat-based billing implementation
   */
  async updateSeatCount(params: UpdateSeatCountParams): Promise<
    ServiceResult<{
      seatCount: number;
      proratedAmount?: number;
    }>
  > {
    const { agencyId, seatCount, updateBehavior = 'proration-charge' } = params;

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { agencyId },
      select: {
        id: true,
        creemSubscriptionId: true,
      },
    });

    if (!subscription || !subscription.creemSubscriptionId) {
      return {
        data: null,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No active subscription found for this agency',
        },
      };
    }

    // First, get the subscription from Creem to retrieve the item ID
    const subResult = await creem.retrieveSubscription(subscription.creemSubscriptionId);

    if (subResult.error || !subResult.data) {
      return {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to retrieve subscription details',
        },
      };
    }

    // Check if subscription has items
    if (!subResult.data.items || subResult.data.items.length === 0) {
      return {
        data: null,
        error: {
          code: 'NO_ITEMS',
          message: 'Subscription does not support seat-based billing',
        },
      };
    }

    // Update the seat count using the first item
    const updateResult = await creem.updateSubscriptionItems(
      subscription.creemSubscriptionId,
      {
        items: [
          {
            id: subResult.data.items[0].id,
            units: seatCount,
          },
        ],
        updateBehavior,
      }
    );

    if (updateResult.error || !updateResult.data) {
      return {
        data: null,
        error: {
          code: updateResult.error?.code || 'UPDATE_ERROR',
          message: updateResult.error?.message || 'Failed to update seat count',
        },
      };
    }

    return {
      data: {
        seatCount,
        proratedAmount: updateResult.data.proratedAmount,
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
