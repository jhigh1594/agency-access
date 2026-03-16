/**
 * BullMQ Queue Setup
 *
 * Background job processing for token refresh and cleanup tasks.
 */

import { Queue, Worker } from 'bullmq';
import { getPlatformTokenCapability, type Platform } from '@agency-platform/shared';
import { env } from './env.js';
import { accessRequestService } from '../services/access-request.service.js';
import { auditService } from '../services/audit.service.js';
import { prisma } from './prisma.js';
import { refreshClientPlatformAuthorization } from '../services/token-lifecycle.service.js';
import { webhookDeliveryService } from '@/services/webhook-delivery.service';
import {
  bullMqConnectionOptions,
  registerQueueErrorHandler,
  registerWorkerErrorHandler,
} from './bullmq.js';

// Create queues
export const tokenRefreshQueue = registerQueueErrorHandler(new Queue('token-refresh', {
  connection: bullMqConnectionOptions,
}), 'token-refresh');

export const cleanupQueue = registerQueueErrorHandler(new Queue('cleanup', {
  connection: bullMqConnectionOptions,
}), 'cleanup');

export const notificationQueue = registerQueueErrorHandler(new Queue('notification', {
  connection: bullMqConnectionOptions,
}), 'notification');

export const webhookDeliveryQueue = registerQueueErrorHandler(new Queue('webhook-delivery', {
  connection: bullMqConnectionOptions,
}), 'webhook-delivery');

export const onboardingEmailQueue = registerQueueErrorHandler(new Queue('onboarding-email', {
  connection: bullMqConnectionOptions,
}), 'onboarding-email');

export const trialExpirationQueue = registerQueueErrorHandler(new Queue('trial-expiration', {
  connection: bullMqConnectionOptions,
}), 'trial-expiration');

export const googleNativeGrantQueue = registerQueueErrorHandler(new Queue('google-native-grant', {
  connection: bullMqConnectionOptions,
}), 'google-native-grant');

export const TOKEN_REFRESH_SCAN_JOB = 'check-expiring-tokens';
export const TOKEN_REFRESH_JOB = 'refresh-token';
export const WEBHOOK_DELIVERY_JOB = 'deliver-webhook-event';
export const GOOGLE_NATIVE_GRANT_JOB = 'execute-google-native-grant';

/**
 * Token Refresh Worker
 *
 * Processes token refresh jobs:
 * 1. Scans for expiring refreshable OAuth tokens
 * 2. Queues refresh jobs
 * 3. Refreshes individual authorizations through the lifecycle service
 * 4. Logs refresh outcomes to AuditLog
 */
export async function startTokenRefreshWorker() {
  const worker = new Worker(
    'token-refresh',
    async (job) => {
      if (job.name === TOKEN_REFRESH_SCAN_JOB) {
        return processExpiringTokens();
      }

      if (job.name !== TOKEN_REFRESH_JOB) {
        return { success: false, error: 'UNKNOWN_JOB_TYPE' };
      }

      const { connectionId, platform } = job.data as {
        connectionId: string;
        platform: Platform;
      };

      try {
        const auth = await prisma.platformAuthorization.findFirst({
          where: { connectionId, platform },
          include: { connection: true },
        });

        if (!auth) {
          return { success: false, error: 'NOT_FOUND' };
        }

        if (auth.status !== 'active') {
          return { success: false, error: 'INACTIVE' };
        }

        const refreshResult = await refreshClientPlatformAuthorization(connectionId, platform);

        if (refreshResult.error) {
          await auditService.createAuditLog({
            agencyId: auth.connection.agencyId,
            resourceId: connectionId,
            resourceType: 'connection',
            action: refreshResult.error.code === 'RECONNECT_REQUIRED'
              ? 'REFRESH_RECONNECT_REQUIRED'
              : 'FAILED',
            userEmail: auth.connection.clientEmail,
            details: {
              platform,
              jobId: job.id,
              error: refreshResult.error.message,
              code: refreshResult.error.code,
            },
          });
          return { success: false, error: refreshResult.error.code };
        }

        await auditService.createAuditLog({
          agencyId: auth.connection.agencyId,
          resourceId: connectionId,
          resourceType: 'connection',
          action: 'REFRESHED',
          userEmail: auth.connection.clientEmail,
          details: {
            platform,
            jobId: job.id,
            outcome: refreshResult.data?.outcome,
            expiresAt: refreshResult.data?.expiresAt,
          },
        });

        return { success: true, expiresAt: refreshResult.data?.expiresAt };
      } catch (error) {
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
      connection: bullMqConnectionOptions,
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  registerWorkerErrorHandler(worker, 'token-refresh');

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
      connection: bullMqConnectionOptions,
    }
  );

  registerWorkerErrorHandler(worker, 'cleanup');

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
      connection: bullMqConnectionOptions,
      concurrency: 10, // Process up to 10 notifications concurrently
    }
  );

  registerWorkerErrorHandler(worker, 'notification');

  worker.on('completed', (job) => {
    console.log(`Notification job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Notification job failed: ${job?.id}`, err);
  });

  return worker;
}

/**
 * Webhook Delivery Worker
 *
 * Processes outbound webhook deliveries asynchronously so customer endpoint
 * latency never blocks product request flows.
 */
