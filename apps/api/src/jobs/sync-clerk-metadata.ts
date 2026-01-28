/**
 * Clerk Metadata Sync Job
 *
 * Background job that syncs usage counters from database to Clerk metadata.
 * Keeps Clerk metadata in sync with actual database usage.
 *
 * Usage:
 * - Schedule to run periodically (e.g., every hour)
 * - Fetches all agencies with clerkUserId
 * - Syncs their usage counters to Clerk private metadata
 */

import { prisma } from '@/lib/prisma';
import { clerkMetadataService } from '@/services/clerk-metadata.service';

/**
 * Sync all agency metadata to Clerk
 *
 * Fetches all agencies with clerkUserId and syncs their usage counters
 * to Clerk private metadata. Useful for keeping Clerk in sync with database.
 *
 * Limits to 100 agencies per run to avoid overwhelming Clerk API.
 *
 * @returns Object with success and failure counts
 */
export async function syncAllAgencyMetadata() {
  const agencies = await prisma.agency.findMany({
    where: { clerkUserId: { not: null } },
    select: { id: true, clerkUserId: true },
    take: 100, // Limit batch size
  });

  let success = 0;
  let failed = 0;

  for (const agency of agencies) {
    if (!agency.clerkUserId) continue;

    try {
      const result = await clerkMetadataService.syncQuotaUsage(agency.clerkUserId, agency.id);

      // Check if sync returned an error (Clerk service returns { data, error } objects)
      if (result.error) {
        console.error(`Failed to sync metadata for agency ${agency.id}:`, result.error.message);
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      console.error(`Failed to sync metadata for agency ${agency.id}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

// If running as a standalone script (for scheduled jobs)
if (require.main === module) {
  syncAllAgencyMetadata()
    .then((result) => {
      console.log(`Metadata sync complete: ${result.success} succeeded, ${result.failed} failed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Metadata sync failed:', error);
      process.exit(1);
    });
}
