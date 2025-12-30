import type { Platform } from '@agency-platform/shared';
import { metaConnector } from './meta';
import { googleAdsConnector } from './google-ads';
import { ga4Connector } from './ga4';
import { googleConnector } from './google';

/**
 * Platform Connector Interface
 *
 * Defines the contract that all platform connectors must implement.
 * Different platforms have different refresh capabilities:
 *
 * - Google Ads & GA4: Support refresh_token flow
 * - Meta: Uses 60-day long-lived tokens (no refresh, requires re-auth)
 * - TikTok/LinkedIn/Snapchat: To be implemented
 */
export interface PlatformConnector {
  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string, scopes?: string[], redirectUri?: string): string;

  /**
   * Exchange authorization code for access tokens
   */
  exchangeCode(code: string, redirectUri?: string): Promise<any>;

  /**
   * Optional: Refresh access token using refresh token
   * Not supported by all platforms (e.g., Meta)
   */
  refreshToken?(refreshToken: string): Promise<any>;

  /**
   * Optional: Exchange short-lived token for long-lived token
   * Meta-specific (60-day tokens)
   */
  getLongLivedToken?(shortToken: string): Promise<any>;

  /**
   * Verify token is still valid
   */
  verifyToken(accessToken: string): Promise<boolean>;

  /**
   * Get user info from platform
   */
  getUserInfo(accessToken: string): Promise<any>;

  /**
   * Optional: Verify agency has access to client's assets
   */
  verifyClientAccess?(
    agencyAccessToken: string,
    ...args: any[]
  ): Promise<any>;

  /**
   * Optional: Revoke token
   */
  revokeToken?(accessToken: string): Promise<void>;
}

/**
 * Platform Connector Registry
 *
 * Maps platform identifiers to their connector instances.
 * Add new connectors here as they are implemented.
 */
const connectors: Partial<Record<Platform, PlatformConnector>> = {
  meta: metaConnector,
  meta_ads: metaConnector,
  google: googleConnector,
  google_ads: googleAdsConnector,
  ga4: ga4Connector,

  // TODO: Add remaining platforms when connectors are implemented
  // tiktok: tiktokConnector,
  // linkedin: linkedinConnector,
  // snapchat: snapchatConnector,
  // instagram: instagramConnector,
};

/**
 * Get the appropriate connector for a platform
 *
 * @param platform - The platform identifier
 * @returns The platform connector instance
 * @throws Error if no connector exists for the platform
 *
 * @example
 * ```typescript
 * const connector = getConnector('meta_ads');
 * const tokens = await connector.exchangeCode(code);
 * ```
 */
export function getConnector(platform: Platform): PlatformConnector {
  const connector = connectors[platform];

  if (!connector) {
    throw new Error(
      `No connector found for platform: ${platform}. ` +
      `Available platforms: ${Object.keys(connectors).join(', ')}`
    );
  }

  return connector;
}

/**
 * Check if a connector exists for a platform
 *
 * @param platform - The platform identifier
 * @returns Whether a connector is available
 */
export function hasConnector(platform: Platform): boolean {
  return platform in connectors;
}

/**
 * Get all available platform connectors
 *
 * @returns Array of platform identifiers that have connectors
 */
export function getAvailablePlatforms(): Platform[] {
  return Object.keys(connectors) as Platform[];
}
