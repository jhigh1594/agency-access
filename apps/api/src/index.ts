import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './lib/env';
import { oauthTestRoutes } from './routes/oauth-test';
import { agencyRoutes } from './routes/agencies';
import { accessRequestRoutes } from './routes/access-requests';
import { tokenHealthRoutes } from './routes/token-health';
import { clientAuthRoutes } from './routes/client-auth';
import { templateRoutes } from './routes/templates';
import { platformAuthorizationRoutes } from './routes/platform-authorization';
import { clientRoutes } from './routes/clients';
import { agencyPlatformsRoutes } from './routes/agency-platforms';

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
await fastify.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
});

// Register JWT for Clerk verification
await fastify.register(jwt, {
  secret: env.CLERK_SECRET_KEY,
});

// Clerk JWT verification decorator
fastify.decorate('verifyUser', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
});

// Register routes
await fastify.register(oauthTestRoutes);
await fastify.register(agencyRoutes, { prefix: '/api' });
await fastify.register(accessRequestRoutes, { prefix: '/api' });
await fastify.register(tokenHealthRoutes, { prefix: '/api' });
await fastify.register(clientAuthRoutes, { prefix: '/api' });
await fastify.register(templateRoutes, { prefix: '/api' });
await fastify.register(platformAuthorizationRoutes, { prefix: '/api' });
await fastify.register(clientRoutes, { prefix: '/api' });
await fastify.register(agencyPlatformsRoutes);

// Health check route
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    // Start background workers (optional - graceful degradation if Redis unavailable)
    try {
      const { startNotificationWorker } = await import('./lib/queue.js');
      await startNotificationWorker();
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
