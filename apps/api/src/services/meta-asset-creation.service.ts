/**
 * Meta Asset Creation Service
 *
 * Handles creation of Meta assets (ad accounts, product catalogs) for client connections.
 * Follows the security pattern of retrieving tokens from Infisical (never stored in DB).
 * All creation events are logged for audit purposes.
 */

import { logger } from '../lib/logger.js';
import { infisical } from '../lib/infisical.js';
import { prisma } from '../lib/prisma.js';
import { auditService } from './audit.service.js';
import { metaConnector } from './connectors/meta.js';

export interface CreateAdAccountParams {
  name: string;
  currency: string;
  timezoneId: string;
}

export interface CreateProductCatalogParams {
  name: string;
}

export interface CreatedAdAccount {
  id: string;
  name: string;
  currency: string;
  timezoneId: string;
  accountId: string;
}

export interface CreatedProductCatalog {
  id: string;
  name: string;
  catalogType: string;
}

export interface AssetCreationLinks {
  pageCreationUrl: string;
  pixelCreationUrl: string;
}

class MetaAssetCreationService {
  /**
   * Create a new Meta ad account for a client connection
   *
   * @param connectionId - Client connection ID
   * @param businessId - Meta Business Manager ID
   * @param params - Ad account creation parameters
   * @param userEmail - User email for audit logging
   * @param agencyId - Agency ID for audit logging
   * @returns Created ad account details
   */
  async createAdAccount(
    connectionId: string,
    businessId: string,
    params: CreateAdAccountParams,
    userEmail: string,
    agencyId: string
  ): Promise<{ data: CreatedAdAccount | null; error: { code: string; message: string; details?: any } | null }> {
    try {
      logger.info('Creating Meta ad account', {
        connectionId,
        businessId,
        accountName: params.name,
        currency: params.currency,
      });

      // Step 1: Get the platform authorization for this connection
      const platformAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: 'meta',
          },
        },
      });

      if (!platformAuth) {
        return {
          data: null,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: 'Meta authorization not found for this connection',
          },
        };
      }

      // Step 2: Check if authorization is active
      if (platformAuth.status !== 'active') {
        return {
          data: null,
          error: {
            code: 'AUTHORIZATION_INACTIVE',
            message: 'Meta authorization is not active',
          },
        };
      }

      // Step 3: Retrieve tokens from Infisical (NEVER from database)
      let tokens;
      try {
        tokens = await infisical.getOAuthTokens(platformAuth.secretId);
      } catch (tokenError) {
        logger.error('Failed to retrieve Meta tokens from Infisical', {
          connectionId,
          secretId: platformAuth.secretId,
          error: tokenError,
        });
        return {
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        };
      }

      if (!tokens || !tokens.accessToken) {
        return {
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        };
      }

      // Step 4: Check if token is expired
      if (tokens.expiresAt && new Date(tokens.expiresAt) < new Date()) {
        return {
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Your authorization has expired. Please reconnect your Meta account.',
          },
        };
      }

      // Step 5: Create ad account via Meta API
      const createdAccount = await metaConnector.createAdAccount(
        tokens.accessToken,
        businessId,
        params
      );

      logger.info('Meta ad account created successfully', {
        connectionId,
        accountId: createdAccount.id,
        accountName: createdAccount.name,
      });

      // Step 6: Update connection metadata with created asset
      const connection = await prisma.clientConnection.findUnique({
        where: { id: connectionId },
      });

      if (connection) {
        const currentGrantedAssets = (connection.grantedAssets as any) || {};
        const createdAdAccounts = currentGrantedAssets.meta?.createdAdAccounts || [];

        await prisma.clientConnection.update({
          where: { id: connectionId },
          data: {
            grantedAssets: {
              ...currentGrantedAssets,
              meta: {
                ...(currentGrantedAssets.meta || {}),
                createdAdAccounts: [
                  ...createdAdAccounts,
                  {
                    id: createdAccount.id,
                    accountId: createdAccount.accountId,
                    name: createdAccount.name,
                    currency: createdAccount.currency,
                    timezoneId: createdAccount.timezoneId,
                    createdAt: new Date().toISOString(),
                  },
                ],
              },
            },
          },
        });
      }

      // Step 7: Create audit log
      await auditService.createAuditLog({
        agencyId,
        userEmail,
        action: 'META_AD_ACCOUNT_CREATED',
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          platform: 'meta',
          businessId,
          accountId: createdAccount.id,
          accountName: createdAccount.name,
          currency: createdAccount.currency,
          timezoneId: createdAccount.timezoneId,
        },
      });

      return { data: createdAccount, error: null };
    } catch (error) {
      logger.error('Failed to create Meta ad account', {
        connectionId,
        businessId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Check for specific Meta API errors
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
        return {
          data: null,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Your Meta account does not have permission to create ad accounts. Please ensure you have ads_management scope.',
          },
        };
      }

      if (errorMessage.includes('limit') || errorMessage.includes('maximum')) {
        return {
          data: null,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'You have reached the maximum number of ad accounts for this Business Manager.',
          },
        };
      }

      return {
        data: null,
        error: {
          code: 'CREATION_FAILED',
          message: `Failed to create ad account: ${errorMessage}`,
        },
      };
    }
  }

  /**
   * Create a new Meta product catalog for a client connection
   *
   * @param connectionId - Client connection ID
   * @param businessId - Meta Business Manager ID
   * @param params - Product catalog creation parameters
   * @param userEmail - User email for audit logging
   * @param agencyId - Agency ID for audit logging
   * @returns Created product catalog details
   */
  async createProductCatalog(
    connectionId: string,
    businessId: string,
    params: CreateProductCatalogParams,
    userEmail: string,
    agencyId: string
  ): Promise<{ data: CreatedProductCatalog | null; error: { code: string; message: string; details?: any } | null }> {
    try {
      logger.info('Creating Meta product catalog', {
        connectionId,
        businessId,
        catalogName: params.name,
      });

      // Step 1: Get the platform authorization for this connection
      const platformAuth = await prisma.platformAuthorization.findUnique({
        where: {
          connectionId_platform: {
            connectionId,
            platform: 'meta',
          },
        },
      });

      if (!platformAuth) {
        return {
          data: null,
          error: {
            code: 'AUTHORIZATION_NOT_FOUND',
            message: 'Meta authorization not found for this connection',
          },
        };
      }

      // Step 2: Check if authorization is active
      if (platformAuth.status !== 'active') {
        return {
          data: null,
          error: {
            code: 'AUTHORIZATION_INACTIVE',
            message: 'Meta authorization is not active',
          },
        };
      }

      // Step 3: Retrieve tokens from Infisical (NEVER from database)
      let tokens;
      try {
        tokens = await infisical.getOAuthTokens(platformAuth.secretId);
      } catch (tokenError) {
        logger.error('Failed to retrieve Meta tokens from Infisical', {
          connectionId,
          secretId: platformAuth.secretId,
          error: tokenError,
        });
        return {
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        };
      }

      if (!tokens || !tokens.accessToken) {
        return {
          data: null,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'OAuth tokens not found in secure storage',
          },
        };
      }

      // Step 4: Check if token is expired
      if (tokens.expiresAt && new Date(tokens.expiresAt) < new Date()) {
        return {
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Your authorization has expired. Please reconnect your Meta account.',
          },
        };
      }

      // Step 5: Create product catalog via Meta API
      const createdCatalog = await metaConnector.createProductCatalog(
        tokens.accessToken,
        businessId,
        params.name
      );

      logger.info('Meta product catalog created successfully', {
        connectionId,
        catalogId: createdCatalog.id,
        catalogName: createdCatalog.name,
      });

      // Step 6: Update connection metadata with created asset
      const connection = await prisma.clientConnection.findUnique({
        where: { id: connectionId },
      });

      if (connection) {
        const currentGrantedAssets = (connection.grantedAssets as any) || {};
        const createdProductCatalogs = currentGrantedAssets.meta?.createdProductCatalogs || [];

        await prisma.clientConnection.update({
          where: { id: connectionId },
          data: {
            grantedAssets: {
              ...currentGrantedAssets,
              meta: {
                ...(currentGrantedAssets.meta || {}),
                createdProductCatalogs: [
                  ...createdProductCatalogs,
                  {
                    id: createdCatalog.id,
                    name: createdCatalog.name,
                    catalogType: createdCatalog.catalogType,
                    createdAt: new Date().toISOString(),
                  },
                ],
              },
            },
          },
        });
      }

      // Step 7: Create audit log
      await auditService.createAuditLog({
        agencyId,
        userEmail,
        action: 'META_PRODUCT_CATALOG_CREATED',
        resourceType: 'client_connection',
        resourceId: connectionId,
        metadata: {
          platform: 'meta',
          businessId,
          catalogId: createdCatalog.id,
          catalogName: createdCatalog.name,
          catalogType: createdCatalog.catalogType,
        },
      });

      return { data: createdCatalog, error: null };
    } catch (error) {
      logger.error('Failed to create Meta product catalog', {
        connectionId,
        businessId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Check for specific Meta API errors
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
        return {
          data: null,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Your Meta account does not have permission to create product catalogs. Please ensure you have catalog_management scope.',
          },
        };
      }

      if (errorMessage.includes('limit') || errorMessage.includes('maximum')) {
        return {
          data: null,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'You have reached the maximum number of product catalogs for this Business Manager.',
          },
        };
      }

      return {
        data: null,
        error: {
          code: 'CREATION_FAILED',
          message: `Failed to create product catalog: ${errorMessage}`,
        },
      };
    }
  }

  /**
   * Get asset creation links for manual asset creation (pages, pixels)
   *
   * @param businessId - Meta Business Manager ID
   * @returns URLs for page and pixel creation
   */
  getAssetCreationLinks(businessId: string): AssetCreationLinks {
    return {
      pageCreationUrl: metaConnector.getPageCreationUrl(businessId),
      pixelCreationUrl: metaConnector.getPixelCreationUrl(businessId),
    };
  }

  /**
   * Get supported currencies for ad account creation
   *
   * @returns Array of supported currency codes
   */
  getSupportedCurrencies(): string[] {
    return metaConnector.getSupportedCurrencies();
  }

  /**
   * Get supported timezones for ad account creation
   *
   * @returns Array of supported timezone IDs with names
   */
  getSupportedTimezones(): Array<{ id: string; name: string; offset: string }> {
    return metaConnector.getSupportedTimezones();
  }
}

// Export singleton instance
export const metaAssetCreationService = new MetaAssetCreationService();
