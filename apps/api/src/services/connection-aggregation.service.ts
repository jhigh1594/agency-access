/**
 * Connection Aggregation Service
 *
 * Provides aggregated statistics and summaries for connections and access requests.
 * Used by the dashboard and other summary views.
 */

import { prisma } from '../lib/prisma.js';
import type { AccessRequestStatus } from '@agency-platform/shared';

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  activeConnections: number;
  totalPlatforms: number;
}

/**
 * Get aggregated dashboard statistics for an agency.
 *
 * Optimized version using groupBy and raw SQL for better performance.
 * - Uses groupBy to get counts by status in a single query
 * - Uses raw SQL for distinct platform count (faster than findMany + distinct)
 */
export async function getDashboardStats(agencyId: string): Promise<{ data: DashboardStats | null; error: any }> {
  try {
    // Use groupBy for more efficient aggregation
    // This gets all request counts in a single query instead of multiple count() calls
    const [requestStats, connectionStats, platformCount] = await Promise.all([
      // Get all request counts by status in one query
      prisma.accessRequest.groupBy({
        by: ['status'],
        where: { agencyId },
        _count: true,
      }),
      // Get all connection counts by status in one query
      prisma.clientConnection.groupBy({
        by: ['status'],
        where: { agencyId },
        _count: true,
      }),
      // Use raw SQL for distinct platform count (more efficient than Prisma's distinct)
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT pa.platform) as count
        FROM platform_authorizations pa
        INNER JOIN client_connections cc ON pa.connection_id = cc.id
        WHERE cc.agency_id = ${agencyId}
          AND cc.status = 'active'
          AND pa.status = 'active'
      `,
    ]);

    // Transform groupBy results into stats
    const totalRequests = requestStats.reduce((sum, r) => sum + r._count, 0);
    const pendingRequests = requestStats.find((r) => r.status === 'pending')?._count || 0;
    const activeConnections = connectionStats.find((c) => c.status === 'active')?._count || 0;
    const totalPlatforms = Number(platformCount[0]?.count || 0);

    return {
      data: {
        totalRequests,
        pendingRequests,
        activeConnections,
        totalPlatforms,
      },
      error: null,
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve dashboard statistics',
      },
    };
  }
}

/**
 * Get a summary of client connections by status
 */
export async function getClientConnectionSummary(agencyId: string) {
  try {
    const connections = await prisma.clientConnection.groupBy({
      by: ['status'],
      where: { agencyId },
      _count: true,
    });

    return { data: connections, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve connection summary',
      },
    };
  }
}
