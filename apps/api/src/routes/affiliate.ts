import type { FastifyInstance } from 'fastify';

import {
  AffiliateApplicationInputSchema,
  AffiliatePortalLinkCreateInputSchema,
} from '@agency-platform/shared';

import { sendError, sendSuccess } from '@/lib/response.js';
import { authenticate } from '@/middleware/auth.js';
import { requireAffiliatePartner } from '@/middleware/affiliate-partner.js';
import { affiliateService } from '@/services/affiliate.service.js';

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function extractForwardedIp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.split(',')[0]?.trim() || undefined;
}

export async function affiliateRoutes(fastify: FastifyInstance) {
  fastify.post('/affiliate/applications', async (request, reply) => {
    const validated = AffiliateApplicationInputSchema.safeParse(request.body);
    if (!validated.success) {
      return sendError(
        reply,
        'VALIDATION_ERROR',
        'Invalid affiliate application',
        400,
        validated.error.flatten()
      );
    }

    const result = await affiliateService.submitApplication(validated.data);
    if (result.error || !result.data) {
      const statusCode = result.error?.code === 'CONFLICT' ? 409 : 400;
      return sendError(
        reply,
        result.error?.code || 'INTERNAL_ERROR',
        result.error?.message || 'Failed to submit affiliate application',
        statusCode,
        result.error?.details
      );
    }

    return sendSuccess(reply, result.data, 201);
  });

  fastify.post('/affiliate/links/:code/resolve', async (request, reply) => {
    const { code } = request.params as { code: string };
    if (!code || !code.trim()) {
      return sendError(reply, 'VALIDATION_ERROR', 'Affiliate code is required', 400);
    }

    const body = (request.body || {}) as {
      referrer?: string;
      landingPath?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };

    const result = await affiliateService.registerClick(code, {
      referrer: body.referrer,
      landingPath: body.landingPath,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      userAgent: headerValue(request.headers['user-agent']),
      ipAddress: extractForwardedIp(headerValue(request.headers['x-forwarded-for'])) || request.ip,
    });

    if (result.error || !result.data) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
      return sendError(
        reply,
        result.error?.code || 'INTERNAL_ERROR',
        result.error?.message || 'Failed to resolve affiliate link',
        statusCode
      );
    }

    return sendSuccess(reply, result.data);
  });

  fastify.get('/affiliate/portal/overview', {
    onRequest: [authenticate(), requireAffiliatePartner()],
  }, async (request, reply) => {
    const partner = (request as any).affiliatePartner as { id: string } | undefined;
    if (!partner?.id) {
      return sendError(reply, 'FORBIDDEN', 'Approved affiliate partner access is required', 403);
    }

    const result = await affiliateService.getPortalOverview(partner.id);
    if (result.error || !result.data) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 400;
      return sendError(
        reply,
        result.error?.code || 'INTERNAL_ERROR',
        result.error?.message || 'Failed to load affiliate portal overview',
        statusCode,
        result.error?.details
      );
    }

    return sendSuccess(reply, result.data);
  });

  fastify.get('/affiliate/portal/commissions', {
    onRequest: [authenticate(), requireAffiliatePartner()],
  }, async (request, reply) => {
    const partner = (request as any).affiliatePartner as { id: string } | undefined;
    if (!partner?.id) {
      return sendError(reply, 'FORBIDDEN', 'Approved affiliate partner access is required', 403);
    }

    const result = await affiliateService.getPortalCommissionHistory(partner.id);
    if (result.error || !result.data) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 400;
      return sendError(
        reply,
        result.error?.code || 'INTERNAL_ERROR',
        result.error?.message || 'Failed to load affiliate commission history',
        statusCode,
        result.error?.details
      );
    }

    return sendSuccess(reply, result.data);
  });

  fastify.post('/affiliate/portal/links', {
    onRequest: [authenticate(), requireAffiliatePartner()],
  }, async (request, reply) => {
    const partner = (request as any).affiliatePartner as { id: string } | undefined;
    if (!partner?.id) {
      return sendError(reply, 'FORBIDDEN', 'Approved affiliate partner access is required', 403);
    }

    const validated = AffiliatePortalLinkCreateInputSchema.safeParse(request.body);
    if (!validated.success) {
      return sendError(
        reply,
        'VALIDATION_ERROR',
        'Invalid affiliate link settings',
        400,
        validated.error.flatten()
      );
    }

    const result = await affiliateService.createPortalLink(partner.id, validated.data);
    if (result.error || !result.data) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 400;
      return sendError(
        reply,
        result.error?.code || 'INTERNAL_ERROR',
        result.error?.message || 'Failed to create affiliate portal link',
        statusCode,
        result.error?.details
      );
    }

    return sendSuccess(reply, result.data, 201);
  });
}
