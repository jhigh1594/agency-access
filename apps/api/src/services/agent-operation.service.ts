import { createHash } from 'crypto';
import {
  AgentApprovalPreviewSchema,
  AgentOperationResultSchema,
  AgentPermissionSchema,
  type AgentApprovalPreview,
  type AgentOperationResult,
} from '@agency-platform/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import type { AgentPrincipal, AgentRequestMetadata } from '@/lib/agent-principal.js';
import { agentPolicyService } from '@/services/agent-policy.service.js';
import { agentTelemetryService } from '@/services/agent-telemetry.service.js';

const PROHIBITED_KEY = /(access.?token|refresh.?token|api.?key|signing.?secret|secret.?id|password|credential)/i;
const STALE_EXECUTION_MS = 10 * 60 * 1000;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => {
          if (PROHIBITED_KEY.test(key)) {
            throw new Error(`Operation input contains prohibited secret field: ${key}`);
          }
          return [key, canonicalize(child)];
        })
    );
  }
  return value;
}

function parsePermissions(value: unknown) {
  return AgentPermissionSchema.array().parse(value);
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError
    ? error.code === 'P2002'
    : Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002');
}

function safeFailureMessage(retryable: boolean): string {
  return retryable
    ? 'A downstream effect did not complete; retrying this operation is safe.'
    : 'The operation could not be completed; prepare a new operation after checking current state.';
}

export class AgentOperationConflictError extends Error {
  readonly code = 'IDEMPOTENCY_CONFLICT';
}

export class AgentOperationStateError extends Error {
  readonly code = 'OPERATION_NOT_EXECUTABLE';
}

export class AgentOperationNotFoundError extends Error {
  readonly code = 'NOT_FOUND';
}

async function writeAudit(
  transaction: Pick<typeof prisma, 'auditLog'>,
  input: {
    agencyId: string;
    ownerSubject: string;
    oauthClientId: string;
    grantId: string;
    operationId: string;
    action: string;
    actionType: string;
    riskClass: string;
    status: string;
    actorType: 'agent' | 'human';
    requestMetadata: AgentRequestMetadata;
    targetResourceType?: string;
    targetResourceId?: string;
    outcome?: Record<string, string | boolean | null>;
  }
) {
  await transaction.auditLog.create({
    data: {
      agencyId: input.agencyId,
      action: input.action,
      resourceType: 'agent_operation',
      resourceId: input.operationId,
      actorType: input.actorType,
      actorId: input.ownerSubject,
      agentGrantId: input.grantId,
      agentOperationId: input.operationId,
      oauthClientId: input.oauthClientId,
      ipAddress: input.requestMetadata.ipAddress,
      userAgent: input.requestMetadata.userAgent,
      metadata: {
        actionType: input.actionType,
        riskClass: input.riskClass,
        status: input.status,
        correlationId: input.requestMetadata.correlationId,
        ...(input.targetResourceType ? { targetResourceType: input.targetResourceType } : {}),
        ...(input.targetResourceId ? { targetResourceId: input.targetResourceId } : {}),
        ...(input.outcome ? { outcome: input.outcome } : {}),
      },
    },
  });
}

