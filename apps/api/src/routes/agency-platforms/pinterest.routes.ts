import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { assertAgencyAccess } from '@/lib/authorization.js';

/**
 * Pinterest agency platform routes
 * Handles Pinterest-specific platform connection operations
 */

export async function pinterestRoutes(fastify: FastifyInstance) {
  // Set error handler for this plugin (encapsulated)
  fastify.setErrorHandler((error: any, request: any, reply: any) => {
    // Transform Fastify validation errors to match API error format
    if (error.code === 'FST_ERR_VALIDATION') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Invalid request data',
        },
      });
    }

    // For other errors, use default handling
    reply.send(error);
  });

  /**
   * PATCH /business-id
   * Save Pinterest Business ID to connection metadata
   *
   * This endpoint is called after successful Pinterest OAuth connection
   * to optionally store the Business ID for better organization and
   * future business-specific operations.
   */
  fastify.patch('/business-id', {
    schema: {
      body: {
        type: 'object',
        required: ['agencyId', 'businessId'],
        properties: {
          agencyId: {
            type: 'string',
            format: 'uuid',
            description: 'Agency ID',
          },
          businessId: {
            type: 'string',
            pattern: '^\\d{1,20}$',
            minLength: 1,
            maxLength: 20,
            description: 'Pinterest Business ID (1-20 digits)',
          },
        },
        additionalProperties: false,
      },
    },
  }, async (request: any, reply: any) => {
    const { agencyId, businessId } = request.body as {
      agencyId: string;
      businessId: string;
    };
    const principalAgencyId = request.principalAgencyId as string;
    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    // Get existing connection
    const connection = await prisma.agencyPlatformConnection.findFirst({
      where: {
        agencyId,
        platform: 'pinterest',
      },
    });

    if (!connection) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Pinterest connection not found for this agency',
        },
      });
    }

    // Merge with existing metadata
    const existingMetadata = (connection.metadata as Record<string, unknown> | null) || {};
    const updatedMetadata = {
      ...existingMetadata,
      businessId,
    };

    // Update connection
    await prisma.agencyPlatformConnection.update({
      where: { id: connection.id },
      data: {
        metadata: updatedMetadata,
      },
    });

    // Log audit entry
    await prisma.auditLog.create({
      data: {
        agencyId,
        action: 'AGENCY_CONNECTED',
        agencyConnectionId: connection.id,
        ipAddress: request.ip || request.headers['x-forwarded-for'] || null,
        userAgent: request.headers['user-agent'] || null,
        metadata: {
          platform: 'pinterest',
          businessId,
        },
      },
    });

    return reply.send({
      data: {
        id: connection.id,
        platform: 'pinterest',
        metadata: updatedMetadata,
      },
    });
  });
}
