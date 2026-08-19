/**
 * Platform Data Transformation Utilities
 *
 * Phase 5: Converts hierarchical platform selection from HierarchicalPlatformSelector
 * to the flat API format expected by the backend.
 */

import { AccessLevel } from '@agency-platform/shared';
import type {
  PlatformGroupConfig,
  PlatformProductConfig,
} from '@agency-platform/shared';

// ============================================================
// TYPES (re-exported from shared — single definition)
// ============================================================

export type { PlatformGroupConfig, PlatformProductConfig };

// ============================================================
// TRANSFORMATION
// ============================================================

/**
 * Transforms hierarchical platform selection to API format
 *
 * @param selection - Record of platform groups to product IDs
 *                    Example: { google: ['google_ads', 'ga4'], meta: ['meta_ads'] }
 * @param platformAccessLevels - Per-platform access level overrides (key: platform group)
 * @param globalAccessLevel - Default access level for platforms without explicit override
 * @returns Array of platform group configurations for API
 *
 * @example
 * transformPlatformsForAPI(
 *   { google: ['google_ads', 'ga4'], meta: ['meta_ads'] },
 *   { meta: 'admin' }, // Meta has explicit override
 *   'standard' // Google uses default
 * )
 * // Returns:
 * [
 *   {
 *     platformGroup: 'google',
 *     products: [
 *       { product: 'google_ads', accessLevel: 'standard', accounts: [] },
 *       { product: 'ga4', accessLevel: 'standard', accounts: [] }
 *     ]
 *   },
 *   {
 *     platformGroup: 'meta',
 *     products: [
 *       { product: 'meta_ads', accessLevel: 'admin', accounts: [] }
 *     ]
 *   }
 * ]
 */
export function transformPlatformsForAPI(
  selection: Record<string, string[]>,
  platformAccessLevels: Record<string, AccessLevel>,
  globalAccessLevel: AccessLevel = 'standard'
): PlatformGroupConfig[] {
  return Object.entries(selection)
    .filter(([_, productIds]) => productIds.length > 0) // Filter out empty groups
    .map(([platformGroup, productIds]) => {
      // Use platform-specific level if set, otherwise fall back to global
      const accessLevel = platformAccessLevels[platformGroup] ?? globalAccessLevel;
      return {
        platformGroup,
        products: productIds.map((productId) => ({
          product: productId,
          accessLevel,
          accounts: [], // Empty for client_authorization flow
        })),
      };
    });
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Calculate total number of selected products across all groups
 */
export function getPlatformCount(selection: Record<string, string[]>): number {
  return Object.values(selection).reduce((sum, products) => sum + products.length, 0);
}

/**
 * Calculate number of platform groups with at least one selected product
 */
export function getGroupCount(selection: Record<string, string[]>): number {
  return Object.entries(selection).filter(([_, products]) => products.length > 0).length;
}

/**
 * Normalize a connected platform id (product or group) to its platform group.
 *
 * Unlike the strict `platformGroupOf` in shared (hierarchy-only), this also
 * maps legacy product ids absent from PLATFORM_HIERARCHY (youtube_studio,
 * display_video_360, whatsapp_business) and unknown google_, meta_, linkedin,
 * tiktok, or snapchat prefixed ids to their group.
 */
export function normalizePlatformToGroup(platform: string): string {
  if (
    platform === 'ga4' ||
    platform === 'youtube_studio' ||
    platform === 'display_video_360' ||
    platform.startsWith('google_')
  ) {
    return 'google';
  }

  if (
    platform === 'instagram' ||
    platform === 'whatsapp_business' ||
    platform.startsWith('meta_')
  ) {
    return 'meta';
  }

  if (platform.startsWith('linkedin')) {
    return 'linkedin';
  }

  if (platform.startsWith('tiktok')) {
    return 'tiktok';
  }

  if (platform.startsWith('snapchat')) {
    return 'snapchat';
  }

  return platform;
}

