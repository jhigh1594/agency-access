/**
 * Agency Routes
 *
 * API endpoints for agency management.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { agencyService } from '../services/agency.service.js';
import { sendError } from '../lib/response.js';

export async function agencyRoutes(fastify: FastifyInstance) {
  // List agencies with optional filters
  fastify.get('/agencies', async (request, reply) => {
    try {
      const { email, clerkUserId } = request.query as {
        email?: string;
        clerkUserId?: string;
      };

      fastify.log.info('GET /agencies', { email, clerkUserId });

      // Validate that at least one filter is provided
      if (!email && !clerkUserId) {
        fastify.log.warn('GET /agencies: No filter provided');
        return sendValidationError(reply, 'Either email or clerkUserId query parameter is required');
      }

      const result = await agencyService.listAgencies({ email, clerkUserId });

      if (result.error) {
        return sendError(reply, result.error.code, result.error.message, 500, result.error);
      }

      // Ensure we always return a valid response format
      const response = {
        data: result.data || [],
        error: null,
      };
      
      fastify.log.info('GET /agencies: Success', { count: response.data.length });
      return reply.send(response);
    } catch (error) {
      fastify.log.error('Error in GET /agencies:', error);
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to retrieve agencies', 500);
    }
  });

  // Get agency by ID
  fastify.get('/agencies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await agencyService.getAgency(id);

    if (result.error) {
      return sendError(reply, result.error.code, result.error.message, result.error.code === 'NOT_FOUND' ? 404 : 500);
    }

    return reply.send(result);
  });

  // Create agency
  fastify.post('/agencies', async (request, reply) => {
    const result = await agencyService.createAgency(request.body as any);

    if (result.error) {
      const statusCode = result.error.code === 'AGENCY_EXISTS' ? 409 : 400;
      return sendError(reply, result.error.code, result.error.message, statusCode);
    }

    return reply.send(result);
  });

  // Update agency
  fastify.patch('/agencies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await agencyService.updateAgency(id, request.body as any);

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 400;
      return sendError(reply, result.error.code, result.error.message, statusCode);
    }

    return reply.send(result);
  });

  // Get agency members
  fastify.get('/agencies/:id/members', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await agencyService.getAgencyMembers(id);

    if (result.error) {
      return sendError(reply, result.error.code, result.error.message, 500);
    }

    return reply.send(result);
  });

  // Invite member
  fastify.post('/agencies/:id/members', async (request, reply) => {
    const { id } = request.params as { id: string };

    const body = request.body as { email: string; role: 'admin' | 'member' | 'viewer' };
    const result = await agencyService.inviteMember(id, body);

    if (result.error) {
      const statusCode = result.error.code === 'MEMBER_EXISTS' ? 409 : 400;
      return sendError(reply, result.error.code, result.error.message, statusCode);
    }

    return reply.send(result);
  });

  // Bulk invite members (for onboarding)
  fastify.post('/agencies/:id/members/bulk', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await agencyService.bulkInviteMembers(id, request.body as any);

    if (result.error) {
      const statusCode = result.error.code === 'AGENCY_NOT_FOUND' ? 404 : 400;
      return sendError(reply, result.error.code, result.error.message, statusCode);
    }

    return reply.send(result);
  });

  // Get onboarding status
  fastify.get('/agencies/:id/onboarding-status', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await agencyService.getOnboardingStatus(id);

    if (result.error) {
      const statusCode = result.error.code === 'AGENCY_NOT_FOUND' ? 404 : 500;
      return sendError(reply, result.error.code, result.error.message, statusCode);
    }

    return reply.send(result);
  });

  // Update member role
  fastify.patch('/members/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const body = request.body as { role: 'admin' | 'member' | 'viewer' };
    const result = await agencyService.updateMemberRole(id, body.role);

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 400;
      return sendError(reply, result.error.code, result.error.message, statusCode);
    }

    return reply.send(result);
  });

  // Remove member
  fastify.delete('/members/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await agencyService.removeMember(id);

    if (result.error) {
      return sendError(reply, result.error.code, result.error.message, result.error.code === 'NOT_FOUND' ? 404 : 500);
    }

    return reply.send({ data: { success: true }, error: null });
  });
}
