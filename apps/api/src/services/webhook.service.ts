/**
 * Webhook Service
 *
 * Handles incoming webhooks from Creem including:
 * - Signature verification for security
 * - Event routing and processing
 * - Subscription updates from webhook events
 * - Invoice payment tracking
 *
 * Following TDD principles - tests written first.
 */

import { creem } from '@/lib/creem';
import { subscriptionService } from './subscription.service';
import { prisma } from '@/lib/prisma';

interface WebhookEvent {
  id: string;
  type: string;
  data: any;
}

interface WebhookResult {
  data: { received: boolean } | null;
  error: { code: string; message: string } | null;
}

class WebhookService {
  /**
   * Verify webhook signature from Creem
   * Delegates to the Creem client's verification method
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    return creem.verifyWebhookSignature(payload, signature);
  }

  /**
   * Handle incoming webhook event from Creem
   * Routes events to appropriate handlers based on event type
   */
  async handleWebhookEvent(event: WebhookEvent): Promise<WebhookResult> {
    const { type, data } = event;

    try {
      switch (type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(data.object);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(data.object);
          break;

        default:
          // Unknown event type - acknowledge receipt but don't process
          console.log(`Unknown webhook event type: ${type}`);
          break;
      }

      return { data: { received: true }, error: null };
    } catch (error) {
      // Log error but don't throw - webhooks should always return success
      console.error(`Error processing webhook event ${type}:`, error);

      // Return success anyway to prevent Creem from retrying
      return { data: { received: true }, error: null };
    }
  }

  /**
   * Handle checkout.session.completed event
   * Creates/updates subscription from new checkout
   */
  private async handleCheckoutCompleted(session: any): Promise<void> {
    if (!session.subscription) {
      return; // One-time payment, not a subscription
    }

    await subscriptionService.syncSubscription({
      creemSubscriptionId: session.subscription,
      creemCustomerId: session.customer,
      productId: session.product_id,
      status: session.status || 'active', // Pass through Creem's actual status (may be 'trialing')
    });
  }

  /**
   * Handle customer.subscription.updated event
   * Syncs subscription changes (upgrades, downgrades, renewals)
   */
  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    await subscriptionService.syncSubscription({
      creemSubscriptionId: subscription.id,
      creemCustomerId: subscription.customer,
      productId: subscription.product_id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  /**
   * Handle customer.subscription.deleted event
   * Marks subscription as canceled
   */
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    await subscriptionService.syncSubscription({
      creemSubscriptionId: subscription.id,
      creemCustomerId: subscription.customer,
      productId: subscription.product_id,
      status: 'canceled',
    });
  }

  /**
   * Handle invoice.paid event
   * Creates invoice record and updates subscription status
   */
  private async handleInvoicePaid(invoice: any): Promise<void> {
    // Get subscription ID from our database
    const subscription = await prisma.subscription.findFirst({
      where: {
        creemCustomerId: invoice.customer,
        creemSubscriptionId: invoice.subscription,
      },
      select: { id: true },
    });

    if (!subscription) {
      console.log(`Subscription not found for invoice ${invoice.id}`);
      return;
    }

    // Create invoice record
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        creemInvoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency || 'usd',
        status: invoice.status || 'paid',
        invoiceDate: new Date(invoice.created * 1000),
        paidAt: new Date(invoice.created * 1000),
        invoiceUrl: invoice.hosted_invoice_url,
        invoicePdfUrl: invoice.pdf_url,
        creemData: invoice,
      },
    });

    // Update subscription status to active (it might have been past_due)
    await subscriptionService.syncSubscription({
      creemSubscriptionId: invoice.subscription,
      creemCustomerId: invoice.customer,
      productId: invoice.product_id,
      status: 'active',
    });
  }

  /**
   * Handle invoice.payment_failed event
   * Updates subscription status to past_due
   */
  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    await subscriptionService.syncSubscription({
      creemSubscriptionId: invoice.subscription,
      creemCustomerId: invoice.customer,
      productId: invoice.product_id,
      status: 'past_due',
    });
  }
}

// Singleton export
export const webhookService = new WebhookService();
