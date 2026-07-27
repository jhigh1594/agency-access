import {
  MetaAccessRequirementSnapshotSchema,
  type MetaAssetGrantLifecycle,
  type MetaRecipeAssetKind,
} from '@agency-platform/shared';
import { prisma } from '@/lib/prisma';
import { metaAccessStatusService } from './meta-access-status.service.js';
import { metaPartnerService } from './meta-partner.service.js';

type SelectedMetaAsset = { id: string; name?: string };

export type MetaGrantOrchestrationInput = {
  agencyId: string;
  accessRequestId: string;
  connectionId: string;
  authorizationId: string;
  clientBusinessId: string;
  clientSystemUserAccessToken: string;
  selectedAssets: Partial<Record<MetaRecipeAssetKind, SelectedMetaAsset[]>>;
  instagramRelationshipEvidence?: Record<string, { pageId: string; observedAt: string }>;
};

export type MetaGrantOrchestrationItem = {
  assetId: string;
  assetKind: MetaRecipeAssetKind;
  requestedTasks: string[];
  verifiedTasks: string[];
  status: MetaAssetGrantLifecycle;
  grantMethod: 'automatic' | 'manual_partner_share' | 'relationship_backed';
  nextActor?: string;
  errorCode?: string;
  errorMessage?: string;
};

function classifyProviderFailure(error: unknown): {
  code: string;
  message: string;
  nextActor: 'client' | 'agency' | 'retry';
} {
  const message = error instanceof Error ? error.message : String(error);
  if (/rate limit|too many|code.?4|code.?17|code.?32|code.?613/i.test(message)) {
    return { code: 'META_PROVIDER_RATE_LIMIT', message, nextActor: 'retry' };
  }
  if (/permission|not authorized|admin|access denied/i.test(message)) {
    return { code: 'META_PROVIDER_PERMISSION_DENIED', message, nextActor: 'client' };
  }
  return { code: 'META_PROVIDER_ERROR', message, nextActor: 'retry' };
}

