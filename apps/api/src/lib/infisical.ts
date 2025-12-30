import { InfisicalSDK, SecretType } from '@infisical/sdk';
import { env } from './env';

/**
 * Infisical client singleton for managing OAuth tokens and secrets
 *
 * Security Pattern:
 * - OAuth tokens are NEVER stored in PostgreSQL
 * - Only Infisical secret references are stored in the database
 * - All token access is logged in the AuditLog table
 */

class InfisicalService {
  private client: InfisicalSDK | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize Infisical client with Machine Identity authentication
   */
  private async initialize(): Promise<void> {
    if (this.client) return;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        this.client = new InfisicalSDK();

        // Authenticate with Machine Identity (Universal Auth)
        await this.client.auth().universalAuth.login({
          clientId: env.INFISICAL_CLIENT_ID,
          clientSecret: env.INFISICAL_CLIENT_SECRET,
        });
      })();
    }

    await this.initPromise;
  }

  /**
   * Store OAuth tokens in Infisical
   *
   * @param secretName - Unique identifier for the secret (e.g., "meta_token_conn_abc123")
   * @param tokens - OAuth tokens to store (accessToken, refreshToken, etc.)
   * @returns The secret name (to be stored in database as secretId)
   */
  async storeOAuthTokens(
    secretName: string,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
      scope?: string;
    }
  ): Promise<string> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Infisical client not initialized');
    }

    // Store tokens as a JSON string in Infisical
    const secretValue = JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt?.toISOString(),
      scope: tokens.scope,
      storedAt: new Date().toISOString(),
    });

    await this.client.secrets().createSecret(secretName, {
      projectId: env.INFISICAL_PROJECT_ID,
      environment: env.INFISICAL_ENVIRONMENT,
      secretValue,
      type: SecretType.Shared,
    });

    return secretName;
  }

  /**
   * Retrieve OAuth tokens from Infisical
   *
   * @param secretName - The secret name (from database secretId field)
   * @returns The OAuth tokens
   */
  async getOAuthTokens(secretName: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
  }> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Infisical client not initialized');
    }

    const secret = await this.client.secrets().getSecret({
      projectId: env.INFISICAL_PROJECT_ID,
      environment: env.INFISICAL_ENVIRONMENT,
      secretName,
      type: SecretType.Shared,
    });

    const parsed = JSON.parse(secret.secretValue);

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
      scope: parsed.scope,
    };
  }

  /**
   * Alias for getOAuthTokens for backward compatibility
   */
  async retrieveOAuthTokens(secretName: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
  }> {
    return this.getOAuthTokens(secretName);
  }

  /**
   * Update existing OAuth tokens (e.g., after token refresh)
   *
   * @param secretName - The secret name
   * @param tokens - Updated tokens
   */
  async updateOAuthTokens(
    secretName: string,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
      scope?: string;
    }
  ): Promise<void> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Infisical client not initialized');
    }

    const secretValue = JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt?.toISOString(),
      scope: tokens.scope,
      updatedAt: new Date().toISOString(),
    });

    await this.client.secrets().updateSecret(secretName, {
      projectId: env.INFISICAL_PROJECT_ID,
      environment: env.INFISICAL_ENVIRONMENT,
      secretValue,
      type: SecretType.Shared,
    });
  }

  /**
   * Delete OAuth tokens from Infisical (when connection is revoked)
   *
   * @param secretName - The secret name
   */
  async deleteOAuthTokens(secretName: string): Promise<void> {
    await this.initialize();

    if (!this.client) {
      throw new Error('Infisical client not initialized');
    }

    await this.client.secrets().deleteSecret(secretName, {
      projectId: env.INFISICAL_PROJECT_ID,
      environment: env.INFISICAL_ENVIRONMENT,
      type: SecretType.Shared,
    });
  }

  /**
   * Alias for deleteOAuthTokens for backward compatibility
   */
  async deleteSecret(secretName: string): Promise<void> {
    return this.deleteOAuthTokens(secretName);
  }

  /**
   * Generate a unique secret name for a platform authorization
   *
   * @param platform - Platform name (e.g., "meta", "google_ads")
   * @param connectionId - Database connection ID
   * @returns Unique secret name
   */
  generateSecretName(platform: string, connectionId: string): string {
    return `${platform}_token_${connectionId}`;
  }
}

// Export singleton instance
export const infisical = new InfisicalService();
