/**
 * Agency Platform Routes
 *
 * OAuth and platform connection management endpoints.
 * Handles OAuth initiation, callbacks, and connection management.
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { agencyPlatformService } from '@/services/agency-platform.service';
import { metaAssetsService } from '@/services/meta-assets.service';
import { googleAssetsService } from '@/services/google-assets.service';
import { identityVerificationService } from '@/services/identity-verification.service';
import { oauthStateService } from '@/services/oauth-state.service';
import { MetaConnector } from '@/services/connectors/meta';
import { GoogleConnector } from '@/services/connectors/google';
// Kit now uses team invitation flow (manual), not OAuth
// import { KitConnector } from '@/services/connectors/kit';
import { BeehiivConnector } from '@/services/connectors/beehiiv';
import { TikTokConnector } from '@/services/connectors/tiktok';
import { MailchimpConnector } from '@/services/connectors/mailchimp';
import { PinterestConnector } from '@/services/connectors/pinterest';
import { KlaviyoConnector } from '@/services/connectors/klaviyo';
import { ShopifyConnector } from '@/services/connectors/shopify';
import type { Platform } from '@agency-platform/shared';
import { env } from '@/lib/env';
import type { GoogleAccountsResponse } from '@/services/connectors/google';

// Meta business accounts response type
interface MetaBusinessAccountsResponse {
  businesses: Array<{
    id: string;
    name: string;
    verticalName?: string;
    verificationStatus?: string;
  }>;
  hasAccess: boolean;
}

// Platform names mapping
const PLATFORM_NAMES: Record<Platform, string> = {
  google: 'Google',
  meta: 'Meta',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  ga4: 'Google Analytics',
  tiktok: 'TikTok Ads',
  tiktok_ads: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
  linkedin_ads: 'LinkedIn Ads',
  snapchat: 'Snapchat Ads',
  snapchat_ads: 'Snapchat Ads',
  instagram: 'Instagram',
  kit: 'Kit',
  beehiiv: 'Beehiiv',
  mailchimp: 'Mailchimp',
  pinterest: 'Pinterest',
  klaviyo: 'Klaviyo',
  shopify: 'Shopify',
};

// Platform categorization helper
function getPlatformCategory(platform: Platform): 'recommended' | 'other' {
  const recommended: Platform[] = ['google', 'meta', 'linkedin'];
  return recommended.includes(platform) ? 'recommended' : 'other';
}

// Supported platforms for agency connections
const SUPPORTED_PLATFORMS = ['google', 'meta', 'linkedin', 'kit', 'beehiiv', 'tiktok', 'mailchimp', 'pinterest', 'klaviyo', 'shopify'] as const;
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

// Platform connector mapping
const PLATFORM_CONNECTORS = {
  google: GoogleConnector,
  meta: MetaConnector,
  linkedin: MetaConnector, // LinkedIn not implemented yet, placeholder
  // Kit uses team invitation flow (manual), not OAuth - no connector needed
  // kit: KitConnector,
  beehiiv: BeehiivConnector,
  tiktok: TikTokConnector,
  mailchimp: MailchimpConnector,
  pinterest: PinterestConnector,
  klaviyo: KlaviyoConnector,
  shopify: ShopifyConnector,
} as const;

export async function agencyPlatformsRoutes(fastify: FastifyInstance) {
  /**
   * Middleware: Auto-provision agency if it doesn't exist
   * This allows new users to connect platforms without manually creating an agency first
   * 
   * NOTE: This middleware is deprecated in favor of using agencyResolutionService
   * directly in route handlers. Keeping for backward compatibility but should be removed.
   */
  fastify.addHook('onRequest', async (request, reply) => {
    // Get agencyId from query params (GET) or body (POST)
    const { agencyId: queryAgencyId } = request.query as { agencyId?: string };
    const body = request.body as { agencyId?: string } | undefined;
    const bodyAgencyId = body?.agencyId;
    const agencyId = queryAgencyId || bodyAgencyId;

    // Skip if no agencyId in request
    if (!agencyId) {
      return;
    }

    // Use centralized resolution service instead of direct Prisma queries
    // This prevents creating duplicate agencies
    const { agencyResolutionService } = await import('../services/agency-resolution.service.js');
    const result = await agencyResolutionService.resolveAgency(agencyId, {
      createIfMissing: true,
    });

    // Log warning if resolution failed (but don't block request)
    if (result.error) {
      fastify.log.warn({
        msg: 'Agency resolution failed in middleware',
        error: result.error,
        agencyId,
      });
    }
  });

  /**
   * GET /agency-platforms
   * List all agency platform connections with status
   * Supports agencyId (UUID) or clerkUserId for lookup
   */
  fastify.get('/agency-platforms', async (request, reply) => {
    const { agencyId, clerkUserId, status } = request.query as {
      agencyId?: string;
      clerkUserId?: string;
      status?: string;
    };

    // Determine the actual agency ID to use
    let actualAgencyId = agencyId;

    // If clerkUserId is provided, look up the agency first
    if (clerkUserId && !agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { clerkUserId },
      });

      if (!agency) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AGENCY_NOT_FOUND',
            message: 'Agency not found for the provided clerkUserId',
          },
        });
      }

      actualAgencyId = agency.id;
    }

    if (!actualAgencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId or clerkUserId is required',
        },
      });
    }

    const filters = status ? { status } : undefined;
    const result = await agencyPlatformService.getConnections(actualAgencyId, filters);

    if (result.error) {
      return reply.code(500).send(result);
    }

    return reply.send(result);
  });

  /**
   * GET /agency-platforms/available
   * List all platforms with connection status (for UI)
   */
  fastify.get('/agency-platforms/available', async (request, reply) => {
    const { agencyId } = request.query as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    // Resolve agency using centralized service
    const { agencyResolutionService } = await import('../services/agency-resolution.service.js');
    const agencyResult = await agencyResolutionService.resolveAgency(agencyId, {
      createIfMissing: false,
    });

    if (agencyResult.error) {
      return reply.code(404).send({
        data: null,
        error: {
          code: agencyResult.error.code,
          message: agencyResult.error.message,
        },
      });
    }

    const actualAgencyId = agencyResult.data!.agencyId;

    // Get agency connections
    const result = await agencyPlatformService.getConnections(actualAgencyId);

    if (result.error) {
      return reply.code(500).send(result);
    }

    const connections = result.data || [];

    // Return all available platforms (both group-level and standalone platforms)
    const allPlatforms: Platform[] = [
      'google',     // Includes: google_ads, ga4, business, tag manager, search console, merchant
      'meta',       // Includes: meta_ads (facebook & instagram)
      'linkedin',
      'kit',        // Kit (ConvertKit) - standalone OAuth 2.0
      'beehiiv',    // Beehiiv - API key authentication (team invitation workflow)
      'tiktok',     // TikTok Ads - OAuth 2.0
      'mailchimp',  // Mailchimp - OAuth 2.0
      'pinterest',  // Pinterest Ads - OAuth 2.0
      'klaviyo',    // Klaviyo - OAuth 2.0 with PKCE
      'shopify',    // Shopify - OAuth 2.0 with shop context
    ];

    // Build available platforms list with connection status
    const availablePlatforms = allPlatforms.map((platform) => {
      const connection = connections.find((c: any) => c.platform === platform);

      // Extract email from connection with fallback chain
      // Priority: agencyEmail (manual invitations) > metadata fields > connectedBy
      let connectedEmail: string | undefined;
      if (connection?.agencyEmail) {
        connectedEmail = connection.agencyEmail;
      } else if (connection?.metadata) {
        const meta = connection.metadata as Record<string, any>;
        connectedEmail =
          meta.email ||
          meta.userEmail ||
          meta.businessEmail ||
          connection.connectedBy;
      } else if (connection) {
        connectedEmail = connection.connectedBy;
      }

      return {
        platform,
        name: PLATFORM_NAMES[platform],
        category: getPlatformCategory(platform),
        connected: !!connection && connection.status === 'active',
        status: connection?.status,
        connectedEmail,
        connectedAt: connection?.connectedAt,
        expiresAt: connection?.expiresAt,
        metadata: connection?.metadata,
      };
    });

    return reply.send({
      data: availablePlatforms,
      error: null,
    });
  });

  /**
   * POST /agency-platforms/:platform/initiate
   * Start OAuth flow - generates auth URL and state token
   */
  fastify.post('/agency-platforms/:platform/initiate', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, userEmail, redirectUrl } = request.body as {
      agencyId?: string;
      userEmail?: string;
      redirectUrl?: string;
    };

    // Validate platform
    if (!SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" is not supported`,
        },
      });
    }

    // Validate required fields
    if (!agencyId || !userEmail) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId and userEmail are required',
        },
      });
    }

    // Create state token for CSRF protection
    const stateResult = await oauthStateService.createState({
      agencyId,
      platform,
      userEmail,
      redirectUrl,
      timestamp: Date.now(),
    });

    if (stateResult.error) {
      return reply.code(500).send(stateResult);
    }

    // Get platform connector
    const ConnectorClass = PLATFORM_CONNECTORS[platform as keyof typeof PLATFORM_CONNECTORS];
    if (!ConnectorClass) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'CONNECTOR_NOT_IMPLEMENTED',
          message: `OAuth connector for "${platform}" is not implemented yet`,
        },
      });
    }

    const connector = new ConnectorClass();

    // Generate OAuth authorization URL
    const authUrl = connector.getAuthUrl(stateResult.data!);

    return reply.send({
      data: {
        authUrl,
        state: stateResult.data,
      },
      error: null,
    });
  });

  /**
   * GET /agency-platforms/:platform/callback
   * OAuth callback handler
   * Validates state, exchanges code for tokens, creates connection
   */
  fastify.get('/agency-platforms/:platform/callback', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { code, state } = request.query as { code?: string; state?: string };

    try {
      // Validate state token (CSRF protection)
      const stateResult = await oauthStateService.validateState(state || '');

      if (stateResult.error || !stateResult.data) {
        const errorCode = stateResult.error?.code || 'INVALID_STATE';
        const redirectUrl = stateResult.data?.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=${errorCode}`);
      }

      const stateData = stateResult.data;

      // Resolve agency using centralized service (prevents duplicates)
      const { agencyResolutionService } = await import('../services/agency-resolution.service.js');
      const agencyResult = await agencyResolutionService.getOrCreateAgency(stateData.agencyId, {
        userEmail: stateData.userEmail,
        agencyName: 'My Agency',
      });

      if (agencyResult.error) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        fastify.log.error({
          error: agencyResult.error,
          agencyId: stateData.agencyId,
          userEmail: stateData.userEmail,
        });
        return reply.redirect(`${redirectUrl}?error=AGENCY_RESOLUTION_FAILED`);
      }

      // Use the resolved agency UUID (never use Clerk ID for connections)
      const actualAgencyId = agencyResult.data!.agencyId;
      const agency = agencyResult.data!.agency;

      // Get platform connector
      const ConnectorClass = PLATFORM_CONNECTORS[platform as keyof typeof PLATFORM_CONNECTORS];
      if (!ConnectorClass) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=CONNECTOR_NOT_IMPLEMENTED`);
      }

      const connector = new ConnectorClass();

      // Exchange authorization code for tokens
      let tokens;
      try {
        tokens = await connector.exchangeCode(code || '');

        // For Meta, exchange for long-lived token (60 days)
        if (platform === 'meta' && 'getLongLivedToken' in connector) {
          tokens = await (connector as any).getLongLivedToken(tokens.accessToken);
        }
      } catch (error) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=TOKEN_EXCHANGE_FAILED`);
      }

      // For Google, fetch all available Google accounts after connection
      let googleAccounts: GoogleAccountsResponse | undefined;
      if (platform === 'google' && connector instanceof GoogleConnector) {
        try {
          googleAccounts = await connector.getAllGoogleAccounts(tokens.accessToken);
        } catch (error) {
          console.error('Failed to fetch Google accounts:', error);
          // Continue anyway - accounts can be fetched later
        }
      }

      // For Meta, fetch all available Business Manager accounts after connection
      let metaBusinessAccounts: MetaBusinessAccountsResponse | undefined;
      if (platform === 'meta' && connector instanceof MetaConnector) {
        try {
          metaBusinessAccounts = await connector.getBusinessAccounts(tokens.accessToken);
        } catch (error) {
          console.error('Failed to fetch Meta business accounts:', error);
          // Continue anyway - accounts can be fetched later
        }
      }

      // Create platform connection using the resolved agency UUID
      const connectionResult = await agencyPlatformService.createConnection({
        agencyId: actualAgencyId,
        platform: stateData.platform,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        connectedBy: stateData.userEmail,
        metadata: {
          tokenType: tokens.tokenType,
          // For Google, store the discovered accounts in metadata
          ...(googleAccounts && {
            googleAccounts: {
              adsAccounts: googleAccounts.adsAccounts,
              analyticsProperties: googleAccounts.analyticsProperties,
              businessAccounts: googleAccounts.businessAccounts,
              tagManagerContainers: googleAccounts.tagManagerContainers,
              searchConsoleSites: googleAccounts.searchConsoleSites,
              merchantCenterAccounts: googleAccounts.merchantCenterAccounts,
              hasAccess: googleAccounts.hasAccess,
            },
          }),
          // For Meta, store the discovered business accounts in metadata
          ...(metaBusinessAccounts && {
            metaBusinessAccounts: {
              businesses: metaBusinessAccounts.businesses,
              hasAccess: metaBusinessAccounts.hasAccess,
            },
          }),
        },
      });

      if (connectionResult.error) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=${connectionResult.error.code}`);
      }

      // Handle Meta specific flow (Business Portfolio selection)
      // This is now a required step for the Meta OAuth flow
      if (platform === 'meta' && connectionResult.data) {
        const connection = connectionResult.data;
        
        // ALWAYS redirect to the specific callback page for Meta selection
        // This ensures the user land on the page that has the MetaBusinessPortfolioSelector
        const baseUrl = env.FRONTEND_URL;
        return reply.redirect(
          `${baseUrl}/platforms/callback?success=true&platform=meta&requireBusinessSelection=true&connectionId=${connection.id}&agencyId=${actualAgencyId}`
        );
      }

      // Standard redirect for other platforms or if Meta businessId already set
      const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
      return reply.redirect(`${redirectUrl}?success=true&platform=${platform}`);
    } catch (error) {
      const redirectUrl = env.FRONTEND_URL;
      return reply.redirect(`${redirectUrl}?error=CALLBACK_FAILED`);
    }
  });

  /**
   * DELETE /agency-platforms/:platform
   * Revoke platform connection
   */
  fastify.delete('/agency-platforms/:platform', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, revokedBy } = request.body as {
      agencyId?: string;
      revokedBy?: string;
    };

    if (!agencyId || !revokedBy) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId and revokedBy are required',
        },
      });
    }

    const result = await agencyPlatformService.revokeConnection(
      agencyId,
      platform,
      revokedBy
    );

    if (result.error) {
      const statusCode = result.error.code === 'CONNECTION_NOT_FOUND' ? 404 : 500;
      return reply.code(statusCode).send(result);
    }

    return reply.send(result);
  });

  /**
   * POST /agency-platforms/:platform/refresh
   * Manually refresh platform tokens
   */
  fastify.post('/agency-platforms/:platform/refresh', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId } = request.body as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    // Get current connection to retrieve refresh token
    const connectionResult = await agencyPlatformService.getConnection(agencyId, platform);

    if (connectionResult.error || !connectionResult.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Platform connection not found',
        },
      });
    }

    // Get platform connector
    const ConnectorClass = PLATFORM_CONNECTORS[platform as keyof typeof PLATFORM_CONNECTORS];
    if (!ConnectorClass) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'CONNECTOR_NOT_IMPLEMENTED',
          message: `OAuth connector for "${platform}" is not implemented yet`,
        },
      });
    }

    try {
      const connector = new ConnectorClass();

      // Get valid token (will auto-refresh if needed)
      const tokenResult = await agencyPlatformService.getValidToken(agencyId, platform);

      if (tokenResult.error || !tokenResult.data) {
        return reply.code(500).send(tokenResult);
      }

      // For Meta, get long-lived token
      let newTokens;
      if (platform === 'meta' && 'getLongLivedToken' in connector) {
        newTokens = await (connector as any).getLongLivedToken(tokenResult.data);
      } else {
        return reply.code(400).send({
          data: null,
          error: {
            code: 'REFRESH_NOT_SUPPORTED',
            message: 'Token refresh not supported for this platform',
          },
        });
      }

      // Update connection with new tokens
      const refreshResult = await agencyPlatformService.refreshConnection(
        agencyId,
        platform,
        {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
        }
      );

      if (refreshResult.error) {
        return reply.code(500).send(refreshResult);
      }

      return reply.send(refreshResult);
    } catch (error) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Failed to refresh tokens',
        },
      });
    }
  });

  /**
   * POST /agency-platforms/identity
   *
   * Create identity-only connection (no OAuth tokens).
   * Used for platform-native authorization flow where agencies share
   * their identity (email/Business ID) for clients to add in platform UIs.
   */
  fastify.post('/agency-platforms/identity', async (request, reply) => {
    const { agencyId, platform, agencyEmail, businessId, connectedBy } = request.body as {
      agencyId?: string;
      platform?: string;
      agencyEmail?: string;
      businessId?: string;
      connectedBy?: string;
    };

    // Validate required fields
    if (!agencyId || !platform || !connectedBy) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId, platform, and connectedBy are required',
        },
      });
    }

    // Validate platform
    if (!SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" is not supported`,
        },
      });
    }

    // Validate identity fields based on platform
    if (platform === 'meta_ads' && !businessId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'businessId is required for Meta platform',
        },
      });
    }

    if ((platform === 'google' || platform === 'google_ads' || platform === 'ga4' || platform === 'linkedin') && !agencyEmail) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyEmail is required for Google and LinkedIn platforms',
        },
      });
    }

    // Create identity-only connection
    const result = await identityVerificationService.createIdentityConnection({
      agencyId,
      platform: platform as 'google' | 'meta' | 'meta_ads' | 'google_ads' | 'ga4' | 'linkedin',
      agencyEmail,
      businessId,
      connectedBy,
    });

    if (result.error) {
      const statusCode = result.error.code === 'DUPLICATE_IDENTITY' ? 409 : 400;
      return reply.code(statusCode).send(result);
    }

    return reply.code(201).send(result);
  });

  /**
   * PUT /agency-platforms/:id/verify
   *
   * Verify agency identity via platform API check.
   * Uses agency's OAuth token (if available) to verify identity.
   */
  fastify.put('/agency-platforms/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Get platform connector to verify identity
    // For MVP, we'll do a basic format validation
    // In production, this would make an API call to verify the identity

    // For now, just update the verification status to 'verified'
    // The actual verification happens when a client confirms authorization
    const result = await identityVerificationService.updateVerificationStatus(
      id,
      'verified',
      {} // No additional verified data needed for MVP
    );

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return reply.code(statusCode).send(result);
    }

    return reply.send(result);
  });

  /**
   * POST /agency-platforms/:platform/manual-connect
   *
   * Create manual invitation connection (no OAuth tokens).
   * Used for platforms that use team invitation flow instead of OAuth.
   *
   * Platforms: kit, mailchimp, beehiiv, klaviyo
   */
  fastify.post('/agency-platforms/:platform/manual-connect', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, invitationEmail } = request.body as {
      agencyId?: string;
      invitationEmail?: string;
    };

    // Validate platform
    const manualPlatforms = ['kit', 'mailchimp', 'beehiiv', 'klaviyo'];
    if (!manualPlatforms.includes(platform)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" does not support manual invitation flow. Supported platforms: ${manualPlatforms.join(', ')}`,
        },
      });
    }

    // Validate required fields
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

    // Validate email format
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

    // Resolve agency using centralized service
    const { agencyResolutionService } = await import('../services/agency-resolution.service.js');
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

    // Check if platform already connected
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

    // Create manual invitation connection (no OAuth tokens)
    const connection = await prisma.agencyPlatformConnection.create({
      data: {
        agencyId: actualAgencyId,
        platform,
        connectionMode: 'manual_invitation',
        agencyEmail: invitationEmail.toLowerCase(),
        secretId: null, // Manual invitation doesn't need tokens
        status: 'active',
        verificationStatus: 'pending',
        connectedBy: 'agency', // Will be updated when we have proper auth
        metadata: {
          authMethod: 'manual_team_invitation',
          invitationEmail: invitationEmail.toLowerCase(),
          invitationSentAt: new Date().toISOString(),
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        agencyId: actualAgencyId,
        action: 'AGENCY_MANUAL_INVITATION_CONNECTED',
        userEmail: 'agency', // Will be updated when we have proper auth
        agencyConnectionId: connection.id,
        metadata: {
          platform,
          connectionMode: 'manual_invitation',
          invitationEmail: invitationEmail.toLowerCase(),
        },
        ipAddress: '0.0.0.0', // Will be populated by middleware
        userAgent: 'unknown', // Will be populated by middleware
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
   *
   * Update the invitation email for a manual invitation connection.
   * Used when agency wants to change the email that receives client invitations.
   *
   * Platforms: kit, mailchimp, beehiiv, klaviyo
   */
  fastify.patch('/agency-platforms/:platform/manual-invitation', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, invitationEmail } = request.body as {
      agencyId?: string;
      invitationEmail?: string;
    };

    // Validate platform
    const manualPlatforms = ['kit', 'mailchimp', 'beehiiv', 'klaviyo'];
    if (!manualPlatforms.includes(platform)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" does not support manual invitation flow. Supported platforms: ${manualPlatforms.join(', ')}`,
        },
      });
    }

    // Validate required fields
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

    // Validate email format
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

    // Resolve agency
    const { agencyResolutionService } = await import('../services/agency-resolution.service.js');
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

    // Find existing connection
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

    // Update the email
    const updatedConnection = await prisma.agencyPlatformConnection.update({
      where: { id: existingConnection.id },
      data: {
        agencyEmail: invitationEmail.toLowerCase(),
        metadata: {
          ...(existingConnection.metadata as any || {}),
          invitationEmail: invitationEmail.toLowerCase(),
          invitationEmailUpdatedAt: new Date().toISOString(),
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        agencyId: actualAgencyId,
        action: 'AGENCY_MANUAL_INVITATION_UPDATED',
        userEmail: 'agency', // Will be updated when we have proper auth
        agencyConnectionId: existingConnection.id,
        metadata: {
          platform,
          previousEmail: existingConnection.agencyEmail,
          newEmail: invitationEmail.toLowerCase(),
        },
        ipAddress: '0.0.0.0', // Will be populated by middleware
        userAgent: 'unknown', // Will be populated by middleware
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

  /**
   * GET /agency-platforms/google/accounts
   * Fetch all Google accounts for an agency's Google connection
   *
   * This endpoint retrieves all available Google accounts across all products
   * (Ads, Analytics, Business, Tag Manager, Search Console, Merchant Center)
   * for the agency's Google OAuth connection.
   *
   * Query params:
   * - agencyId: Agency ID (required)
   * - refresh: If 'true', re-fetch from Google APIs instead of using cached metadata
   */
  fastify.get('/agency-platforms/google/accounts', async (request, reply) => {
    const { agencyId, refresh } = request.query as {
      agencyId?: string;
      refresh?: string;
    };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    // Get Google connection
    const connectionResult = await agencyPlatformService.getConnection(agencyId, 'google');

    if (connectionResult.error || !connectionResult.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'GOOGLE_NOT_CONNECTED',
          message: 'Google is not connected. Please connect your Google account first.',
        },
      });
    }

    const connection = connectionResult.data;

    // If refresh is requested, fetch fresh data from Google APIs
    if (refresh === 'true') {
      try {
        // Get valid access token
        const tokenResult = await agencyPlatformService.getValidToken(agencyId, 'google');

        if (tokenResult.error || !tokenResult.data) {
          return reply.code(500).send({
            data: null,
            error: {
              code: 'TOKEN_ERROR',
              message: 'Failed to get valid access token',
            },
          });
        }

        // Fetch all Google accounts
        const googleConnector = new GoogleConnector();
        const googleAccounts = await googleConnector.getAllGoogleAccounts(tokenResult.data);

        // Update connection metadata with fresh data
        await agencyPlatformService.updateConnectionMetadata(agencyId, 'google', {
          googleAccounts: {
            adsAccounts: googleAccounts.adsAccounts,
            analyticsProperties: googleAccounts.analyticsProperties,
            businessAccounts: googleAccounts.businessAccounts,
            tagManagerContainers: googleAccounts.tagManagerContainers,
            searchConsoleSites: googleAccounts.searchConsoleSites,
            merchantCenterAccounts: googleAccounts.merchantCenterAccounts,
            hasAccess: googleAccounts.hasAccess,
          },
        });

        return reply.send({
          data: googleAccounts,
          error: null,
        });
      } catch (error) {
        return reply.code(500).send({
          data: null,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch Google accounts',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // Otherwise, return cached data from connection metadata
    const meta = connection.metadata as Record<string, any> | undefined;
    const googleAccounts = meta?.googleAccounts as GoogleAccountsResponse | undefined;

    if (!googleAccounts) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'NO_ACCOUNTS_FOUND',
          message: 'No Google accounts found. Try refreshing with ?refresh=true',
        },
      });
    }

    return reply.send({
      data: googleAccounts,
      error: null,
    });
  });

  /**
   * GET /agency-platforms/meta/business-accounts
   * Fetch all Meta Business Manager accounts for an agency's Meta connection
   *
   * This endpoint retrieves all available Business Manager accounts
   * for the agency's Meta OAuth connection.
   *
   * Query params:
   * - agencyId: Agency ID (required)
   * - refresh: If 'true', re-fetch from Meta APIs instead of using cached metadata
   */
  fastify.get('/agency-platforms/meta/business-accounts', async (request, reply) => {
    const { agencyId, refresh } = request.query as {
      agencyId?: string;
      refresh?: string;
    };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    // Get Meta connection
    const connectionResult = await agencyPlatformService.getConnection(agencyId, 'meta');

    if (connectionResult.error || !connectionResult.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'META_NOT_CONNECTED',
          message: 'Meta is not connected. Please connect your Meta account first.',
        },
      });
    }

    const connection = connectionResult.data;

    // If refresh is requested, fetch fresh data from Meta APIs
    if (refresh === 'true') {
      try {
        // Get valid access token
        const tokenResult = await agencyPlatformService.getValidToken(agencyId, 'meta');

        if (tokenResult.error || !tokenResult.data) {
          return reply.code(500).send({
            data: null,
            error: {
              code: 'TOKEN_ERROR',
              message: 'Failed to get valid access token',
            },
          });
        }

        // Fetch all Meta business accounts
        const metaConnector = new MetaConnector();
        const businessAccounts = await metaConnector.getBusinessAccounts(tokenResult.data);

        // Update connection metadata with fresh data
        await agencyPlatformService.updateConnectionMetadata(agencyId, 'meta', {
          metaBusinessAccounts: {
            businesses: businessAccounts.businesses,
            hasAccess: businessAccounts.hasAccess,
          },
        });

        return reply.send({
          data: businessAccounts,
          error: null,
        });
      } catch (error) {
        return reply.code(500).send({
          data: null,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch Meta business accounts',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // Otherwise, return cached data from connection metadata
    const meta = connection.metadata as Record<string, any> | undefined;
    const businessAccounts = meta?.metaBusinessAccounts as MetaBusinessAccountsResponse | undefined;

    if (!businessAccounts) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'NO_ACCOUNTS_FOUND',
          message: 'No Meta business accounts found. Try refreshing with ?refresh=true',
        },
      });
    }

    return reply.send({
      data: businessAccounts,
      error: null,
    });
  });

  /**
   * POST /agency-platforms/meta/complete-oauth
   * Complete Meta OAuth by selecting a Business Portfolio and creating a system user
   */
  fastify.post('/agency-platforms/meta/complete-oauth', async (request, reply) => {
    const { agencyId, businessId, businessName, connectionId } = request.body as {
      agencyId?: string;
      businessId?: string;
      businessName?: string;
      connectionId?: string;
    };

    if (!agencyId || !businessId || !businessName || !connectionId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId, businessId, businessName, and connectionId are required',
        },
      });
    }

    try {
      // 1. Update the business portfolio selection
      const result = await metaAssetsService.saveBusinessPortfolio(agencyId, businessId, businessName);

      if (result.error) {
        return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send(result);
      }

      // 2. The saveBusinessPortfolio service already handles system user creation
      // but let's ensure the connection metadata is fully updated
      const connection = await prisma.agencyPlatformConnection.findUnique({
        where: { id: connectionId },
      });

      return reply.send({
        data: connection,
        error: null,
      });
    } catch (error) {
      fastify.log.error({
        msg: 'Failed to complete Meta OAuth',
        error: error instanceof Error ? error.message : String(error),
        agencyId,
        businessId,
      });
      return reply.code(500).send({
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete Meta OAuth flow',
        },
      });
    }
  });

  /**
   * PATCH /agency-platforms/meta/business
   * Save selected Business Portfolio for a Meta connection
   */
  fastify.patch('/agency-platforms/meta/business', async (request, reply) => {
    const { agencyId, businessId, businessName } = request.body as {
      agencyId?: string;
      businessId?: string;
      businessName?: string;
    };

    if (!agencyId || !businessId || !businessName) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId, businessId, and businessName are required',
        },
      });
    }

    const result = await metaAssetsService.saveBusinessPortfolio(agencyId, businessId, businessName);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send(result);
    }

    return reply.send(result);
  });

  /**
   * PATCH /agency-platforms/meta/asset-settings
   * Save asset settings for a Meta connection
   */
  fastify.patch('/agency-platforms/meta/asset-settings', async (request, reply) => {
    const { agencyId, settings } = request.body as {
      agencyId?: string;
      settings?: any;
    };

    if (!agencyId || !settings) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId and settings are required',
        },
      });
    }

    const result = await metaAssetsService.saveAssetSettings(agencyId, settings);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send(result);
    }

    return reply.send(result);
  });

  /**
   * GET /agency-platforms/meta/asset-settings
   * Get current asset settings for a Meta connection
   */
  fastify.get('/agency-platforms/meta/asset-settings', async (request, reply) => {
    const { agencyId } = request.query as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    const result = await metaAssetsService.getAssetSettings(agencyId);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send(result);
    }

    return reply.send(result);
  });

  /**
   * GET /agency-platforms/meta/assets/:businessId
   * Fetch all assets for a specific Meta business
   */
  fastify.get('/agency-platforms/meta/assets/:businessId', async (request, reply) => {
    const { businessId } = request.params as { businessId: string };
    const { agencyId } = request.query as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'agencyId is required' },
      });
    }

    const result = await metaAssetsService.getAssetsForBusiness(agencyId, businessId);

    if (result.error) {
      return reply.code(500).send(result);
    }

    return reply.send(result);
  });

  /**
   * GET /agency-platforms/meta/assets/summary
   * Returns summary of all businesses and their asset counts
   */
  fastify.get('/agency-platforms/meta/assets/summary', async (request, reply) => {
    const { agencyId } = request.query as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'agencyId is required' },
      });
    }

    // Get Meta connection
    const connectionResult = await agencyPlatformService.getConnection(agencyId, 'meta');
    if (connectionResult.error || !connectionResult.data) {
      return reply.code(404).send({
        data: null,
        error: { code: 'META_NOT_CONNECTED', message: 'Meta is not connected' },
      });
    }

    const meta = connectionResult.data.metadata as any;
    const businesses = meta?.metaBusinessAccounts?.businesses || [];

    // Fetch assets for each business
    const summaries = await Promise.all(
      businesses.map(async (business: any) => {
        const result = await metaAssetsService.getAssetsForBusiness(agencyId, business.id);
        if (result.data) {
          return {
            businessId: business.id,
            businessName: business.name,
            adAccountsCount: result.data.adAccounts.length,
            pagesCount: result.data.pages.length,
            instagramAccountsCount: result.data.instagramAccounts.length,
            productCatalogsCount: result.data.productCatalogs.length,
          };
        }
        return {
          businessId: business.id,
          businessName: business.name,
          error: result.error,
        };
      })
    );

    return reply.send({ data: summaries, error: null });
  });

  /**
   * PATCH /agency-platforms/meta/selections
   * Save granular asset selections for a Meta connection
   */
  fastify.patch('/agency-platforms/meta/selections', async (request, reply) => {
    const { agencyId, selections } = request.body as {
      agencyId?: string;
      selections?: any[];
    };

    if (!agencyId || !selections) {
      return reply.code(400).send({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'agencyId and selections are required' },
      });
    }

    const result = await metaAssetsService.saveAssetSelections(agencyId, selections);

    if (result.error) {
      return reply.code(500).send(result);
    }

    return reply.send(result);
  });

  /**
   * GET /agency-platforms/google/asset-settings
   * Get current asset settings for a Google connection
   */
  fastify.get('/agency-platforms/google/asset-settings', async (request, reply) => {
    const { agencyId } = request.query as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    const result = await googleAssetsService.getAssetSettings(agencyId);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send(result);
    }

    return reply.send(result);
  });

  /**
   * PATCH /agency-platforms/google/asset-settings
   * Save asset settings for a Google connection
   */
  fastify.patch('/agency-platforms/google/asset-settings', async (request, reply) => {
    const { agencyId, settings } = request.body as {
      agencyId?: string;
      settings?: any;
    };

    if (!agencyId || !settings) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId and settings are required',
        },
      });
    }

    const result = await googleAssetsService.saveAssetSettings(agencyId, settings);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send(result);
    }

    return reply.send(result);
  });

  /**
   * PATCH /agency-platforms/google/account
   * Save selected account for a Google product
   */
  fastify.patch('/agency-platforms/google/account', async (request, reply) => {
    const { agencyId, product, accountId, accountName } = request.body as {
      agencyId?: string;
      product?: string;
      accountId?: string;
      accountName?: string;
    };

    if (!agencyId || !product || !accountId || !accountName) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId, product, accountId, and accountName are required',
        },
      });
    }

    const result = await googleAssetsService.saveAccountSelection(
      agencyId,
      product,
      accountId,
      accountName
    );

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send(result);
    }

    return reply.send(result);
  });
}

// Helper function to get platform display name
function getPlatformDisplayName(platform: string): string {
  const displayNames: Record<string, string> = {
    meta: 'Meta',
    google: 'Google',
    linkedin: 'LinkedIn',
  };
  return displayNames[platform] || platform;
}
