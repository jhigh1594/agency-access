/**
 * Expired Access Requests Job
 *
 * Runs daily to find AccessRequest records with status='pending' and expiresAt < now.
 * Transitions them to 'expired' and emits access_request.expired webhook events.
 */

import { prisma } from '@/lib/prisma';
import { emitAccessRequestLifecycleWebhook } from '@/services/access-request.service';

/** Cap on concurrent webhook emissions so a large backlog stays bounded. */
const WEBHOOK_CONCURRENCY = 10;

/**
 * Find and expire all overdue pending access requests.
 *
 * 1. Transition every overdue request from 'pending' to 'expired' in one
 *    bulk update (instead of one UPDATE per request).
 * 2. Emit access_request.expired webhook events with bounded concurrency.
 */
export async function checkExpiredRequests(): Promise<{ expired: number }> {
  const now = new Date();

  const expiredRequests = await prisma.accessRequest.findMany({
    where: {
      status: 'pending',
      expiresAt: { lte: now },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (expiredRequests.length === 0) {
    return { expired: 0 };
  }

  await prisma.accessRequest.updateMany({
    where: {
      id: { in: expiredRequests.map((request) => request.id) },
      status: 'pending',
    },
    data: { status: 'expired' },
  });

  for (let i = 0; i < expiredRequests.length; i += WEBHOOK_CONCURRENCY) {
    await Promise.all(
      expiredRequests.slice(i, i + WEBHOOK_CONCURRENCY).map((request) =>
        emitAccessRequestLifecycleWebhook({
          accessRequestId: request.id,
          previousStatus: request.status,
          nextStatus: 'expired',
        })
      )
    );
  }

  return { expired: expiredRequests.length };
}

// Standalone script support (ESM-compatible)
const isDirectExecution = process.argv[1]?.endsWith('check-expired-requests') ||
  process.argv[1]?.endsWith('check-expired-requests.js') ||
  process.argv[1]?.endsWith('check-expired-requests.ts');

if (isDirectExecution) {
  checkExpiredRequests()
    .then((result) => {
      console.log(`Expired requests check complete: ${result.expired} requests expired`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Expired requests check failed:', error);
      process.exit(1);
    });
}
