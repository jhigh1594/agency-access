/**
 * Connection Service
 *
 * Business logic for managing client connections and platform authorizations.
 * Works with Infisical for token storage - never stores tokens directly in database.
 */

import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { getConnector } from '@/services/connectors/factory';
import type { Platform } from '@agency-platform/shared';
import { z } from 'zod';

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
        platform: true,
        status: true,
        expiresAt: true,
        lastRefreshedAt: true,
      },
    });

    return { data: authorizations, error: null };
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
 * Refresh a platform authorization
 */
export async function refreshPlatformAuthorization(
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

    // Get current tokens
    const tokens = await infisical.retrieveOAuthTokens(authorization.secretId);

    if (!tokens || !tokens.refreshToken) {
      return {
        data: null,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token available for this platform',
        },
      };
    }

    // Get platform connector and refresh token
    const connector = getConnector(platform);

    if (!connector.refreshToken) {
      return {
        data: null,
        error: {
          code: 'NOT_SUPPORTED',
          message: `${platform} does not support token refresh via refresh_token`,
        },
      };
    }

    // Call connector to refresh token
    const newTokens = await connector.refreshToken(tokens.refreshToken);

    // Update Infisical with new tokens
    await infisical.updateOAuthTokens(authorization.secretId, {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken || tokens.refreshToken,
      expiresAt: newTokens.expiresAt,
    });

    // Update database with new expiration
    const updated = await prisma.platformAuthorization.update({
      where: { id: authorization.id },
      data: {
        expiresAt: newTokens.expiresAt,
        lastRefreshedAt: new Date(),
        status: 'active',
      },
    });

    return { data: updated, error: null };
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
  getAgencyConnections,
  refreshPlatformAuthorization,
  revokePlatformAuthorization,
};
