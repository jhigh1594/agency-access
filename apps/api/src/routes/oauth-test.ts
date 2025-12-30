import { FastifyInstance } from 'fastify';
import { metaConnector } from '../services/connectors/meta';
import { infisical } from '../lib/infisical';
import { oauthStateService } from '../services/oauth-state.service';

/**
 * Test routes for Meta OAuth flow
 *
 * IMPORTANT: These are temporary test routes for MLP validation
 * In production, these will be replaced with proper access request flows
 */

export async function oauthTestRoutes(fastify: FastifyInstance) {
  /**
   * Step 1: Initiate OAuth flow
   * GET /api/oauth/meta/test
   *
   * Generates authorization URL and redirects user to Meta
   */
  fastify.get('/api/oauth/meta/test', async (request, reply) => {
    // Create OAuth state token with CSRF protection
    const { data: state, error } = await oauthStateService.createState({
      agencyId: 'test-agency', // In production, this comes from the access request
      platform: 'meta_ads',
      userEmail: 'test@example.com', // In production, this comes from the authenticated user
      redirectUrl: `${process.env.FRONTEND_URL}/dashboard`,
      timestamp: Date.now(),
    });

    if (error || !state) {
      fastify.log.error({ error }, 'Failed to create OAuth state token');
      return reply.code(500).send({
        success: false,
        error: 'Failed to create OAuth state token',
      });
    }

    fastify.log.info({ state }, 'Generated OAuth state token');

    // Generate Meta authorization URL with only public_profile (always available)
    // Note: Even 'email' requires enabling "Email" permission in app settings
    const authUrl = metaConnector.getAuthUrl(state, ['public_profile']);

    // Redirect user to Meta
    return reply.redirect(authUrl);
  });

  /**
   * Step 2: Handle OAuth callback
   * GET /api/oauth/meta/callback
   *
   * Receives authorization code from Meta and exchanges it for tokens
   */
  fastify.get('/api/oauth/meta/callback', async (request, reply) => {
    const { code, state, error, error_description } = request.query as {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };

    // Handle OAuth errors
    if (error) {
      fastify.log.error({ error, error_description }, 'Meta OAuth error');
      return reply.code(400).send({
        success: false,
        error,
        description: error_description,
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required parameters',
      });
    }

    try {
      // Verify state token matches stored value (CSRF protection)
      const { data: stateData, error: stateError } = await oauthStateService.validateState(state);

      if (stateError || !stateData) {
        fastify.log.error({ state, error: stateError }, 'OAuth state validation failed');
        return reply.code(400).send({
          success: false,
          error: 'Invalid or expired state token',
          code: stateError?.code || 'INVALID_STATE',
        });
      }

      fastify.log.info(
        { state, agencyId: stateData.agencyId, platform: stateData.platform },
        'OAuth state validated successfully'
      );

      // Step 1: Exchange code for short-lived token
      fastify.log.info('Exchanging authorization code for token...');
      const shortLivedToken = await metaConnector.exchangeCode(code);
      fastify.log.info({ expiresIn: shortLivedToken.expiresIn }, 'Got short-lived token');

      // Step 2: Exchange for long-lived token (60 days)
      fastify.log.info('Exchanging for long-lived token...');
      const longLivedToken = await metaConnector.getLongLivedToken(shortLivedToken.accessToken);
      fastify.log.info(
        { expiresAt: longLivedToken.expiresAt },
        'Got long-lived token (60 days)'
      );

      // Step 3: Get user info
      fastify.log.info('Fetching user info...');
      const userInfo = await metaConnector.getUserInfo(longLivedToken.accessToken);
      fastify.log.info({ userId: userInfo.id, userName: userInfo.name }, 'Got user info');

      // Step 4: Store token in Infisical
      fastify.log.info('Storing token in Infisical...');
      const secretName = infisical.generateSecretName('meta', `test_${Date.now()}`);
      await infisical.storeOAuthTokens(secretName, {
        accessToken: longLivedToken.accessToken,
        expiresAt: longLivedToken.expiresAt,
        scope: 'email,public_profile',
      });
      fastify.log.info({ secretName }, 'Token stored in Infisical');

      // Success! Return HTML response
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Success</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                max-width: 600px;
                margin: 100px auto;
                padding: 20px;
                text-align: center;
              }
              .success {
                font-size: 48px;
                margin-bottom: 20px;
              }
              .details {
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                text-align: left;
                margin-top: 30px;
              }
              .details h3 {
                margin-top: 0;
              }
              .token {
                font-family: monospace;
                font-size: 12px;
                word-break: break-all;
                background: #fff;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="success">🎉</div>
            <h1>Meta OAuth Success!</h1>
            <p>You've successfully connected your Meta account.</p>

            <div class="details">
              <h3>Connection Details</h3>
              <p><strong>User:</strong> ${userInfo.name} (Marketing API - email not available)</p>
              <p><strong>Meta ID:</strong> ${userInfo.id}</p>
              <p><strong>Token Expires:</strong> ${longLivedToken.expiresAt?.toLocaleString()}</p>
              <p><strong>Infisical Secret:</strong> <code>${secretName}</code></p>

              <h3>Access Token (preview)</h3>
              <div class="token">
                ${longLivedToken.accessToken.substring(0, 50)}...
              </div>

              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                ✅ Token is securely stored in Infisical<br>
                ✅ Never stored in database<br>
                ✅ Valid for ~60 days
              </p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      fastify.log.error(error, 'OAuth callback error');
      return reply.code(500).send({
        success: false,
        error: 'OAuth flow failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Verify stored token
   * GET /api/oauth/meta/verify/:secretName
   *
   * Retrieves token from Infisical and verifies it's still valid
   */
  fastify.get('/api/oauth/meta/verify/:secretName', async (request, reply) => {
    const { secretName } = request.params as { secretName: string };

    try {
      // Retrieve token from Infisical
      const tokens = await infisical.getOAuthTokens(secretName);

      // Verify with Meta
      const isValid = await metaConnector.verifyToken(tokens.accessToken);

      return {
        success: true,
        secretName,
        isValid,
        expiresAt: tokens.expiresAt,
        tokenPreview: tokens.accessToken.substring(0, 20) + '...',
      };
    } catch (error) {
      fastify.log.error(error, 'Token verification error');
      return reply.code(500).send({
        success: false,
        error: 'Verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
