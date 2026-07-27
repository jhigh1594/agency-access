import {
  MetaAccessRequirementSnapshotSchema,
  MetaClientAuthorizationMetadataSchema,
  type MetaAccessRecipeId,
  type MetaAssetGrantLifecycle,
  type MetaRecipeAssetKind,
} from '@agency-platform/shared';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type Result<T> = {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
};

export type MetaGrantUpsertInput = {
  agencyId: string;
  accessRequestId: string;
  connectionId: string;
  authorizationId?: string;
  destinationId: string;
  clientBusinessId: string;
  recipeId: MetaAccessRecipeId;
  recipeVersion: number;
  assetKind: MetaRecipeAssetKind;
  assetId: string;
  assetName?: string;
  requestedTasks: string[];
  verifiedTasks?: string[];
  grantMethod: string;
  status: MetaAssetGrantLifecycle;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  nextActor?: string;
  grantedAt?: Date;
  verifiedAt?: Date;
  metadata?: Prisma.InputJsonValue;
};

const ALLOWED_TRANSITIONS: Record<MetaAssetGrantLifecycle, ReadonlySet<MetaAssetGrantLifecycle>> = {
  pending: new Set(['granting', 'failed']),
  granting: new Set(['verifying', 'action_required', 'failed']),
  verifying: new Set(['verified', 'action_required', 'failed']),
  verified: new Set(['verifying']),
  action_required: new Set(['verifying', 'granting', 'failed']),
  failed: new Set(['granting']),
};

