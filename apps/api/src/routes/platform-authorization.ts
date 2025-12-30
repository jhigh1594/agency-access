/**
 * Platform-Native Authorization Routes
 *
 * API endpoints for platform-native authorization flow where clients
 * manually grant access to agencies via platform UIs.
 *
 * Public endpoints (no authentication required):
 * - GET /access-requests/:token/instructions - Get client instructions
 */

import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../services/access-request.service';
import { agencyPlatformService } from '../services/agency-platform.service';
import { instructionGenerationService } from '../services/instruction-generation.service';
import { authorizationVerificationService } from '../services/authorization-verification.service';
import { prisma } from '../lib/prisma';
import type { AccessLevel } from '@agency-platform/shared';

export async function platformAuthorizationRoutes(fastify: FastifyInstance) {
  /**
   * GET /access-requests/:token/instructions
   *
   * Get platform-specific authorization instructions (public endpoint).
   * No authentication required - accessed by clients via unique token link.
   *
   * Returns agency branding and step-by-step instructions for each platform.
   */
  fastify.get('/access-requests/:token/instructions', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Get access request by token
    const accessRequestResult = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequestResult.error || !accessRequestResult.data) {
      const statusCode = accessRequestResult.error?.code === 'NOT_FOUND' ? 404 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: accessRequestResult.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to fetch access request',
        },
      });
    }

    const accessRequest = accessRequestResult.data;

    // Get agency information
    const agencyResult = await prisma.agency.findUnique({
      where: { id: accessRequest.agencyId },
      select: { name: true },
    });

    // Get branding from access request (can be customized per request)
    const branding = (accessRequest as any).branding as {
      logoUrl?: string;
      primaryColor?: string;
    } | null;

    // Get agency platform connections (identity mode) for this request
    const connectionsResult = await agencyPlatformService.getConnections(accessRequest.agencyId);

    if (connectionsResult.error || !connectionsResult.data) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'CONNECTIONS_ERROR',
          message: 'Failed to fetch platform connections',
        },
      });
    }

    // Filter to identity-mode connections and map by platform
    const identityConnections = (connectionsResult.data || [])
      .filter((c) => c.connectionMode === 'identity')
      .reduce((acc, conn) => {
        // Map platform to platform group (google_ads -> google, etc.)
        const platformGroup = conn.platform;
        acc[platformGroup] = {
          email: conn.agencyEmail || undefined,
          businessId: conn.businessId || undefined,
        };
        return acc;
      }, {} as Record<string, { email?: string; businessId?: string }>);

    // Generate instructions for each platform in the access request
    const platformInstructions = [];

    // Parse platforms from access request (hierarchical format)
    const platforms = accessRequest.platforms as any;

    for (const [group, groupData] of Object.entries(platforms)) {
      const platformList = groupData as any[];

      for (const platformItem of platformList) {
        const platform = platformItem.platform as string;
        const accessLevel = platformItem.accessLevel as AccessLevel;

        // Get agency identity for this platform group
        const agencyIdentity = identityConnections[group] || {};

        // Generate platform-specific instructions
        const instructionsResult = instructionGenerationService.generateInstructions({
          platform,
          platformName: getPlatformDisplayName(platform),
          agencyIdentity,
          accessLevel,
          agency: {
            name: agencyResult?.name || 'Agency',
            logoUrl: branding?.logoUrl,
          },
        });

        if (instructionsResult.data) {
          platformInstructions.push(instructionsResult.data);
        }
      }
    }

    return reply.code(200).send({
      data: {
        accessRequest: {
          id: accessRequest.id,
          agencyName: agencyResult?.name || 'Agency',
          clientName: accessRequest.clientName,
          expiresAt: accessRequest.expiresAt,
          authModel: accessRequest.authModel,
        },
        branding: {
          logoUrl: branding?.logoUrl,
          primaryColor: branding?.primaryColor,
        },
        instructions: platformInstructions,
      },
      error: null,
    });
  });

  /**
   * POST /verify-authorization
   *
   * Client confirms authorization, trigger API verification.
   * Called after client completes manual authorization in platform UI.
   */
  fastify.post('/verify-authorization', async (request, reply) => {
    const requestBody = request.body as {
      token: string;
      platform: string;
      clientEmail: string;
      confirmationData?: Record<string, any>;
    };

    const { token, platform, clientEmail, confirmationData } = requestBody;

    // Get access request by token
    const accessRequestResult = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequestResult.error || !accessRequestResult.data) {
      const statusCode = accessRequestResult.error?.code === 'NOT_FOUND' ? 404 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: accessRequestResult.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to fetch access request',
        },
      });
    }

    const accessRequest = accessRequestResult.data;

    // Extract access level from platforms configuration
    const platforms = accessRequest.platforms as any;
    let accessLevel: AccessLevel = 'standard';

    for (const [group, groupData] of Object.entries(platforms)) {
      const platformList = groupData as any[];
      const found = platformList.find((p) => p.platform === platform);
      if (found) {
        accessLevel = found.accessLevel as AccessLevel;
        break;
      }
    }

    // Initiate verification
    const verificationResult = await authorizationVerificationService.initiateVerification({
      accessRequestId: accessRequest.id,
      platform,
      clientEmail,
      requiredAccessLevel: accessLevel,
    });

    if (verificationResult.error) {
      const statusCode = verificationResult.error.code === 'ALREADY_VERIFIED' ? 409 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: verificationResult.error,
      });
    }

    return reply.code(202).send(verificationResult);
  });

  /**
   * GET /verification-status/:verificationId
   *
   * Poll verification status.
   * Used by frontend to check verification progress.
   */
  fastify.get('/verification-status/:verificationId', async (request, reply) => {
    const { verificationId } = request.params as { verificationId: string };

    // Extract platform from query string for filtering
    const { platform } = request.query as { platform?: string };

    if (!platform) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Platform query parameter is required',
        },
      });
    }

    const statusResult = await authorizationVerificationService.getVerificationStatus(
      verificationId,
      platform
    );

    if (statusResult.error) {
      const statusCode = statusResult.error.code === 'NOT_FOUND' ? 404 : 400;
      return reply.code(statusCode).send(statusResult);
    }

    return reply.code(200).send(statusResult);
  });
}

/**
 * Get display name for platform
 */
function getPlatformDisplayName(platform: string): string {
  const displayNames: Record<string, string> = {
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    ga4: 'Google Analytics 4',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    snapchat: 'Snapchat',
    instagram: 'Instagram',
  };

  return displayNames[platform] || platform;
}
