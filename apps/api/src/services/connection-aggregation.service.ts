/**
 * Connection Aggregation Service
 *
 * Provides aggregated statistics and summaries for connections and access requests.
 * Used by the dashboard and other summary views.
 */

import { prisma } from '../lib/prisma';
import type { AccessRequestStatus } from '@agency-platform/shared';

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  activeConnections: number;
  totalPlatforms: number;
}

/**
 * Get aggregated dashboard statistics for an agency
 */
export async function getDashboardStats(agencyId: string): Promise<{ data: DashboardStats | null; error: any }> {
  try {
    const [
      totalRequests,
      pendingRequests,
      activeConnections,
      platformAuths,
    ] = await Promise.all([
      // Total access requests
      prisma.accessRequest.count({
        where: { agencyId },
      }),
      // Pending access requests
      prisma.accessRequest.count({
        where: {
          agencyId,
          status: 'pending',
        },
      }),
      // Active client connections
      prisma.clientConnection.count({
        where: {
          agencyId,
          status: 'active',
        },
      }),
      // Unique platforms across all active authorizations
      prisma.platformAuthorization.findMany({
        where: {
          connection: {
            agencyId,
            status: 'active',
          },
          status: 'active',
        },
        select: {
          platform: true,
        },
        distinct: ['platform'],
      }),
    ]);

    return {
      data: {
        totalRequests,
        pendingRequests,
        activeConnections,
        totalPlatforms: platformAuths.length,
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

