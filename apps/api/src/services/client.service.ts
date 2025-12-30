/**
 * Client Service
 *
 * Business logic for client CRUD operations.
 * Part of Phase 5: Enhanced Access Request Creation.
 */

import { prisma } from '@/lib/prisma';
import type { Client } from '@prisma/client';
import type { ClientLanguage } from '@agency-platform/shared';

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
