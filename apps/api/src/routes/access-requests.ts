/**
 * Access Request Routes
 *
 * API endpoints for creating and managing access requests.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../services/access-request.service';
import { agencyPlatformService } from '../services/agency-platform.service';
import { prisma } from '../lib/prisma';

export async function accessRequestRoutes(fastify: FastifyInstance) {
  // Create access request
  fastify.post('/access-requests', async (request, reply) => {
    const requestBody = request.body as any;
    let { agencyId, authModel = 'client_authorization', platforms = [] } = requestBody;

    // Resolve agency using centralized service (ensures consistency)
    const { agencyResolutionService } = await import('../services/agency-resolution.service');
    const agencyResult = await agencyResolutionService.resolveAgency(agencyId, {
      createIfMissing: false, // Don't auto-create for access requests
    });

    if (agencyResult.error) {
      return reply.code(400).send({
        data: null,
        error: {
          code: agencyResult.error.code,
          message: agencyResult.error.message,
          details: agencyResult.error.details,
        },
      });
    }

    // Use the resolved agency UUID (always UUID, never Clerk ID)
    const resolvedAgencyId = agencyResult.data!.agencyId;
    // Update the request body with the resolved agencyId
    requestBody.agencyId = resolvedAgencyId;

    // If delegated access, verify agency has connected the required platforms
    if (authModel === 'delegated_access') {
      // Get agency platform connections - try both the resolved UUID and original ID
      // (in case there are legacy connections stored with Clerk IDs)
      let connectionsResult = await agencyPlatformService.getConnections(resolvedAgencyId);
      
      // If no connections found, try the original ID (for legacy connections stored with Clerk IDs)
      // This handles the case where connections were created before we started using UUIDs
      if (!connectionsResult.error && (!connectionsResult.data || connectionsResult.data.length === 0)) {
        // If resolved ID is still a Clerk ID (agency lookup failed), try direct lookup
        // Also try if IDs are different (resolved to UUID but connections might be with Clerk ID)
        if (resolvedAgencyId.startsWith('user_') || resolvedAgencyId.startsWith('org_') || agencyId !== resolvedAgencyId) {
          fastify.log.info(`No connections found with resolved ID ${resolvedAgencyId}, trying legacy lookup with ${agencyId}`);
          const legacyResult = await agencyPlatformService.getConnections(agencyId);
          if (!legacyResult.error && legacyResult.data && legacyResult.data.length > 0) {
            fastify.log.info(`Found ${legacyResult.data.length} legacy connections with Clerk ID`);
            connectionsResult = legacyResult;
          } else {
            // Last resort: query all connections and see if any match by checking agency clerkUserId
            fastify.log.info(`Trying to find connections via agency lookup for Clerk ID: ${agencyId}`);
            const agency = await prisma.agency.findFirst({
              where: {
                OR: [
                  { clerkUserId: agencyId },
                  { id: agencyId },
                ],
              },
            });
            
            if (agency) {
              // Try with the agency's UUID
              const uuidResult = await agencyPlatformService.getConnections(agency.id);
              if (!uuidResult.error && uuidResult.data && uuidResult.data.length > 0) {
                fastify.log.info(`Found ${uuidResult.data.length} connections with agency UUID ${agency.id}`);
                connectionsResult = uuidResult;
              }
            }
          }
        }
      }

      if (connectionsResult.error) {
        return reply.code(500).send({
          data: null,
          error: connectionsResult.error,
        });
      }

      // Get list of active platform connections
      const allConnections = connectionsResult.data || [];
      const activeConnections = allConnections.filter((c) => c.status === 'active');
      const connectedPlatforms = activeConnections.map((c) => c.platform);

      // Extract requested platform groups from the hierarchical structure
      const requestedPlatforms = platforms.map((p: any) => p.platformGroup);

      // Debug logging
      fastify.log.info({
        originalAgencyId: agencyId,
        resolvedAgencyId: resolvedAgencyId,
        allConnections: allConnections.map((c) => ({ platform: c.platform, status: c.status })),
        activeConnections: activeConnections.map((c) => c.platform),
        connectedPlatforms,
        requestedPlatforms,
      });

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
            details: {
              connectedPlatforms,
              requestedPlatforms,
              allConnectionsCount: allConnections.length,
              activeConnectionsCount: activeConnections.length,
            },
          },
        });
      }
    }

    // Transform hierarchical platforms structure to flat format expected by validation
    // Frontend sends: [{ platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] }]
    // Backend expects: [{ platform: 'google_ads', accessLevel: 'manage' }]
    const transformedPlatforms = platforms.flatMap((group: any) => {
      if (group.platformGroup && Array.isArray(group.products)) {
        // Hierarchical format - flatten it
        return group.products.map((product: any) => {
          // Map frontend access levels to backend access levels
          const accessLevelMap: Record<string, 'manage' | 'view_only'> = {
            'admin': 'manage',
            'standard': 'manage',
            'read_only': 'view_only',
            'email_only': 'view_only',
          };
          
          const backendAccessLevel = accessLevelMap[product.accessLevel] || 'manage';
          
          return {
            platform: product.product,
            accessLevel: backendAccessLevel,
          };
        });
      } else if (group.platform && group.accessLevel) {
        // Already in flat format - ensure accessLevel is correct
        const accessLevelMap: Record<string, 'manage' | 'view_only'> = {
          'admin': 'manage',
          'standard': 'manage',
          'read_only': 'view_only',
          'email_only': 'view_only',
        };
        
        return [{
          platform: group.platform,
          accessLevel: accessLevelMap[group.accessLevel] || group.accessLevel,
        }];
      }
      return [];
    });

    // Log transformation for debugging
    fastify.log.info({
      originalPlatforms: platforms,
      transformedPlatforms,
      platformCount: transformedPlatforms.length,
    });

    // Update request body with transformed platforms
    const transformedRequestBody = {
      ...requestBody,
      platforms: transformedPlatforms,
    };

    // Proceed with access request creation
    const result = await accessRequestService.createAccessRequest(transformedRequestBody);

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
