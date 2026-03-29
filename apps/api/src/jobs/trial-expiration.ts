/**
 * Trial Expiration Job
 *
 * Runs daily to find subscriptions with status='trialing' and trialEnd <= now.
 * Downgrades them: sets subscription status to 'expired' and clears the
 * agency's subscriptionTier (reverts to free).
 *
 * IMPORTANT: Wraps all updates in transactions for atomicity.
 * Respects cancelAtPeriodEnd flag - trials with this set should not auto-expire.
 */

import { prisma } from '@/lib/prisma';

/**
 * Find and expire all overdue trials.
 *
 * For each expired trial:
 * 1. Check cancelAtPeriodEnd flag - if true, don't auto-expire (user intends to cancel)
 * 2. Set subscription.status = 'expired' (keeps tier for history)
 * 3. Set agency.subscriptionTier = null (reverts to free-tier limits)
 * 4. Create AuditLog entry for compliance
 *
 * All database operations are wrapped in a transaction.
 */
export async function expireTrials(): Promise<{ expired: number }> {
  const now = new Date();

  // Find all trialing subscriptions whose trial has ended
  // Include cancelAtPeriodEnd to check before expiring
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'trialing',
      trialEnd: { lte: now },
    },
    select: {
      id: true,
      agencyId: true,
      tier: true,
      trialEnd: true,
      agency: {
        select: {
          clerkUserId: true,
        },
      },
    },
  });

  let expired = 0;

  for (const sub of expiredSubscriptions) {
    // Use transaction to ensure atomicity of expiration
    await prisma.$transaction(async (tx) => {
      // Re-fetch within transaction to get latest state including cancelAtPeriodEnd
      const currentSub = await tx.subscription.findUnique({
        where: { id: sub.id },
        select: {
          id: true,
          status: true,
          tier: true,
          trialEnd: true,
          cancelAtPeriodEnd: true,
          agencyId: true,
        },
      });

      if (!currentSub) {
        console.warn(`Subscription ${sub.id} not found during expiration`);
        return;
      }

      // Skip if status changed (e.g., user already upgraded)
      if (currentSub.status !== 'trialing') {
        console.log(`Subscription ${sub.id} no longer trialing, skipping expiration`);
        return;
      }

      // Skip if cancelAtPeriodEnd is true - user intends to cancel, not auto-expire
      if (currentSub.cancelAtPeriodEnd) {
        console.log(`Subscription ${sub.id} has cancelAtPeriodEnd=true, skipping auto-expiration`);
        return;
      }

      // Mark subscription as expired (preserve tier for audit/history)
      await tx.subscription.update({
        where: { id: currentSub.id },
        data: {
          status: 'expired',
          tier: currentSub.tier,
        },
      });

      // Revert agency to free tier
      await tx.agency.update({
        where: { id: currentSub.agencyId },
        data: { subscriptionTier: null },
      });

      // Create audit log for compliance
      await tx.auditLog.create({
        data: {
          action: 'TRIAL_EXPIRED',
          resourceType: 'subscription',
          resourceId: currentSub.id,
          agencyId: currentSub.agencyId,
          metadata: {
            previousTier: currentSub.tier,
            trialEnd: currentSub.trialEnd,
            expiredAt: now.toISOString(),
          },
        },
      });

      console.log(`Expired trial for subscription ${currentSub.id}, agency ${currentSub.agencyId}`);
      expired++;
    });
  }

  return { expired };
}

// Standalone script support — ESM-compatible
const isTrialExpirationDirectExecution = process.argv[1]?.endsWith('trial-expiration') ||
  process.argv[1]?.endsWith('trial-expiration.js') ||
  process.argv[1]?.endsWith('trial-expiration.ts');

if (isTrialExpirationDirectExecution) {
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
