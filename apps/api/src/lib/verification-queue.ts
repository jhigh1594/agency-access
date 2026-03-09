/**
 * Authorization Verification Queue Setup
 *
 * BullMQ queue for processing platform authorization verification jobs.
 * These jobs use the agency's OAuth token to verify clients have granted access.
 */

import { Queue } from 'bullmq';
import type { AccessLevel } from '@agency-platform/shared';
import { bullMqConnectionOptions, registerQueueErrorHandler } from './bullmq.js';

/**
 * Authorization Verification Queue
 *
 * Jobs in this queue verify that clients have granted access to agencies
 * by calling platform APIs using the agency's OAuth token.
 */
export const authorizationVerificationQueue = registerQueueErrorHandler(new Queue(
  'authorization-verification',
  {
    connection: bullMqConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // 24 hours
      },
      removeOnFail: {
        count: 500, // Keep last 500 failed jobs
        age: 7 * 24 * 3600, // 7 days
      },
    },
  }
), 'authorization-verification');

/**
 * Queue a verification job
 *
 * @param verificationId - Verification record ID
 * @param jobData - Job data containing verification parameters
 */
export async function queueVerification(
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
) {
  await authorizationVerificationQueue.add(
    'verify-authorization',
    {
      verificationId,
      jobData,
    },
    {
      jobId: `verify-${verificationId}`, // Unique job ID to prevent duplicates
      priority: 5, // Medium priority
    }
  );
}
