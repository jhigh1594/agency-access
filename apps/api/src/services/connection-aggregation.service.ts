/**
 * Connection Aggregation Service
 *
 * Provides aggregated statistics and summaries for connections and access requests.
 * Used by the dashboard and other summary views.
 */

import { prisma } from '../lib/prisma.js';

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
    const rows = await prisma.$queryRaw<Array<{
      total_requests: number | bigint;
      pending_requests: number | bigint;
      active_connections: number | bigint;
      total_platforms: number | bigint;
    }>>`
      SELECT
        (SELECT COUNT(*)::int FROM access_requests ar WHERE ar.agency_id = ${agencyId}) AS total_requests,
        (
          SELECT COUNT(*)::int
          FROM access_requests ar
          WHERE ar.agency_id = ${agencyId}
            AND ar.status = 'pending'
        ) AS pending_requests,
        (
          SELECT COUNT(*)::int
          FROM client_connections cc
          WHERE cc.agency_id = ${agencyId}
            AND cc.status = 'active'
        ) AS active_connections,
        (
          SELECT COUNT(DISTINCT pa.platform)::int
          FROM platform_authorizations pa
          INNER JOIN client_connections cc ON pa.connection_id = cc.id
          WHERE cc.agency_id = ${agencyId}
            AND cc.status = 'active'
            AND pa.status = 'active'
        ) AS total_platforms
    `;
    const row = rows[0];

    if (!row) {
      throw new Error('Dashboard stats query returned no rows');
    }

    return {
      data: {
        totalRequests: Number(row.total_requests ?? 0),
        pendingRequests: Number(row.pending_requests ?? 0),
        activeConnections: Number(row.active_connections ?? 0),
        totalPlatforms: Number(row.total_platforms ?? 0),
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
