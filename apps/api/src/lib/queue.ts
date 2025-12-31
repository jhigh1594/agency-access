/**
 * BullMQ Queue Setup
 *
 * Background job processing for token refresh and cleanup tasks.
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import { env } from './env.js';
import { connectionService } from '../services/connection.service.js';
import { accessRequestService } from '../services/access-request.service.js';
import { auditService } from '../services/audit.service.js';
import { prisma } from './prisma.js';
import { getConnector } from '../services/connectors/factory.js';

// Redis connection options for IORedis
const connectionOptions = {
  host: env.REDIS_HOST || 'localhost',
  port: env.REDIS_PORT || 6379,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true, // Don't connect immediately
  enableReadyCheck: false,
  // Disable reconnection attempts in development when Redis is unavailable
  retryStrategy: (times: number) => {
    if (env.NODE_ENV !== 'production') {
      // In development, stop retrying after first failure
      return null;
    }
    // In production, retry with exponential backoff
    return Math.min(times * 50, 2000);
  },
};

// Create queues
export const tokenRefreshQueue = new Queue('token-refresh', {
  connection: connectionOptions,
});

export const cleanupQueue = new Queue('cleanup', {
  connection: connectionOptions,
});

export const notificationQueue = new Queue('notification', {
  connection: connectionOptions,
});

/**
 * Token Refresh Worker
 *
 * Processes token refresh jobs:
 * 1. Finds tokens expiring within 7 days
 * 2. Retrieves refresh token from Infisical
 * 3. Calls connector to refresh
 * 4. Updates Infisical with new token
 * 5. Updates PlatformAuthorization record
 * 6. Logs to AuditLog
 */
