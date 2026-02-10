import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { env } from './lib/env.js';
import { getCorsOptions } from './lib/cors.js';
import { authenticate } from './middleware/auth.js';
import { extractClientIp } from './lib/ip.js';
import { oauthTestRoutes } from './routes/oauth-test.js';
import { agencyRoutes } from './routes/agencies.js';
import { accessRequestRoutes } from './routes/access-requests.js';
// TODO: Re-enable when Token Health page is restored
// import { tokenHealthRoutes } from './routes/token-health.js';
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
import { performanceMiddleware } from './middleware/performance.js';

const fastify = Fastify({
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
await fastify.register(cors, getCorsOptions(env.FRONTEND_URL));

// Register compression middleware
await fastify.register(compress, {
  encodings: ['gzip', 'deflate', 'br'],
  threshold: 1024, // Only compress responses larger than 1KB
});

// Register rate limiting middleware (prevents DoS/brute force attacks)
if (env.RATE_LIMIT_ENABLED) {
  await fastify.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW_SECONDS * 1000,
    skipOnError: true,
    allowList: async (request) => {
      // Skip rate limiting for authenticated users if configured
      if (env.RATE_LIMIT_SKIP_AUTHENTICATED) {
        try {
          const authHeader = request.headers.authorization;
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const { verifyToken } = await import('@clerk/backend');
            const verified = await verifyToken(token, {
              jwtKey: process.env.CLERK_SECRET_KEY,
            });
            return !!verified;
          }
        } catch {
          return false;
        }
      }
      return false;
    },
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

// Register performance monitoring middleware
fastify.addHook('onRequest', performanceMiddleware);

// Note: JWT verification is now handled in the authenticate() middleware
// using Clerk's backend SDK which properly handles RS256 tokens

// Register routes
await fastify.register(oauthTestRoutes);
await fastify.register(agencyRoutes, { prefix: '/api' });
await fastify.register(accessRequestRoutes, { prefix: '/api' });
// TODO: Token Health routes commented out until future state is determined
// await fastify.register(tokenHealthRoutes, { prefix: '/api' });
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
    // Start background workers (optional - graceful degradation if Redis unavailable)
    // Use a timeout to prevent blocking server startup
    try {
      const { startNotificationWorker } = await import('./lib/queue.js');
      const workerPromise = startNotificationWorker();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Worker startup timeout')), 10000)
      );
      await Promise.race([workerPromise, timeoutPromise]);
      fastify.log.info('Notification worker started');
    } catch (workerErr) {
      fastify.log.warn('Failed to start notification worker (Redis may be unavailable)');
      fastify.log.warn('Notifications will be disabled. To enable, ensure Redis is running.');
      if (env.NODE_ENV === 'development') {
        fastify.log.info('To start Redis: brew services start redis (macOS) or docker run -p 6379:6379 redis');
      }
    }

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
