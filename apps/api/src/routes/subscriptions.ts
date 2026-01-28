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

export async function subscriptionRoutes(fastify: FastifyInstance) {
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

      // Validate tier
      const validTiers: SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO'];
      if (!validTiers.includes(body.tier)) {
        return sendValidationError(reply, 'Invalid subscription tier');
      }

      fastify.log.info({ agencyId: body.agencyId, tier: body.tier }, 'POST /subscriptions/checkout');

      const result = await subscriptionService.createCheckoutSession({
        agencyId: body.agencyId,
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

      fastify.log.info({ agencyId: body.agencyId }, 'POST /subscriptions/portal');

      const result = await subscriptionService.createPortalSession({
        agencyId: body.agencyId,
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
      const { agencyId } = request.params as { agencyId: string };

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
      const { agencyId } = request.params as { agencyId: string };

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
      const { agencyId, resource } = request.params as {
        agencyId: string;
        resource: 'access_requests' | 'clients' | 'members' | 'templates';
      };

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
      const { agencyId, feature } = request.params as { agencyId: string; feature: string };

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
      const { agencyId } = request.params as { agencyId: string };
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

}
