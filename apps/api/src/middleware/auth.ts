/**
 * Authentication Middleware
 *
 * Provides JWT verification middleware for protected routes.
 * Uses Clerk JWT tokens for authentication.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Authentication middleware factory
 * Returns a middleware function that verifies JWT tokens
 */
export function authenticate() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
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
      await request.jwtVerify();
    } catch {
      // Continue without authentication
      // The route can check if request.user is defined
    }
  };
}
