import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

/**
 * Pinterest agency platform routes
 * Handles Pinterest-specific platform connection operations
 */

// Request schema for saving Business ID
const SaveBusinessIdSchema = z.object({
  agencyId: z.string().uuid(),
  businessId: z.string().regex(/^\d{1,20}$/, 'Business ID must be 1-20 digits'),
});

export async function registerPinterestRoutes(fastify: FastifyInstance) {
  /**
   * PATCH /agency-platforms/pinterest/business-id
   * Save Pinterest Business ID to connection metadata
   *
   * This endpoint is called after successful Pinterest OAuth connection
   * to optionally store the Business ID for better organization and
   * future business-specific operations.
   */
  fastify.patch('/agency-platforms/pinterest/business-id', async (request, reply) => {
    const result = SaveBusinessIdSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors[0]?.message || 'Invalid request data',
        },
      });
    }

    const { agencyId, businessId } = result.data;

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
