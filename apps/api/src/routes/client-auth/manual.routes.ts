import { FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { createHash } from 'crypto';
import { accessRequestService } from '../../services/access-request.service.js';
import { auditService } from '../../services/audit.service.js';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';

export async function registerManualRoutes(fastify: FastifyInstance) {
  type EmailManualPlatform = 'beehiiv' | 'kit' | 'mailchimp' | 'klaviyo' | 'snapchat';

  const normalizeShopDomain = (value: string): string =>
    value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');

  const isValidShopifyDomain = (value: string): boolean =>
    /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(value);

  const hashCollaboratorCode = (value: string): string =>
    createHash('sha256')
      .update(`shopify-collaborator-code:${value}`)
      .digest('hex');

  const createEmailManualConnectHandler = (
    platform: EmailManualPlatform,
    successMessage: string,
    logContext: string
  ) => {
    return async (
      request: FastifyRequest<{
        Params: { token: string };
        Body: {
          agencyEmail: string;
          clientEmail?: string;
          platform: EmailManualPlatform;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { token } = request.params;

      const manualConnectSchema = z.object({
        agencyEmail: z.string().email(),
        clientEmail: z.string().email().optional(),
        platform: z.literal(platform),
      });

      const validated = manualConnectSchema.safeParse(request.body);
      if (!validated.success) {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validated.error.errors,
          },
        });
      }

      const { agencyEmail, clientEmail } = validated.data;
      const accessRequest = await accessRequestService.getAccessRequestByToken(token);

      if (accessRequest.error || !accessRequest.data) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Access request not found or expired',
          },
        });
      }

      try {
        const connection = await prisma.clientConnection.create({
          data: {
            accessRequestId: accessRequest.data.id,
            agencyId: accessRequest.data.agencyId,
            clientEmail: clientEmail || accessRequest.data.clientEmail || 'unknown',
            status: 'pending_verification',
            grantedAssets: {
              platform,
              agencyEmail,
              clientEmail: clientEmail || accessRequest.data.clientEmail,
              invitationSentAt: new Date().toISOString(),
              authMethod: 'manual_team_invitation',
            },
          },
        });

        await auditService.createAuditLog({
          agencyId: accessRequest.data.agencyId,
          action: 'MANUAL_INVITATION_INITIATED',
          resourceType: 'ClientConnection',
          resourceId: connection.id,
          platform,
          metadata: {
            connectionId: connection.id,
            clientEmail: clientEmail || accessRequest.data.clientEmail,
            agencyEmail,
            accessRequestId: accessRequest.data.id,
          },
        });

        return reply.send({
          data: {
            connectionId: connection.id,
            status: connection.status,
            agencyEmail,
            message: successMessage,
          },
          error: null,
        });
      } catch (error) {
        fastify.log.error({
          error,
          context: logContext,
          token,
          agencyEmail,
        });

        return reply.code(500).send({
          data: null,
          error: {
            code: 'CONNECTION_CREATION_FAILED',
            message: 'Failed to create connection. Please try again.',
          },
        });
      }
    };
  };

  // Manual connection endpoint for platforms that don't use OAuth (e.g., Beehiiv)
  fastify.post(
    '/client/:token/beehiiv/manual-connect',
    createEmailManualConnectHandler(
      'beehiiv',
      'Manual invitation initiated. Waiting for agency to accept Beehiiv team invite.',
      'Failed to create Beehiiv manual connection'
    )
  );

  // Kit manual connection endpoint (team invitation flow)
  fastify.post(
    '/client/:token/kit/manual-connect',
    createEmailManualConnectHandler(
      'kit',
      'Manual invitation initiated. Waiting for agency to accept Kit team invite.',
      'Failed to create Kit manual connection'
    )
  );

  fastify.post(
    '/client/:token/mailchimp/manual-connect',
    createEmailManualConnectHandler(
      'mailchimp',
      'Manual invitation initiated. Waiting for agency to accept Mailchimp team invite.',
      'Failed to create Mailchimp manual connection'
    )
  );

  fastify.post(
    '/client/:token/klaviyo/manual-connect',
    createEmailManualConnectHandler(
      'klaviyo',
      'Manual invitation initiated. Waiting for agency to accept Klaviyo team invite.',
      'Failed to create Klaviyo manual connection'
    )
  );

  // Snapchat manual connection endpoint (business + ad account invite flow)
  fastify.post(
    '/client/:token/snapchat/manual-connect',
    createEmailManualConnectHandler(
      'snapchat',
      'Snapchat access sharing initiated. Complete both organization and ad account invites in Snapchat Ads Manager.',
      'Failed to create Snapchat manual connection'
    )
  );

  // Pinterest manual connection endpoint (partnership flow)
  fastify.post('/client/:token/pinterest/manual-connect', async (request, reply) => {
  const { token } = request.params as { token: string };

  const manualConnectSchema = z.object({
    businessId: z.string().regex(/^\d{1,20}$/, 'Pinterest Business ID must be 1-20 digits'),
    clientEmail: z.string().email().optional(),
    platform: z.literal('pinterest'),
  });

  const validated = manualConnectSchema.safeParse(request.body);
  if (!validated.success) {
    return reply.code(400).send({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validated.error.errors,
      },
    });
  }

  const { businessId, clientEmail } = validated.data;

  const accessRequest = await accessRequestService.getAccessRequestByToken(token);

  if (accessRequest.error || !accessRequest.data) {
    return reply.code(404).send({
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Access request not found or expired',
      },
    });
  }

  try {
    const connection = await prisma.clientConnection.create({
      data: {
        accessRequestId: accessRequest.data.id,
        agencyId: accessRequest.data.agencyId,
        clientEmail: clientEmail || accessRequest.data.clientEmail || 'unknown',
        status: 'pending_verification',
        grantedAssets: {
          platform: 'pinterest',
          businessId,
          clientEmail: clientEmail || accessRequest.data.clientEmail,
          setupComplete: true,
          setupCompletedAt: new Date().toISOString(),
          authMethod: 'manual_partnership',
        },
      },
    });

    await auditService.createAuditLog({
      agencyId: accessRequest.data.agencyId,
      action: 'MANUAL_INVITATION_INITIATED',
      resourceType: 'ClientConnection',
      resourceId: connection.id,
      platform: 'pinterest',
      metadata: {
        connectionId: connection.id,
        clientEmail: clientEmail || accessRequest.data.clientEmail,
        businessId,
        accessRequestId: accessRequest.data.id,
      },
    });

    return reply.send({
      data: {
        connectionId: connection.id,
        status: connection.status,
        businessId,
        message: 'Pinterest partnership setup initiated. Please complete the partnership in Pinterest Business Manager.',
      },
      error: null,
    });
  } catch (error) {
    fastify.log.error({
      error,
      context: 'Failed to create Pinterest manual connection',
      token,
      businessId,
    });

    return reply.code(500).send({
      data: null,
      error: {
        code: 'CONNECTION_CREATION_FAILED',
        message: 'Failed to create connection. Please try again.',
      },
    });
  }
});

  // Shopify manual connection endpoint (collaborator request flow)
  fastify.post('/client/:token/shopify/manual-connect', async (request, reply) => {
    const { token } = request.params as { token: string };

    const manualConnectSchema = z.object({
      shopDomain: z
        .string()
        .transform(normalizeShopDomain)
        .refine(isValidShopifyDomain, 'Shopify domain must look like "store-name.myshopify.com"'),
      collaboratorCode: z.string().trim().regex(/^\d{4}$/, 'Collaborator code must be exactly 4 digits'),
      clientEmail: z.string().email().optional(),
      platform: z.literal('shopify'),
    });

    const validated = manualConnectSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validated.error.errors,
        },
      });
    }

    const { shopDomain, collaboratorCode, clientEmail } = validated.data;
    const collaboratorCodeHash = hashCollaboratorCode(collaboratorCode);

    const accessRequest = await accessRequestService.getAccessRequestByToken(token);
    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Access request not found or expired',
        },
      });
    }

    try {
      const grantedAssetsPayload = {
        platform: 'shopify',
        shopDomain,
        collaboratorCode,
        collaboratorCodeHash,
        clientEmail: clientEmail || accessRequest.data.clientEmail,
        setupComplete: true,
        setupCompletedAt: new Date().toISOString(),
        authMethod: 'manual_collaborator_request',
      };

      const existingConnection = await prisma.clientConnection.findUnique({
        where: { accessRequestId: accessRequest.data.id },
        select: {
          id: true,
          grantedAssets: true,
        },
      });

      const existingPlatform =
        existingConnection &&
        existingConnection.grantedAssets &&
        typeof (existingConnection.grantedAssets as Record<string, unknown>).platform === 'string'
          ? (existingConnection.grantedAssets as Record<string, unknown>).platform as string
          : undefined;

      if (existingConnection && existingPlatform && existingPlatform !== 'shopify') {
        return reply.code(409).send({
          data: null,
          error: {
            code: 'CONNECTION_CONFLICT',
            message: 'This access request already has a non-Shopify connection',
          },
        });
      }

      const connection = existingConnection
        ? await prisma.clientConnection.update({
            where: { id: existingConnection.id },
            data: {
              clientEmail: clientEmail || accessRequest.data.clientEmail || 'unknown',
              status: 'pending_verification',
              grantedAssets: grantedAssetsPayload,
            },
          })
        : await prisma.clientConnection.create({
            data: {
              accessRequestId: accessRequest.data.id,
              agencyId: accessRequest.data.agencyId,
              clientEmail: clientEmail || accessRequest.data.clientEmail || 'unknown',
              status: 'pending_verification',
              grantedAssets: grantedAssetsPayload,
            },
          });

      await auditService.createAuditLog({
        agencyId: accessRequest.data.agencyId,
        action: existingConnection ? 'MANUAL_INVITATION_UPDATED' : 'MANUAL_INVITATION_INITIATED',
        resourceType: 'ClientConnection',
        resourceId: connection.id,
        platform: 'shopify',
        metadata: {
          connectionId: connection.id,
          clientEmail: clientEmail || accessRequest.data.clientEmail,
          shopDomain,
          collaboratorCodeHash,
          accessRequestId: accessRequest.data.id,
        },
      });

      return reply.send({
        data: {
          connectionId: connection.id,
          status: connection.status,
          shopDomain,
          collaboratorCodeMasked: '****',
          message: 'Shopify collaborator details saved. Your agency can now request access in Shopify Partners.',
        },
        error: null,
      });
    } catch (error) {
      fastify.log.error({
        error,
        context: 'Failed to create Shopify manual connection',
        token,
        shopDomain,
      });

      return reply.code(500).send({
        data: null,
        error: {
          code: 'CONNECTION_CREATION_FAILED',
          message: 'Failed to create connection. Please try again.',
        },
      });
    }
  });
}
