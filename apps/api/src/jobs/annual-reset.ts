/**
 * Annual Reset Job
 *
 * Background job that resets annual usage counters when the year rolls over.
 * Runs periodically to check and reset counters that have expired.
 *
 * Usage:
 * - Schedule to run daily (e.g., cron job at midnight)
 * - Finds all current_year counters with past resetAt dates
 * - Resets count to 0 and updates resetAt to next year
 */

import { prisma } from '@/lib/prisma';

/**
 * Check and reset annual usage counters
 *
 * Finds all counters with period='current_year' where resetAt <= now.
 * Resets count to 0 and updates resetAt to next year January 1st.
 *
 * @returns Object with reset count
 */
export async function checkAndResetAnnualCounters() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  // Find all annual counters that need resetting
  const counters = await prisma.agencyUsageCounter.findMany({
    where: {
      period: 'current_year',
      resetAt: { lte: now },
    },
    select: {
      agencyId: true,
      metricType: true,
      period: true,
    },
  });

  // Reset each counter (defensive: skip any non-current_year counters)
  let reset = 0;
  for (const counter of counters) {
    // Skip if somehow an all_time counter got through (defensive programming)
    if (counter.period !== 'current_year') continue;

    await prisma.agencyUsageCounter.update({
      where: {
        agencyId_metricType_period: {
          agencyId: counter.agencyId,
          metricType: counter.metricType,
          period: 'current_year',
        },
      },
      data: {
        count: 0,
        resetAt: new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0)), // Next year Jan 1st UTC
      },
    });
    reset++;
  }

  return { reset };
}

// If running as a standalone script (for scheduled jobs)
if (require.main === module) {
  checkAndResetAnnualCounters()
    .then((result) => {
      console.log(`Annual reset complete: ${result.reset} counters reset`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Annual reset failed:', error);
      process.exit(1);
    });
}
