/**
 * Relative Time Formatter
 *
 * Utility for displaying human-readable relative timestamps.
 */

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format countdown to expiration
 */

export function formatCountdown(targetDate: Date): string {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMs < 0) return 'Expired';
  if (diffDays === 0) {
    if (diffHours < 1) return 'Less than 1 hour';
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }
  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
}
