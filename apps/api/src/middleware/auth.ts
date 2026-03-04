/**
 * Authentication Middleware
 *
 * Provides JWT verification middleware for protected routes.
 * Uses Clerk JWT tokens for authentication with RS256 support.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { recordPerformanceMark } from './performance.js';

type VerifiedAuthClaims = Record<string, unknown>;

let verifyTokenImpl:
  | ((token: string, options: { secretKey: string | undefined }) => Promise<VerifiedAuthClaims | null>)
  | null = null;

async function getVerifyTokenImpl() {
  if (!verifyTokenImpl) {
    const { verifyToken } = await import('@clerk/backend');
    verifyTokenImpl = verifyToken as (
      token: string,
      options: { secretKey: string | undefined }
    ) => Promise<VerifiedAuthClaims | null>;
  }

  return verifyTokenImpl;
}

export async function verifyAuthToken(token: string): Promise<VerifiedAuthClaims | null> {
  const verifyToken = await getVerifyTokenImpl();
  const verified = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  return verified || null;
}

/**
 * Authentication middleware factory
 * Returns a middleware function that verifies JWT tokens using Clerk's verification
 */
export function authenticate() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authStartMs = Date.now();
    try {
      // Skip verification when an upstream middleware has already set auth context.
      if ((request as any).user) {
        return;
      }

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

      // Verify the token using Clerk's backend SDK.
      const verified = await verifyAuthToken(token);

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
    } finally {
      recordPerformanceMark(request, 'auth', Date.now() - authStartMs);
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
      if ((request as any).user) {
        return;
      }

      const authHeader = request.headers.authorization;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const verified = await verifyAuthToken(token);

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