async function execute(input: MetaGrantOrchestrationInput) {
  const accessRequest = await prisma.accessRequest.findFirst({
    where: { id: input.accessRequestId, agencyId: input.agencyId },
    select: { id: true, metaAccessConfig: true },
  });
  const snapshotResult = MetaAccessRequirementSnapshotSchema.safeParse(accessRequest?.metaAccessConfig);
  if (!accessRequest || !snapshotResult.success) {
    return {
      data: null,
      error: { code: 'META_RECIPE_SNAPSHOT_REQUIRED', message: 'This request does not have a valid Meta recipe snapshot' },
    };
  }
  const snapshot = snapshotResult.data;
  const destination = await prisma.metaAgencyDestination.findFirst({
    where: { id: snapshot.destinationId, agencyId: input.agencyId, readinessStatus: 'ready' },
    select: { id: true, agencyConnection: { select: { metadata: true } } },
  });
  if (!destination) {
    return {
      data: null,
      error: { code: 'META_DESTINATION_NOT_READY', message: 'The stored receiving destination is not ready' },
    };
  }
  const destinationMetadata = destination.agencyConnection.metadata &&
    typeof destination.agencyConnection.metadata === 'object' &&
    !Array.isArray(destination.agencyConnection.metadata)
    ? destination.agencyConnection.metadata as Record<string, unknown>
    : {};
  const agencySystemUserId = typeof destinationMetadata.systemUserId === 'string'
    ? destinationMetadata.systemUserId
    : null;
  if (!agencySystemUserId) {
    return {
      data: null,
      error: {
        code: 'META_DESTINATION_SYSTEM_USER_MISSING',
        message: 'The receiving destination does not have a verified agency system user',
      },
    };
  }

  for (const requirement of snapshot.requirements) {
    if (requirement.required && (input.selectedAssets[requirement.assetKind] || []).length === 0) {
      return {
        data: null,
        error: {
          code: 'META_REQUIRED_ASSET_SELECTION_MISSING',
          message: `Select at least one ${requirement.assetKind} for ${snapshot.recipeName}`,
        },
      };
    }
  }

  const previous = await metaAccessStatusService.listForRequest(input.accessRequestId);
  if (previous.error) return previous;
  const verifiedKeys = new Set(
    (previous.data || [])
      .filter((grant) => {
        if (
          grant.source !== 'normalized' ||
          grant.status !== 'verified' ||
          grant.destinationId !== snapshot.destinationId ||
          grant.clientBusinessId !== input.clientBusinessId ||
          grant.recipeId !== snapshot.recipeId ||
          grant.recipeVersion !== snapshot.recipeVersion
        ) {
          return false;
        }
        const requirement = snapshot.requirements.find((item) => item.assetKind === grant.assetKind);
        const verifiedTasks = Array.isArray(grant.verifiedTasks) ? grant.verifiedTasks : [];
        return Boolean(
          requirement && requirement.providerTasks.every((task) => verifiedTasks.includes(task))
        );
      })
      .map((grant) => `${grant.assetKind}:${grant.assetId}`)
  );
  const results: MetaGrantOrchestrationItem[] = [];

  for (const requirement of snapshot.requirements) {
    const selected = input.selectedAssets[requirement.assetKind] || [];
    for (const asset of selected) {
      const key = `${requirement.assetKind}:${asset.id}`;
      if (verifiedKeys.has(key)) {
        results.push({
          assetId: asset.id,
          assetKind: requirement.assetKind,
          requestedTasks: [...requirement.providerTasks],
          verifiedTasks: [...requirement.providerTasks],
          status: 'verified',
          grantMethod: requirement.assetKind === 'instagram_account' ? 'relationship_backed' : 'automatic',
        });
        continue;
      }

      const now = new Date();
      let item: MetaGrantOrchestrationItem;
      if (requirement.assetKind === 'instagram_account') {
        const evidence = input.instagramRelationshipEvidence?.[asset.id];
        const pageVerified = evidence && verifiedKeys.has(`page:${evidence.pageId}`);
        item = pageVerified
          ? {
              assetId: asset.id,
              assetKind: requirement.assetKind,
              requestedTasks: [],
              verifiedTasks: [],
              status: 'verified',
              grantMethod: 'relationship_backed',
            }
          : {
              assetId: asset.id,
              assetKind: requirement.assetKind,
              requestedTasks: [],
              verifiedTasks: [],
              status: 'action_required',
              grantMethod: 'relationship_backed',
              nextActor: 'client',
              errorCode: 'META_INSTAGRAM_RELATIONSHIP_UNVERIFIED',
              errorMessage: 'Verify the professional Instagram account is linked to a selected, verified Page.',
            };
      } else {
        try {
          if (requirement.assetKind === 'page') {
            await metaPartnerService.grantPageAccess(
              input.clientSystemUserAccessToken,
              asset.id,
              agencySystemUserId,
              [...requirement.providerTasks]
            );
          } else {
            await metaPartnerService.grantAdAccountAccess(
              input.clientSystemUserAccessToken,
              asset.id,
              agencySystemUserId,
              [...requirement.providerTasks]
            );
          }
          const verification = requirement.assetKind === 'page'
            ? await metaPartnerService.verifyPageAccess(
                input.clientSystemUserAccessToken,
                asset.id,
                agencySystemUserId,
                [...requirement.providerTasks]
              )
            : await metaPartnerService.verifyAdAccountAccess(
                input.clientSystemUserAccessToken,
                asset.id,
                agencySystemUserId,
                [...requirement.providerTasks]
              );
          item = verification.verified
            ? {
                assetId: asset.id,
                assetKind: requirement.assetKind,
                requestedTasks: [...requirement.providerTasks],
                verifiedTasks: [...requirement.providerTasks],
                status: 'verified',
                grantMethod: 'automatic',
              }
            : {
                assetId: asset.id,
                assetKind: requirement.assetKind,
                requestedTasks: [...requirement.providerTasks],
                verifiedTasks: [],
                status: 'action_required',
                grantMethod: 'manual_partner_share',
                nextActor: 'client',
                errorCode: 'META_ASSIGNED_USER_VERIFICATION_FAILED',
                errorMessage: 'Meta did not return every requested task. Complete partner sharing, then check access again.',
              };
        } catch (error) {
          const classified = classifyProviderFailure(error);
          item = {
            assetId: asset.id,
            assetKind: requirement.assetKind,
            requestedTasks: [...requirement.providerTasks],
            verifiedTasks: [],
            status: classified.nextActor === 'retry' ? 'failed' : 'action_required',
            grantMethod: classified.nextActor === 'retry' ? 'automatic' : 'manual_partner_share',
            nextActor: classified.nextActor,
            errorCode: classified.code,
            errorMessage: classified.message,
          };
        }
      }

      const persisted = await metaAccessStatusService.upsertGrant({
        agencyId: input.agencyId,
        accessRequestId: input.accessRequestId,
        connectionId: input.connectionId,
        authorizationId: input.authorizationId,
        destinationId: snapshot.destinationId,
        clientBusinessId: input.clientBusinessId,
        recipeId: snapshot.recipeId,
        recipeVersion: snapshot.recipeVersion,
        assetKind: item.assetKind,
        assetId: item.assetId,
        assetName: asset.name,
        requestedTasks: item.requestedTasks,
        verifiedTasks: item.verifiedTasks,
        grantMethod: item.grantMethod,
        status: item.status,
        lastErrorCode: item.errorCode,
        lastErrorMessage: item.errorMessage,
        nextActor: item.nextActor,
        grantedAt: item.status === 'verified' ? now : undefined,
        verifiedAt: item.status === 'verified' ? now : undefined,
        metadata: requirement.assetKind === 'instagram_account'
          ? (input.instagramRelationshipEvidence?.[asset.id] as any)
          : undefined,
      });
      if (persisted.error) return persisted;
      results.push(item);
      if (item.status === 'verified') {
        verifiedKeys.add(key);
      }
    }
  }

  return {
    data: {
      recipeId: snapshot.recipeId,
      recipeVersion: snapshot.recipeVersion,
      destinationId: snapshot.destinationId,
      status: results.length > 0 && results.every((item) => item.status === 'verified') ? 'verified' : 'partial',
      grants: results,
    },
    error: null,
  };
}

export const metaGrantOrchestratorService = { execute, classifyProviderFailure };
