import crypto from 'crypto';

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
 * Store code verifier in Redis with state as key
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
  const { redis } = await import('@/lib/redis.js');
  await redis.setex(`pkce:${state}`, ttl, verifier);
}

/**
 * Retrieve code verifier from Redis using state
 *
 * @param state - OAuth state parameter used as the key
 * @returns Code verifier or null if not found/expired
 */
export async function getCodeVerifier(state: string): Promise<string | null> {
  const { redis } = await import('@/lib/redis.js');
  return await redis.get(`pkce:${state}`);
}

/**
 * Delete code verifier from Redis after use
 *
 * Should be called after successful token exchange to clean up.
 *
 * @param state - OAuth state parameter used as the key
 */
export async function deleteCodeVerifier(state: string): Promise<void> {
  const { redis } = await import('@/lib/redis.js');
  await redis.del(`pkce:${state}`);
}
