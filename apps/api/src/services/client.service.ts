/**
 * Client Service
 *
 * Business logic for client CRUD operations.
 * Part of Phase 5: Enhanced Access Request Creation.
 */

import { prisma } from '@/lib/prisma';
import type { ClientLanguage } from '@agency-platform/shared';
import type { Prisma } from '@prisma/client';

type Client = Prisma.ClientGetPayload<{}>;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Error codes
export const ClientError = {
  EMAIL_EXISTS: 'CLIENT_EMAIL_EXISTS',
  INVALID_EMAIL: 'CLIENT_INVALID_EMAIL',
  NOT_FOUND: 'CLIENT_NOT_FOUND',
} as const;

// Input types
export interface CreateClientDto {
  agencyId: string;
  name: string;
  company: string;
  email: string;
  website?: string;
  language?: ClientLanguage;
}

export interface GetClientsDto {
  agencyId: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateClientDto {
  name?: string;
  company?: string;
  email?: string;
  website?: string;
  language?: ClientLanguage;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Create a new client
 * @throws {Error} CLIENT_EMAIL_EXISTS if email already exists for this agency
 * @throws {Error} CLIENT_INVALID_EMAIL if email format is invalid
 */
export async function createClient(dto: CreateClientDto): Promise<Client> {
  const { agencyId, email, language = 'en', ...rest } = dto;

  // Validate email format
  if (!EMAIL_REGEX.test(email)) {
    throw new Error(ClientError.INVALID_EMAIL);
  }

  // Check for duplicate email within the agency
  const existing = await prisma.client.findFirst({
    where: {
      agencyId,
      email,
    },
  });

  if (existing) {
    throw new Error(ClientError.EMAIL_EXISTS);
  }

  // Create client
  const client = await prisma.client.create({
    data: {
      ...rest,
      agencyId,
      email,
      language,
    },
  });

  return client;
}

/**
 * Get clients for an agency with optional search and pagination
 */
export async function getClients(
  dto: GetClientsDto
): Promise<PaginatedResult<Client>> {
  const { agencyId, search, limit = 50, offset = 0 } = dto;

  // Build where clause
  const where: any = { agencyId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get clients and total count in parallel
  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      limit,
      offset,
    },
  };
}

/**
 * Get a client by ID
 * @returns Client or null if not found
 */
export async function getClientById(
  id: string,
  agencyId: string
): Promise<Client | null> {
  return prisma.client.findUnique({
    where: { id },
  });
}

/**
 * Update a client
 * @throws {Error} CLIENT_EMAIL_EXISTS if new email already exists for another client
 * @returns Updated client or null if not found
 */
export async function updateClient(
  id: string,
  agencyId: string,
  dto: UpdateClientDto
): Promise<Client | null> {
  // Check if client exists
  const existing = await prisma.client.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  // If updating email, check for duplicates
  if (dto.email && dto.email !== existing.email) {
    // Validate email format
    if (!EMAIL_REGEX.test(dto.email)) {
      throw new Error(ClientError.INVALID_EMAIL);
    }

    const duplicate = await prisma.client.findFirst({
      where: {
        agencyId,
        email: dto.email,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new Error(ClientError.EMAIL_EXISTS);
    }
  }

  // Update client
  const updated = await prisma.client.update({
    where: { id },
    data: dto,
  });

  return updated;
}

/**
 * Find a client by email within an agency
 * @returns Client or null if not found
 */
export async function findClientByEmail(
  agencyId: string,
  email: string
): Promise<Client | null> {
  return prisma.client.findFirst({
    where: {
      agencyId,
      email,
    },
  });
}

/**
 * Delete a client
 * @returns true if deleted, false if not found
 */
export async function deleteClient(
  id: string,
  agencyId: string
): Promise<boolean> {
  // Check if client exists
  const existing = await prisma.client.findUnique({
    where: { id },
  });

  if (!existing) {
    return false;
  }

  // Delete client
  await prisma.client.delete({
    where: { id },
  });

  return true;
}

/**
 * Get clients with enriched connection and platform data
 */
export async function getClientsWithConnections(
  dto: GetClientsDto
): Promise<PaginatedResult<any>> {
  const { agencyId, search, limit = 50, offset = 0 } = dto;

  // Build where clause
  const where: any = { agencyId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get clients with only their latest access request (list view needs status/platforms from latest only)
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        accessRequests: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            connection: {
              include: {
                authorizations: { select: { platform: true } },
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  // Transform to enriched format (one request per client due to take: 1)
  const enrichedClients = clients.map((client) => {
    const requests = client.accessRequests || [];
    const latestRequest = requests[0];
    const connection = latestRequest?.connection;
    const authorizations = connection?.authorizations || [];

    // Determine status
    let status: 'active' | 'pending' | 'expired' | 'revoked' | 'none' = 'none';
    if (connection && connection.status === 'active') {
      status = 'active';
    } else if (latestRequest && latestRequest.status === 'pending') {
      status = 'pending';
    } else if (connection && connection.status === 'revoked') {
      status = 'revoked';
    } else if (latestRequest && latestRequest.status === 'expired') {
      status = 'expired';
    }

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company,
      platforms: authorizations.map((auth) => auth.platform),
      status,
      connectionCount: connection ? 1 : 0,
      lastActivityAt: latestRequest?.createdAt || client.createdAt,
      createdAt: client.createdAt,
    };
  });

  return {
    data: enrichedClients,
    pagination: {
      total,
      limit,
      offset,
    },
  };
}

// ============================================================
// CLIENT DETAIL PAGE TYPES
// ============================================================

export interface ClientDetailDto {
  clientId: string;
  agencyId: string;
}

export interface ClientDetailResponse {
  client: Client;
  stats: {
    totalRequests: number;
    activeConnections: number;
    pendingConnections: number;
    expiredConnections: number;
  };
  accessRequests: Array<{
    id: string;
    name: string;
    platforms: string[];
    status: string;
    createdAt: Date;
    authorizedAt?: Date | null;
    connectionId?: string | null;
    connectionStatus?: string | null;
  }>;
  activity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
}

/**
 * Get detailed client information including stats, access requests, and activity timeline
 * @returns Client detail response or null if client not found
 */
export async function getClientDetail(
  dto: ClientDetailDto
): Promise<ClientDetailResponse | null> {
  const { clientId, agencyId } = dto;

  // Fetch client with all related data
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      accessRequests: {
        include: {
          connection: {
            include: {
              authorizations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) {
    return null;
  }

  // Verify agency ownership
  if (client.agencyId !== agencyId) {
    return null;
  }

  // Parse platforms from each access request
  const accessRequestsWithPlatforms = client.accessRequests.map((request) => {
    // Parse platforms from JSON - handle both hierarchical and flat formats
    let platforms: string[] = [];
    const platformsData = request.platforms as any;

    if (platformsData) {
      if (typeof platformsData === 'object') {
        // Hierarchical format: { google: ['google_ads', 'ga4'], meta: ['meta_ads'] }
        for (const group in platformsData) {
          const groupPlatforms = platformsData[group];
          if (Array.isArray(groupPlatforms)) {
            platforms.push(...groupPlatforms);
          }
        }
      } else if (Array.isArray(platformsData)) {
        platforms = platformsData;
      }
    }

    const connection = request.connection;
    const connectionStatus = connection?.status || null;
    const authorizations = connection?.authorizations || [];

    // Override platforms with actual authorizations if connection exists
    if (authorizations.length > 0) {
      platforms = authorizations.map((auth) => auth.platform);
    }

    return {
      id: request.id,
      name: request.clientName,
      platforms,
      status: request.status,
      createdAt: request.createdAt,
      authorizedAt: request.authorizedAt,
      connectionId: connection?.id,
      connectionStatus,
    };
  });

  // Calculate stats
  const totalRequests = client.accessRequests.length;
  const activeConnections = client.accessRequests.filter(
    (r) => r.connection?.status === 'active'
  ).length;
  const pendingConnections = client.accessRequests.filter(
    (r) => r.status === 'pending' || r.status === 'partial'
  ).length;
  const expiredConnections = client.accessRequests.filter(
    (r) => r.status === 'expired' || r.connection?.status === 'expired'
  ).length;

  // Build activity timeline from request and connection events
  const activity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }> = [];

  for (const request of client.accessRequests) {
    // Request created
    activity.push({
      id: `request-${request.id}-created`,
      type: 'request_created',
      description: `Access request "${request.clientName}" was created`,
      timestamp: request.createdAt,
      metadata: {
        requestName: request.clientName,
        platforms: accessRequestsWithPlatforms.find((ar) => ar.id === request.id)?.platforms || [],
      },
    });

    // Connection created (when authorized)
    if (request.authorizedAt) {
      activity.push({
        id: `request-${request.id}-authorized`,
        type: 'request_completed',
        description: `Client authorized access for "${request.clientName}"`,
        timestamp: request.authorizedAt,
        metadata: {
          requestName: request.clientName,
          platforms: accessRequestsWithPlatforms.find((ar) => ar.id === request.id)?.platforms || [],
          status: request.status,
        },
      });
    }

    // Connection created
    if (request.connection) {
      activity.push({
        id: `connection-${request.connection.id}-created`,
        type: 'connection_created',
        description: `Connection established for "${request.clientName}"`,
        timestamp: request.connection.createdAt,
        metadata: {
          requestName: request.clientName,
          platforms: accessRequestsWithPlatforms.find((ar) => ar.id === request.id)?.platforms || [],
        },
      });
    }

    // Connection revoked
    if (request.connection?.revokedAt) {
      activity.push({
        id: `connection-${request.connection.id}-revoked`,
        type: 'connection_revoked',
        description: `Access revoked for "${request.clientName}"`,
        timestamp: request.connection.revokedAt,
        metadata: {
          requestName: request.clientName,
          platforms: accessRequestsWithPlatforms.find((ar) => ar.id === request.id)?.platforms || [],
          status: request.connection.status,
        },
      });
    }
  }

  // Client updated event
  if (client.updatedAt > client.createdAt) {
    activity.push({
      id: `client-${client.id}-updated`,
      type: 'client_updated',
      description: 'Client information was updated',
      timestamp: client.updatedAt,
    });
  }

  // Sort activity by timestamp descending (newest first)
  activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    client,
    stats: {
      totalRequests,
      activeConnections,
      pendingConnections,
      expiredConnections,
    },
    accessRequests: accessRequestsWithPlatforms,
    activity,
  };
}
