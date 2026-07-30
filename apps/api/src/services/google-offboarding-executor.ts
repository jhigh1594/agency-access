import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { resolveGoogleNativeGrantDispatchMode } from '@/lib/worker-runtime';
import { auditService } from '@/services/audit.service';
import { clientOffboardingService } from '@/services/client-offboarding.service';
import { refreshClientPlatformAuthorization } from '@/services/token-lifecycle.service';
import {
  revokeAdsManagerLink,
  revokeAdsDirectUser,
  revokeAdsPendingInvitation,
  revokeGa4AccessBinding,
  revokeBusinessAdmin,
  revokeBusinessLocationAdmin,
  revokeGtmUserPermission,
  revokeMerchantUser,
  buildSearchConsoleHandoff,
  type OffboardingProviderResult,
} from '@/services/connectors/google-offboarding';

type CleanupResult = 'deleted' | 'already_absent' | 'failed' | 'blocked';

type ExecuteRunResult = {
  runId: string;
  finalStatus: string;
  itemsProcessed: number;
  errors: string[];
};

type ExecuteCleanupResult = {
  runId: string;
  cleanupResult: CleanupResult;
  finalStatus: string;
};

const FROZEN_ITEM_STATUSES = new Set([
  'revoked_verified',
  'already_absent',
  'attestation_recorded',
  'failed_terminal',
]);

function buildCredentialGeneration(connectionId: string): string {
  return `gen-${connectionId.slice(0, 8)}`;
}

async function getFreshAccessToken(connectionId: string): Promise<string | null> {
  const tokenResult = await refreshClientPlatformAuthorization(connectionId, 'google');
  if (tokenResult.error || !tokenResult.data?.accessToken) {
    return null;
  }
  return tokenResult.data.accessToken;
}

