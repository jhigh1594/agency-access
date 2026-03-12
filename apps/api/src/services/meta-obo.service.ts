import {
  MetaClientAuthorizationMetadataSchema,
  type MetaClientAuthorizationMetadata,
  type MetaManagedBusinessLinkState,
  type MetaSystemUserProvisionState,
} from '@agency-platform/shared';

import { env } from '@/lib/env';
import { infisical } from '@/lib/infisical';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/services/audit.service';

type ServiceError = {
  code: string;
  message: string;
  details?: unknown;
};

type ServiceResult<T> = {
  data: T | null;
  error: ServiceError | null;
};

type PlatformAuthorizationRecord = {
  id: string;
  connectionId: string;
  secretId: string;
  metadata: unknown;
};

type OBOAuditContext = {
  agencyId?: string;
  connectionId: string;
  ipAddress?: string;
  userEmail?: string;
};

function createServiceError(code: string, message: string, details?: unknown): ServiceError {
  return { code, message, details };
}

async function parseGraphError(response: Response): Promise<ServiceError> {
  try {
    const payload = (await response.json()) as {
      error?: {
        code?: string | number;
        message?: string;
      };
    };
    const error = payload.error;

    return createServiceError(
      `META_API_${error?.code ?? response.status}`,
      error?.message || 'Meta API request failed',
      payload
    );
  } catch {
    const text = await response.text();
    return createServiceError(
      `META_API_${response.status}`,
      text || 'Meta API request failed',
      text
    );
  }
}

