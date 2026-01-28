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

const PRICE_ID_TO_TIER: Record<string, SubscriptionTier> = {
  'price_starter_monthly': 'STARTER',
  'price_starter_yearly': 'STARTER',
  'price_agency_monthly': 'AGENCY',
  'price_agency_yearly': 'AGENCY',
  'price_pro_monthly': 'PRO',
  'price_pro_yearly': 'PRO',
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
        const tier = PRICE_ID_TO_TIER[subscription.price_id];

        if (!tier) {
          return reply.code(400).send({ error: 'Unknown price ID' });
        }

        // Find agency by Creem customer ID
        const agency = await prisma.agency.findFirst({
          where: {
            settings: {
              path: ['creemCustomerId'],
              equals: subscription.customer_id,
            },
          },
        });

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
