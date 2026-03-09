/**
 * Connection Service
 *
 * Business logic for managing client connections and platform authorizations.
 * Works with Infisical for token storage - never stores tokens directly in database.
 */

import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { auditService } from '@/services/audit.service';
import { getConnector } from '@/services/connectors/factory';
import { refreshClientPlatformAuthorization } from '@/services/token-lifecycle.service';
import {
  getPlatformTokenCapability,
  type Platform,
  type DashboardConnectionSummary,
  type HealthStatus,
} from '@agency-platform/shared';
import { z } from 'zod';
import { invalidateCache } from '@/lib/cache.js';

function calculateHealthStatus(
  expiresAt: Date | null,
  platform: Platform,
  status?: string
): { health: HealthStatus; daysUntilExpiry: number } {
  if (status && status !== 'active') {
    return { health: 'expired', daysUntilExpiry: -1 };
  }

  const capability = getPlatformTokenCapability(platform);
  if (capability.expiryBehavior === 'non_expiring') {
    return { health: 'healthy', daysUntilExpiry: 0 };
  }

  if (!expiresAt) {
    return { health: 'unknown', daysUntilExpiry: 0 };
  }

  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return { health: 'expired', daysUntilExpiry };
  }

  if (daysUntilExpiry <= 7) {
    return { health: 'expiring', daysUntilExpiry };
  }

  return { health: 'healthy', daysUntilExpiry };
}

async function resolveTokenHealth(input: {
  authorizationId?: string;
  connectionId: string;
  platform: Platform;
  status: string;
  expiresAt: Date | null;
  secretId?: string;
  agencyId?: string;
  userEmail?: string;
}): Promise<{ health: HealthStatus; daysUntilExpiry: number }> {
  const fallback = calculateHealthStatus(input.expiresAt, input.platform, input.status);
  const capability = getPlatformTokenCapability(input.platform);

  if (
    !input.secretId
    || (capability.healthStrategy !== 'live_verify' && capability.healthStrategy !== 'api_key_verify')
  ) {
    return fallback;
  }

  try {
    const tokens = await infisical.retrieveOAuthTokens(input.secretId);
    if (!tokens?.accessToken) {
      return { health: 'expired', daysUntilExpiry: -1 };
    }

    await auditService.createAuditLog({
      agencyId: input.agencyId,
      userEmail: input.userEmail,
      resourceId: input.connectionId,
      resourceType: 'connection',
      action: 'TOKEN_HEALTH_CHECK',
      details: {
        platform: input.platform,
        authorizationId: input.authorizationId,
      },
    });

    const connector = getConnector(input.platform);
    const isValid = await connector.verifyToken(tokens.accessToken);

    if (!isValid) {
      return { health: 'expired', daysUntilExpiry: -1 };
    }

    return fallback;
  } catch (error) {
    if (fallback.health === 'expired') {
      return fallback;
    }

    return { health: 'unknown', daysUntilExpiry: fallback.daysUntilExpiry };
  }
}

/**
 * Create a new client connection with platform authorizations
 */
export async function createClientConnection(input: {
  requestId: string;
  platforms: Record<string, { accessToken: string; refreshToken?: string; expiresAt: Date }>;
}) {
  try {
    // Get the access request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!accessRequest) {
      return {
        data: null,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    // Create connection and platform authorizations in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the connection
      const connection = await tx.clientConnection.create({
        data: {
          accessRequestId: input.requestId,
          agencyId: accessRequest.agencyId,
          clientEmail: accessRequest.clientEmail,
          status: 'active',
        },
      });

      // Create platform authorizations
      for (const [platform, tokens] of Object.entries(input.platforms)) {
        const secretId = infisical.generateSecretName(platform as Platform, connection.id);

        // Store tokens in Infisical
        await infisical.storeOAuthTokens(secretId, tokens);

        // Create database record with only secretId
        await tx.platformAuthorization.create({
          data: {
            connectionId: connection.id,
            platform: platform as Platform,
            secretId,
            expiresAt: tokens.expiresAt,
            status: 'active',
          },
        });
      }

      return connection;
    });

    // Invalidate dashboard cache for this agency
    await invalidateCache(`dashboard:${accessRequest.agencyId}:*`);

    return { data: result, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create client connection',
      },
    };
  }
}

/**
 * Get a connection by ID
 */
export async function getConnection(connectionId: string) {
  try {
    const connection = await prisma.clientConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return {
        data: null,
        error: {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found',
        },
      };
    }

    return { data: connection, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve connection',
      },
    };
  }
}

/**
 * Get all platform authorizations for a connection
 */
export async function getConnectionAuthorizations(connectionId: string) {
  try {
    const authorizations = await prisma.platformAuthorization.findMany({
      where: { connectionId },
      orderBy: { createdAt: 'asc' },
    });

    return { data: authorizations, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve authorizations',
      },
    };
  }
}

/**
 * Get platform tokens from Infisical for a specific platform authorization
 */
