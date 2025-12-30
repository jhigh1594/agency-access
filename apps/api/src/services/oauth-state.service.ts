/**
 * OAuth State Service
 *
 * Manages OAuth state tokens for CSRF protection during OAuth flows.
 * State tokens are stored in Redis with 10-minute expiry and are single-use.
 */

import { randomBytes } from 'crypto';
import { redis } from '@/lib/redis';

export interface OAuthState {
  agencyId: string;
  platform: string;
  userEmail: string;
  redirectUrl?: string;
  timestamp: number;
  // For client authorization flows
  accessRequestId?: string;
  clientEmail?: string;
}

const STATE_EXPIRY_SECONDS = 600; // 10 minutes
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Create a new OAuth state token
 * Stores state data in Redis with 10-minute expiry
 */
async function createState(
  stateData: OAuthState
): Promise<{ data: string | null; error: { code: string; message?: string } | null }> {
  try {
    // Generate random state token
    const stateToken = randomBytes(32).toString('hex');

    // Store in Redis with 10-minute expiry
    await redis.set(
      `oauth_state:${stateToken}`,
      JSON.stringify(stateData),
      'EX',
      STATE_EXPIRY_SECONDS
    );

    return { data: stateToken, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'STATE_CREATION_FAILED',
        message: 'Failed to create OAuth state token',
      },
    };
  }
}

/**
 * Validate and consume OAuth state token (one-time use)
 * Returns state data if valid, null if invalid or expired
 */
async function validateState(
  stateToken: string
): Promise<{ data: OAuthState | null; error: { code: string; message?: string } | null }> {
  try {
    // Validate token is not empty
    if (!stateToken || stateToken.trim() === '') {
      return {
        data: null,
        error: {
          code: 'INVALID_STATE_TOKEN',
          message: 'State token cannot be empty',
        },
      };
    }

    // Get state data from Redis
    const stateDataStr = await redis.get(`oauth_state:${stateToken}`);

    // Token not found (expired or already used)
    if (!stateDataStr) {
      return { data: null, error: null };
    }

    // Delete token immediately (one-time use)
    await redis.del(`oauth_state:${stateToken}`);

    // Parse state data
    let stateData: OAuthState;
    try {
      stateData = JSON.parse(stateDataStr);
    } catch (parseError) {
      return {
        data: null,
        error: {
          code: 'INVALID_STATE_DATA',
          message: 'State data is malformed',
        },
      };
    }

    // Validate required fields
    // For agency flows: agencyId, platform, userEmail required
    // For client flows: accessRequestId, platform, clientEmail required
    const isAgencyFlow = !!stateData.agencyId && !!stateData.userEmail;
    const isClientFlow = !!stateData.accessRequestId && !!stateData.clientEmail;

    if (!stateData.platform || !stateData.timestamp || (!isAgencyFlow && !isClientFlow)) {
      return {
        data: null,
        error: {
          code: 'INVALID_STATE_DATA',
          message: 'State data is missing required fields',
        },
      };
    }

    // Validate timestamp (prevent replay attacks)
    const now = Date.now();
    const age = now - stateData.timestamp;

    if (age > STATE_MAX_AGE_MS) {
      return {
        data: null,
        error: {
          code: 'STATE_EXPIRED',
          message: 'State token has expired',
        },
      };
    }

    return { data: stateData, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'STATE_VALIDATION_FAILED',
        message: 'Failed to validate OAuth state token',
      },
    };
  }
}

// Export as service object for easier mocking in tests
export const oauthStateService = {
  createState,
  validateState,
};
