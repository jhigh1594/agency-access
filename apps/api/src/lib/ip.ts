/**
 * IP Address Extraction Utility
 *
 * Extracts client IP addresses from various headers to support:
 * - Cloudflare (cf-connecting-ip)
 * - Standard proxies (x-forwarded-for)
 * - Nginx (x-real-ip)
 * - Direct connections (request.ip)
 */

import type { FastifyRequest } from 'fastify';

/**
 * Extract the real client IP address from the request
 *
 * Priority:
 * 1. X-Forwarded-For (first IP - original client)
 * 2. CF-Connecting-IP (Cloudflare)
 * 3. X-Real-IP (Nginx)
 * 4. Request IP (direct connection)
 */
export function extractClientIp(request: FastifyRequest): string {
  // Check X-Forwarded-For header (standard proxy header)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // The first IP is the original client
    const firstIp = (forwardedFor as string).split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Check Cloudflare header
  const cfIp = request.headers['cf-connecting-ip'];
  if (cfIp) {
    return cfIp as string;
  }

  // Check Nginx X-Real-IP header
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return realIp as string;
  }

  // Fall back to direct connection IP
  return request.ip;
}

/**
 * Extract the user agent from the request
 */
export function extractUserAgent(request: FastifyRequest): string {
  return (request.headers['user-agent'] as string) || 'unknown';
}
