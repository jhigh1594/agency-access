/**
 * Agency Resolution Service
 *
 * Centralized service for resolving and creating agencies.
 * Ensures consistent agency resolution across the application and prevents duplicates.
 * Includes caching layer for performance optimization.
 */

import { prisma } from '@/lib/prisma';
import { getCached, CacheKeys, CacheTTL } from '@/lib/cache.js';

export interface ResolveAgencyResult {
  data: {
    agencyId: string; // Always returns UUID
    agency: {
      id: string;
      clerkUserId: string | null;
      name: string;
      email: string;
    };
  } | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

/**
 * Resolve agency from Clerk user ID or agency UUID
 *
 * This is the SINGLE SOURCE OF TRUTH for agency resolution.
 * Always use this function instead of direct Prisma queries.
 *
 * @param identifier - Clerk user ID (user_xxx, org_xxx) or agency UUID
 * @param options - Optional configuration
 * @returns Resolved agency with UUID
 *
 * @example
 * const result = await resolveAgency('user_123');
 * if (result.error) {
 *   // Handle error
 * }
 * const { agencyId, agency } = result.data;
 */
export async function resolveAgency(
  identifier: string,
  options: {
    createIfMissing?: boolean;
    userEmail?: string;
    agencyName?: string;
  } = {}
): Promise<ResolveAgencyResult> {
  const { createIfMissing = false, userEmail, agencyName = 'My Agency' } = options;

  // Check if identifier is a Clerk ID
  const isClerkId = identifier.startsWith('user_') || identifier.startsWith('org_');

  // For Clerk ID lookups that don't need creation, try cache first
  if (isClerkId && !createIfMissing) {
    const cacheKey = CacheKeys.agencyByClerkId(identifier); // Cache by clerkUserId
    const cachedResult = await getCached<ResolveAgencyResult['data']>({
      key: cacheKey,
      ttl: CacheTTL.EXTENDED, // 30 minutes - agency data rarely changes
      fetch: async () => {
        const result = await resolveAgencyFromDb(identifier, { createIfMissing: false, userEmail, agencyName });
        return { data: result.data, error: result.error };
      },
    });

    if (cachedResult.data) {
      return { data: cachedResult.data, error: null };
    }
    // Fall through to DB if cache fails
  }

  // For UUID lookups or when creating, go directly to DB
  return resolveAgencyFromDb(identifier, options);
}

/**
 * Internal database resolution (not cached)
 * Separated to allow caching wrapper to handle cache logic
 */
async function resolveAgencyFromDb(
  identifier: string,
  options: {
    createIfMissing?: boolean;
    userEmail?: string;
    agencyName?: string;
  }
): Promise<ResolveAgencyResult> {
  const { createIfMissing = false, userEmail, agencyName = 'My Agency' } = options;

  try {
    // Check if identifier is a Clerk ID
    const isClerkId = identifier.startsWith('user_') || identifier.startsWith('org_');

    let agency = null;

    if (isClerkId) {
      // Look up by clerkUserId (this is the correct way)
      agency = await prisma.agency.findUnique({
        where: { clerkUserId: identifier },
      });

      // If not found and we should create, create with proper UUID
      if (!agency && createIfMissing) {
        // Check for duplicate email if provided
        if (userEmail) {
          const existingByEmail = await prisma.agency.findUnique({
            where: { email: userEmail },
          });

          if (existingByEmail) {
            // If existing agency has no clerkUserId, update it
            if (!existingByEmail.clerkUserId) {
              agency = await prisma.agency.update({
                where: { id: existingByEmail.id },
                data: { clerkUserId: identifier },
              });
            } else if (existingByEmail.clerkUserId !== identifier) {
              // Different clerkUserId - this is a conflict
              return {
                data: null,
                error: {
                  code: 'AGENCY_EMAIL_CONFLICT',
                  message: 'Email is already associated with a different agency',
                  details: {
                    existingAgencyId: existingByEmail.id,
                    existingClerkUserId: existingByEmail.clerkUserId,
                    requestedClerkUserId: identifier,
                  },
                },
              };
            } else {
              // Same clerkUserId, use existing
              agency = existingByEmail;
            }
          }
        }

        // Create new agency if still not found
        if (!agency) {
          agency = await prisma.agency.create({
            data: {
              name: agencyName,
              email: userEmail || `${identifier}@clerk.temp`,
              clerkUserId: identifier,
            },
          });
        }
      }
    } else {
      // Assume it's a UUID, look up by id
      agency = await prisma.agency.findUnique({
        where: { id: identifier },
      });

      // If not found and we should create, this is unusual but handle it
      if (!agency && createIfMissing) {
        agency = await prisma.agency.create({
          data: {
            id: identifier,
            name: agencyName,
            email: userEmail || `user@${identifier.slice(0, 8)}.agency`,
          },
        });
      }
    }

    if (!agency) {
      return {
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: `Agency not found for identifier: ${identifier}`,
        },
      };
    }

    // Always return the UUID, never the Clerk ID
    return {
      data: {
        agencyId: agency.id, // Always UUID
        agency: {
          id: agency.id,
          clerkUserId: agency.clerkUserId,
          name: agency.name,
          email: agency.email,
        },
      },
      error: null,
    };
  } catch (error: any) {
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return {
        data: null,
        error: {
          code: 'AGENCY_ALREADY_EXISTS',
          message: 'An agency with this identifier already exists',
          details: error.meta,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to resolve agency',
        details: error.message,
      },
    };
  }
}

/**
 * Get or create agency for a Clerk user
 *
 * Convenience function that always creates if missing.
 * Use this when you know the user should have an agency.
 */
export async function getOrCreateAgency(
  clerkUserId: string,
  options: {
    userEmail?: string;
    agencyName?: string;
  } = {}
): Promise<ResolveAgencyResult> {
  return resolveAgency(clerkUserId, {
    ...options,
    createIfMissing: true,
  });
}

/**
 * Agency Resolution Service
 * Exports all agency resolution functions
 */
export const agencyResolutionService = {
  resolveAgency,
  getOrCreateAgency,
  invalidateAgencyCache,
};

/**
 * Invalidate agency cache for a specific clerk user
 * Call this when agency data is updated
 */
export async function invalidateAgencyCache(clerkUserId: string): Promise<void> {
  const { invalidateCache } = await import('@/lib/cache.js');
  // Invalidate both cache key patterns
  await Promise.all([
    invalidateCache(`agency:clerk:${clerkUserId}`),
    invalidateCache(`agency:${clerkUserId}`),
  ]);
}

