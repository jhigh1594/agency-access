/**
 * Quota Routes
 *
 * API endpoints for quota checking and usage tracking.
 *
 * Endpoints:
 * - GET /api/quota - Get current usage snapshot
 * - POST /api/quota/check - Check if action is allowed
 */

import { FastifyInstance } from 'fastify';
import { quotaService } from '@/services/quota.service';
import { verifyToken } from '@clerk/backend';
import { type MetricType, MetricTypeSchema } from '@agency-platform/shared';

export async function quotaRoutes(fastify: FastifyInstance) {
  // ============================================================
  // GET /api/quota - Get current usage snapshot
  // ============================================================

  fastify.get('/api/quota', async (request, reply) => {
    try {
      // Verify Clerk JWT
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization token required',
          } as any,
        });
      }

      const verified = await verifyToken(token, {
        jwtKey: process.env.CLERK_SECRET_KEY,
      });

      const orgId = verified.orgId as string | undefined;
      if (!orgId || typeof orgId !== 'string') {
        return reply.code(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Organization ID not found in token',
          } as any,
        });
      }

      // Get usage snapshot
      const usage = await quotaService.getUsage(orgId);

      if (!usage) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Agency not found',
          },
        } as any);
      }

      return reply.send({
        data: usage,
      });
    } catch (error) {
      console.error('Error fetching quota:', error);
      return reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch quota information',
        } as any,
      });
    }
  });

  // ============================================================
  // POST /api/quota/check - Check if action is allowed
  // ============================================================

  fastify.post('/api/quota/check', async (request, reply) => {
    try {
      // Verify Clerk JWT
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization token required',
          } as any,
        });
      }

      const verified = await verifyToken(token, {
        jwtKey: process.env.CLERK_SECRET_KEY,
      });

      const orgId = verified.orgId as string | undefined;
      if (!orgId || typeof orgId !== 'string') {
        return reply.code(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Organization ID not found in token',
          } as any,
        });
      }

      // Validate request body
      const body = request.body as {
        metric: MetricType;
        requestedAmount?: number;
      };

      const metricResult = MetricTypeSchema.safeParse(body.metric);
      if (!metricResult.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid metric type',
            details: metricResult.error.errors,
          } as any,
        });
      }

      // Check quota
      const result = await quotaService.checkQuota({
        agencyId: orgId,
        metric: body.metric,
        action: 'create',
        requestedAmount: body.requestedAmount || 1,
      });

      return reply.send({
        data: result,
      } as any);
    } catch (error) {
      console.error('Error checking quota:', error);
      return reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check quota',
        },
      });
    }
  });
}
