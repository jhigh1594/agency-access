/**
 * Token Refresh Job Processor
 *
 * BullMQ job for processing scheduled token refresh checks.
 * Finds tokens expiring within 7 days and queues individual refresh jobs.
 */

import { Worker, Job } from 'bullmq';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { connectionService } from '../services/connection.service.js';
import { auditService } from '../services/audit.service.js';
import { infisical } from '../lib/infisical.js';
import { getConnector } from '../services/connectors/factory.js';
import type { Platform } from '@agency-platform/shared';

const connectionOptions = {
  host: env.REDIS_HOST || 'localhost',
  port: env.REDIS_PORT || 6379,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

interface RefreshJobData {
  connectionId: string;
  platform: Platform;
}

/**
 * Token Refresh Worker
 *
 * Processes individual token refresh jobs:
 * 1. Retrieves authorization record from database
 * 2. Gets refresh token from Infisical
 * 3. Calls platform connector to refresh
 * 4. Updates Infisical with new token
 * 5. Updates database with new expiration
 * 6. Logs to audit trail
 */
export const tokenRefreshWorker = new Worker<RefreshJobData>(
  'token-refresh',
  async (job: Job<RefreshJobData>) => {
    const { connectionId, platform } = job.data;

    console.log(`Processing token refresh for ${connectionId}/${platform}`);

    try {
      // Get authorization record
      const auth = await prisma.platformAuthorization.findFirst({
        where: { connectionId, platform },
        include: { connection: true },
      });

      if (!auth) {
        console.error(`Authorization not found: ${connectionId}/${platform}`);
        throw new Error('Authorization not found');
      }

      if (auth.status !== 'active') {
        console.log(`Skipping inactive authorization: ${connectionId}/${platform}`);
        return { success: false, reason: 'INACTIVE' };
      }

      // Retrieve tokens from Infisical
      const tokens = await infisical.retrieveOAuthTokens(auth.secretId);

      if (!tokens || !tokens.refreshToken) {
        console.error(`No refresh token available for ${auth.secretId}`);
        await auditService.createAuditLog({
          resourceId: connectionId,
          resourceType: 'connection',
          action: 'REFRESH_FAILED',
          details: {
            platform,
            reason: 'NO_REFRESH_TOKEN'
          },
        });
        throw new Error('No refresh token available');
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
        return { success: false, reason: 'NOT_SUPPORTED' };
      }

      // Call connector to refresh token
      const newTokens = await connector.refreshToken(tokens.refreshToken);

      // Update Infisical with new tokens
      await infisical.updateOAuthTokens(auth.secretId, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken || tokens.refreshToken,
        expiresAt: newTokens.expiresAt,
      });

      // Update database with new expiration
      await prisma.platformAuthorization.update({
        where: { id: auth.id },
        data: {
          expiresAt: newTokens.expiresAt,
          status: 'active',
        },
      });

      console.log(`Token refreshed successfully for ${connectionId}/${platform}`);

      // Log successful refresh to audit trail
      await auditService.createAuditLog({
        resourceId: connectionId,
        resourceType: 'connection',
        action: 'TOKEN_REFRESHED',
        details: {
          platform,
          jobId: job.id,
          manual: job.opts.priority !== undefined,
          newExpiresAt: newTokens.expiresAt.toISOString(),
        },
      });

      return {
        success: true,
        connectionId,
        platform,
        message: 'Token refresh processed',
      };
    } catch (error) {
      console.error(`Token refresh failed for ${connectionId}/${platform}:`, error);

      // Log failure
      await auditService.createAuditLog({
        resourceId: connectionId,
        resourceType: 'connection',
        action: 'TOKEN_REFRESH_FAILED',
        details: {
          platform,
          error: String(error),
          jobId: job.id,
        },
      });

      throw error; // Trigger retry
    }
  },
  {
    connection: connectionOptions,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs per interval
      duration: 1000, // Per second
    },
  }
);

// Worker events
tokenRefreshWorker.on('completed', (job) => {
  console.log(`✓ Token refresh job completed: ${job.id}`);
});

tokenRefreshWorker.on('failed', (job, err) => {
  console.error(`✗ Token refresh job failed: ${job?.id}`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await tokenRefreshWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await tokenRefreshWorker.close();
  process.exit(0);
});

export default tokenRefreshWorker;
