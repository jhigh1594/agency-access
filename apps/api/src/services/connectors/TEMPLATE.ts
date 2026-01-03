/**
 * ⚠️ TEMPLATE FILE - DO NOT USE DIRECTLY ⚠️
 *
 * ============================================================================
 * HYBRID CONNECTOR ARCHITECTURE - CHOOSE YOUR PATTERN
 * ============================================================================
 *
 * This codebase supports TWO connector patterns. Choose the one that fits
 * your platform's OAuth implementation:
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ PATTERN 1: BaseConnector (RECOMMENDED for standard OAuth 2.0)              │
 * │                                                                             │
 * │ Best for: Platforms following standard OAuth 2.0 spec                      │
 * │   - Google, LinkedIn, TikTok, Snapchat, most modern platforms               │
 * │                                                                             │
 * │ Benefits:                                                                   │
 * │   - ~80% less code (~50 lines vs 300+)                                     │
 * │   - Centralized OAuth flow (write once, works for all)                     │
 * │   - Configuration-driven (add to registry.config.ts)                        │
 * │   - Automatic error handling, token refresh, verification                  │
 * │                                                                             │
 * │ How to use:                                                                 │
 * │   1. Add config to registry.config.ts                                      │
 * │   2. Extend BaseConnector                                                  │
 * │   3. Implement only normalizeResponse()                                    │
 * │                                                                             │
 * │ See: SECTION A below - "BaseConnector Pattern Example"                     │
 * │ Reference: linkedin.ts (working example)                                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ PATTERN 2: Standalone Class (Legacy/Custom flows)                          │
 * │                                                                             │
 * │ Best for: Platforms with non-standard OAuth flows                          │
 * │   - Meta (long-lived token exchange), custom auth flows                    │
 * │                                                                             │
 * │ Benefits:                                                                   │
 * │   - Full control over OAuth implementation                                 │
 * │   - Flexibility for weird platform quirks                                  │
 * │   - No inheritance constraints                                             │
 * │                                                                             │
 * │ How to use:                                                                 │
 * │   Copy this entire template and customize                                  │
 * │                                                                             │
 * │ See: SECTION B below - "Full Template (Legacy Pattern)"                    │
 * │ Reference: meta.ts, google.ts (working examples)                           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 * QUICK DECISION GUIDE
 * ============================================================================
 *
 * Does your platform follow standard OAuth 2.0?
 *   - Authorization URL with client_id, redirect_uri, state, scope, response_type=code
 *   - Token endpoint accepts authorization_code grant type
 *   - Returns access_token (and optionally refresh_token, expires_in)
 *
 *   YES → Use BaseConnector (Pattern 1) - Much faster!
 *   NO  → Use Full Template (Pattern 2) - More control
 *
 * Still not sure? Check if your platform is in registry.config.ts.
 * If yes, someone already configured it → Use BaseConnector.
 *
 * ============================================================================
 */

// ============================================================================
// SECTION A: BaseConnector Pattern Example (RECOMMENDED)
// ============================================================================

/**
 * EXAMPLE: Using BaseConnector for a standard OAuth 2.0 platform
 *
 * This is all the code you need for platforms like LinkedIn, TikTok, Snapchat.
 * Only ~50 lines vs 300+ with the legacy pattern!
 *
 * Step-by-step:
 * 1. Add env vars to apps/api/src/lib/env.ts
 * 2. Add platform to packages/shared/src/types.ts
 * 3. Add config to registry.config.ts (OAuth endpoints, scopes, etc.)
 * 4. Create this file (extending BaseConnector)
 * 5. Register in factory.ts
 * 6. Add OAuth callback route in apps/api/src/routes/oauth.ts
 */

// import { BaseConnector, NormalizedTokenResponse } from './base.connector.js';

// /**
//  * [Platform] Connector
//  *
//  * Uses BaseConnector pattern for standard OAuth 2.0 flow.
//  * Only need to implement normalizeResponse() to handle response format.
//  */
// export class [Platform]Connector extends BaseConnector {
//   constructor() {
//     super('[platform]' as any); // Platform key from registry.config.ts
//   }

//   /**
//    * Normalize platform's token response to our standard format
//    *
//    * @param data - Raw response from platform's token endpoint
//    * @returns Normalized token response
//    */
//   normalizeResponse(data: any): NormalizedTokenResponse {
//     return {
//       accessToken: data.access_token,        // Map platform field
//       refreshToken: data.refresh_token,       // If supported
//       expiresIn: data.expires_in,             // Convert to number
//       expiresAt: new Date(Date.now() + data.expires_in * 1000),
//       tokenType: data.token_type ?? 'Bearer',
//       metadata: {
//         platform: '[platform]',
//         authorizedAt: new Date().toISOString(),
//       },
//     };
//   }
// }

// // Export singleton instance (factory pattern)
// export const [platform]Connector = new [Platform]Connector();

// ============================================================================
// SECTION B: Full Template (Legacy Pattern - For Special Cases)
// ============================================================================