async function revokeProviderItem(
  item: {
    productId: string;
    assetLabel: string;
    grant: {
      id: string;
      product: string;
      assetId: string;
      assetName: string;
    } | null;
  },
  token: string,
): Promise<OffboardingProviderResult> {
  const grant = item.grant;
  const product = item.productId;

  if (product === 'google_search_console') {
    return buildSearchConsoleHandoff(grant?.assetId ?? '');
  }

  if (!grant) {
    return {
      success: false,
      providerOutcome: 'terminal_failure',
      reason: 'No grant record found for item',
      retryable: false,
    };
  }

  switch (product) {
    case 'google_ads': {
      const metadata = (grant as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
      const managerCustomerId = (grant as Record<string, unknown>).managerCustomerId as string | undefined;
      const recipientEmail = (grant as Record<string, unknown>).recipientEmail as string | undefined;

      if (
        (grant as Record<string, unknown>).grantMode === 'manager_link' &&
        managerCustomerId &&
        (grant as Record<string, unknown>).providerExternalId
      ) {
        return revokeAdsManagerLink(
          token,
          managerCustomerId,
          (grant as Record<string, unknown>).providerExternalId as string,
        );
      }

      if (recipientEmail && (grant as Record<string, unknown>).providerExternalId) {
        return revokeAdsDirectUser(
          token,
          grant.assetId,
          (grant as Record<string, unknown>).providerExternalId as string,
        );
      }

      if (recipientEmail && (grant as Record<string, unknown>).providerResourceName) {
        const invitationId = ((grant as Record<string, unknown>).providerResourceName as string).split('/').pop();
        if (invitationId) {
          return revokeAdsPendingInvitation(token, grant.assetId, invitationId);
        }
      }

      return {
        success: false,
        providerOutcome: 'terminal_failure',
        reason: 'No revocation target found for Google Ads item',
        retryable: false,
      };
    }

    case 'ga4': {
      const metadata = (grant as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
      const bindingId = metadata?.providerExternalId as string | undefined;
      if (!bindingId) {
        return {
          success: false,
          providerOutcome: 'terminal_failure',
          reason: 'No access binding ID found for GA4 item',
          retryable: false,
        };
      }
      const parts = grant.assetId.split('/');
      const property = parts.length > 1 ? `properties/${parts[parts.length - 1]}` : `properties/${grant.assetId}`;
      return revokeGa4AccessBinding(token, '', property, bindingId);
    }

    case 'google_business_profile':
      return revokeBusinessAdmin(token, grant.assetId, `accounts/${grant.assetId}/admins/-`);

    case 'google_tag_manager': {
      const meta = (grant as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
      const permissionId = meta?.providerExternalId as string | undefined;
      if (!permissionId) {
        return {
          success: false,
          providerOutcome: 'terminal_failure',
          reason: 'No permission ID found for GTM item',
          retryable: false,
        };
      }
      return revokeGtmUserPermission(token, grant.assetId, permissionId);
    }

    case 'google_merchant_center': {
      const meta = (grant as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
      const userId = meta?.providerExternalId as string | undefined;
      if (!userId) {
        return {
          success: false,
          providerOutcome: 'terminal_failure',
          reason: 'No user ID found for Merchant Center item',
          retryable: false,
        };
      }
      return revokeMerchantUser(token, grant.assetId, userId);
    }

    default:
      return {
        success: false,
        providerOutcome: 'terminal_failure',
        reason: `Unknown product: ${product}`,
        retryable: false,
      };
  }
}

async function claimItem(itemId: string, runId: string): Promise<boolean> {
  const result = await prisma.googleOffboardingItem.updateMany({
    where: {
      id: itemId,
      runId,
      status: 'pending',
    },
    data: { status: 'executing' },
  });
  return result.count > 0;
}

function deriveItemTerminalStatus(
  providerResult: OffboardingProviderResult,
): { status: string; providerOutcome: string } {
  if (providerResult.success) {
    switch (providerResult.providerOutcome) {
      case 'deleted':
        return { status: 'revoked_verified', providerOutcome: 'deleted' };
      case 'already_absent':
        return { status: 'already_absent', providerOutcome: 'already_absent' };
      case 'manual_handoff':
        return { status: 'manual_action_required', providerOutcome: 'manual_handoff' };
      default:
        return { status: 'revoked_verified', providerOutcome: providerResult.providerOutcome };
    }
  }

  if (providerResult.retryable) {
    return { status: 'failed_retryable', providerOutcome: providerResult.providerOutcome };
  }

  return { status: 'failed_terminal', providerOutcome: providerResult.providerOutcome };
}

export async function executeRun(runId: string): Promise<ExecuteRunResult> {
  const run = await prisma.googleOffboardingRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    throw new Error(`Offboarding run ${runId} not found`);
  }

  if (run.status === 'executing' || run.status === 'receipt_pending' || run.status === 'completed' ||
      run.status === 'completed_with_manual_follow_up' || run.status === 'incomplete' || run.status === 'canceled') {
    return {
      runId,
      finalStatus: run.status,
      itemsProcessed: 0,
      errors: ['Run is already in a terminal or in-progress state'],
    };
  }

  const expectedGeneration = buildCredentialGeneration(run.connectionId);
  if (run.credentialGeneration && run.credentialGeneration !== expectedGeneration) {
    throw new Error('Credential generation mismatch: tokens may have been refreshed since preparation');
  }

  if (!run.credentialGeneration) {
    await prisma.googleOffboardingRun.update({
      where: { id: runId },
      data: { credentialGeneration: expectedGeneration },
    });
  }

  await prisma.googleOffboardingRun.update({
    where: { id: runId },
    data: { status: 'executing' },
  });

  await auditService.createAuditLog({
    agencyId: run.agencyId,
    action: 'OFFBOARDING_RUN_STARTED',
    resourceType: 'google_offboarding_run',
    resourceId: runId,
    metadata: { connectionId: run.connectionId, snapshotHash: run.snapshotHash },
  });

  const items = await prisma.googleOffboardingItem.findMany({
    where: {
      runId,
      classification: 'eligible_automatic',
      status: 'pending',
    },
    include: {
      grant: { select: { id: true, product: true, assetId: true, assetName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  let itemsProcessed = 0;
  const errors: string[] = [];

  for (const item of items) {
    const claimed = await claimItem(item.id, runId);
    if (!claimed) {
      itemsProcessed++;
      continue;
    }

    const token = await getFreshAccessToken(run.connectionId);
    if (!token) {
      await prisma.googleOffboardingItem.update({
        where: { id: item.id },
        data: { status: 'failed_retryable', reason: 'Failed to obtain fresh access token' },
      });
      await clientOffboardingService.addAttempt({
        itemId: item.id,
        runId,
        action: 'provider_call',
        providerOutcome: 'transient_failure',
        errorCode: 'TOKEN_UNAVAILABLE',
        errorMessage: 'Failed to obtain fresh access token',
      });
      errors.push(`Item ${item.id}: token unavailable`);
      itemsProcessed++;
      continue;
    }

    const providerResult = await revokeProviderItem(item as any, token);
    const terminal = deriveItemTerminalStatus(providerResult);

    await clientOffboardingService.addAttempt({
      itemId: item.id,
      runId,
      action: 'provider_call',
      providerOutcome: providerResult.providerOutcome,
      requestId: providerResult.requestId,
      responseClassification: providerResult.success ? 'success' : (providerResult.retryable ? 'transient_failure' : 'terminal_failure'),
      errorCode: providerResult.success ? undefined : 'PROVIDER_ERROR',
      errorMessage: providerResult.reason,
    });

    await prisma.googleOffboardingItem.update({
      where: { id: item.id },
      data: {
        status: terminal.status,
        providerOutcome: terminal.providerOutcome,
        reason: providerResult.reason,
      },
    });

    await auditService.createAuditLog({
      agencyId: run.agencyId,
      action: 'OFFBOARDING_ITEM_COMPLETED',
      resourceType: 'google_offboarding_item',
      resourceId: item.id,
      metadata: {
        runId,
        productId: item.productId,
        classification: item.classification,
        providerOutcome: terminal.providerOutcome,
        itemStatus: terminal.status,
      },
    });

    itemsProcessed++;
  }

  const searchConsoleItems = await prisma.googleOffboardingItem.findMany({
    where: {
      runId,
      classification: 'eligible_automatic',
      productId: 'google_search_console',
      status: 'pending',
    },
  });

  for (const scItem of searchConsoleItems) {
    const handoff = buildSearchConsoleHandoff(scItem.assetLabel);

    await clientOffboardingService.addAttempt({
      itemId: scItem.id,
      runId,
      action: 'provider_call',
      providerOutcome: 'manual_handoff',
      responseClassification: 'success',
      errorMessage: handoff.reason,
    });

    await prisma.googleOffboardingItem.update({
      where: { id: scItem.id },
      data: {
        status: 'attestation_recorded',
        providerOutcome: 'manual_handoff',
        reason: handoff.reason,
      },
    });
  }

  const finalStatus = await clientOffboardingService.deriveRunStatus({ runId, assumeStatus: 'executing' });

  return { runId, finalStatus, itemsProcessed, errors };
}

export async function executeCleanup(runId: string): Promise<ExecuteCleanupResult> {
  const run = await prisma.googleOffboardingRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    throw new Error(`Offboarding run ${runId} not found`);
  }

  if (run.status !== 'executing' && run.status !== 'receipt_pending') {
    throw new Error(`Run ${runId} is not in an executable state for cleanup (current: ${run.status})`);
  }

  const automaticItems = await prisma.googleOffboardingItem.findMany({
    where: {
      runId,
      classification: 'eligible_automatic',
    },
  });

  for (const item of automaticItems) {
    if (item.productId === 'google_search_console') continue;

    if (item.status !== 'revoked_verified' && item.status !== 'already_absent') {
      return {
        runId,
        cleanupResult: 'blocked' as CleanupResult,
        finalStatus: run.status,
      };
    }
  }

  const connection = await prisma.clientConnection.findUnique({
    where: { id: run.connectionId },
  });

  let cleanupResult: CleanupResult = 'already_absent' as CleanupResult;

  if (connection) {
    const auth = await prisma.platformAuthorization.findFirst({
      where: {
        connectionId: run.connectionId,
        platform: 'google',
      },
      select: { secretId: true },
    });

    if (auth?.secretId) {
      try {
        await infisical.deleteOAuthTokens(auth.secretId);
        cleanupResult = 'deleted';
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        const isNotFound = message.includes('404') || message.includes('not found') || message.includes('Not found');
        cleanupResult = isNotFound ? 'already_absent' : 'failed';
      }
    }
  } else {
    cleanupResult = 'already_absent';
  }

  await clientOffboardingService.addAttempt({
    itemId: runId,
    runId,
    action: 'secret_cleanup',
    providerOutcome: cleanupResult,
    responseClassification: cleanupResult === 'blocked' ? 'terminal_failure' : 'success',
  });

  await auditService.createAuditLog({
    agencyId: run.agencyId,
    action: 'OFFBOARDING_SECRET_CLEANUP',
    resourceType: 'google_offboarding_run',
    resourceId: runId,
    metadata: {
      connectionId: run.connectionId,
      cleanupResult,
    },
  });

  const items = await prisma.googleOffboardingItem.findMany({ where: { runId } });
  const hasManualItems = items.some(
    (i) => i.productId === 'google_search_console' || i.classification !== 'eligible_automatic',
  );

  let finalStatus: string;
  if (cleanupResult === 'blocked') {
    finalStatus = 'incomplete';
  } else if (cleanupResult === 'failed') {
    finalStatus = 'incomplete';
  } else if (hasManualItems) {
    finalStatus = 'completed_with_manual_follow_up';
  } else {
    finalStatus = 'completed';
  }

  await prisma.googleOffboardingRun.update({
    where: { id: runId },
    data: {
      status: finalStatus,
      finalOutcome: finalStatus,
    },
  });

  return { runId, cleanupResult, finalStatus };
}

export async function buildReceipt(runId: string) {
  const receipt = await clientOffboardingService.serializeReceipt({ runId });

  const items = receipt.items as Array<Record<string, unknown>>;
  const enrichedItems = items.map((item) => {
    const sanitized: Record<string, unknown> = { ...item };
    if (sanitized.providerOutcome === 'manual_handoff' && typeof sanitized.reason === 'string') {
      sanitized.manualHandoffInstructions = sanitized.reason;
      delete sanitized.reason;
    }
    return sanitized;
  });

  const attempts = receipt.attempts as Array<Record<string, unknown>>;
  const cleanupAttempt = attempts.find((a) => a.action === 'secret_cleanup');

  return {
    run: receipt.run,
    items: enrichedItems,
    attempts: attempts.map((a) => {
      const { action, providerOutcome, responseClassification, createdAt } = a;
      return { action, providerOutcome, responseClassification, createdAt };
    }),
    secretCleanupResult: cleanupAttempt
      ? { outcome: cleanupAttempt.providerOutcome, createdAt: cleanupAttempt.createdAt }
      : null,
  };
}

export async function dispatchOffboardingRun(runId: string): Promise<void> {
  const dispatchMode = resolveGoogleNativeGrantDispatchMode(
    process.env.BACKGROUND_WORKERS_ENABLED,
  );

  if (dispatchMode === 'inline') {
    await executeRun(runId);
  } else {
    const { enqueueJob } = await import('@/lib/pg-boss.js');
    await enqueueJob('google-client-offboarding', { runId } as any, {
      singletonKey: `google-client-offboarding-${runId}`,
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
    });
  }
}
