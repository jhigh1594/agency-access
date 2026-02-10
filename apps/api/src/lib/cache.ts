/**
 * Cache Layer
 *
 * Server-side caching utilities using Redis for performance optimization.
 * Provides a generic cache wrapper with stale-while-revalidate pattern.
 *
 * Cache keys follow the pattern: `resource:id:subkey`
 * TTL (Time-To-Live) is in seconds
 */

import { redis } from './redis.js';

/**
 * Cache options for getCached function
 */
export interface CacheOptions<T> {
  key: string;
  ttl?: number; // Time to live in seconds (default: 5 minutes)
  fetch: () => Promise<{ data: T | null; error: any }>;
}

/**
 * Cached result with metadata
 */
export interface CachedResult<T> {
  data: T | null;
  cached: boolean; // true if data came from cache, false if fetched fresh
  error: any;
}

/**
 * Generic cache wrapper with automatic TTL and error handling
 *
 * Usage:
 * ```ts
 * const result = await getCached({
 *   key: 'dashboard:agency-123',
 *   ttl: 300, // 5 minutes
 *   fetch: async () => {
 *     // Your data fetching logic here
 *     return { data: someData, error: null };
 *   }
 * });
 * ```
 */
export async function getCached<T>({ key, ttl = 300, fetch }: CacheOptions<T>): Promise<CachedResult<T>> {
  // Try cache first
  try {
    const cached = await redis.get(key);
    if (cached) {
      return { data: JSON.parse(cached) as T, cached: true, error: null };
    }
  } catch (error) {
    // Cache read failed - continue to fetch from database
    // This prevents cache failures from breaking the app
    if ((error as any).code !== 'ECONNREFUSED') {
      console.warn(`Cache read failed for key "${key}":`, error);
    }
  }

  // Cache miss - fetch from database/source
  const result = await fetch();

  // Store in cache if successful and data exists
  if (result.data && !result.error) {
    try {
      await redis.set(key, JSON.stringify(result.data), 'EX', ttl);
    } catch (error) {
      // Cache write failed - non-critical, continue with data
      if ((error as any).code !== 'ECONNREFUSED') {
        console.warn(`Cache write failed for key "${key}":`, error);
      }
    }
  }

  return { ...result, cached: false };
}

/**
 * Invalidate cache by key pattern
 *
 * Usage:
 * ```ts
 * await invalidateCache('dashboard:agency-123:*');
 * ```
 *
 * @param pattern - Redis key pattern to match (supports wildcards)
 * @returns Object with success status and number of keys deleted
 */
export async function invalidateCache(pattern: string): Promise<{ success: boolean; keysDeleted: number; error?: any }> {
  try {
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return { success: true, keysDeleted: keys.length };
  } catch (error) {
    console.error(`Cache invalidation failed for pattern "${pattern}":`, error);
    return {
      success: false,
      keysDeleted: 0,
      error,
    };
  }
}

/**
 * Delete a specific cache key
 *
 * @param key - Exact cache key to delete
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn(`Failed to delete cache key "${key}":`, error);
    return false;
  }
}

/**
 * Cache key generators
 *
 * Provides consistent cache key naming across the application.
 * Format: `resource:identifier:subkey`
 */
export const CacheKeys = {
  // Dashboard cache
  dashboard: (agencyId: string) => `dashboard:${agencyId}`,

  // Dashboard components
  stats: (agencyId: string) => `dashboard:${agencyId}:stats`,
  requests: (agencyId: string) => `dashboard:${agencyId}:requests`,
  connections: (agencyId: string) => `dashboard:${agencyId}:connections`,

  // Agency data
  agency: (agencyIdOrClerkId: string) => `agency:${agencyIdOrClerkId}`,
  agencyByClerkId: (clerkUserId: string) => `agency:clerk:${clerkUserId}`,
  agencyMembers: (agencyId: string) => `agency:${agencyId}:members`,

  // Access requests
  accessRequest: (requestId: string) => `access-request:${requestId}`,
  agencyAccessRequests: (agencyId: string) => `agency:${agencyId}:access-requests`,

  // Client connections
  clientConnection: (connectionId: string) => `connection:${connectionId}`,
  agencyConnections: (agencyId: string) => `agency:${agencyId}:connections`,

  // Platform authorizations
  platformAuth: (connectionId: string, platform: string) => `auth:${connectionId}:${platform}`,

  // OAuth tokens (not cached - in Infisical)
  // Token cache keys are managed by the token refresh system
};

/**
 * Cache TTL constants (in seconds)
 *
 * Predefined TTL values for different data types.
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute - rapidly changing data
  MEDIUM: 300, // 5 minutes - default for dashboard
  LONG: 600, // 10 minutes - relatively static data
  EXTENDED: 1800, // 30 minutes - rarely changing data
};

/**
 * Cache statistics (for monitoring)
 *
 * Track cache hit/miss ratios to optimize TTL values.
 */
export class CacheStats {
  private hits = 0;
  private misses = 0;
  private errors = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  recordError(): void {
    this.errors++;
  }

  getStats(): { hits: number; misses: number; errors: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }
}

// Global cache stats instance
export const cacheStats = new CacheStats();
