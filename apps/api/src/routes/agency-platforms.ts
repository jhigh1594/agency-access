/**
 * Agency Platform Routes
 *
 * OAuth and platform connection management endpoints.
 * Handles OAuth initiation, callbacks, and connection management.
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { agencyPlatformService } from '@/services/agency-platform.service';
import { identityVerificationService } from '@/services/identity-verification.service';
import { oauthStateService } from '@/services/oauth-state.service';
import { MetaConnector } from '@/services/connectors/meta';
import { GoogleConnector } from '@/services/connectors/google';
import type { Platform } from '@agency-platform/shared';
import { env } from '@/lib/env';
import type { GoogleAccountsResponse } from '@/services/connectors/google';

// Platform names mapping
const PLATFORM_NAMES: Record<Platform, string> = {
  google: 'Google',
  meta: 'Meta',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  ga4: 'Google Analytics',
  tiktok: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
  snapchat: 'Snapchat Ads',
  instagram: 'Instagram',
};

// Platform categorization helper
function getPlatformCategory(platform: Platform): 'recommended' | 'other' {
  const recommended: Platform[] = ['google', 'meta', 'linkedin'];
  return recommended.includes(platform) ? 'recommended' : 'other';
}

// Supported platforms for agency connections (group-level platforms)
const SUPPORTED_PLATFORMS = ['google', 'meta', 'linkedin'] as const;
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

// Platform connector mapping
const PLATFORM_CONNECTORS = {
  google: GoogleConnector,
  meta: MetaConnector,
  linkedin: MetaConnector, // LinkedIn not implemented yet, placeholder
} as const;

export async function agencyPlatformsRoutes(fastify: FastifyInstance) {
  /**
   * Middleware: Auto-provision agency if it doesn't exist
   * This allows new users to connect platforms without manually creating an agency first
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

    // Check if agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    // Auto-provision agency if it doesn't exist
    if (!agency) {
      // Create agency with a default name
      await prisma.agency.create({
        data: {
          id: agencyId,
          name: 'My Agency',
          email: `user@${agencyId.slice(0, 8)}.agency`, // Placeholder email
          // Note: In production, you'd fetch actual user email from Clerk
        },
      });
    }
  });

  /**
   * GET /agency-platforms
   * List all agency platform connections with status
   */
  fastify.get('/agency-platforms', async (request, reply) => {
    const { agencyId, status } = request.query as {
      agencyId?: string;
      status?: string;
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

    const filters = status ? { status } : undefined;
    const result = await agencyPlatformService.getConnections(agencyId, filters);

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

    // Get agency connections
    const result = await agencyPlatformService.getConnections(agencyId);

    if (result.error) {
      return reply.code(500).send(result);
    }

    const connections = result.data || [];

    // Only return group-level platforms (unified connectors)
    // Product-level platforms (google_ads, ga4, meta_ads) are now subsumed under unified platforms
    const allPlatforms: Platform[] = [
      'google',   // Includes: google_ads, ga4, business, tag manager, search console, merchant
      'meta',     // Includes: meta_ads (facebook & instagram)
      'linkedin',
      // Note: TikTok, Snapchat, Instagram standalone can be added here when needed
    ];

    // Build available platforms list with connection status
    const availablePlatforms = allPlatforms.map((platform) => {
      const connection = connections.find((c) => c.platform === platform);

      // Extract email from metadata with fallback chain
      let connectedEmail: string | undefined;
      if (connection?.metadata) {
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

      // Auto-provision agency if it doesn't exist
      let agency = await prisma.agency.findUnique({
        where: { id: stateData.agencyId },
      });

      if (!agency) {
        agency = await prisma.agency.create({
          data: {
            id: stateData.agencyId,
            name: 'My Agency',
            email: stateData.userEmail || 'user@agency.com',
          },
        });
      }

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

      // Create platform connection
      const connectionResult = await agencyPlatformService.createConnection({
        agencyId: stateData.agencyId,
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
        },
      });

      if (connectionResult.error) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=${connectionResult.error.code}`);
      }

      // Redirect to success page
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
