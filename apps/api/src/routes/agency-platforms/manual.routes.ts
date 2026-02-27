import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import type { Platform } from '@agency-platform/shared';
import { PLATFORM_NAMES, MANUAL_PLATFORMS } from './constants.js';
import { assertAgencyAccess } from '@/lib/authorization.js';
import { CacheKeys, deleteCache, invalidateCache } from '@/lib/cache.js';

export async function registerManualRoutes(fastify: FastifyInstance) {
  /**
   * POST /agency-platforms/:platform/manual-connect
   * Create manual invitation connection (no OAuth tokens).
   */
  fastify.post('/agency-platforms/:platform/manual-connect', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, invitationEmail, businessId } = request.body as {
      agencyId?: string;
      invitationEmail?: string;
      businessId?: string;
    };

    if (!MANUAL_PLATFORMS.includes(platform as any)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" does not support manual invitation flow. Supported platforms: ${MANUAL_PLATFORMS.join(', ')}`,
        },
      });
    }

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    const principalAgencyId = (request as any).principalAgencyId as string;
    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    // Pinterest requires businessId, other platforms require invitationEmail
    const isPinterest = platform === 'pinterest';

    if (isPinterest) {
      // Validate Business ID for Pinterest (numeric, 1-20 digits)
      if (!businessId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'businessId is required for Pinterest',
          },
        });
      }

      const businessIdRegex = /^\d{1,20}$/;
      if (!businessIdRegex.test(businessId)) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'INVALID_BUSINESS_ID',
            message: 'Pinterest Business ID must be 1-20 digits',
          },
        });
      }
    } else {
      // Validate email for other manual platforms
      if (!invitationEmail) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'invitationEmail is required',
          },
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(invitationEmail)) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
          },
        });
      }
    }

    const { agencyResolutionService } = await import('../../services/agency-resolution.service.js');
    const agencyResult = await agencyResolutionService.resolveAgency(agencyId, {
      createIfMissing: false,
    });

    if (agencyResult.error || !agencyResult.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      });
    }

    const actualAgencyId = agencyResult.data.agencyId;

    const existingConnection = await prisma.agencyPlatformConnection.findFirst({
      where: {
        agencyId: actualAgencyId,
        platform,
        status: 'active',
      },
    });

    if (existingConnection) {
      return reply.code(409).send({
        data: null,
        error: {
          code: 'PLATFORM_ALREADY_CONNECTED',
          message: `${PLATFORM_NAMES[platform as Platform]} is already connected`,
        },
      });
    }

    const connection = await prisma.agencyPlatformConnection.create({
      data: {
        agencyId: actualAgencyId,
        platform,
        connectionMode: 'manual_invitation',
        agencyEmail: isPinterest ? null : invitationEmail!.toLowerCase(),
        secretId: null,
        status: 'active',
        verificationStatus: 'pending',
        connectedBy: 'agency',
        metadata: {
          authMethod: isPinterest ? 'manual_partnership' : 'manual_team_invitation',
          ...(isPinterest
            ? { businessId }
            : { invitationEmail: invitationEmail!.toLowerCase() }
          ),
          invitationSentAt: new Date().toISOString(),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        agencyId: actualAgencyId,
        action: 'AGENCY_MANUAL_INVITATION_CONNECTED',
        userEmail: 'agency',
        agencyConnectionId: connection.id,
        metadata: {
          platform,
          connectionMode: 'manual_invitation',
          ...(isPinterest
            ? { businessId }
            : { invitationEmail: invitationEmail!.toLowerCase() }
          ),
        },
        ipAddress: '0.0.0.0',
        userAgent: 'unknown',
      },
    });

    await Promise.all([
      deleteCache(CacheKeys.agencyConnections(actualAgencyId)),
      invalidateCache(`dashboard:${actualAgencyId}:*`),
    ]);

    return reply.code(201).send({
      data: {
        connectionId: connection.id,
        platform: connection.platform,
        agencyEmail: connection.agencyEmail,
        businessId: isPinterest ? businessId : undefined,
        status: connection.status,
        connectedAt: connection.connectedAt,
      },
      error: null,
    });
  });

  /**
   * PATCH /agency-platforms/:platform/manual-invitation
   * Update the invitation email for a manual invitation connection.
   */
  fastify.patch('/agency-platforms/:platform/manual-invitation', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, invitationEmail, businessId } = request.body as {
      agencyId?: string;
      invitationEmail?: string;
      businessId?: string;
    };

    if (!MANUAL_PLATFORMS.includes(platform as any)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" does not support manual invitation flow. Supported platforms: ${MANUAL_PLATFORMS.join(', ')}`,
        },
      });
    }

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    const principalAgencyId = (request as any).principalAgencyId as string;
    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    // Pinterest requires businessId, other platforms require invitationEmail
    const isPinterest = platform === 'pinterest';

    if (isPinterest) {
      if (!businessId) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'businessId is required for Pinterest',
          },
        });
      }

      const businessIdRegex = /^\d{1,20}$/;
      if (!businessIdRegex.test(businessId)) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'INVALID_BUSINESS_ID',
            message: 'Pinterest Business ID must be 1-20 digits',
          },
        });
      }
    } else {
      if (!invitationEmail) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'invitationEmail is required',
          },
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(invitationEmail)) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
          },
        });
      }
    }

    const { agencyResolutionService } = await import('../../services/agency-resolution.service.js');
    const agencyResult = await agencyResolutionService.resolveAgency(agencyId, {
      createIfMissing: false,
    });

    if (agencyResult.error || !agencyResult.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      });
    }

    const actualAgencyId = agencyResult.data.agencyId;

    const existingConnection = await prisma.agencyPlatformConnection.findFirst({
      where: {
        agencyId: actualAgencyId,
        platform,
      },
    });

    if (!existingConnection) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'CONNECTION_NOT_FOUND',
          message: `No connection found for ${PLATFORM_NAMES[platform as Platform]}`,
        },
      });
    }

    const updatedConnection = await prisma.agencyPlatformConnection.update({
      where: { id: existingConnection.id },
      data: {
        agencyEmail: isPinterest ? null : invitationEmail!.toLowerCase(),
        metadata: {
          ...((existingConnection.metadata as any) || {}),
          ...(isPinterest
            ? { businessId, businessIdUpdatedAt: new Date().toISOString() }
            : { invitationEmail: invitationEmail!.toLowerCase(), invitationEmailUpdatedAt: new Date().toISOString() }
          ),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        agencyId: actualAgencyId,
        action: 'AGENCY_MANUAL_INVITATION_UPDATED',
        userEmail: 'agency',
        agencyConnectionId: existingConnection.id,
        metadata: {
          platform,
          previousEmail: existingConnection.agencyEmail,
          newEmail: isPinterest ? null : invitationEmail!.toLowerCase(),
          ...(isPinterest
            ? {
                previousBusinessId: (existingConnection.metadata as any)?.businessId,
                newBusinessId: businessId,
              }
            : {}
          ),
        },
        ipAddress: '0.0.0.0',
        userAgent: 'unknown',
      },
    });

    await Promise.all([
      deleteCache(CacheKeys.agencyConnections(actualAgencyId)),
      invalidateCache(`dashboard:${actualAgencyId}:*`),
    ]);

    return reply.send({
      data: {
        connectionId: updatedConnection.id,
        platform: updatedConnection.platform,
        agencyEmail: updatedConnection.agencyEmail,
        businessId: isPinterest ? businessId : undefined,
        status: updatedConnection.status,
        connectedAt: updatedConnection.connectedAt,
      },
      error: null,
    });
  });
}
