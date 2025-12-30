/**
 * Platform Data Transformation Utilities
 *
 * Phase 5: Converts hierarchical platform selection from HierarchicalPlatformSelector
 * to the flat API format expected by the backend.
 */

import { AccessLevel } from '@agency-platform/shared';

// ============================================================
// TYPES
// ============================================================

export interface PlatformProductConfig {
  product: string;
  accessLevel: AccessLevel;
  accounts: string[]; // Account IDs (empty for client_authorization flow)
}

export interface PlatformGroupConfig {
  platformGroup: string;
  products: PlatformProductConfig[];
}

// ============================================================
// TRANSFORMATION
// ============================================================

/**
 * Transforms hierarchical platform selection to API format
 *
 * @param selection - Record of platform groups to product IDs
 *                    Example: { google: ['google_ads', 'ga4'], meta: ['meta_ads'] }
 * @param globalAccessLevel - Access level to apply to all products
 * @returns Array of platform group configurations for API
 *
 * @example
 * transformPlatformsForAPI(
 *   { google: ['google_ads', 'ga4'], meta: ['meta_ads'] },
 *   'admin'
 * )
 * // Returns:
 * [
 *   {
 *     platformGroup: 'google',
 *     products: [
 *       { product: 'google_ads', accessLevel: 'admin', accounts: [] },
 *       { product: 'ga4', accessLevel: 'admin', accounts: [] }
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
  globalAccessLevel: AccessLevel
): PlatformGroupConfig[] {
  return Object.entries(selection)
    .filter(([_, productIds]) => productIds.length > 0) // Filter out empty groups
    .map(([platformGroup, productIds]) => ({
      platformGroup,
      products: productIds.map((productId) => ({
        product: productId,
        accessLevel: globalAccessLevel,
        accounts: [], // Empty for client_authorization flow
      })),
    }));
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
 * Check if any platforms are selected
 */
export function hasPlatformsSelected(selection: Record<string, string[]>): boolean {
  return getPlatformCount(selection) > 0;
}

/**
 * Get list of all selected product IDs (flat array)
 */
export function getSelectedProductIds(selection: Record<string, string[]>): string[] {
  return Object.values(selection).flat();
}

/**
 * Get human-readable summary of selection
 * Example: "5 products across 2 platforms"
 */
export function getSelectionSummary(selection: Record<string, string[]>): string {
  const productCount = getPlatformCount(selection);
  const groupCount = getGroupCount(selection);

  if (productCount === 0) {
    return 'No platforms selected';
  }

  const productsText = productCount === 1 ? 'product' : 'products';
  const platformsText = groupCount === 1 ? 'platform' : 'platforms';

  return `${productCount} ${productsText} across ${groupCount} ${platformsText}`;
}
