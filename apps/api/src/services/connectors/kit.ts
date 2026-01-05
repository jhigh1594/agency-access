import type { NormalizedTokenResponse } from './base.connector.js';

/**
 * Kit (ConvertKit) - Team Invitation Flow (NON-OAUTH)
 *
 * Kit now uses team invitation workflow instead of OAuth:
 * 1. Client invites agency as team member in Kit UI
 * 2. Agency receives email invitation and accepts
 * 3. No API keys or tokens exchanged
 *
 * @see https://help.kit.com/en/articles/2502649-how-to-add-a-team-member-to-your-kit-account
 * @see https://help.kit.com/en/articles/3437304-invite-your-team
 *
 * Client Instructions:
 * 1. Log into Kit account
 * 2. Go to Account Settings → Team
 * 3. Click "Invite a team member" button
 * 4. Enter agency email address
 * 5. Select role/permission level
 * 6. Send invitation
 */

// ============================================================================
// PRESERVED: OAuth Implementation (for potential future use)
// ============================================================================
// The following OAuth implementation is preserved for reference.
// Kit's team invitation flow is now used for client connections.
// Uncomment to restore OAuth flow if needed in the future.

/*
import { env } from '../../lib/env.js';

interface KitTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

interface KitAccountResponse {
  id: string;
  name: string;
  primary_email_address: string;
}

export class KitConnector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authUrl = 'https://api.kit.com/v4/oauth/authorize';
  private readonly tokenUrl = 'https://api.kit.com/v4/oauth/token';
  private readonly userInfoUrl = 'https://api.kit.com/v4/account';

  constructor() {
    this.clientId = env.KIT_CLIENT_ID;
    this.clientSecret = env.KIT_CLIENT_SECRET;
    this.redirectUri = `${env.API_URL}/agency-platforms/kit/callback`;
  }

  getAuthUrl(state: string, scopes?: string[], redirectUri?: string): string {
    const scopesToUse = scopes ?? ['public'];
    const scopeString = scopesToUse.join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri ?? this.redirectUri,
      state,
      scope: scopeString,
      response_type: 'code',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri?: string
  ): Promise<NormalizedTokenResponse> {
    const body = {
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri ?? this.redirectUri,
    };

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kit token exchange failed: ${error}`);
    }

    const data: KitTokenResponse = await response.json();
    return this.normalizeResponse(data);
  }

  async refreshToken(refreshToken: string): Promise<NormalizedTokenResponse> {
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
    };

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kit token refresh failed: ${error}`);
    }

    const data: KitTokenResponse = await response.json();
    return this.normalizeResponse(data);
  }

  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(this.userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
  }> {
    const response = await fetch(this.userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kit user info fetch failed: ${error}`);
    }

    const data: KitAccountResponse = await response.json();

    return {
      id: data.id,
      email: data.primary_email_address,
      name: data.name,
    };
  }

  private normalizeResponse(data: KitTokenResponse): NormalizedTokenResponse {
    const expiresAt = new Date((data.created_at * 1000) + (data.expires_in * 1000));

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt,
      tokenType: data.token_type,
      scope: data.scope,
      metadata: {
        platform: 'kit',
        authorizedAt: new Date().toISOString(),
      },
    };
  }
}

export const kitConnector = new KitConnector();
*/

// ============================================================================
// END: Preserved OAuth Implementation
// ============================================================================

/**
 * Export null for type compatibility
 *
 * The Kit connector now uses team invitation flow (UI-only).
 * No OAuth tokens are exchanged or stored.
 * This null export maintains compatibility with the factory pattern.
 */
export const kitConnector = null as any;
