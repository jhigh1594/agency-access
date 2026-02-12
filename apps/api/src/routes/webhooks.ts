/**
 * Webhook Routes
 *
 * Handles incoming webhooks from payment providers (Creem.io).
 * Processes subscription events and updates tier metadata accordingly.
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { clerkMetadataService } from '@/services/clerk-metadata.service';
import { SubscriptionTier } from '@agency-platform/shared';
import { getTierFromProductId } from '@/config/creem.config';

type CreemEvent = {
  id: string;
  type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled';
  data: {
    subscription: {
      id: string;
      status: 'active' | 'past_due' | 'canceled' | 'trialing';
      customer_id: string;
      price_id: string;
      current_period_start: string;
      current_period_end: string;
      trial_end?: string;
    };
  };
};

export async function webhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/webhooks/creem
   *
   * Handles Creem.io subscription webhooks.
   * Processes subscription creation, updates, and cancellations.
   *
   * Idempotent: Duplicate events are detected via audit log and ignored.
   */
  fastify.post('/webhooks/creem', async (request, reply) => {
    const payload = request.body as CreemEvent;

    try {
      // Check for idempotency - prevent duplicate processing
      const existing = await prisma.auditLog.findFirst({
        where: {
          action: `CREEM_WEBHOOK_${payload.type}`,
          resourceId: payload.id,
        },
      });

      if (existing) {
        return { received: true, duplicate: true };
      }

      // Log webhook for audit trail
      await prisma.auditLog.create({
        data: {
          action: `CREEM_WEBHOOK_${payload.type}`,
          resourceId: payload.id,
          resourceType: 'webhook',
          metadata: payload as any,
        },
      });

      // Only process subscription events
      if (payload.type === 'subscription.created' ||
          payload.type === 'subscription.updated' ||
          payload.type === 'subscription.canceled') {

        const { subscription } = payload.data;

      // Use Creem config utility to map product ID to tier
      let tier: SubscriptionTier;
      try {
        tier = getTierFromProductId(subscription.price_id);
      } catch (err: any) {
        // Unknown product ID - log and skip
        fastify.log.warn({ priceId: subscription.price_id, error: err?.message || String(err) }, 'Unknown Creem product ID in webhook');
        return reply.code(400).send({ error: 'Unknown product ID' });
      }

      // Find agency by Creem customer ID
      // Look up via Subscription model which has the creemCustomerId field
      const agencyWithSubscription = await prisma.agency.findFirst({
        where: {
          subscription: {
            creemCustomerId: subscription.customer_id,
          },
        },
        include: {
          subscription: true,
        },
      });

      const agency = agencyWithSubscription;

        if (agency?.clerkUserId) {
          // Update Clerk metadata with new tier
          await clerkMetadataService.setSubscriptionTier(
            agency.clerkUserId,
            tier,
            {
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start),
              currentPeriodEnd: new Date(subscription.current_period_end),
              trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end) : undefined,
            }
          );

          // Update agency subscription tier in database
          await prisma.agency.update({
            where: { id: agency.id },
            data: { subscriptionTier: tier },
          });

          // Also update subscription record if it exists
          if (agency.subscription) {
            await prisma.subscription.update({
              where: { id: agency.subscription.id },
              data: {
                tier,
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start),
                currentPeriodEnd: new Date(subscription.current_period_end),
                trialStart: subscription.trial_end ? null : new Date(),
                trialEnd: subscription.trial_end ? new Date(subscription.trial_end) : null,
                creemData: subscription as any,
              },
            });
          }
        }
      }

      return { received: true, processed: true };
    } catch (error: any) {
      return reply.code(500).send({
        error: 'Webhook failed',
        details: error.message,
      });
    }
  });
}
