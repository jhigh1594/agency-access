/**
 * IP Address Extraction Utility
 *
 * Extracts client IP addresses from Fastify's trusted source.
 * Fastify applies trust proxy rules configured at server startup.
 */

import type { FastifyRequest } from 'fastify';

/**
 * Extract the real client IP address from the request
 *
 * IMPORTANT:
 * We do not read user-controlled forwarding headers directly here.
 * This prevents spoofing rate-limit and audit identities.
 */
export function extractClientIp(request: FastifyRequest): string {
  return request.ip || '0.0.0.0';
}

/**
 * Extract the user agent from the request
 */
export function extractUserAgent(request: FastifyRequest): string {
  return (request.headers['user-agent'] as string) || 'unknown';
}
