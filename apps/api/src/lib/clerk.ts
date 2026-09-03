import { ClerkClient, createClerkClient } from '@clerk/backend';
import { env } from '@/lib/env';

let clerkClient: ClerkClient | null = null;

/**
 * Shared Clerk backend client.
 *
 * Lazily constructs a single SDK client from the Zod-validated env so callers
 * do not build a fresh client per request.
 */
export function getClerkClient(): ClerkClient {
  if (!clerkClient) {
    clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  }

  return clerkClient;
}