export async function getPlatformTokens(connectionId: string, platform: Platform) {
  try {
    // Find the platform authorization
    const authorization = await prisma.platformAuthorization.findFirst({
      where: {
        connectionId,
        platform,
      },
    });

    if (!authorization) {
      return {
        data: null,
        error: {
          code: 'AUTHORIZATION_NOT_FOUND',
          message: 'Platform authorization not found',
        },
      };
    }

    // Retrieve tokens from Infisical
    const tokens = await infisical.retrieveOAuthTokens(authorization.secretId);

    if (!tokens) {
      return {
        data: null,
        error: {
          code: 'TOKENS_NOT_FOUND',
          message: 'Tokens not found in secure storage',
        },
      };
    }

    return { data: tokens, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve platform tokens',
      },
    };
  }
}

/**
 * Update platform tokens in Infisical and database
 */
export async function updatePlatformTokens(
  connectionId: string,
  platform: Platform,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  }
) {
  try {
    // Find the platform authorization
    const authorization = await prisma.platformAuthorization.findFirst({
      where: {
        connectionId,
        platform,
      },
    });

    if (!authorization) {
      return {
        data: null,
        error: {
          code: 'AUTHORIZATION_NOT_FOUND',
          message: 'Platform authorization not found',
        },
      };
    }

    // Update tokens in Infisical
    await infisical.updateOAuthTokens(authorization.secretId, tokens);

    // Update expiry in database
    const updated = await prisma.platformAuthorization.update({
      where: { id: authorization.id },
      data: { expiresAt: tokens.expiresAt },
    });

    return { data: updated, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update platform tokens',
      },
    };
  }
}

/**
 * Revoke a connection and delete all tokens from Infisical
 */
export async function revokeConnection(connectionId: string) {
  try {
    // Get connection with authorizations
    const connection = await prisma.clientConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return {
        data: null,
        error: {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found',
        },
      };
    }

    // Get all platform authorizations
    const authorizations = await prisma.platformAuthorization.findMany({
      where: { connectionId },
    });

    // Delete all tokens from Infisical
    for (const auth of authorizations) {
      if (auth.platform === 'tiktok' || auth.platform === 'tiktok_ads') {
        await auditService.createAuditLog({
          agencyId: connection.agencyId,
          userEmail: connection.clientEmail,
          action: 'TIKTOK_TOKEN_REVOKED',
          resourceType: 'client_connection',
          resourceId: connectionId,
          metadata: {
            platform: auth.platform,
            reason: 'connection_revoked',
          },
        });
      }
      await infisical.deleteSecret(auth.secretId);
    }

    // Update connection status
    await prisma.clientConnection.update({
      where: { id: connectionId },
      data: { status: 'revoked' },
    });

    // Update all authorizations to revoked
    await prisma.platformAuthorization.updateMany({
      where: { connectionId },
      data: { status: 'revoked' },
    });

    return { data: connection, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revoke connection',
      },
    };
  }
}

/**
 * Get token health for a connection
 */
export async function getTokenHealth(connectionId: string) {
  try {
    const authorizations = await prisma.platformAuthorization.findMany({
      where: { connectionId },
      select: {
        id: true,
        connectionId: true,
        platform: true,
        status: true,
        expiresAt: true,
        lastRefreshedAt: true,
        secretId: true,
      },
    });

    const healthRows = await Promise.all(authorizations.map(async (authorization) => ({
      ...authorization,
      ...(await resolveTokenHealth({
        authorizationId: authorization.id,
        connectionId: authorization.connectionId,
        platform: authorization.platform as Platform,
        status: authorization.status,
        expiresAt: authorization.expiresAt,
        secretId: authorization.secretId,
      })),
    })));

    return {
      data: healthRows,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get token health',
      },
    };
  }
}

/**
 * Get token health for all client authorizations in an agency
 */