function readMetadata(metadata: unknown): {
  rootMetadata: Record<string, unknown>;
  metaMetadata: MetaClientAuthorizationMetadata;
} {
  const rootMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? ({ ...(metadata as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  const parsed = MetaClientAuthorizationMetadataSchema.safeParse(rootMetadata.meta);

  return {
    rootMetadata,
    metaMetadata: parsed.success ? parsed.data : {},
  };
}

function buildManagedBusinessesUrl(
  partnerBusinessId: string,
  clientBusinessId: string,
  clientBusinessAdminAccessToken: string
): string {
  const url = new URL(
    `https://graph.facebook.com/v21.0/${partnerBusinessId}/managed_businesses`
  );
  url.searchParams.set('existing_client_business_id', clientBusinessId);
  url.searchParams.set('access_token', clientBusinessAdminAccessToken);
  return url.toString();
}

function buildClientSystemUserTokenUrl(
  clientBusinessId: string,
  scopes: string[],
  partnerBusinessAdminSystemUserAccessToken: string
): string {
  const url = new URL(`https://graph.facebook.com/v21.0/${clientBusinessId}/access_token`);
  url.searchParams.set('scope', scopes.join(','));
  url.searchParams.set('app_id', env.META_APP_ID);
  url.searchParams.set('access_token', partnerBusinessAdminSystemUserAccessToken);
  return url.toString();
}

function buildGraphMeUrl(accessToken: string): string {
  const url = new URL('https://graph.facebook.com/v21.0/me');
  url.searchParams.set('access_token', accessToken);
  return url.toString();
}

async function writeAuditLog(
  context: OBOAuditContext,
  action: string,
  metadata: Record<string, unknown>
) {
  await createAuditLog({
    agencyId: context.agencyId,
    userEmail: context.userEmail,
    action,
    resourceType: 'connection',
    resourceId: context.connectionId,
    ipAddress: context.ipAddress,
    metadata,
  });
}

class MetaOBOService {
  private async getAuthorization(authorizationId: string): Promise<ServiceResult<PlatformAuthorizationRecord>> {
    const authorization = await prisma.platformAuthorization.findUnique({
      where: { id: authorizationId },
    });

    if (!authorization) {
      return {
        data: null,
        error: createServiceError('NOT_FOUND', 'Meta platform authorization not found'),
      };
    }

    return {
      data: authorization as PlatformAuthorizationRecord,
      error: null,
    };
  }

  private async updateAuthorizationMeta(
    authorizationId: string,
    updater: (currentMeta: MetaClientAuthorizationMetadata) => MetaClientAuthorizationMetadata
  ): Promise<ServiceResult<void>> {
    const authorizationResult = await this.getAuthorization(authorizationId);
    if (authorizationResult.error || !authorizationResult.data) {
      return {
        data: null,
        error: authorizationResult.error,
      };
    }

    const { rootMetadata, metaMetadata } = readMetadata(authorizationResult.data.metadata);
    const nextMeta = updater(metaMetadata);

    await prisma.platformAuthorization.update({
      where: { id: authorizationId },
      data: {
        metadata: {
          ...rootMetadata,
          meta: nextMeta,
        },
      },
    });

    return { data: null, error: null };
  }

  async getClientAccessTokenForOBO(input: {
    authorizationId: string;
    connectionId: string;
    agencyId?: string;
    userEmail?: string;
    ipAddress?: string;
    purpose: string;
  }): Promise<ServiceResult<{ accessToken: string }>> {
    const authorizationResult = await this.getAuthorization(input.authorizationId);
    if (authorizationResult.error || !authorizationResult.data) {
      return {
        data: null,
        error: authorizationResult.error,
      };
    }

    const authorization = authorizationResult.data;

    try {
      const tokens = await infisical.getOAuthTokens(authorization.secretId);

      await writeAuditLog(
        {
          agencyId: input.agencyId,
          connectionId: input.connectionId,
          ipAddress: input.ipAddress,
          userEmail: input.userEmail,
        },
        'META_OBO_TOKEN_READ',
        {
          authorizationId: input.authorizationId,
          platform: 'meta',
          purpose: input.purpose,
          secretId: authorization.secretId,
        }
      );

      return {
        data: {
          accessToken: tokens.accessToken,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: createServiceError(
          'TOKEN_READ_FAILED',
          error instanceof Error ? error.message : 'Failed to read Meta token'
        ),
      };
    }
  }

  async ensureManagedBusinessRelationship(input: {
    authorizationId: string;
    connectionId: string;
    agencyId?: string;
    userEmail?: string;
    ipAddress?: string;
    partnerBusinessId: string;
    clientBusinessId: string;
    clientBusinessAdminAccessToken: string;
  }): Promise<ServiceResult<MetaManagedBusinessLinkState>> {
    const lastAttemptAt = new Date().toISOString();
    const requestUrl = buildManagedBusinessesUrl(
      input.partnerBusinessId,
      input.clientBusinessId,
      input.clientBusinessAdminAccessToken
    );

    const response = await fetch(requestUrl, {
      method: 'POST',
    });

    if (!response.ok) {
      const graphError = await parseGraphError(response);
      const failedState: MetaManagedBusinessLinkState = {
        status: 'failed',
        partnerBusinessId: input.partnerBusinessId,
        clientBusinessId: input.clientBusinessId,
        lastAttemptAt,
        lastErrorCode: graphError.code,
        lastErrorMessage: graphError.message,
      };

      await this.updateAuthorizationMeta(input.authorizationId, (currentMeta) => ({
        ...currentMeta,
        obo: {
          ...(currentMeta.obo || {}),
          managedBusinessLink: failedState,
        },
      }));

      await writeAuditLog(
        {
          agencyId: input.agencyId,
          connectionId: input.connectionId,
          ipAddress: input.ipAddress,
          userEmail: input.userEmail,
        },
        'META_OBO_MANAGED_BUSINESS_LINK_FAILED',
        {
          authorizationId: input.authorizationId,
          partnerBusinessId: input.partnerBusinessId,
          clientBusinessId: input.clientBusinessId,
          errorCode: graphError.code,
        }
      );

      return {
        data: null,
        error: graphError,
      };
    }

    const linkedState: MetaManagedBusinessLinkState = {
      status: 'linked',
      partnerBusinessId: input.partnerBusinessId,
      clientBusinessId: input.clientBusinessId,
      establishedAt: lastAttemptAt,
      lastAttemptAt,
    };

    await this.updateAuthorizationMeta(input.authorizationId, (currentMeta) => ({
      ...currentMeta,
      obo: {
        ...(currentMeta.obo || {}),
        managedBusinessLink: linkedState,
      },
    }));

    await writeAuditLog(
      {
        agencyId: input.agencyId,
        connectionId: input.connectionId,
        ipAddress: input.ipAddress,
        userEmail: input.userEmail,
      },
      'META_OBO_MANAGED_BUSINESS_LINKED',
      {
        authorizationId: input.authorizationId,
        partnerBusinessId: input.partnerBusinessId,
        clientBusinessId: input.clientBusinessId,
      }
    );

    return {
      data: linkedState,
      error: null,
    };
  }

  async provisionClientBusinessSystemUserToken(input: {
    authorizationId: string;
    connectionId: string;
    agencyId?: string;
    userEmail?: string;
    ipAddress?: string;
    clientBusinessId: string;
    scopes: string[];
    partnerBusinessAdminSystemUserAccessToken: string;
  }): Promise<ServiceResult<MetaSystemUserProvisionState>> {
    const lastAttemptAt = new Date().toISOString();
    const tokenUrl = buildClientSystemUserTokenUrl(
      input.clientBusinessId,
      input.scopes,
      input.partnerBusinessAdminSystemUserAccessToken
    );

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
    });

    if (!tokenResponse.ok) {
      const graphError = await parseGraphError(tokenResponse);
      const failedState: MetaSystemUserProvisionState = {
        status: 'failed',
        clientBusinessId: input.clientBusinessId,
        appId: env.META_APP_ID,
        scopes: input.scopes,
        lastAttemptAt,
        lastErrorCode: graphError.code,
        lastErrorMessage: graphError.message,
      };

      await this.updateAuthorizationMeta(input.authorizationId, (currentMeta) => ({
        ...currentMeta,
        obo: {
          ...(currentMeta.obo || {}),
          clientSystemUser: failedState,
        },
      }));

      return {
        data: null,
        error: graphError,
      };
    }

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenPayload.access_token) {
      return {
        data: null,
        error: createServiceError(
          'META_API_INVALID_RESPONSE',
          'Meta did not return a client system-user access token'
        ),
      };
    }

    const secretName = `meta_obo_system_user_${input.authorizationId}_${input.clientBusinessId}`;
    const tokenSecretId = await infisical.storeOAuthTokens(secretName, {
      accessToken: tokenPayload.access_token,
    });

    const systemUserResponse = await fetch(buildGraphMeUrl(tokenPayload.access_token), {
      method: 'GET',
    });

    if (!systemUserResponse.ok) {
      const graphError = await parseGraphError(systemUserResponse);
      return {
        data: null,
        error: graphError,
      };
    }

    const systemUserPayload = (await systemUserResponse.json()) as { id?: string };
    if (!systemUserPayload.id) {
      return {
        data: null,
        error: createServiceError(
          'META_API_INVALID_RESPONSE',
          'Meta did not return the client system-user ID'
        ),
      };
    }

    const readyState: MetaSystemUserProvisionState = {
      status: 'ready',
      clientBusinessId: input.clientBusinessId,
      appId: env.META_APP_ID,
      scopes: input.scopes,
      systemUserId: systemUserPayload.id,
      tokenSecretId,
      provisionedAt: lastAttemptAt,
      lastAttemptAt,
    };

    await this.updateAuthorizationMeta(input.authorizationId, (currentMeta) => ({
      ...currentMeta,
      obo: {
        ...(currentMeta.obo || {}),
        clientSystemUser: readyState,
      },
    }));

    await writeAuditLog(
      {
        agencyId: input.agencyId,
        connectionId: input.connectionId,
        ipAddress: input.ipAddress,
        userEmail: input.userEmail,
      },
      'META_OBO_SYSTEM_USER_PROVISIONED',
      {
        authorizationId: input.authorizationId,
        clientBusinessId: input.clientBusinessId,
        systemUserId: systemUserPayload.id,
        tokenSecretId,
        scopes: input.scopes,
      }
    );

    return {
      data: readyState,
      error: null,
    };
  }
}

export const metaOBOService = new MetaOBOService();
