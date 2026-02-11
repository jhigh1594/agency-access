import { FastifyInstance } from 'fastify';
import { agencyPlatformService } from '@/services/agency-platform.service';
import { oauthStateService } from '@/services/oauth-state.service';
import { MetaConnector } from '@/services/connectors/meta';
import { GoogleConnector } from '@/services/connectors/google';
import type { GoogleAccountsResponse } from '@/services/connectors/google';
import type { PlatformConnector } from '@/services/connectors/factory';
import { ConnectorError } from '@/services/connectors/base.connector.js';
import { env } from '@/lib/env';
import { PLATFORM_CONNECTORS, SUPPORTED_PLATFORMS, MANUAL_PLATFORMS } from './constants.js';

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

export async function registerOAuthRoutes(fastify: FastifyInstance) {
  /**
   * POST /agency-platforms/:platform/initiate
   * Start OAuth flow - generates auth URL and state token
   */
  fastify.post('/agency-platforms/:platform/initiate', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { agencyId, userEmail, redirectUrl, ...extraParams } = request.body as {
      agencyId?: string;
      userEmail?: string;
      redirectUrl?: string;
      shop?: string; // For Shopify OAuth
      [key: string]: any; // Allow other platform-specific params
    };

    if (!SUPPORTED_PLATFORMS.includes(platform as any)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" is not supported`,
        },
      });
    }

    if (!agencyId || !userEmail) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId and userEmail are required',
        },
      });
    }

    const stateResult = await oauthStateService.createState({
      agencyId,
      platform,
      userEmail,
      redirectUrl,
      timestamp: Date.now(),
      ...extraParams, // Include extra params (e.g., shop for Shopify)
    });

    if (stateResult.error) {
      return reply.code(500).send(stateResult);
    }

    if (MANUAL_PLATFORMS.includes(platform as any)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'MANUAL_INVITATION_PLATFORM',
          message: `${platform} uses manual invitation flow, not OAuth`,
        },
      });
    }

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

    const connector = new ConnectorClass() as PlatformConnector;

    try {
      // Handle platform-specific parameters (e.g., shop for Shopify)
      let authUrl: string;
      if (platform === 'shopify' && extraParams.shop) {
        authUrl = (connector as any).getAuthUrl(
          stateResult.data!,
          undefined, // scopes
          undefined, // redirectUri
          extraParams.shop // shop parameter for Shopify
        );
      } else {
        authUrl = connector.getAuthUrl(stateResult.data!);
      }

      return reply.send({
        data: {
          authUrl,
          state: stateResult.data,
        },
        error: null,
      });
    } catch (err) {
      if (err instanceof ConnectorError) {
        if (err.code === 'MISSING_CLIENT_ID' || err.code === 'MISSING_CLIENT_SECRET') {
          return reply.code(503).send({
            data: null,
            error: {
              code: err.code,
              message: `${platform} integration is not configured. Add the required environment variables (e.g. ${platform.toUpperCase()}_CLIENT_ID, ${platform.toUpperCase()}_CLIENT_SECRET) to your .env file.`,
            },
          });
        }
      }
      throw err;
    }
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
      const stateResult = await oauthStateService.validateState(state || '');

      if (stateResult.error || !stateResult.data) {
        const errorCode = stateResult.error?.code || 'INVALID_STATE';
        const redirectUrl = stateResult.data?.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=${errorCode}`);
      }

      const stateData = stateResult.data;

      const { agencyResolutionService } = await import('../../services/agency-resolution.service.js');
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

      const actualAgencyId = agencyResult.data!.agencyId;

      if (MANUAL_PLATFORMS.includes(platform as any)) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=MANUAL_INVITATION_PLATFORM`);
      }

      const ConnectorClass = PLATFORM_CONNECTORS[platform as keyof typeof PLATFORM_CONNECTORS];
      if (!ConnectorClass) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=CONNECTOR_NOT_IMPLEMENTED`);
      }

      const connector = new ConnectorClass() as PlatformConnector;

      let tokens;
      try {
        // Handle platform-specific parameters (e.g., shop for Shopify)
        const shop = stateData.shop as string | undefined;
        if (platform === 'shopify' && shop) {
          tokens = await (connector as any).exchangeCode(code || '', undefined, shop);
        } else {
          tokens = await connector.exchangeCode(code || '');
        }

        if (platform === 'meta' && 'getLongLivedToken' in connector) {
          tokens = await (connector as any).getLongLivedToken(tokens.accessToken);
        }
      } catch (error) {
        const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
        return reply.redirect(`${redirectUrl}?error=TOKEN_EXCHANGE_FAILED`);
      }

      let googleAccounts: GoogleAccountsResponse | undefined;
      if (platform === 'google' && connector instanceof GoogleConnector) {
        try {
          googleAccounts = await connector.getAllGoogleAccounts(tokens.accessToken);
        } catch (error) {
          console.error('Failed to fetch Google accounts:', error);
        }
      }

      let metaBusinessAccounts: MetaBusinessAccountsResponse | undefined;
      if (platform === 'meta' && connector instanceof MetaConnector) {
        try {
          metaBusinessAccounts = await connector.getBusinessAccounts(tokens.accessToken);
        } catch (error) {
          console.error('Failed to fetch Meta business accounts:', error);
        }
      }

      const connectionResult = await agencyPlatformService.createConnection({
        agencyId: actualAgencyId,
        platform: stateData.platform,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        connectedBy: stateData.userEmail,
        metadata: {
          tokenType: tokens.tokenType,
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

      if (platform === 'meta' && connectionResult.data) {
        const connection = connectionResult.data;
        const baseUrl = env.FRONTEND_URL;
        return reply.redirect(
          `${baseUrl}/platforms/callback?success=true&platform=meta&requireBusinessSelection=true&connectionId=${connection.id}&agencyId=${actualAgencyId}`
        );
      }

      const redirectUrl = stateData.redirectUrl || env.FRONTEND_URL;
      return reply.redirect(`${redirectUrl}?success=true&platform=${platform}`);
    } catch (error) {
      const redirectUrl = env.FRONTEND_URL;
      return reply.redirect(`${redirectUrl}?error=CALLBACK_FAILED`);
    }
  });
}
