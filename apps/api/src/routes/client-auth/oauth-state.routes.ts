import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../../services/access-request.service.js';
import { oauthStateService } from '../../services/oauth-state.service.js';
import { getConnector } from '../../services/connectors/factory.js';
import { env } from '../../lib/env.js';
import type { Platform } from '@agency-platform/shared';
import { createOAuthStateSchema } from './schemas.js';

export async function registerOAuthStateRoutes(fastify: FastifyInstance) {
  // Create OAuth state token for CSRF protection
  fastify.post('/client/:token/oauth-state', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequest.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const validated = createOAuthStateSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid platform',
          details: validated.error.errors,
        },
      });
    }

    const { platform } = validated.data;

    const stateResult = await oauthStateService.createState({
      agencyId: accessRequest.data.agencyId,
      platform,
      userEmail: accessRequest.data.clientEmail,
      accessRequestId: accessRequest.data.id,
      clientEmail: accessRequest.data.clientEmail,
      timestamp: Date.now(),
    });

    if (stateResult.error || !stateResult.data) {
      return reply.code(500).send({
        data: null,
        error: stateResult.error || {
          code: 'STATE_CREATION_FAILED',
          message: 'Failed to create OAuth state token',
        },
      });
    }

    return reply.send({
      data: { state: stateResult.data },
      error: null,
    });
  });

  // Generate OAuth URL for a specific platform
  fastify.post('/client/:token/oauth-url', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequest.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const validated = createOAuthStateSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid platform',
          details: validated.error.errors,
        },
      });
    }

    const { platform } = validated.data;

    // Create OAuth state token (include token for redirect after OAuth)
    const stateResult = await oauthStateService.createState({
      agencyId: accessRequest.data.agencyId,
      platform,
      userEmail: accessRequest.data.clientEmail,
      accessRequestId: accessRequest.data.id,
      accessRequestToken: token,
      clientEmail: accessRequest.data.clientEmail,
      timestamp: Date.now(),
    });

    if (stateResult.error || !stateResult.data) {
      return reply.code(500).send({
        data: null,
        error: stateResult.error || {
          code: 'STATE_CREATION_FAILED',
          message: 'Failed to create OAuth state token',
        },
      });
    }

    const state = stateResult.data;

    // Get connector and generate URL
    try {
      const connector = getConnector(platform as Platform);
      const redirectUri = `${env.FRONTEND_URL}/invite/oauth-callback`;

      // For Google platform group, determine scopes based on requested products
      let scopes: string[] | undefined;
      if (platform === 'google') {
        const platforms = accessRequest.data.platforms as any[];
        const googleProducts = platforms
          .filter((p: any) => p.platformGroup === 'google')
          .flatMap((p: any) => p.products || []);

        const productIds = googleProducts.map((p: any) =>
          typeof p === 'string' ? p : p.product
        );

        scopes = [];
        if (productIds.includes('google_ads')) {
          scopes.push('https://www.googleapis.com/auth/adwords');
        }
        if (productIds.includes('ga4')) {
          scopes.push('https://www.googleapis.com/auth/analytics.readonly');
        }
        if (productIds.includes('google_business_profile')) {
          scopes.push('https://www.googleapis.com/auth/business.manage');
        }
        if (productIds.includes('google_tag_manager')) {
          scopes.push('https://www.googleapis.com/auth/tagmanager.readonly');
        }
        if (productIds.includes('google_merchant_center')) {
          scopes.push('https://www.googleapis.com/auth/content');
        }
        if (productIds.includes('google_search_console')) {
          scopes.push('https://www.googleapis.com/auth/webmasters');
        }
        scopes.push('https://www.googleapis.com/auth/userinfo.email');
      }

      if (platform === 'meta' || platform === 'meta_ads') {
        scopes = [
          'ads_management',
          'ads_read',
          'business_management',
          'pages_read_engagement',
        ];
      }

      const authUrl = connector.getAuthUrl(state, scopes, redirectUri);

      return reply.send({
        data: { authUrl, state },
        error: null,
      });
    } catch (error) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'CONNECTOR_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate OAuth URL',
        },
      });
    }
  });
}
