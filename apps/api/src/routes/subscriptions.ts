/**
 * Subscription Routes
 *
 * API endpoints for subscription management including:
 * - Checkout session creation for new subscriptions and upgrades
 * - Customer portal access for self-service management
 * - Subscription details and tier information
 * - Invoice history
 *
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { subscriptionService } from '../services/subscription.service.js';
import { tierLimitsService } from '../services/tier-limits.service.js';
import { sendError, sendSuccess, sendValidationError, sendNotFound } from '../lib/response.js';
import { SubscriptionTier } from '@agency-platform/shared';
import { authenticate } from '@/middleware/auth.js';
import { resolvePrincipalAgency } from '@/lib/authorization.js';

export async function subscriptionRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate());
  fastify.addHook('onRequest', async (request: any, reply) => {
    const principalResult = await resolvePrincipalAgency(request);
    if (principalResult.error || !principalResult.data) {
      const statusCode = principalResult.error?.code === 'UNAUTHORIZED' ? 401 : 403;
      return reply.code(statusCode).send({
        data: null,
        error: principalResult.error || {
          code: 'FORBIDDEN',
          message: 'Unable to resolve agency for authenticated user',
        },
      });
    }
    request.principalAgencyId = principalResult.data.agencyId;
  });

  // ============================================================
  // CHECKOUT SESSIONS
  // ============================================================

  /**
   * POST /api/subscriptions/checkout
   * Create a checkout session for a new subscription or upgrade
   */
  fastify.post('/subscriptions/checkout', async (request, reply) => {
    try {
      const body = request.body as {
        agencyId: string;
        tier: SubscriptionTier;
        successUrl: string;
        cancelUrl: string;
      };

      // Validate required fields
      if (!body.agencyId || !body.tier || !body.successUrl || !body.cancelUrl) {
        return sendValidationError(
          reply,
          'agencyId, tier, successUrl, and cancelUrl are required'
        );
      }
      const agencyId = (request as any).principalAgencyId as string;

      // Validate tier
      const validTiers: SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO'];
      if (!validTiers.includes(body.tier)) {
        return sendValidationError(reply, 'Invalid subscription tier');
      }

      fastify.log.info({ agencyId, tier: body.tier }, 'POST /subscriptions/checkout');

      const result = await subscriptionService.createCheckoutSession({
        agencyId,
        tier: body.tier,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
      });

      if (result.error) {
        fastify.log.error({ error: result.error }, 'POST /subscriptions/checkout: Service error');
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'AGENCY_NOT_FOUND' ? 404 : 500
        );
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /subscriptions/checkout');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to create checkout session', 500);
    }
  });

  // ============================================================
  // CUSTOMER PORTAL
  // ============================================================

  /**
   * POST /api/subscriptions/portal
   * Create a portal session for self-service subscription management
   */
  fastify.post('/subscriptions/portal', async (request, reply) => {
    try {
      const body = request.body as {
        agencyId: string;
        returnUrl: string;
      };

      // Validate required fields
      if (!body.agencyId || !body.returnUrl) {
        return sendValidationError(reply, 'agencyId and returnUrl are required');
      }
      const agencyId = (request as any).principalAgencyId as string;

      fastify.log.info({ agencyId }, 'POST /subscriptions/portal');

      const result = await subscriptionService.createPortalSession({
        agencyId,
        returnUrl: body.returnUrl,
      });

      if (result.error) {
        fastify.log.error({ error: result.error }, 'POST /subscriptions/portal: Service error');
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'NO_SUBSCRIPTION' ? 404 : 500
        );
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /subscriptions/portal');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to create portal session', 500);
    }
  });

  // ============================================================
  // SUBSCRIPTION DETAILS
  // ============================================================

  /**
   * GET /api/subscriptions/:agencyId
   * Get subscription details for an agency
   */
  fastify.get('/subscriptions/:agencyId', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;

      fastify.log.info({ agencyId }, 'GET /subscriptions/:agencyId');

      const result = await subscriptionService.getSubscription(agencyId);

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /subscriptions/:agencyId');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to retrieve subscription', 500);
    }
  });

  /**
   * GET /api/subscriptions/:agencyId/tier
   * Get tier details and usage information
   */
  fastify.get('/subscriptions/:agencyId/tier', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;

      fastify.log.info({ agencyId }, 'GET /subscriptions/:agencyId/tier');

      const result = await tierLimitsService.getTierDetails(agencyId);

      if (result.error) {
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'AGENCY_NOT_FOUND' ? 404 : 500
        );
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /subscriptions/:agencyId/tier');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to retrieve tier details', 500);
    }
  });

  /**
   * GET /api/subscriptions/:agencyId/limits/:resource
   * Check if agency can perform action based on tier limits
   */
  fastify.get('/subscriptions/:agencyId/limits/:resource', async (request, reply) => {
    try {
      const { resource } = request.params as {
        agencyId: string;
        resource: 'access_requests' | 'clients' | 'members' | 'templates';
      };
      const agencyId = (request as any).principalAgencyId as string;

      // Validate resource type
      const validResources = ['access_requests', 'clients', 'members', 'templates'];
      if (!validResources.includes(resource)) {
        return sendValidationError(reply, 'Invalid resource type');
      }

      fastify.log.info({ agencyId, resource }, 'GET /subscriptions/:agencyId/limits/:resource');

      const result = await tierLimitsService.checkTierLimit(agencyId, resource);

      return sendSuccess(reply, result);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /subscriptions/:agencyId/limits/:resource');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to check tier limit', 500);
    }
  });

  /**
   * GET /api/subscriptions/:agencyId/features/:feature
   * Check if agency has access to a specific feature
   */
  fastify.get('/subscriptions/:agencyId/features/:feature', async (request, reply) => {
    try {
      const { feature } = request.params as { agencyId: string; feature: string };
      const agencyId = (request as any).principalAgencyId as string;

      fastify.log.info({ agencyId, feature }, 'GET /subscriptions/:agencyId/features/:feature');

      const hasAccess = await tierLimitsService.hasFeatureAccess(agencyId, feature);

      return sendSuccess(reply, { hasAccess });
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /subscriptions/:agencyId/features/:feature');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to check feature access', 500);
    }
  });

  // ============================================================
  // INVOICES
  // ============================================================

  /**
   * GET /api/subscriptions/:agencyId/invoices
   * List invoices for an agency's subscription
   */
  fastify.get('/subscriptions/:agencyId/invoices', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;
      const { limit } = request.query as { limit?: string };

      fastify.log.info({ agencyId, limit }, 'GET /subscriptions/:agencyId/invoices');

      const result = await subscriptionService.listInvoices({
        agencyId,
        limit: limit ? parseInt(limit, 10) : 10,
      });

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /subscriptions/:agencyId/invoices');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to retrieve invoices', 500);
    }
  });

  /**
   * GET /api/subscriptions/:agencyId/payment-methods
   * List payment methods for the agency's customer account
   */
  fastify.get('/subscriptions/:agencyId/payment-methods', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;

      fastify.log.info({ agencyId }, 'GET /subscriptions/:agencyId/payment-methods');

      const result = await subscriptionService.getPaymentMethods(agencyId);

      if (result.error) {
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'AGENCY_NOT_FOUND' ? 404 : 500
        );
      }

      return sendSuccess(reply, result.data || []);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /subscriptions/:agencyId/payment-methods');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to retrieve payment methods', 500);
    }
  });

  /**
   * GET /api/subscriptions/:agencyId/billing-details
   * Get billing profile details
   */
  fastify.get('/subscriptions/:agencyId/billing-details', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;

      fastify.log.info({ agencyId }, 'GET /subscriptions/:agencyId/billing-details');

      const result = await subscriptionService.getBillingDetails(agencyId);

      if (result.error) {
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'AGENCY_NOT_FOUND' ? 404 : 500
        );
      }

      return sendSuccess(reply, result.data || {});
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /subscriptions/:agencyId/billing-details');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to retrieve billing details', 500);
    }
  });

  /**
   * PUT /api/subscriptions/:agencyId/billing-details
   * Update billing profile details
   */
  fastify.put('/subscriptions/:agencyId/billing-details', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;
      const body = request.body as {
        name?: string;
        email?: string;
        taxId?: string;
        address?: {
          line1?: string;
          line2?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
      };

      if (!body || typeof body !== 'object') {
        return sendValidationError(reply, 'Billing details payload is required');
      }

      fastify.log.info({ agencyId }, 'PUT /subscriptions/:agencyId/billing-details');

      const result = await subscriptionService.updateBillingDetails(agencyId, body);

      if (result.error) {
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'AGENCY_NOT_FOUND' ? 404 : 500
        );
      }

      return sendSuccess(reply, result.data || {});
    } catch (error) {
      fastify.log.error({ error }, 'Error in PUT /subscriptions/:agencyId/billing-details');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to update billing details', 500);
    }
  });

  // ============================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================

  /**
   * POST /api/subscriptions/:agencyId/upgrade
   * Upgrade or downgrade a subscription to a different tier
   */
  fastify.post('/subscriptions/:agencyId/upgrade', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;
      const body = request.body as {
        newTier: SubscriptionTier;
        updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
      };

      // Validate required fields
      if (!body.newTier) {
        return sendValidationError(reply, 'newTier is required');
      }

      // Validate tier
      const validTiers: SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO'];
      if (!validTiers.includes(body.newTier)) {
        return sendValidationError(reply, 'Invalid subscription tier');
      }

      // Validate update behavior
      const validBehaviors = ['proration-charge-immediately', 'proration-charge', 'proration-none'] as const;
      if (body.updateBehavior && !validBehaviors.includes(body.updateBehavior)) {
        return sendValidationError(reply, 'Invalid update behavior');
      }

      fastify.log.info({ agencyId, newTier: body.newTier, updateBehavior: body.updateBehavior }, 'POST /subscriptions/:agencyId/upgrade');

      const result = await subscriptionService.upgradeSubscription({
        agencyId,
        newTier: body.newTier,
        updateBehavior: body.updateBehavior || 'proration-charge',
      });

      if (result.error) {
        fastify.log.error({ error: result.error }, 'POST /subscriptions/:agencyId/upgrade: Service error');
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'NO_SUBSCRIPTION' ? 404 : 400
        );
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /subscriptions/:agencyId/upgrade');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to upgrade subscription', 500);
    }
  });

  /**
   * POST /api/subscriptions/:agencyId/cancel
   * Cancel a subscription
   */
  fastify.post('/subscriptions/:agencyId/cancel', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;
      const body = request.body as {
        cancelAtPeriodEnd?: boolean;
      };

      fastify.log.info({ agencyId, cancelAtPeriodEnd: body.cancelAtPeriodEnd }, 'POST /subscriptions/:agencyId/cancel');

      const result = await subscriptionService.cancelSubscription({
        agencyId,
        cancelAtPeriodEnd: body.cancelAtPeriodEnd ?? true,
      });

      if (result.error) {
        fastify.log.error({ error: result.error }, 'POST /subscriptions/:agencyId/cancel: Service error');
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'NO_SUBSCRIPTION' ? 404 : 500
        );
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /subscriptions/:agencyId/cancel');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to cancel subscription', 500);
    }
  });

  /**
   * POST /api/subscriptions/:agencyId/update-seats
   * Update seat count for seat-based subscriptions (future-ready)
   */
  fastify.post('/subscriptions/:agencyId/update-seats', async (request, reply) => {
    try {
      const agencyId = (request as any).principalAgencyId as string;
      const body = request.body as {
        seatCount: number;
        updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
      };

      // Validate required fields
      if (typeof body.seatCount !== 'number' || body.seatCount < 1) {
        return sendValidationError(reply, 'seatCount must be a positive number');
      }

      fastify.log.info({ agencyId, seatCount: body.seatCount }, 'POST /subscriptions/:agencyId/update-seats');

      const result = await subscriptionService.updateSeatCount({
        agencyId,
        seatCount: body.seatCount,
        updateBehavior: body.updateBehavior || 'proration-charge',
      });

      if (result.error) {
        fastify.log.error({ error: result.error }, 'POST /subscriptions/:agencyId/update-seats: Service error');
        return sendError(
          reply,
          result.error.code,
          result.error.message,
          result.error.code === 'NO_SUBSCRIPTION' ? 404 : 400
        );
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /subscriptions/:agencyId/update-seats');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to update seat count', 500);
    }
  });

}
