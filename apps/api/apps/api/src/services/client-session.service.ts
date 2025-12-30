/**
 * Client Session Service
 *
 * Manages temporary client OAuth tokens in Redis for the asset selection flow.
 * Tokens are auto-expired after 15 minutes (900 seconds).
 *
 * Flow:
 * 1. Client completes OAuth → create session with token
 * 2. Frontend fetches assets using sessionId
 * 3. Client selects assets → grant partner access
 * 4. Session auto-deleted after grant or 15-minute expiry
 */

import { redis } from '../lib/redis';
import { v4 as uuidv4 } from 'uuid';
import type { Platform } from '@agency-platform/shared';

export interface ClientSession {
  sessionId: string;
  accessRequestId: string;
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  clientEmail: string;
  createdAt: Date;
}

export type CreateSessionData = Omit<ClientSession, 'sessionId' | 'createdAt'>;

class ClientSessionService {
  private readonly SESSION_PREFIX = 'client-session:';
  private readonly TTL_SECONDS = 900; // 15 minutes

  /**
   * Create a new client session with temporary OAuth tokens
   *
   * @param data - Session data including access token and request info
   * @returns Session ID for asset fetching
   */
  async createSession(data: CreateSessionData): Promise<string> {
    const sessionId = uuidv4();
    const session: ClientSession = {
      ...data,
      sessionId,
      createdAt: new Date(),
    };

    const key = `${this.SESSION_PREFIX}${sessionId}`;

    // Store in Redis with 15-minute expiry
    await redis.setex(
      key,
      this.TTL_SECONDS,
      JSON.stringify({
        ...session,
        expiresAt: session.expiresAt?.toISOString(),
        createdAt: session.createdAt.toISOString(),
      })
    );

    return sessionId;
  }

  /**
   * Retrieve a client session by ID
   *
   * @param sessionId - UUID of the session
   * @returns Session data or null if expired/not found
   */
  async getSession(sessionId: string): Promise<ClientSession | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
      createdAt: new Date(parsed.createdAt),
    };
  }

  /**
   * Delete a client session (after successful grant or error)
   *
   * @param sessionId - UUID of the session to delete
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.del(key);
  }

  /**
   * Get remaining TTL for a session (for debugging)
   *
   * @param sessionId - UUID of the session
   * @returns Remaining seconds or null if expired
   */
  async getSessionTTL(sessionId: string): Promise<number | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const ttl = await redis.ttl(key);

    // -1 = key exists but no TTL, -2 = key doesn't exist
    if (ttl <= 0) {
      return null;
    }

    return ttl;
  }
}

export const clientSessionService = new ClientSessionService();
