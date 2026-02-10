/**
 * Authentication Middleware
 *
 * Provides JWT verification middleware for protected routes.
 * Uses Clerk JWT tokens for authentication with RS256 support.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Authentication middleware factory
 * Returns a middleware function that verifies JWT tokens using Clerk's verification
 */
export function authenticate() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Extract Authorization header
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        return reply.code(401).send({
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid Authorization header',
          },
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify the token using Clerk's backend SDK
      // This handles RS256 verification with JWKS automatically
      const { verifyToken } = await import('@clerk/backend');
      const verified = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!verified) {
        return reply.code(401).send({
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired authentication token',
          },
        });
      }

      // Attach verified user data to request
      (request as any).user = verified;
    } catch (err) {
      return reply.code(401).send({
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing authentication token',
        },
      });
    }
  };
}

/**
 * Optional authentication middleware
 * Attempts to verify JWT but continues even if verification fails
 * Useful for routes that work with or without authentication
 */
export function optionalAuthenticate() {
  return async (request: FastifyRequest) => {
    try {
      const authHeader = request.headers.authorization;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { verifyToken } = await import('@clerk/backend');
        const verified = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        if (verified) {
          (request as any).user = verified;
        }
      }
    } catch {
      // Continue without authentication
      // The route can check if request.user is defined
    }
  };
}
