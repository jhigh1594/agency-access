import crypto from 'crypto';
import { prisma } from './prisma.js';

/**
 * PKCE (Proof Key for Code Exchange) Helper
 *
 * Required for OAuth 2.0 flows that mandate PKCE, such as Klaviyo.
 * PKCE enhances security by preventing authorization code interception attacks.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7636
 */

/**
 * Generate a code verifier and code challenge for PKCE
 *
 * The code verifier is a cryptographically random string between 43-128 characters.
 * The code challenge is the SHA-256 hash of the verifier, base64url-encoded.
 *
 * @returns Object containing code_verifier and code_challenge
 */
export function generateCodeChallenge(): {
  code_verifier: string;
  code_challenge: string;
} {
  // Generate code_verifier (43-128 characters, random)
  const verifierBytes = crypto.randomBytes(32);
  const code_verifier = base64UrlEncode(verifierBytes);

  // Generate code_challenge (SHA-256 hash)
  const challengeBytes = crypto.createHash('sha256')
    .update(code_verifier)
    .digest();
  const code_challenge = base64UrlEncode(challengeBytes);

  return { code_verifier, code_challenge };
}

/**
 * Base64URL-encode a buffer
 *
 * Uses the URL-safe base64 encoding as specified in RFC 4648:
 * - No padding (= characters removed)
 * - + replaced with -
 * - / replaced with _
 *
 * @param buffer - Buffer to encode
 * @returns Base64URL-encoded string
 */
function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Store code verifier in Postgres with state as key
 *
 * The code verifier must be stored during authorization and retrieved during
 * token exchange to verify the PKCE challenge.
 *
 * @param state - OAuth state parameter used as the key
 * @param verifier - Code verifier to store
 * @param ttl - Time to live in seconds (default: 600 = 10 minutes)
 */
export async function storeCodeVerifier(
  state: string,
  verifier: string,
  ttl: number = 600
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttl * 1000);

  await prisma.pkceVerifier.create({
    data: {
      stateKey: state,
      verifier,
      expiresAt,
    },
  });
}

/**
 * Retrieve code verifier from Postgres using state
 * Consumes the verifier (single-use) if found.
 *
 * @param state - OAuth state parameter used as the key
 * @returns Code verifier or null if not found/expired
 */
export async function getCodeVerifier(state: string): Promise<string | null> {
  const record = await prisma.pkceVerifier.findUnique({
    where: { stateKey: state },
  });

  if (!record) {
    return null;
  }

  // Check if expired
  if (record.expiresAt < new Date()) {
    // Clean up expired record
    await prisma.pkceVerifier.delete({ where: { stateKey: state } });
    return null;
  }

  // Check if already consumed
  if (record.consumedAt) {
    return null;
  }

  return record.verifier;
}

/**
 * Delete code verifier from Postgres after use (consume)
 *
 * Uses atomic update to mark as consumed, ensuring single-use semantics.
 * Should be called after successful token exchange.
 *
 * @param state - OAuth state parameter used as the key
 */
export async function deleteCodeVerifier(state: string): Promise<void> {
  // Atomic consume: set consumedAt if not already set
  await prisma.pkceVerifier.updateMany({
    where: {
      stateKey: state,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });
}

/**
 * Cleanup expired PKCE verifiers
 * Should be called periodically (e.g., by a background job)
 */
export async function cleanupExpiredVerifiers(): Promise<{ deleted: number }> {
  const result = await prisma.pkceVerifier.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { consumedAt: { not: null } },
      ],
    },
  });

  return { deleted: result.count };
}