/**
 * For platforms with non-standard OAuth flows, use this full template.
 *
 * Copy and customize this for platforms that need:
 * - Custom token exchanges (e.g., Meta's long-lived tokens)
 * - Multi-step authorization flows
 * - Non-standard request/response formats
 * - Special verification or revocation methods
 */

import { env } from '../../lib/env.js';
import type { AccessLevel } from '@agency-platform/shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Token response from platform's OAuth token endpoint
 * Adjust fields based on platform's actual response format
 */
interface [Platform]TokenResponse {
  access_token: string;
  refresh_token?: string;  // Not all platforms provide refresh tokens
  expires_in: number;      // Seconds until expiration
  token_type: string;      // Usually "Bearer"
  scope?: string;          // Granted scopes
}

/**
 * Normalized token format used internally
 */
interface [Platform]Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: Date;
  tokenType?: string;
  scope?: string;
}

/**
 * User info response from platform
 * Adjust fields based on platform's user info endpoint
 */
interface [Platform]UserInfo {
  id: string;
  email: string;
  name?: string;
  // Add other platform-specific fields as needed
}

// ============================================================================
// Connector Class
// ============================================================================

export class [Platform]Connector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  /**
   * Default OAuth scopes for this platform
   * 
   * IMPORTANT: Check platform documentation for:
   * - Available scopes
   * - Required scopes for your use case
   * - Scope format (space-separated, comma-separated, etc.)
   * 
   * Example scopes (adjust based on platform):
   * - 'read' - Read-only access
   * - 'write' - Write access
   * - 'admin' - Administrative access
   */
  static readonly DEFAULT_SCOPES = [
    'read',
    'write',
    // Add platform-specific scopes here
  ];

  constructor() {
    // Get credentials from environment variables
    // Add these to apps/api/src/lib/env.ts first!
    this.clientId = env.[PLATFORM]_CLIENT_ID;
    this.clientSecret = env.[PLATFORM]_CLIENT_SECRET;
    
    // OAuth callback URL - adjust path if needed
    this.redirectUri = `${env.API_URL}/api/oauth/[platform]/callback`;
  }

  // ==========================================================================
  // Required Methods (PlatformConnector Interface)
  // ==========================================================================

  /**
   * Generate OAuth authorization URL
   *
   * This method creates the URL that users will be redirected to for OAuth authorization.
   * The state parameter is used for CSRF protection and should be stored in Redis/database.
   *
   * @param state - CSRF protection token (managed by OAuthStateService)
   * @param scopes - Optional array of scopes to request (uses DEFAULT_SCOPES if not provided)
   * @param redirectUri - Optional override for redirect URI (used in client flow)
   * @returns Authorization URL to redirect user to
   *
   * @example
   * ```typescript
   * const state = await oauthStateService.createState(userId);
   * const authUrl = connector.getAuthUrl(state);
   * // Redirect user to authUrl
   * ```
   */
  getAuthUrl(
    state: string,
    scopes?: string[],
    redirectUri?: string
  ): string {
    const scopesToUse = scopes ?? [Platform]Connector.DEFAULT_SCOPES;
    
    // Build OAuth authorization URL
    // Adjust query parameters based on platform's OAuth spec
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri ?? this.redirectUri,
      state,  // CSRF protection
      scope: scopesToUse.join(' '),  // Adjust separator if needed (space, comma, etc.)
      response_type: 'code',  // Standard OAuth 2.0
      // Add platform-specific parameters here if needed:
      // access_type: 'offline',  // For refresh tokens (Google-style)
      // prompt: 'consent',       // Force consent screen (Google-style)
    });

    // Replace with actual platform OAuth authorization endpoint
    return `https://api.[platform].com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   *
   * After user authorizes, the platform redirects back with an authorization code.
   * This method exchanges that code for an access token (and optionally refresh token).
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Optional override for redirect URI (must match getAuthUrl)
   * @returns Access token with expiration info
   *
   * @example
   * ```typescript
   * const tokens = await connector.exchangeCode(code);
   * // Store tokens in Infisical (never in database!)
   * await infisical.storeOAuthTokens(secretName, tokens);
   * ```
   */
  async exchangeCode(
    code: string,
    redirectUri?: string
  ): Promise<[Platform]Tokens> {
    // Build token exchange request
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri ?? this.redirectUri,
      grant_type: 'authorization_code',  // Standard OAuth 2.0
      // Add platform-specific parameters if needed
    });

    // Make token exchange request
    // Replace with actual platform token endpoint
    const response = await fetch('https://api.[platform].com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Add platform-specific headers if needed
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[Platform] token exchange failed: ${error}`);
    }

    const data = (await response.json()) as [Platform]TokenResponse;

    // Normalize response to internal format
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * OPTIONAL: Not all platforms support token refresh.
   * If platform doesn't support refresh tokens:
   * - Remove this method (or throw error)
   * - Document that re-authorization is required when tokens expire
   * - Update token refresh job to handle this platform differently
   *
   * @param refreshToken - Refresh token from initial exchange
   * @returns New access token with updated expiration
   *
   * @example
   * ```typescript
   * // Called by token refresh job before expiration
   * const newTokens = await connector.refreshToken(refreshToken);
   * await infisical.updateOAuthTokens(secretName, newTokens);
   * ```
   */
  async refreshToken(refreshToken: string): Promise<[Platform]Tokens> {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      // Add platform-specific parameters if needed
    });

    const response = await fetch('https://api.[platform].com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[Platform] token refresh failed: ${error}`);
    }

    const data = (await response.json()) as [Platform]TokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,  // Some platforms return new refresh token
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tokenType: data.token_type,
    };
  }

  /**
   * Verify token is still valid
   *
   * Makes a lightweight API call to check if token is valid.
   * Used by token health monitoring and before making API calls.
   *
   * @param accessToken - Token to verify
   * @returns Whether token is valid
   *
   * @example
   * ```typescript
   * const isValid = await connector.verifyToken(accessToken);
   * if (!isValid) {
   *   // Token expired or revoked - trigger re-authorization
   * }
   * ```
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      // Make a lightweight API call to verify token
      // Use a simple endpoint like /me, /user, or /verify
      // Replace with actual platform endpoint
      const response = await fetch('https://api.[platform].com/v1/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Add platform-specific headers if needed
        },
      });

      return response.ok;
    } catch {
      // If request fails, assume token is invalid
      return false;
    }
  }

  /**
   * Get user info from platform
   *
   * Fetches user profile information after OAuth authorization.
   * Used to store metadata about the connected account.
   *
   * @param accessToken - Valid access token
   * @returns User profile data (id, email, name, etc.)
   *
   * @example
   * ```typescript
   * const userInfo = await connector.getUserInfo(accessToken);
   * // Store in PlatformAuthorization.metadata
   * await prisma.platformAuthorization.update({
   *   data: { metadata: { userId: userInfo.id, email: userInfo.email } }
   * });
   * ```
   */
  async getUserInfo(accessToken: string): Promise<[Platform]UserInfo> {
    // Replace with actual platform user info endpoint
    const response = await fetch('https://api.[platform].com/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Add platform-specific headers if needed
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[Platform] user info fetch failed: ${error}`);
    }

    const data = (await response.json()) as [Platform]UserInfo;
    return data;
  }

  // ==========================================================================
  // Optional Methods (Platform-Specific)
  // ==========================================================================

  /**
   * Exchange short-lived token for long-lived token
   *
   * OPTIONAL: Only implement if platform supports this (e.g., Meta).
   * Some platforms provide short-lived tokens that must be exchanged
   * for long-lived tokens during initial authorization.
   *
   * @param shortLivedToken - Short-lived access token
   * @returns Long-lived access token
   */
  async getLongLivedToken?(shortLivedToken: string): Promise<[Platform]Tokens> {
    // Implement if platform supports this flow
    // Example: Meta exchanges 2-hour tokens for 60-day tokens
    throw new Error('Long-lived token exchange not supported by this platform');
  }

  /**
   * Verify agency has access to client's assets
   *
   * OPTIONAL: Only implement if using delegated access model.
   * Used to verify that an agency's platform connection has been
   * granted access to a client's specific assets (accounts, pages, etc.).
   *
   * @param agencyAccessToken - Agency's OAuth access token
   * @param clientEmail - Client's email (for validation)
   * @param requiredAccessLevel - Minimum access level required
   * @returns Verification result with granted access details
   */
  async verifyClientAccess?(
    agencyAccessToken: string,
    clientEmail: string,
    requiredAccessLevel: AccessLevel
  ): Promise<{
    hasAccess: boolean;
    accessLevel: AccessLevel;
    assets?: Array<{
      type: string;
      id: string;
      name: string;
      permissions: string[];
    }>;
    error?: string;
  }> {
    // Implement if using delegated access model
    // This is platform-specific and may not apply to all connectors
    throw new Error('Client access verification not implemented for this platform');
  }

  /**
   * Revoke access token (when user disconnects)
   *
   * OPTIONAL: Implement if platform supports token revocation.
   * Called when user disconnects their platform account.
   *
   * @param accessToken - Token to revoke
   */
  async revokeToken?(accessToken: string): Promise<void> {
    const response = await fetch('https://api.[platform].com/oauth/revoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Or use POST body with token parameter, depending on platform
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[Platform] token revocation failed: ${error}`);
    }
  }

  // ==========================================================================
  // Platform-Specific Helper Methods
  // ==========================================================================

  /**
   * Add any platform-specific helper methods here.
   * Examples:
   * - Fetching assets (accounts, pages, etc.)
   * - Making API calls with proper authentication
   * - Platform-specific data transformations
   */

  /**
   * Example: Fetch user's accounts/assets
   * 
   * @param accessToken - Valid access token
   * @returns List of accounts/assets user has access to
   */
  async getAccounts?(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    // Add platform-specific fields
  }>> {
    // Implement if platform has concept of accounts/assets
    // This is used in asset selection flow for client authorization
    throw new Error('Account fetching not implemented for this platform');
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

/**
 * Export singleton instance of the connector.
 * This is the pattern used throughout the codebase.
 */
export const [platform]Connector = new [Platform]Connector();