async function upsertGrant(input: MetaGrantUpsertInput): Promise<Result<any>> {
  try {
    const grant = await prisma.$transaction(async (tx) => {
      const [request, destination, connection, authorization] = await Promise.all([
        tx.accessRequest.findUnique({ where: { id: input.accessRequestId }, select: { id: true, agencyId: true } }),
        tx.metaAgencyDestination.findFirst({ where: { id: input.destinationId, agencyId: input.agencyId }, select: { id: true } }),
        tx.clientConnection.findUnique({ where: { id: input.connectionId }, select: { id: true, accessRequestId: true, agencyId: true } }),
        input.authorizationId
          ? tx.platformAuthorization.findUnique({
              where: { id: input.authorizationId },
              select: { id: true, connectionId: true, platform: true },
            })
          : Promise.resolve(null),
      ]);

      const authorizationMismatch = Boolean(
        input.authorizationId && (
          !authorization ||
          authorization.connectionId !== input.connectionId ||
          !['meta', 'meta_ads'].includes(authorization.platform)
        )
      );
      if (!request || request.agencyId !== input.agencyId || !destination || !connection || connection.agencyId !== input.agencyId || connection.accessRequestId !== input.accessRequestId || authorizationMismatch) {
        throw new Error('META_GRANT_OWNERSHIP_MISMATCH');
      }

      const now = new Date();
      return tx.metaAssetGrant.upsert({
        where: {
          accessRequestId_destinationId_clientBusinessId_assetKind_assetId: {
            accessRequestId: input.accessRequestId,
            destinationId: input.destinationId,
            clientBusinessId: input.clientBusinessId,
            assetKind: input.assetKind,
            assetId: input.assetId,
          },
        },
        create: {
          accessRequestId: input.accessRequestId,
          connectionId: input.connectionId,
          authorizationId: input.authorizationId,
          destinationId: input.destinationId,
          clientBusinessId: input.clientBusinessId,
          recipeId: input.recipeId,
          recipeVersion: input.recipeVersion,
          assetKind: input.assetKind,
          assetId: input.assetId,
          assetName: input.assetName,
          requestedTasks: input.requestedTasks,
          verifiedTasks: input.verifiedTasks,
          grantMethod: input.grantMethod,
          status: input.status,
          lastErrorCode: input.lastErrorCode,
          lastErrorMessage: input.lastErrorMessage,
          nextActor: input.nextActor,
          lastAttemptAt: now,
          grantedAt: input.grantedAt,
          verifiedAt: input.verifiedAt,
          metadata: input.metadata,
        },
        update: {
          authorizationId: input.authorizationId,
          assetName: input.assetName,
          requestedTasks: input.requestedTasks,
          verifiedTasks: input.verifiedTasks,
          grantMethod: input.grantMethod,
          status: input.status,
          lastErrorCode: input.lastErrorCode,
          lastErrorMessage: input.lastErrorMessage,
          nextActor: input.nextActor,
          lastAttemptAt: now,
          grantedAt: input.grantedAt,
          verifiedAt: input.verifiedAt,
          metadata: input.metadata,
        },
      });
    });

    return { data: grant, error: null };
  } catch (error) {
    const ownershipMismatch = error instanceof Error && error.message === 'META_GRANT_OWNERSHIP_MISMATCH';
    return {
      data: null,
      error: {
        code: ownershipMismatch ? 'FORBIDDEN' : 'INTERNAL_ERROR',
        message: ownershipMismatch ? 'Grant resources do not belong to the same agency and request' : 'Failed to persist Meta asset grant',
        details: ownershipMismatch ? undefined : error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function transitionGrant(
  grantId: string,
  nextStatus: MetaAssetGrantLifecycle,
  options: { newAttempt?: boolean } = {}
): Promise<Result<any>> {
  try {
    const current = await prisma.metaAssetGrant.findUnique({ where: { id: grantId } });
    if (!current) {
      return { data: null, error: { code: 'GRANT_NOT_FOUND', message: 'Meta asset grant not found' } };
    }

    const currentStatus = current.status as MetaAssetGrantLifecycle;
    if (!ALLOWED_TRANSITIONS[currentStatus]?.has(nextStatus)) {
      return {
        data: null,
        error: { code: 'INVALID_GRANT_TRANSITION', message: `Cannot transition Meta grant from ${currentStatus} to ${nextStatus}` },
      };
    }

    const updated = await prisma.metaAssetGrant.update({
      where: { id: grantId },
      data: {
        status: nextStatus,
        lastAttemptAt: new Date(),
        ...(options.newAttempt ? { attemptVersion: { increment: 1 } } : {}),
        ...(nextStatus === 'verified' ? { verifiedAt: new Date() } : {}),
      },
    });
    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to transition Meta asset grant', details: error instanceof Error ? error.message : String(error) } };
  }
}

async function listForRequest(accessRequestId: string): Promise<Result<any[]>> {
  try {
    const grants = await prisma.metaAssetGrant.findMany({
      where: { accessRequestId },
      orderBy: [{ createdAt: 'asc' }],
    });
    if (grants.length > 0) {
      return { data: grants.map((grant) => ({ ...grant, source: 'normalized' })), error: null };
    }

    const connection = await prisma.clientConnection.findUnique({
      where: { accessRequestId },
      include: { authorizations: { where: { platform: 'meta' } } },
    });
    const metadata = connection?.authorizations[0]?.metadata;
    const root = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
    const parsed = MetaClientAuthorizationMetadataSchema.safeParse(root.meta);
    const legacy = parsed.success ? parsed.data.obo?.assetGrantResults || [] : [];

    return {
      data: legacy.map((grant) => ({
        assetId: grant.assetId,
        assetKind: grant.assetType,
        requestedTasks: grant.requestedTasks,
        status: grant.status === 'unresolved' ? 'action_required' : grant.status === 'granted' ? 'verifying' : grant.status,
        grantedAt: grant.grantedAt,
        verifiedAt: grant.verifiedAt,
        lastErrorCode: grant.errorCode,
        lastErrorMessage: grant.errorMessage,
        source: 'legacy',
      })),
      error: null,
    };
  } catch (error) {
    return { data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to read Meta access status', details: error instanceof Error ? error.message : String(error) } };
  }
}

async function getFulfillmentProjection(accessRequestId: string): Promise<Result<any>> {
  try {
    const [request, grantsResult, connection] = await Promise.all([
      prisma.accessRequest.findUnique({
        where: { id: accessRequestId },
        select: { id: true, metaAccessConfig: true },
      }),
      listForRequest(accessRequestId),
      prisma.clientConnection.findUnique({
        where: { accessRequestId },
        include: {
          authorizations: {
            where: { platform: 'meta' },
            select: { status: true, expiresAt: true, metadata: true },
          },
        },
      }),
    ]);
    if (!request) {
      return { data: null, error: { code: 'REQUEST_NOT_FOUND', message: 'Access request not found' } };
    }
    if (grantsResult.error) return grantsResult;
    const snapshotResult = MetaAccessRequirementSnapshotSchema.safeParse(request.metaAccessConfig);
    if (!snapshotResult.success) {
      return {
        data: {
          mode: 'legacy',
          status: 'not_started',
          complete: false,
          oauthHealth: connection?.authorizations[0]?.status || 'missing',
          grants: grantsResult.data || [],
        },
        error: null,
      };
    }

    const snapshot = snapshotResult.data;
    const authorization = connection?.authorizations[0];
    const rootMetadata = authorization?.metadata
      && typeof authorization.metadata === 'object'
      && !Array.isArray(authorization.metadata)
      ? authorization.metadata as Record<string, unknown>
      : {};
    const metaMetadata = MetaClientAuthorizationMetadataSchema.safeParse(rootMetadata.meta);
    const activeClientBusinessId = metaMetadata.success
      ? metaMetadata.data.selection?.clientBusinessId
      : undefined;
    const grants = (grantsResult.data || []).filter((grant) => {
      if (grant.source !== 'normalized') return true;
      return grant.destinationId === snapshot.destinationId
        && grant.recipeId === snapshot.recipeId
        && grant.recipeVersion === snapshot.recipeVersion
        && (!activeClientBusinessId || grant.clientBusinessId === activeClientBusinessId);
    });
    const requiredKinds = snapshot.requirements.filter((requirement) => requirement.required);
    const requiredSatisfied = requiredKinds.every((requirement) => {
      const matching = grants.filter((grant) => grant.assetKind === requirement.assetKind);
      return matching.length > 0 && matching.every((grant) => grant.status === 'verified');
    });
    const allSelectedVerified = grants.length > 0 && grants.every((grant) => grant.status === 'verified');
    const complete = requiredSatisfied && allSelectedVerified;
    const hasActionRequired = grants.some((grant) => grant.status === 'action_required');
    const hasFailed = grants.some((grant) => grant.status === 'failed');
    const status = complete
      ? 'complete'
      : hasActionRequired
        ? 'action_required'
        : hasFailed
          ? 'failed'
          : grants.length > 0
            ? 'partial'
            : 'not_started';
    const lastNativeVerifiedAt = grants
      .map((grant) => grant.verifiedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null;

    return {
      data: {
        mode: 'outcome',
        recipeId: snapshot.recipeId,
        recipeVersion: snapshot.recipeVersion,
        destinationId: snapshot.destinationId,
        status,
        complete,
        oauthHealth: authorization?.status || 'missing',
        oauthExpiresAt: authorization?.expiresAt || null,
        lastNativeVerifiedAt,
        grants: grants.map((grant) => ({
          ...grant,
          clientLabel: grant.status === 'verified'
            ? 'Access verified'
            : grant.status === 'action_required'
              ? 'Action needed'
              : grant.status === 'failed'
                ? 'Retry needed'
                : 'In progress',
          nextActor: grant.nextActor || (grant.status === 'action_required' ? 'client' : grant.status === 'failed' ? 'agency' : null),
        })),
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to project Meta fulfillment', details: error instanceof Error ? error.message : String(error) },
    };
  }
}

export const metaAccessStatusService = { upsertGrant, transitionGrant, listForRequest, getFulfillmentProjection };
