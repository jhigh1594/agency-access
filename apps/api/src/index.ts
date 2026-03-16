// Import Sentry instrumentation FIRST (before any other modules)
import "./instrument.js";
import * as Sentry from "@sentry/node";

import Fastify, { type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import fastifyRawBody from 'fastify-raw-body';
import { env } from './lib/env.js';
import { getCorsOptions } from './lib/cors.js';
import { authenticate, optionalAuthenticate } from './middleware/auth.js';
import { extractClientIp } from './lib/ip.js';
import { oauthTestRoutes } from './routes/oauth-test.js';
import { agencyRoutes } from './routes/agencies.js';
import { accessRequestRoutes } from './routes/access-requests.js';
import { tokenHealthRoutes } from './routes/token-health.js';
import { clientAuthRoutes } from './routes/client-auth.js';
import { templateRoutes } from './routes/templates.js';
import { platformAuthorizationRoutes } from './routes/platform-authorization.js';
import { clientRoutes } from './routes/clients.js';
import { agencyPlatformsRoutes } from './routes/agency-platforms.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { usageRoutes } from './routes/usage.js';
import { webhookRoutes } from './routes/webhooks.js';
import { beehiivRoutes } from './routes/beehiiv.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { internalAdminRoutes } from './routes/internal-admin.routes.js';
import { quotaRoutes } from './routes/quota.routes';
import { contactRoutes } from './routes/contact.js';
import { helpScoutRoutes } from './routes/help-scout.js';
import { affiliateRoutes } from './routes/affiliate.js';
import { sentryWebhooksRoutes } from './routes/sentry-webhooks.js';
import { sentryTestRoutes } from './routes/sentry-test.routes.js';
import { performanceOnRequest, performanceOnSend } from './middleware/performance.js';
import { prisma } from './lib/prisma.js';

const trustProxy = env.TRUST_PROXY_IPS.length > 0 ? env.TRUST_PROXY_IPS : false;

function buildAuthenticatedRateLimitAllowList() {
  return async (request: FastifyRequest, _key: string): Promise<boolean> => {
    return Boolean((request as FastifyRequest & { user?: unknown }).user);
  };
}

const fastify = Fastify({
  trustProxy,
  logger: {
    level: env.LOG_LEVEL || 'info',
    transport: env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Register plugins
await fastify.register(cors, getCorsOptions(env.FRONTEND_URL, env.CORS_ALLOWED_ORIGINS));
await fastify.register(fastifyRawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
});

// Register compression middleware
await fastify.register(compress, {
  encodings: ['gzip', 'deflate', 'br'],
  threshold: 1024, // Only compress responses larger than 1KB
});

// Register performance monitoring middleware before auth/rate-limit hooks.
fastify.addHook('onRequest', performanceOnRequest);
fastify.addHook('onSend', performanceOnSend);

// Register rate limiting middleware (prevents DoS/brute force attacks)
if (env.RATE_LIMIT_ENABLED) {
  if (env.RATE_LIMIT_SKIP_AUTHENTICATED) {
    fastify.addHook('onRequest', optionalAuthenticate());
  }

  await fastify.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW_SECONDS * 1000,
    skipOnError: true,
    allowList: env.RATE_LIMIT_SKIP_AUTHENTICATED
      ? buildAuthenticatedRateLimitAllowList()
      : async () => false,
    keyGenerator: (request) => {
      // Use IP address as rate limit key
      return extractClientIp(request);
    },
    errorResponseBuilder: (request, context) => ({
      data: null,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: {
          limit: context.max,
          reset: new Date(Date.now() + context.ttl).toISOString(),
        },
      },
    }),
  });
}

