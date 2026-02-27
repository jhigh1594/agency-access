import type { FastifyInstance } from 'fastify';
import { sendError, sendSuccess, sendValidationError } from '@/lib/response.js';
import { authenticate } from '@/middleware/auth.js';
import { requireInternalAdmin } from '@/middleware/internal-admin.js';
import { internalAdminService } from '@/services/internal-admin.service.js';
import { subscriptionService } from '@/services/subscription.service.js';
import type { SubscriptionTier } from '@agency-platform/shared';

interface InternalAdminRouteOptions {
  allowlist?: {
    userIds: string[];
    emails: string[];
  };
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function internalAdminRoutes(
  fastify: FastifyInstance,
  options: InternalAdminRouteOptions = {},
) {
  fastify.addHook('onRequest', authenticate());
  fastify.addHook('onRequest', requireInternalAdmin(options.allowlist));

  fastify.get('/internal-admin/overview', async (_request, reply) => {
    try {
      const result = await internalAdminService.getOverview();
      if (result.error || !result.data) {
        return sendError(reply, result.error?.code || 'INTERNAL_ERROR', result.error?.message || 'Failed to fetch overview', 500);
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /internal-admin/overview');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to fetch overview', 500);
    }
  });

  fastify.get('/internal-admin/agencies', async (request, reply) => {
    try {
      const query = request.query as { search?: string; page?: string; limit?: string; includeSynthetic?: string };
      const page = parsePositiveInt(query.page);
      const limit = parsePositiveInt(query.limit);
      const includeSynthetic = parseOptionalBoolean(query.includeSynthetic);

      if (query.page && (!page || page < 1)) {
        return sendValidationError(reply, 'page must be a positive integer');
      }
      if (query.limit && (!limit || limit < 1)) {
        return sendValidationError(reply, 'limit must be a positive integer');
      }
      if (query.includeSynthetic !== undefined && includeSynthetic === undefined) {
        return sendValidationError(reply, 'includeSynthetic must be true or false');
      }

      const result = await internalAdminService.listAgencies({
        search: query.search,
        page,
        limit,
        includeSynthetic,
      });

      if (result.error || !result.data) {
        return sendError(reply, result.error?.code || 'INTERNAL_ERROR', result.error?.message || 'Failed to fetch agencies', 500);
      }

      fastify.log.info({
        requestId: request.id,
        page: result.data.page,
        limit: result.data.limit,
        total: result.data.total,
        itemCount: result.data.items.length,
      }, 'GET /internal-admin/agencies response');

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /internal-admin/agencies');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to fetch agencies', 500);
    }
  });

  fastify.get('/internal-admin/agencies/:agencyId', async (request, reply) => {
    try {
      const { agencyId } = request.params as { agencyId: string };
      if (!agencyId) {
        return sendValidationError(reply, 'agencyId is required');
      }

      const result = await internalAdminService.getAgencyDetail(agencyId);
      if (result.error || !result.data) {
        const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
        return sendError(reply, result.error?.code || 'INTERNAL_ERROR', result.error?.message || 'Failed to fetch agency detail', statusCode);
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /internal-admin/agencies/:agencyId');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to fetch agency detail', 500);
    }
  });

  fastify.get('/internal-admin/subscriptions', async (request, reply) => {
    try {
      const query = request.query as { status?: string; tier?: string; page?: string; limit?: string };
      const page = parsePositiveInt(query.page);
      const limit = parsePositiveInt(query.limit);

      if (query.page && (!page || page < 1)) {
        return sendValidationError(reply, 'page must be a positive integer');
      }
      if (query.limit && (!limit || limit < 1)) {
        return sendValidationError(reply, 'limit must be a positive integer');
      }

      const result = await internalAdminService.listSubscriptions({
        status: query.status,
        tier: query.tier,
        page,
        limit,
      });

      if (result.error || !result.data) {
        return sendError(reply, result.error?.code || 'INTERNAL_ERROR', result.error?.message || 'Failed to fetch subscriptions', 500);
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in GET /internal-admin/subscriptions');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to fetch subscriptions', 500);
    }
  });

  fastify.post('/internal-admin/subscriptions/:agencyId/upgrade', async (request, reply) => {
    try {
      const { agencyId } = request.params as { agencyId: string };
      const body = request.body as {
        newTier?: SubscriptionTier;
        updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
      };

      if (!agencyId) {
        return sendValidationError(reply, 'agencyId is required');
      }

      if (!body.newTier) {
        return sendValidationError(reply, 'newTier is required');
      }

      const validTiers: SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO', 'ENTERPRISE'];
      if (!validTiers.includes(body.newTier)) {
        return sendValidationError(reply, 'Invalid subscription tier');
      }

      const result = await subscriptionService.upgradeSubscription({
        agencyId,
        newTier: body.newTier,
        updateBehavior: body.updateBehavior,
      });

      if (result.error || !result.data) {
        const statusCode = result.error?.code === 'NO_SUBSCRIPTION' ? 404 : 400;
        return sendError(reply, result.error?.code || 'INTERNAL_ERROR', result.error?.message || 'Failed to upgrade subscription', statusCode);
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /internal-admin/subscriptions/:agencyId/upgrade');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to upgrade subscription', 500);
    }
  });

  fastify.post('/internal-admin/subscriptions/:agencyId/cancel', async (request, reply) => {
    try {
      const { agencyId } = request.params as { agencyId: string };
      const body = request.body as { cancelAtPeriodEnd?: boolean };

      if (!agencyId) {
        return sendValidationError(reply, 'agencyId is required');
      }

      const result = await subscriptionService.cancelSubscription({
        agencyId,
        cancelAtPeriodEnd: body.cancelAtPeriodEnd,
      });

      if (result.error || !result.data) {
        const statusCode = result.error?.code === 'NO_SUBSCRIPTION' ? 404 : 400;
        return sendError(reply, result.error?.code || 'INTERNAL_ERROR', result.error?.message || 'Failed to cancel subscription', statusCode);
      }

      return sendSuccess(reply, result.data);
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /internal-admin/subscriptions/:agencyId/cancel');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to cancel subscription', 500);
    }
  });
}
