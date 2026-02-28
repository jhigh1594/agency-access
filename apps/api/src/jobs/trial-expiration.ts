/**
 * Trial Expiration Job
 *
 * Runs daily to find subscriptions with status='trialing' and trialEnd <= now.
 * Downgrades them: sets subscription status to 'expired' and clears the
 * agency's subscriptionTier (reverts to free).
 */

import { prisma } from '@/lib/prisma';

/**
 * Find and expire all overdue trials.
 *
 * For each expired trial:
 * 1. Set subscription.status = 'expired' (keeps tier for history)
 * 2. Set agency.subscriptionTier = null (reverts to free-tier limits)
 */
export async function expireTrials(): Promise<{ expired: number }> {
  const now = new Date();

  // Find all trialing subscriptions whose trial has ended
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'trialing',
      trialEnd: { lte: now },
    },
    select: {
      id: true,
      agencyId: true,
      tier: true,
    },
  });

  let expired = 0;

  for (const sub of expiredSubscriptions) {
    // Mark subscription as expired (preserve tier for audit/history)
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'expired',
        tier: sub.tier,
      },
    });

    // Revert agency to free tier
    await prisma.agency.update({
      where: { id: sub.agencyId },
      data: { subscriptionTier: null },
    });

    expired++;
  }

  return { expired };
}

// Standalone script support
if (require.main === module) {
  expireTrials()
    .then((result) => {
      console.log(`Trial expiration complete: ${result.expired} subscriptions expired`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Trial expiration failed:', error);
      process.exit(1);
    });
}
