/**
 * Creem Product/Price Configuration
 *
 * Maps subscription tiers to Creem product IDs.
 * These are the actual product IDs from the Creem dashboard.
 *
 * Products:
 * - Starter: prod_79jS6KXv2wilYkPQQjmGVP
 * - Agency: prod_2cT8b4pPcNFq47h29DlNTz
 * - Pro: prod_12lDKXew8bJqbUmTGpLZbR
 */

import type { SubscriptionTier } from '@agency-platform/shared';

export const CREEM_PRODUCT_IDS: Record<SubscriptionTier, string> = {
  STARTER: 'prod_79jS6KXv2wilYkPQQjmGVP',
  AGENCY: 'prod_2cT8b4pPcNFq47h29DlNTz',
  PRO: 'prod_12lDKXew8bJqbUmTGpLZbR',
  ENTERPRISE: 'prod_2cT8b4pPcNFq47h29DlNTz',
};

/**
 * Get the Creem product ID for a given subscription tier
 */
export function getProductId(tier: SubscriptionTier): string {
  return CREEM_PRODUCT_IDS[tier];
}

/**
 * Get subscription tier from a Creem product ID
 */
export function getTierFromProductId(productId: string): SubscriptionTier {
  const entry = Object.entries(CREEM_PRODUCT_IDS).find(
    ([, id]) => id === productId
  );

  if (!entry) {
    throw new Error(`Unknown Creem product ID: ${productId}`);
  }

  return entry[0] as SubscriptionTier;
}
