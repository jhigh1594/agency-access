/**
 * Audit Service
 *
 * Business logic for security audit logging.
 * All token access events must be logged for compliance.
 */

import { prisma } from '@/lib/prisma';
import type { Platform } from '@agency-platform/shared';

/**
 * Log token access event
 */
export async function logTokenAccess(input: {
  connectionId: string;
  platform: Platform;
  userEmail: string;
  ipAddress: string;
  details?: Record<string, any>;
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        resourceId: input.connectionId,
        resourceType: 'connection',
        action: 'ACCESSED',
        userEmail: input.userEmail,
        ipAddress: input.ipAddress,
        metadata: input.details || {},
      },
    });

    return { data: auditLog, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to log token access',
      },
    };
  }
}

/**
 * Log token grant event
 */
export async function logTokenGrant(input: {
  connectionId: string;
  platform: Platform;
  userEmail: string;
  ipAddress: string;
  details?: Record<string, any>;
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        resourceId: input.connectionId,
        resourceType: 'connection',
        action: 'GRANTED',
        userEmail: input.userEmail,
        ipAddress: input.ipAddress,
        metadata: input.details || {},
      },
    });

    return { data: auditLog, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to log token grant',
      },
    };
  }
}

/**
 * Log token revoke event
 */
export async function logTokenRevoke(input: {
  connectionId: string;
  platform: Platform;
  userEmail: string;
  ipAddress: string;
  details?: Record<string, any>;
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        resourceId: input.connectionId,
        resourceType: 'connection',
        action: 'REVOKED',
        userEmail: input.userEmail,
        ipAddress: input.ipAddress,
        metadata: input.details || {},
      },
    });

    return { data: auditLog, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to log token revoke',
      },
    };
  }
}

/**
 * Log token refresh event
 */
export async function logTokenRefresh(input: {
  connectionId: string;
  platform: Platform;
  userEmail: string;
  ipAddress: string;
  details?: Record<string, any>;
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        resourceId: input.connectionId,
        resourceType: 'connection',
        action: 'REFRESHED',
        userEmail: input.userEmail,
        ipAddress: input.ipAddress,
        metadata: input.details || {},
      },
    });

    return { data: auditLog, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to log token refresh',
      },
    };
  }
}

/**
 * Log failure event
 */
export async function logFailure(input: {
  connectionId: string;
  platform: Platform;
  details: {
    error: string;
    code?: string;
    statusCode?: number;
  };
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        resourceId: input.connectionId,
        resourceType: 'connection',
        action: 'FAILED',
        metadata: input.details,
      },
    });

    return { data: auditLog, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to log failure',
      },
    };
  }
}

/**
 * Get audit trail for a connection
 */
export async function getConnectionAuditTrail(
  connectionId: string,
  platform?: Platform,
  limit?: number
) {
  try {
    const where: any = {
      resourceId: connectionId,
      resourceType: 'connection',
    };

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { data: auditLogs, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve audit trail',
      },
    };
  }
}

/**
 * Create a general audit log entry
 * For flexible logging when specific methods don't fit
 */
export async function createAuditLog(input: {
  agencyId?: string;
  userEmail?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  agencyConnectionId?: string;
  platform?: Platform | string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        agencyId: input.agencyId,
        userEmail: input.userEmail,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        agencyConnectionId: input.agencyConnectionId,
        metadata: input.details || input.metadata || {},
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    return { data: auditLog, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create audit log',
      },
    };
  }
}

/**
 * Get security events for an agency
 */
export async function getSecurityEvents(agencyId: string, days: number) {
  try {
    // Get all connections for this agency
    const connections = await prisma.clientConnection.findMany({
      where: { agencyId },
      select: { id: true },
    });

    const connectionIds = connections.map((c: any) => c.id);

    // Calculate date threshold
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get security events (failures and revokes) for the time period
    const securityEvents = await prisma.auditLog.findMany({
      where: {
        resourceId: { in: connectionIds },
        resourceType: 'connection',
        action: { in: ['FAILED', 'REVOKED'] },
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: securityEvents, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve security events',
      },
    };
  }
}

/**
 * Audit Service
 * Exports all audit-related service functions as a single object
 */
export const auditService = {
  logTokenAccess,
  logTokenGrant,
  logTokenRevoke,
  logTokenRefresh,
  logFailure,
  createAuditLog,
  getConnectionAuditTrail,
  getSecurityEvents,
};
