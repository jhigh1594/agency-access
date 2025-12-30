/**
 * Access Request Routes
 *
 * API endpoints for creating and managing access requests.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../services/access-request.service';
import { agencyPlatformService } from '../services/agency-platform.service';

export async function accessRequestRoutes(fastify: FastifyInstance) {
  // Create access request
  fastify.post('/access-requests', async (request, reply) => {
    const requestBody = request.body as any;
    const { agencyId, authModel = 'client_authorization', platforms = [] } = requestBody;

    // If delegated access, verify agency has connected the required platforms
    if (authModel === 'delegated_access') {
      // Get agency platform connections
      const connectionsResult = await agencyPlatformService.getConnections(agencyId);

      if (connectionsResult.error) {
        return reply.code(500).send({
          data: null,
          error: connectionsResult.error,
        });
      }

      // Get list of active platform connections
      const connectedPlatforms = (connectionsResult.data || [])
        .filter((c) => c.status === 'active')
        .map((c) => c.platform);

      // Extract requested platform groups from the hierarchical structure
      const requestedPlatforms = platforms.map((p: any) => p.platformGroup);

      // Check for missing platforms
      const missingPlatforms = requestedPlatforms.filter(
        (platform: string) => !connectedPlatforms.includes(platform)
      );

      if (missingPlatforms.length > 0) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'PLATFORMS_NOT_CONNECTED',
            message: 'Agency must connect platforms before requesting delegated access',
            missingPlatforms,
          },
        });
      }
    }

    // Proceed with access request creation
    const result = await accessRequestService.createAccessRequest(requestBody);

    if (result.error) {
      const statusCode = result.error.code === 'SUBDOMAIN_TAKEN' ? 409 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.code(201).send(result);
  });

  // Get access request by unique token (for client authorization flow - no auth required)
  fastify.get('/client/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    const result = await accessRequestService.getAccessRequestByToken(token);

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' || result.error.code === 'EXPIRED' ? 404 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Get all access requests for an agency
  fastify.get('/agencies/:id/access-requests', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, limit, offset } = request.query as any;

    const result = await accessRequestService.getAgencyAccessRequests(id, {
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    if (result.error) {
      return reply.code(500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Get single access request by ID
  fastify.get('/access-requests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await accessRequestService.getAccessRequestById(id);

    if (result.error) {
      return reply.code(404).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Update access request
  fastify.patch('/access-requests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await accessRequestService.updateAccessRequest(id, request.body as any);

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Mark request as authorized (called after successful OAuth)
  fastify.post('/access-requests/:id/authorize', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await accessRequestService.markRequestAuthorized(id);

    if (result.error) {
      return reply.code(404).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Cancel access request
  fastify.post('/access-requests/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await accessRequestService.cancelAccessRequest(id);

    if (result.error) {
      return reply.code(404).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send({ data: { success: true }, error: null });
  });
}
