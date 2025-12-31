/**
 * Authorization Verification Job Processor
 *
 * BullMQ job for processing platform authorization verification.
 * Uses agency's OAuth token to verify client has granted access via platform API.
 */

import { Worker, Job } from 'bullmq';
import { env } from '../lib/env.js';
import { executeVerification } from '../services/authorization-verification.service.js';
import type { AccessLevel } from '@agency-platform/shared';

const connectionOptions = {
  host: env.REDIS_HOST || 'localhost',
  port: env.REDIS_PORT || 6379,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

interface VerificationJobData {
  verificationId: string;
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
  };
}

/**
 * Authorization Verification Worker
 *
 * Processes verification jobs:
 * 1. Retrieves verification record from database
 * 2. Gets agency's OAuth token from Infisical
 * 3. Calls platform API to verify access
 * 4. Updates verification record with results
 * 5. Updates access request status if all platforms verified
 */
export const authorizationVerificationWorker = new Worker<VerificationJobData>(
  'authorization-verification',
  async (job: Job<VerificationJobData>) => {
    const { verificationId, jobData } = job.data;

    console.log(`Processing verification for ${verificationId} (${jobData.platform})`);

    try {
      // Execute verification using the service
      await executeVerification(verificationId, jobData);

      return {
        success: true,
        verificationId,
        platform: jobData.platform,
        message: 'Verification completed',
      };
    } catch (error) {
      console.error(`Verification failed for ${verificationId}:`, error);

      // The executeVerification function handles error logging and status updates
      // We just need to log the job-level error here
      throw error; // Trigger retry
    }
  },
  {
    connection: connectionOptions,
    concurrency: 3, // Process up to 3 verifications concurrently (API rate limits)
    limiter: {
      max: 5, // Max 5 verification jobs per interval
      duration: 10000, // Per 10 seconds (respect API rate limits)
    },
  }
);

// Worker events
authorizationVerificationWorker.on('completed', (job) => {
  console.log(`✓ Authorization verification job completed: ${job.id}`);
});

authorizationVerificationWorker.on('failed', (job, err) => {
  console.error(`✗ Authorization verification job failed: ${job?.id}`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing verification worker...');
  await authorizationVerificationWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing verification worker...');
  await authorizationVerificationWorker.close();
  process.exit(0);
});

export default authorizationVerificationWorker;
