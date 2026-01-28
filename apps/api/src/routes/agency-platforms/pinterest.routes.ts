import { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * Pinterest agency platform routes
 * Handles Pinterest-specific platform connection operations
 */

// Request schema for saving Business ID
const SaveBusinessIdSchema = z.object({
  agencyId: z.string().uuid(),
  businessId: z.string().regex(/^\d{1,20}$/, 'Business ID must be 1-20 digits'),
});

// Convert Zod schema to JSON schema for Fastify validation
const saveBusinessIdJsonSchema = {
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
      description: 'Pinterest Business ID (1-20 digits)',
    },
  },
};

export async function pinterestRoutes(fastify: FastifyInstance) {
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
      body: saveBusinessIdJsonSchema,
    },
  }, async (request, reply) => {
    const { agencyId, businessId } = request.body as {
      agencyId: string;
      businessId: string;
    };

    // Use fastify.prisma instead of imported prisma
    const prisma = fastify.prisma;

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
    const existingMetadata = (connection.metadata as any) || {};
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
        platform: 'pinterest',
        metadata: {
          businessId,
          connectionId: connection.id,
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
