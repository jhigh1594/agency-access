/**
 * Queue Helper Functions
 *
 * Re-exports for backwards compatibility with services that used to import from lib/queue.ts
 * All functions now delegate to pg-boss.
 */

import type { AccessLevel } from '@agency-platform/shared';
import { enqueueJob, type JobOptions } from './pg-boss.js';

// Re-export job name constants for backwards compatibility
export const TOKEN_REFRESH_SCAN_JOB = 'token-refresh-scan';
export const TOKEN_REFRESH_JOB = 'token-refresh';
export const WEBHOOK_DELIVERY_JOB = 'webhook-delivery';
export const GOOGLE_NATIVE_GRANT_JOB = 'google-native-grant';

/**
 * Add a token refresh job to the queue
 */
export async function queueTokenRefresh(connectionId: string, platform: string): Promise<void> {
  await enqueueJob('token-refresh', {
    connectionId,
    platform,
  }, {
    singletonKey: `refresh-${connectionId}-${platform}`,
    priority: 1,
    retryLimit: 3,
    retryBackoff: true,
  });
}

/**
 * Add an outbound webhook delivery job to the queue.
 */
export async function queueWebhookDelivery(eventId: string): Promise<void> {
  const { env } = await import('./env.js');

  await enqueueJob('webhook-delivery', {
    eventId,
  }, {
    singletonKey: `webhook-${eventId}`,
    retryLimit: env.WEBHOOK_MAX_ATTEMPTS,
    retryDelay: 30,
    retryBackoff: true,
  });
}

/**
 * Add a Google native grant execution job to the queue.
 */
export async function queueGoogleNativeGrantExecution(grantId: string): Promise<void> {
  await enqueueJob('google-native-grant', {
    grantId,
  }, {
    singletonKey: `google-native-grant-${grantId}`,
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
  });
}

/**
 * Add a notification job to the queue.
 */
export async function queueNotification(data: {
  agencyId: string;
  accessRequestId: string;
  clientEmail: string;
  clientName?: string;
  platforms: string[];
  completedAt: string;
}): Promise<void> {
  await enqueueJob('notification', data, {
    singletonKey: `notification-${data.accessRequestId}`,
    retryLimit: 3,
    retryBackoff: true,
  });
}

/**
 * Add an authorization verification job to the queue.
 */
export async function queueAuthorizationVerification(
  verificationId: string,
  jobData: {
    accessRequestId: string;
    platform: string;
    clientEmail: string;
    requiredAccessLevel: AccessLevel;
    agencyConnectionId: string;
    agencyIdentity: {
      email?: string;
      businessId?: string;
    };
  }
): Promise<void> {
  await enqueueJob('authorization-verification', {
    verificationId,
    jobData,
  }, {
    singletonKey: `verification-${verificationId}`,
    retryLimit: 5,
    retryDelay: 60,
    retryBackoff: true,
  });
}
