import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import type { Platform } from '@agency-platform/shared';
import { PLATFORM_NAMES, MANUAL_PLATFORMS } from './constants.js';

export async function registerManualRoutes(fastify: FastifyInstance) {
  /**
   * POST /agency-platforms/:platform/manual-connect
   * Create manual invitation connection (no OAuth tokens).
   */
  fastify.post('/agency-platforms/:platform/manual-connect', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, invitationEmail } = request.body as {
      agencyId?: string;
      invitationEmail?: string;
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
        agencyEmail: invitationEmail.toLowerCase(),
        secretId: null,
        status: 'active',
        verificationStatus: 'pending',
        connectedBy: 'agency',
        metadata: {
          authMethod: 'manual_team_invitation',
          invitationEmail: invitationEmail.toLowerCase(),
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
          invitationEmail: invitationEmail.toLowerCase(),
        },
        ipAddress: '0.0.0.0',
        userAgent: 'unknown',
      },
    });

    return reply.code(201).send({
      data: {
        connectionId: connection.id,
        platform: connection.platform,
        agencyEmail: connection.agencyEmail,
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
    const { agencyId, invitationEmail } = request.body as {
      agencyId?: string;
      invitationEmail?: string;
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
        agencyEmail: invitationEmail.toLowerCase(),
        metadata: {
          ...((existingConnection.metadata as any) || {}),
          invitationEmail: invitationEmail.toLowerCase(),
          invitationEmailUpdatedAt: new Date().toISOString(),
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
          newEmail: invitationEmail.toLowerCase(),
        },
        ipAddress: '0.0.0.0',
        userAgent: 'unknown',
      },
    });

    return reply.send({
      data: {
        connectionId: updatedConnection.id,
        platform: updatedConnection.platform,
        agencyEmail: updatedConnection.agencyEmail,
        status: updatedConnection.status,
        connectedAt: updatedConnection.connectedAt,
      },
      error: null,
    });
  });
}
