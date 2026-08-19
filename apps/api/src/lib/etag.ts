/**
 * ETag computation for conditional-request caching.
 */
import { createHash } from 'crypto';

/**
 * Compute an MD5 ETag digest for a JSON-serializable payload.
 */
export function computeEtag(payload: unknown): string {
  return createHash('md5').update(JSON.stringify(payload)).digest('hex');
}