// Register security headers middleware
await fastify.register(helmet, {
  contentSecurityPolicy: false, // Disabled for OAuth compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

// Custom error handler: return our standard { error: { code, message } } format
// so frontend always gets a parseable error.message
fastify.setErrorHandler((error: unknown, _request, reply) => {
  const err = error as { statusCode?: number; code?: string; message?: string };
  const statusCode = err.statusCode ?? 500;
  const message = err?.message || 'An unexpected error occurred';

  // Capture 500 errors in Sentry (4xx are client errors, don't need tracking)
  if (statusCode >= 500 && process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }

  void reply.code(statusCode).send({
    data: null,
    error: {
      code: err?.code || 'INTERNAL_ERROR',
      message,
    },
  });
});

// Note: JWT verification is now handled in the authenticate() middleware
// using Clerk's backend SDK which properly handles RS256 tokens

// Register routes
await fastify.register(oauthTestRoutes);
await fastify.register(agencyRoutes, { prefix: '/api' });
await fastify.register(accessRequestRoutes, { prefix: '/api' });
await fastify.register(tokenHealthRoutes, { prefix: '/api' });
await fastify.register(clientAuthRoutes, { prefix: '/api' });
await fastify.register(templateRoutes, { prefix: '/api' });
await fastify.register(platformAuthorizationRoutes, { prefix: '/api' });
await fastify.register(clientRoutes, { prefix: '/api' });
await fastify.register(dashboardRoutes, { prefix: '/api' });
await fastify.register(usageRoutes, { prefix: '/api' });
await fastify.register(webhookRoutes, { prefix: '/api' });
await fastify.register(agencyPlatformsRoutes);
await fastify.register(beehiivRoutes);
await fastify.register(subscriptionRoutes, { prefix: '/api' });
await fastify.register(internalAdminRoutes, { prefix: '/api' });
await fastify.register(quotaRoutes, { prefix: '/api' });
await fastify.register(contactRoutes);
await fastify.register(helpScoutRoutes, { prefix: '/api' });
await fastify.register(affiliateRoutes, { prefix: '/api' });
await fastify.register(sentryWebhooksRoutes, { prefix: '/api' });
await fastify.register(sentryTestRoutes); // No prefix - routes handle their own paths

// Health check and root routes
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Performance monitoring endpoint (requires authentication)
fastify.get('/performance-stats', {
  onRequest: [authenticate()],
}, async () => {
  const { getPerformanceStats } = await import('./middleware/performance.js');
  return getPerformanceStats();
});

fastify.get('/', async () => {
  return { 
    name: 'Agency Access Platform API',
    version: '0.1.0',
    status: 'running',
    documentation: '/health' 
  };
});

// Start server
const start = async () => {
  try {
    await prisma.$connect();

    if (env.NODE_ENV === 'production') {
      try {
        const { ensureRedisReady } = await import('./lib/redis.js');
        await ensureRedisReady();
        fastify.log.info('redis readiness check passed');
      } catch (redisErr) {
        fastify.log.warn(
          { error: redisErr },
          'Redis readiness check failed; OAuth state will use stateless fallback and Redis-backed workers may be degraded'
        );
      }

      const { assertWebhookSchemaReady } = await import('./lib/webhook-schema-readiness.js');
      await assertWebhookSchemaReady();
      fastify.log.info('webhook schema readiness check passed');
    }

    const startOptionalBackgroundTask = async (
      label: string,
      startTask: () => Promise<unknown>,
      warning: string
    ) => {
      try {
        const taskPromise = startTask();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Worker startup timeout')), 10000)
        );
        await Promise.race([taskPromise, timeoutPromise]);
        fastify.log.info(`${label} started`);
      } catch (workerErr) {
        fastify.log.warn(`Failed to start ${label} (Redis may be unavailable)`);
        fastify.log.warn(warning);
        if (env.NODE_ENV === 'development') {
          fastify.log.info('To start Redis: brew services start redis (macOS) or docker run -p 6379:6379 redis');
        }
      }
    };

    const {
      scheduleJobs,
      startCleanupWorker,
      startGoogleNativeGrantWorker,
      startNotificationWorker,
      startOnboardingEmailWorker,
      startTokenRefreshWorker,
      startTrialExpirationWorker,
      startWebhookDeliveryWorker,
    } = await import('./lib/queue.js');

    await startOptionalBackgroundTask(
      'token refresh worker',
      startTokenRefreshWorker,
      'Automatic token refresh will be disabled until Redis is available.'
    );

    await startOptionalBackgroundTask(
      'cleanup worker',
      startCleanupWorker,
      'Cleanup jobs will be disabled until Redis is available.'
    );

    await startOptionalBackgroundTask(
      'trial expiration worker',
      startTrialExpirationWorker,
      'Trial expiration jobs will be disabled until Redis is available.'
    );

    await startOptionalBackgroundTask(
      'google native grant worker',
      startGoogleNativeGrantWorker,
      'Google native grant execution will be disabled until Redis is available.'
    );

    await startOptionalBackgroundTask(
      'notification worker',
      startNotificationWorker,
      'Notifications will be disabled. To enable, ensure Redis is running.'
    );

    await startOptionalBackgroundTask(
      'webhook delivery worker',
      startWebhookDeliveryWorker,
      'Outbound webhooks will not be delivered until Redis is available.'
    );

    await startOptionalBackgroundTask(
      'onboarding email worker',
      startOnboardingEmailWorker,
      'Onboarding emails will not be delayed. To enable, ensure Redis is running.'
    );

    await startOptionalBackgroundTask(
      'recurring job scheduler',
      scheduleJobs,
      'Recurring background jobs will not be scheduled until Redis is available.'
    );

    await fastify.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });
    fastify.log.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