export async function getAgencyTokenHealth(agencyId: string) {
  try {
    const authorizations = await prisma.platformAuthorization.findMany({
      where: {
        connection: {
          agencyId,
          status: 'active',
        },
      },
      select: {
        id: true,
        connectionId: true,
        platform: true,
        status: true,
        expiresAt: true,
        lastRefreshedAt: true,
        secretId: true,
        connection: {
          select: {
            agencyId: true,
            clientEmail: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    const healthRows = await Promise.all(authorizations.map(async (authorization) => {
      const capability = getPlatformTokenCapability(authorization.platform as Platform);

      return {
        id: authorization.id,
        connectionId: authorization.connectionId,
        clientName: authorization.connection.clientEmail,
        platform: authorization.platform,
        status: authorization.status,
        expiresAt: authorization.expiresAt,
        lastRefreshedAt: authorization.lastRefreshedAt,
        canRefresh: capability.connectionMethod === 'oauth'
          && capability.refreshStrategy === 'automatic',
        ...(await resolveTokenHealth({
          authorizationId: authorization.id,
          connectionId: authorization.connectionId,
          platform: authorization.platform as Platform,
          status: authorization.status,
          expiresAt: authorization.expiresAt,
          secretId: authorization.secretId,
          agencyId: authorization.connection.agencyId,
          userEmail: authorization.connection.clientEmail,
        })),
      };
    }));

    return {
      data: healthRows,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get agency token health',
      },
    };
  }
}

/**
 * Get all connections for an agency
 */
export async function getAgencyConnections(agencyId: string) {
  try {
    const connections = await prisma.clientConnection.findMany({
      where: { agencyId },
      include: {
        authorizations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: connections, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get agency connections',
      },
    };
  }
}

/**
 * Get lightweight connection summaries for dashboard
 * Returns only essential data (platform badges) without full authorization details
 * This reduces payload size significantly for agencies with many connections
 */
export async function getAgencyConnectionSummaries(agencyId: string) {
  try {
    const connections = await prisma.clientConnection.findMany({
      where: { agencyId },
      select: {
        id: true,
        clientEmail: true,
        status: true,
        createdAt: true,
        // Only select platform from authorizations, not full details
        authorizations: {
          select: {
            platform: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: connections, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get agency connection summaries',
      },
    };
  }
}

/**
 * Get lightweight dashboard connection summaries.
 * Includes only active connections and active platform authorizations.
 */
export async function getDashboardConnectionSummaries(
  agencyId: string,
  limit: number,
  options: { includeTotal?: boolean } = {}
): Promise<{ data: { items: DashboardConnectionSummary[]; total: number } | null; error: any }> {
  try {
    const includeTotal = options.includeTotal ?? true;
    const where = {
      agencyId,
      status: 'active',
    };

    const connectionsPromise = prisma.clientConnection.findMany({
      where,
      select: {
        id: true,
        clientEmail: true,
        status: true,
        createdAt: true,
        authorizations: {
          where: {
            status: 'active',
          },
          select: {
            platform: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const totalPromise = includeTotal
      ? prisma.clientConnection.count({
          where,
        })
      : Promise.resolve<number | null>(null);
    const [connections, total] = await Promise.all([connectionsPromise, totalPromise]);

    const items: DashboardConnectionSummary[] = connections.map((connection) => ({
      id: connection.id,
      clientEmail: connection.clientEmail,
      status: connection.status,
      createdAt: connection.createdAt.toISOString(),
      platforms: Array.from(new Set(connection.authorizations.map((auth) => auth.platform))),
    }));

    return {
      data: {
        items,
        total: total ?? items.length,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get dashboard connection summaries',
      },
    };
  }
}

/**
 * Refresh a platform authorization
 */
export async function refreshPlatformAuthorization(
  connectionId: string,
  platform: Platform
) {
  try {
    const refreshResult = await refreshClientPlatformAuthorization(connectionId, platform);

    if (refreshResult.error) {
      return {
        data: null,
        error: refreshResult.error,
      };
    }

    const authorization = await prisma.platformAuthorization.findFirst({
      where: { connectionId, platform },
    });

    if (!authorization) {
      return {
        data: null,
        error: {
          code: 'AUTHORIZATION_NOT_FOUND',
          message: 'Platform authorization not found',
        },
      };
    }

    return { data: authorization, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh platform authorization',
      },
    };
  }
}

/**
 * Revoke a specific platform authorization
 */
export async function revokePlatformAuthorization(
  connectionId: string,
  platform: Platform
) {
  try {
    const authorization = await prisma.platformAuthorization.findFirst({
      where: { connectionId, platform },
    });

    if (!authorization) {
      return {
        data: null,
        error: {
          code: 'AUTHORIZATION_NOT_FOUND',
          message: 'Platform authorization not found',
        },
      };
    }

    // Delete tokens from Infisical
    await infisical.deleteOAuthTokens(authorization.secretId);

    if (platform === 'tiktok' || platform === 'tiktok_ads') {
      const connection = await prisma.clientConnection.findUnique({
        where: { id: connectionId },
        select: {
          agencyId: true,
          clientEmail: true,
        },
      });

      await auditService.createAuditLog({
        agencyId: connection?.agencyId,
        userEmail: connection?.clientEmail,
        action: 'TIKTOK_TOKEN_REVOKED',
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          platform,
          reason: 'platform_authorization_revoked',
        },
      });
    }

    // Update authorization status
    const updated = await prisma.platformAuthorization.update({
      where: { id: authorization.id },
      data: { status: 'revoked' },
    });

    return { data: updated, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revoke platform authorization',
      },
    };
  }
}

/**
 * Connection Service
 * Exports all connection-related service functions as a single object
 */
export const connectionService = {
  createClientConnection,
  getConnection,
  getConnectionAuthorizations,
  getPlatformTokens,
  updatePlatformTokens,
  revokeConnection,
  getTokenHealth,
  getAgencyTokenHealth,
  getAgencyConnections,
  getAgencyConnectionSummaries,
  getDashboardConnectionSummaries,
  refreshPlatformAuthorization,
  revokePlatformAuthorization,
};
