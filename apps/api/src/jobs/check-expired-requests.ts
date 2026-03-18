/**
 * Expired Access Requests Job
 *
 * Runs daily to find AccessRequest records with status='pending' and expiresAt < now.
 * Transitions them to 'expired' and emits access_request.expired webhook events.
 */

import { prisma } from '@/lib/prisma';
import { emitAccessRequestLifecycleWebhook } from '@/services/access-request.service';

/**
 * Find and expire all overdue pending access requests.
 *
 * For each expired request:
 * 1. Transition status from 'pending' to 'expired'
 * 2. Emit access_request.expired webhook event to the agency's endpoint
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

  let expired = 0;

  for (const request of expiredRequests) {
    await prisma.accessRequest.update({
      where: { id: request.id },
      data: { status: 'expired' },
    });

    await emitAccessRequestLifecycleWebhook({
      accessRequestId: request.id,
      previousStatus: request.status,
      nextStatus: 'expired',
    });

    expired++;
  }

  return { expired };
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
