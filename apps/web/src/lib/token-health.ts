/**
 * Token Health Utility
 *
 * Calculates the health status of OAuth tokens based on expiration dates.
 * Used throughout the application to determine if tokens need refreshing.
 */

export type TokenHealthStatus = 'healthy' | 'expiring' | 'expired' | 'unknown';

export interface TokenHealth {
  status: TokenHealthStatus;
  daysUntilExpiry: number;
}

/**
 * Calculate token health based on expiration date.
 *
 * @param expiresAt - The expiration date of the token (Date, ISO string, or null)
 * @returns TokenHealth object with status and days until expiry
 *
 * Status thresholds:
 * - unknown: No expiration date provided
 * - expired: Already past expiration
 * - expiring: Expires within 7 days
 * - healthy: More than 7 days until expiration
 */
export function getTokenHealth(expiresAt: Date | string | null): TokenHealth {
  if (!expiresAt) {
    return { status: 'unknown', daysUntilExpiry: 0 };
  }

  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return { status: 'expired', daysUntilExpiry };
  }

  if (daysUntilExpiry <= 7) {
    return { status: 'expiring', daysUntilExpiry };
  }

  return { status: 'healthy', daysUntilExpiry };
}

/**
 * Check if a token is expired.
 */
export function isTokenExpired(expiresAt: Date | string | null): boolean {
  return getTokenHealth(expiresAt).status === 'expired';
}

/**
 * Check if a token is expiring soon (within 7 days).
 */
export function isTokenExpiringSoon(expiresAt: Date | string | null): boolean {
  const health = getTokenHealth(expiresAt);
  return health.status === 'expiring' || health.status === 'expired';
}

/**
 * Format expiration date as a human-readable string.
 */
export function formatExpirationDate(expiresAt: Date | string | null): string {
  if (!expiresAt) return 'Unknown';

  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format days until expiry as a human-readable string.
 */
export function formatDaysUntilExpiry(days: number): string {
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days < 7) return `Expires in ${days} days`;
  return `${days} days remaining`;
}