export async function startWebhookDeliveryWorker() {
  const worker = new Worker(
    'webhook-delivery',
    async (job) => {
      if (job.name !== WEBHOOK_DELIVERY_JOB) {
        return { success: false, error: 'UNKNOWN_JOB_TYPE' };
      }

      const result = await webhookDeliveryService.deliverWebhookEvent({
        eventId: job.data.eventId,
        attemptNumber: job.attemptsMade + 1,
      });

      if (result.error) {
        if (result.data?.retryable) {
          throw new Error(result.error.message);
        }

        return {
          success: false,
          deliveryId: result.data?.deliveryId ?? null,
          error: result.error.code,
        };
      }

      return {
        success: true,
        deliveryId: result.data?.deliveryId ?? null,
      };
    },
    {
      connection: bullMqConnectionOptions,
      concurrency: 10,
    }
  );

  registerWorkerErrorHandler(worker, 'webhook-delivery');

  worker.on('completed', (job) => {
    console.log(`Webhook delivery job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Webhook delivery job failed: ${job?.id}`, err);
  });

  return worker;
}

/**
 * Onboarding Email Worker
 *
 * Processes delayed onboarding emails for activation and habit-building.
 */
export async function startOnboardingEmailWorker() {
  const worker = new Worker(
    'onboarding-email',
    async (job) => {
      const { onboardingEmailService } = await import('../services/onboarding-email.service.js');
      const result = await onboardingEmailService.sendOnboardingEmail(job.data);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    {
      connection: bullMqConnectionOptions,
      concurrency: 5,
    }
  );

  registerWorkerErrorHandler(worker, 'onboarding-email');

  worker.on('completed', (job) => {
    console.log(`Onboarding email job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Onboarding email job failed: ${job?.id}`, err);
  });

  return worker;
}

/**
 * Trial Expiration Worker
 *
 * Checks for and expires overdue trials daily.
 */
export async function startTrialExpirationWorker() {
  const worker = new Worker(
    'trial-expiration',
    async (job) => {
      const { expireTrials } = await import('../jobs/trial-expiration.js');
      const result = await expireTrials();
      console.log(`Trial expiration job completed: ${result.expired} expired`);
      return result;
    },
    {
      connection: bullMqConnectionOptions,
    }
  );

  registerWorkerErrorHandler(worker, 'trial-expiration');

  worker.on('completed', (job) => {
    console.log(`Trial expiration job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Trial expiration job failed: ${job?.id}`, err);
  });

  return worker;
}

export async function startGoogleNativeGrantWorker() {
  const worker = new Worker(
    'google-native-grant',
    async (job) => {
      if (job.name !== GOOGLE_NATIVE_GRANT_JOB) {
        return { success: false, error: 'UNKNOWN_JOB_TYPE' };
      }

      const { googleNativeAccessService } = await import('@/services/google-native-access.service');
      const result = await googleNativeAccessService.executeGoogleNativeGrant(job.data.grantId);

      if (result.error) {
        if ((result.error.details as { retryable?: boolean } | undefined)?.retryable) {
          throw new Error(result.error.message);
        }

        if (typeof job.discard === 'function') {
          job.discard();
        }

        throw new Error(result.error.message);
      }

      return result.data;
    },
    {
      connection: bullMqConnectionOptions,
      concurrency: 5,
    }
  );

  registerWorkerErrorHandler(worker, 'google-native-grant');

  worker.on('completed', (job) => {
    console.log(`Google native-grant job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Google native-grant job failed: ${job?.id}`, err);
  });

  return worker;
}

/**
 * Schedule recurring jobs
 */
export async function scheduleJobs() {
  await tokenRefreshQueue.add(
    TOKEN_REFRESH_SCAN_JOB,
    { type: 'check-expiring-tokens' },
    {
      repeat: {
        pattern: '0 */6 * * *', // Every 6 hours
        tz: 'UTC',
      },
    }
  );

  // Cleanup job - runs daily at 2 AM UTC
  const cleanupQueue = registerQueueErrorHandler(new Queue('cleanup', {
    connection: bullMqConnectionOptions,
  }), 'cleanup-scheduler');

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

  // Trial expiration check - runs daily at 3 AM UTC
  const trialExpQueue = registerQueueErrorHandler(new Queue('trial-expiration', {
    connection: bullMqConnectionOptions,
  }), 'trial-expiration-scheduler');

  await trialExpQueue.add(
    'check-expired-trials',
    { type: 'check-expired-trials' },
    {
      repeat: {
        pattern: '0 3 * * *', // Daily at 3 AM UTC
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
    TOKEN_REFRESH_JOB,
    { connectionId, platform },
    {
      jobId: `refresh-${connectionId}-${platform}`,
      priority: 1, // Higher priority for manual refreshes
    }
  );
}

/**
 * Add an outbound webhook delivery job to the queue.
 */
export async function queueWebhookDelivery(eventId: string) {
  await webhookDeliveryQueue.add(
    WEBHOOK_DELIVERY_JOB,
    { eventId },
    {
      attempts: env.WEBHOOK_MAX_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
      jobId: `webhook-${eventId}`,
    }
  );
}

export async function queueGoogleNativeGrantExecution(grantId: string) {
  await googleNativeGrantQueue.add(
    GOOGLE_NATIVE_GRANT_JOB,
    { grantId },
    {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
      jobId: `google-native-grant-${grantId}`,
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

  let queued = 0;

  for (const auth of expiringAuths) {
    const capability = getPlatformTokenCapability(auth.platform as Platform);

    if (capability.connectionMethod !== 'oauth' || capability.refreshStrategy !== 'automatic') {
      continue;
    }

    await queueTokenRefresh(auth.connectionId, auth.platform);
    queued += 1;
  }

  return { queued };
}