export const agentOperationService = {
  hashInput(input: unknown): string {
    return createHash('sha256').update(JSON.stringify(canonicalize(input))).digest('hex');
  },

  async prepare(input: {
    principal: AgentPrincipal;
    actionType: string;
    idempotencyKey: string;
    input: unknown;
    approvalPreview?: AgentApprovalPreview;
  }) {
    if (!input.idempotencyKey || input.idempotencyKey.length > 200) {
      throw new Error('A bounded idempotency key is required');
    }
    const policy = agentPolicyService.authorize(input.principal, input.actionType);
    if (policy.riskClass === 'read') throw new Error('Read actions do not create operations');
    let snapshot;
    try {
      snapshot = canonicalize(input.input);
    } catch (error) {
      if (error instanceof Error && error.message.includes('prohibited secret field')) {
        agentTelemetryService.recordRedactionViolation({
          agencyId: input.principal.agencyId,
          grantId: input.principal.grantId,
          operationType: input.actionType,
        });
      }
      throw error;
    }
    const inputHash = this.hashInput(snapshot);
    const preview = input.approvalPreview
      ? AgentApprovalPreviewSchema.parse(input.approvalPreview)
      : undefined;
    if (policy.riskClass === 'consequential' && !preview) {
      throw new Error('Consequential actions require an approval preview');
    }
    if (preview && preview.agency.id !== input.principal.agencyId) {
      throw new Error('Approval preview agency does not match the agent grant');
    }
    const status = policy.riskClass === 'consequential' ? 'pending_approval' : 'prepared';
    const expiresAt = preview ? new Date(preview.expiresAt) : null;

    try {
      return await prisma.$transaction(async (transaction) => {
        const operation = await transaction.agentOperation.create({
          data: {
            agencyId: input.principal.agencyId,
            grantId: input.principal.grantId,
            actionType: input.actionType,
            riskClass: policy.riskClass,
            inputSnapshot: snapshot as Prisma.InputJsonValue,
            inputHash,
            approvalPreview: preview as Prisma.InputJsonValue | undefined,
            idempotencyKey: input.idempotencyKey,
            status,
            expiresAt,
          },
        });
        await writeAudit(transaction as typeof prisma, {
          agencyId: input.principal.agencyId,
          ownerSubject: input.principal.ownerSubject,
          oauthClientId: input.principal.oauthClientId,
          grantId: input.principal.grantId,
          operationId: operation.id,
          action: 'AGENT_OPERATION_PREPARED',
          actionType: input.actionType,
          riskClass: policy.riskClass,
          status,
          actorType: 'agent',
          requestMetadata: input.principal.requestMetadata,
          ...(preview?.client?.id ? { targetResourceType: 'client', targetResourceId: preview.client.id } : {}),
        });
        return operation;
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await prisma.agentOperation.findUnique({
        where: {
          grantId_idempotencyKey: {
            grantId: input.principal.grantId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (!existing || existing.inputHash !== inputHash || existing.actionType !== input.actionType) {
        throw new AgentOperationConflictError('Idempotency key was already used for different intent');
      }
      agentTelemetryService.recordDuplicateSuppression({
        agencyId: input.principal.agencyId,
        grantId: input.principal.grantId,
        operationId: existing.id,
        actionType: existing.actionType,
      });
      return existing;
    }
  },

  async getForAgent(principal: AgentPrincipal, operationId: string) {
    agentPolicyService.authorize(principal, 'operation.read');
    return this.getScoped(principal, operationId);
  },

  async getScoped(principal: AgentPrincipal, operationId: string) {
    return prisma.agentOperation.findFirst({
      where: { id: operationId, agencyId: principal.agencyId, grantId: principal.grantId },
    });
  },

  async getForOwner(agencyId: string, ownerSubject: string, operationId: string) {
    return prisma.agentOperation.findFirst({
      where: { id: operationId, agencyId, grant: { ownerSubject } },
    });
  },

  async decide(input: {
    agencyId: string;
    ownerSubject: string;
    operationId: string;
    decision: 'approved' | 'declined';
    requestMetadata: AgentRequestMetadata;
  }) {
    const decision = await prisma.$transaction(async (transaction) => {
      const operation = await transaction.agentOperation.findFirst({
        where: {
          id: input.operationId,
          agencyId: input.agencyId,
          grant: { ownerSubject: input.ownerSubject, state: 'active' },
        },
        include: { grant: true },
      });
      if (!operation) throw new AgentOperationNotFoundError('Agent operation not found');
      if (operation.status !== 'pending_approval') {
        throw new AgentOperationStateError('Agent operation is no longer pending approval');
      }
      const now = new Date();
      if (!operation.expiresAt || operation.expiresAt <= now) {
        await transaction.agentOperation.updateMany({
          where: { id: operation.id, status: 'pending_approval' },
          data: { status: 'expired', completedAt: now, retryable: false },
        });
        return { expired: true as const };
      }
      const grantPermissions = parsePermissions(operation.grant.permissions);
      agentPolicyService.authorize({ permissions: grantPermissions }, operation.actionType);
      const claimed = await transaction.agentOperation.updateMany({
        where: { id: operation.id, agencyId: input.agencyId, status: 'pending_approval' },
        data: {
          status: input.decision,
          decidedBy: input.ownerSubject,
          decidedAt: now,
          ...(input.decision === 'declined' ? { completedAt: now, retryable: false } : {}),
        },
      });
      if (claimed.count !== 1) {
        throw new AgentOperationStateError('Agent operation decision was already recorded');
      }
      await writeAudit(transaction as typeof prisma, {
        agencyId: input.agencyId,
        ownerSubject: input.ownerSubject,
        oauthClientId: operation.grant.oauthClientId,
        grantId: operation.grantId,
        operationId: operation.id,
        action: input.decision === 'approved' ? 'AGENT_OPERATION_APPROVED' : 'AGENT_OPERATION_DECLINED',
        actionType: operation.actionType,
        riskClass: operation.riskClass,
        status: input.decision,
        actorType: 'human',
        requestMetadata: input.requestMetadata,
        ...((operation.approvalPreview as any)?.client?.id
          ? { targetResourceType: 'client', targetResourceId: (operation.approvalPreview as any).client.id }
          : {}),
        outcome: { decision: input.decision },
      });
      return { expired: false as const, operation: { ...operation, status: input.decision, decidedBy: input.ownerSubject, decidedAt: now } };
    });
    if (decision.expired) {
      throw new AgentOperationStateError('Agent operation approval has expired');
    }
    agentTelemetryService.recordApprovalDecision({
      agencyId: input.agencyId,
      grantId: decision.operation.grantId,
      operationId: decision.operation.id,
      decision: input.decision,
      latencyMs: decision.operation.decidedAt!.getTime() - decision.operation.createdAt.getTime(),
    });
    return decision.operation;
  },

  async execute(input: {
    principal: AgentPrincipal;
    operationId: string;
    effect: (snapshot: unknown) => Promise<AgentOperationResult>;
    revalidate?: (snapshot: unknown) => Promise<boolean>;
  }): Promise<{ operation: unknown; claimed: boolean }> {
    let operation = await prisma.agentOperation.findFirst({
      where: { id: input.operationId, agencyId: input.principal.agencyId, grantId: input.principal.grantId },
    });
    if (!operation) throw new AgentOperationNotFoundError('Agent operation not found');
    if (
      operation.status === 'executing' &&
      operation.executionStartedAt &&
      operation.executionStartedAt.getTime() <= Date.now() - STALE_EXECUTION_MS
    ) {
      const recovered = await prisma.agentOperation.updateMany({
        where: { id: operation.id, status: 'executing', executionStartedAt: operation.executionStartedAt },
        data: { status: 'failed_retryable', retryable: true, failureCode: 'STALE_EXECUTION' },
      });
      if (recovered.count === 1) {
        operation = { ...operation, status: 'failed_retryable', retryable: true, failureCode: 'STALE_EXECUTION' };
      }
    }
    const executable = operation.riskClass === 'reversible'
      ? ['prepared', 'failed_retryable']
      : ['approved', 'failed_retryable'];
    if (!executable.includes(operation.status)) {
      throw new AgentOperationStateError(`Agent operation cannot execute from ${operation.status}`);
    }
    if (operation.expiresAt && operation.expiresAt <= new Date()) {
      await prisma.agentOperation.updateMany({
        where: { id: operation.id, status: operation.status },
        data: { status: 'expired', completedAt: new Date(), retryable: false },
      });
      throw new AgentOperationStateError('Agent operation approval has expired');
    }
    const grant = await prisma.agentGrant.findFirst({
      where: {
        id: input.principal.grantId,
        agencyId: input.principal.agencyId,
        ownerSubject: input.principal.ownerSubject,
        oauthClientId: input.principal.oauthClientId,
        state: 'active',
      },
    });
    if (!grant) throw new AgentOperationStateError('Agent grant is no longer active');
    agentPolicyService.authorize({ permissions: parsePermissions(grant.permissions) }, operation.actionType);
    if (input.revalidate && !(await input.revalidate(operation.inputSnapshot))) {
      throw new AgentOperationStateError('Operation target changed; prepare a new approval preview');
    }
    const startedAt = new Date();
    const claim = await prisma.agentOperation.updateMany({
      where: { id: operation.id, status: operation.status },
      data: { status: 'executing', executionStartedAt: startedAt },
    });
    if (claim.count !== 1) {
      return {
        operation: await prisma.agentOperation.findUnique({ where: { id: operation.id } }),
        claimed: false,
      };
    }

    let effectCompleted = false;
    try {
      const result = AgentOperationResultSchema.parse(await input.effect(operation.inputSnapshot));
      effectCompleted = true;
      const completed = await prisma.$transaction(async (transaction) => {
        const updated = await transaction.agentOperation.update({
          where: { id: operation.id },
          data: {
            status: 'succeeded', result: result as Prisma.InputJsonValue,
            completedAt: new Date(), retryable: false, failureCode: null, failureMessage: null,
          },
        });
        await writeAudit(transaction as typeof prisma, {
          agencyId: input.principal.agencyId, ownerSubject: input.principal.ownerSubject,
          oauthClientId: input.principal.oauthClientId, grantId: input.principal.grantId,
          operationId: operation.id, action: 'AGENT_OPERATION_SUCCEEDED',
          actionType: operation.actionType, riskClass: operation.riskClass, status: 'succeeded',
          actorType: 'agent', requestMetadata: input.principal.requestMetadata,
          ...(result.resourceType ? { targetResourceType: result.resourceType } : {}),
          ...(result.resourceId ? { targetResourceId: result.resourceId } : {}),
          outcome: {
            completionState: result.completionState || null,
            retryable: result.retryable,
          },
        });
        return updated;
      });
      return { operation: completed, claimed: true };
    } catch (error) {
      const retryable = effectCompleted || Boolean(error && typeof error === 'object' && (error as { retryable?: boolean }).retryable);
      const status = retryable ? 'failed_retryable' : 'failed_terminal';
      const failed = await prisma.$transaction(async (transaction) => {
        const updated = await transaction.agentOperation.update({
          where: { id: operation.id },
          data: {
            status, failureCode: retryable ? 'RETRYABLE_EFFECT_FAILURE' : 'EFFECT_FAILURE',
            failureMessage: safeFailureMessage(retryable), retryable, completedAt: new Date(),
          },
        });
        await writeAudit(transaction as typeof prisma, {
          agencyId: input.principal.agencyId, ownerSubject: input.principal.ownerSubject,
          oauthClientId: input.principal.oauthClientId, grantId: input.principal.grantId,
          operationId: operation.id, action: 'AGENT_OPERATION_FAILED', actionType: operation.actionType,
          riskClass: operation.riskClass, status, actorType: 'agent', requestMetadata: input.principal.requestMetadata,
          outcome: {
            failureCode: retryable ? 'RETRYABLE_EFFECT_FAILURE' : 'EFFECT_FAILURE',
            retryable,
          },
        });
        return updated;
      });
      return { operation: failed, claimed: true };
    }
  },
};