export async function startTokenRefreshWorker() {
  const worker = new Worker(
    'token-refresh',
    async (job) => {
      const { connectionId, platform } = job.data;

      try {
        // Get authorization record
        const auth = await prisma.platformAuthorization.findFirst({
          where: { connectionId, platform },
          include: { connection: true },
        });

        if (!auth) {
          console.error(`Authorization not found: ${connectionId}/${platform}`);
          return { success: false, error: 'NOT_FOUND' };
        }

        if (auth.status !== 'active') {
          return { success: false, error: 'INACTIVE' };
        }

        // Retrieve tokens from Infisical
        const { infisical } = await import('../lib/infisical.js');
        const tokens = await infisical.retrieveOAuthTokens(auth.secretId);

        if (!tokens || !tokens.refreshToken) {
          return { success: false, error: 'NO_REFRESH_TOKEN' };
        }

        // Get platform connector and refresh token
        const connector = getConnector(platform);

        if (!connector.refreshToken) {
          // Platform doesn't support refresh (e.g., Meta with 60-day tokens)
          console.log(`${platform} does not support token refresh, skipping`);
          await auditService.createAuditLog({
            resourceId: connectionId,
            resourceType: 'connection',
            action: 'REFRESH_NOT_SUPPORTED',
            details: {
              platform,
              reason: 'Platform does not support token refresh via refresh_token',
            },
          });
          return { success: false, error: 'NOT_SUPPORTED' };
        }

        // Call connector to refresh token
        const newTokens = await connector.refreshToken(tokens.refreshToken);

        // Update tokens in Infisical
        await infisical.updateOAuthTokens(auth.secretId, newTokens);

        // Update database
        await prisma.platformAuthorization.update({
          where: { id: auth.id },
          data: {
            expiresAt: newTokens.expiresAt,
            lastRefreshedAt: new Date(),
          },
        });

        // Log the refresh
        await auditService.createAuditLog({
          resourceId: connectionId,
          resourceType: 'connection',
          action: 'REFRESHED',
          details: {
            platform,
            jobId: job.id,
            expiresAt: newTokens.expiresAt,
          },
        });

        return { success: true, expiresAt: newTokens.expiresAt };
      } catch (error) {
        console.error(`Token refresh failed for ${connectionId}/${platform}:`, error);

        // Log failure
        await auditService.createAuditLog({
          resourceId: connectionId,
          resourceType: 'connection',
          action: 'FAILED',
          details: {
            platform,
            jobId: job.id,
            error: String(error),
          },
        });

        throw error; // Will trigger retry
      }
    },
    {
      connection: connectionOptions,
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  worker.on('completed', (job) => {
    console.log(`Token refresh job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Token refresh job failed: ${job?.id}`, err);
  });

  return worker;
}

/**
 * Cleanup Worker
 *
 * Processes cleanup jobs:
 * 1. Deletes expired access requests
 * 2. Archives old audit logs
 */
export async function startCleanupWorker() {
  const worker = new Worker(
    'cleanup',
    async (job) => {
      const { type } = job.data;

      if (type === 'delete-expired-requests') {
        const result = await accessRequestService.deleteExpiredRequests();

        if (result.data) {
          console.log(`Deleted ${result.data.deleted} expired requests`);
        }

        return result.data;
      }

      return { success: false, error: 'UNKNOWN_JOB_TYPE' };
    },
    {
      connection: connectionOptions,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Cleanup job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Cleanup job failed: ${job?.id}`, err);
  });

  return worker;
}

/**
 * Notification Worker
 *
 * Processes notification jobs:
 * 1. Sends notifications to agencies when clients complete authorization
 * 2. Supports multiple channels: email, webhook, Slack, in-app
 */
export async function startNotificationWorker() {
  const worker = new Worker(
    'notification',
    async (job) => {
      const { agencyId, accessRequestId, clientEmail, clientName, platforms, completedAt } = job.data;

      try {
        const { notificationService } = await import('../services/notification.service.js');

        const result = await notificationService.sendNotification({
          agencyId,
          accessRequestId,
          clientEmail,
          clientName,
          platforms,
          completedAt,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        return { success: true };
      } catch (error) {
        console.error(`Notification job failed for ${agencyId}:`, error);
        throw error; // Will trigger retry
      }
    },
    {
      connection: connectionOptions,
      concurrency: 10, // Process up to 10 notifications concurrently
    }
  );

  worker.on('completed', (job) => {
    console.log(`Notification job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Notification job failed: ${job?.id}`, err);
  });

  return worker;
}

/**
 * Schedule recurring jobs
 */
export async function scheduleJobs() {
  // Token refresh check - runs every 6 hours
  // This job scans for tokens expiring within 7 days and queues refresh jobs
  const tokenRefreshQueue = new Queue('token-refresh', {
    connection: connectionOptions,
  });

  await tokenRefreshQueue.add(
    'check-expiring-tokens',
    { type: 'check-expiring-tokens' },
    {
      repeat: {
        pattern: '0 */6 * * *', // Every 6 hours
        tz: 'UTC',
      },
    }
  );

  // Cleanup job - runs daily at 2 AM UTC
  const cleanupQueue = new Queue('cleanup', {
    connection: connectionOptions,
  });

  await cleanupQueue.add(
    'delete-expired-requests',
    { type: 'delete-expired-requests' },
    {
      repeat: {
        pattern: '0 2 * * *', // Daily at 2 AM
        tz: 'UTC',
      },
    }
  );

  console.log('Recurring jobs scheduled successfully');
}

/**
 * Add a token refresh job to the queue
 */
export async function queueTokenRefresh(connectionId: string, platform: string) {
  await tokenRefreshQueue.add(
    'refresh-token',
    { connectionId, platform },
    {
      jobId: `refresh-${connectionId}-${platform}`,
      priority: 1, // Higher priority for manual refreshes
    }
  );
}

/**
 * Process expiring tokens check
 * This is called by the recurring job to find and queue refreshes
 */
export async function processExpiringTokens() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Find all active authorizations expiring within 7 days
  const expiringAuths = await prisma.platformAuthorization.findMany({
    where: {
      status: 'active',
      expiresAt: {
        lte: sevenDaysFromNow,
      },
    },
    include: {
      connection: {
        select: {
          id: true,
          agencyId: true,
          clientEmail: true,
        },
      },
    },
  });

  console.log(`Found ${expiringAuths.length} tokens expiring soon`);

  // Queue refresh jobs for each expiring token
  for (const auth of expiringAuths) {
    await queueTokenRefresh(auth.connectionId, auth.platform);
  }

  return { queued: expiringAuths.length };
}
