import { createHmac, timingSafeEqual } from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { enforceRouteAgency, requirePrincipalAgency } from '@/lib/agency-guard.js';
import { authenticate } from '@/middleware/auth.js';
import { env, isOffboardingEnabled } from '@/lib/env.js';
import { prisma } from '@/lib/prisma.js';
import { clientOffboardingService } from '@/services/client-offboarding.service.js';
import { dispatchOffboardingRun } from '@/services/google-offboarding-executor.js';
import { sendError, sendValidationError } from '../lib/response.js';

const CAPABILITY_EXPIRY_MS = 15 * 60 * 1000;

const PrepareBodySchema = z.object({
  idempotencyKey: z.string().min(1).max(200),
  intentHash: z.string().min(1).max(128),
}).strict();

const ConfirmBodySchema = z.object({
  capabilityToken: z.string().min(1),
}).strict();

const AttestBodySchema = z.object({
  itemId: z.string().min(1),
  attestation: z.string().min(1).max(500),
}).strict();

function serverHmacSecret(): string {
  const secret = process.env.OFFBOARDING_CAPABILITY_SECRET;
  if (!secret) {
    throw new Error('OFFBOARDING_CAPABILITY_SECRET is required when Google client offboarding is enabled');
  }
  return secret;
}

function buildCredentialGeneration(connectionId: string): string {
  return `gen-${connectionId.slice(0, 8)}`;
}

function generateCapability(input: {
  connectionId: string;
  runId: string;
  snapshotHash: string;
  credentialGeneration: string;
  action: string;
  approvingAdmin: string;
}): string {
  const secret = serverHmacSecret();
  const payload = [
    input.connectionId,
    input.runId,
    input.snapshotHash,
    input.credentialGeneration,
    input.action,
    input.approvingAdmin,
    Math.floor(Date.now() / 1000) + Math.floor(CAPABILITY_EXPIRY_MS / 1000),
  ].join('|');

  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

function parseCapability(token: string): {
  connectionId: string;
  runId: string;
  snapshotHash: string;
  credentialGeneration: string;
  action: string;
  approvingAdmin: string;
  expiresAt: number;
  valid: boolean;
  reason?: string;
} {
  const secret = serverHmacSecret();
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex < 0) return { connectionId: '', runId: '', snapshotHash: '', credentialGeneration: '', action: '', approvingAdmin: '', expiresAt: 0, valid: false, reason: 'INVALID_TOKEN_FORMAT' };

  const payloadB64 = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const payloadBuffer = Buffer.from(payloadB64, 'base64url');
  const expectedHmac = createHmac('sha256', secret);
  expectedHmac.update(payloadBuffer);

  const expectedSig = expectedHmac.digest('hex');
  if (signature.length !== expectedSig.length) {
    return { connectionId: '', runId: '', snapshotHash: '', credentialGeneration: '', action: '', approvingAdmin: '', expiresAt: 0, valid: false, reason: 'INVALID_SIGNATURE' };
  }

  let sigMatch: boolean;
  try {
    sigMatch = timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSig, 'utf8'));
  } catch {
    sigMatch = false;
  }
  if (!sigMatch) {
    return { connectionId: '', runId: '', snapshotHash: '', credentialGeneration: '', action: '', approvingAdmin: '', expiresAt: 0, valid: false, reason: 'INVALID_SIGNATURE' };
  }

  const payload = payloadBuffer.toString('utf-8');
  const parts = payload.split('|');
  if (parts.length !== 7) return { connectionId: '', runId: '', snapshotHash: '', credentialGeneration: '', action: '', approvingAdmin: '', expiresAt: 0, valid: false, reason: 'INVALID_PAYLOAD' };

  const [connectionId, runId, snapshotHash, credentialGeneration, action, approvingAdmin, expiresAtStr] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() / 1000 > expiresAt) {
    return { connectionId, runId, snapshotHash, credentialGeneration, action, approvingAdmin, expiresAt, valid: false, reason: 'EXPIRED' };
  }

  return { connectionId, runId, snapshotHash, credentialGeneration, action, approvingAdmin, expiresAt, valid: true };
}


function ownerSubject(request: FastifyRequest): string | null {
  const user = (request as any).user as { sub?: string } | undefined;
  return user?.sub || null;
}

async function ensureConnectionBelongsToAgency(connectionId: string, agencyId: string) {
  const connection = await prisma.clientConnection.findFirst({
    where: { id: connectionId, agencyId },
    select: { id: true },
  });
  if (!connection) {
    return { code: 'CONNECTION_NOT_FOUND', message: 'Connection not found' };
  }
  return null;
}

async function ensureRunBelongsToAgency(runId: string, agencyId: string) {
  const run = await prisma.googleOffboardingRun.findFirst({
    where: { id: runId, agencyId },
    select: { id: true },
  });
  if (!run) {
    return { code: 'RUN_NOT_FOUND', message: 'Offboarding run not found' };
  }
  return null;
}

export async function clientOffboardingRoutes(fastify: FastifyInstance) {
  const adminHooks = [authenticate(), requirePrincipalAgency];

  fastify.addHook('onRequest', async (request, reply) => {
    const { agencyId } = request.params as { agencyId?: string };
    if (!isOffboardingEnabled(agencyId)) {
      return sendError(reply, 'FEATURE_DISABLED', 'Google client offboarding is not enabled for this agency', 403);
    }
  });

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/prepare', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply, 'agencyId');
    if (!agencyId) return;

    const { connectionId } = request.params as { connectionId: string };
    const ownershipError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (ownershipError) return reply.code(404).send({ data: null, error: ownershipError });

    const parsed = PrepareBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 'VALIDATION_ERROR', 'Invalid prepare input', 400, parsed.error.flatten());
    }

    try {
      const run = await clientOffboardingService.prepare({
        agencyId,
        connectionId,
        idempotencyKey: parsed.data.idempotencyKey,
        intentHash: parsed.data.intentHash,
      });

      const credentialGeneration = buildCredentialGeneration(connectionId);
      const subject = ownerSubject(request) || 'unknown';

      await prisma.googleOffboardingRun.update({
        where: { id: run.id },
        data: { credentialGeneration },
      });

      const capabilityToken = generateCapability({
        connectionId,
        runId: run.id,
        snapshotHash: parsed.data.intentHash,
        credentialGeneration,
        action: 'confirm',
        approvingAdmin: subject,
      });

      const sanitizedRun = await clientOffboardingService.getRun({ runId: run.id });

      return reply.send({ data: { ...sanitizedRun, capabilityToken }, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to prepare offboarding run';
      return sendError(reply, 'PREPARE_FAILED', message, 400);
    }
  });

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/confirm', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply, 'agencyId');
    if (!agencyId) return;

    const { connectionId } = request.params as { connectionId: string };
    const ownershipError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (ownershipError) return reply.code(404).send({ data: null, error: ownershipError });

    const parsed = ConfirmBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, 'Capability token is required');
    }

    const subject = ownerSubject(request);
    if (!subject) return sendError(reply, 'UNAUTHORIZED', 'Authenticated identity is required', 401);

    const run = await prisma.googleOffboardingRun.findFirst({
      where: { connectionId, agencyId, status: { in: ['prepared'] } },
      select: { id: true, status: true, snapshotHash: true, credentialGeneration: true, approvedById: true, approvedAt: true },
    });

    if (!run) {
      return sendError(reply, 'RUN_NOT_FOUND', 'No prepared offboarding run found for this connection', 404);
    }

    if (run.approvedAt) {
      return sendError(reply, 'ALREADY_CONFIRMED', 'Run has already been confirmed', 409);
    }

    if (!run.credentialGeneration) {
      return sendError(reply, 'CAPABILITY_REQUIRED', 'Confirmation capability is required; call prepare first', 409);
    }

    const currentGeneration = run.credentialGeneration;

    const parsedCap = parseCapability(parsed.data.capabilityToken);
    if (!parsedCap.valid) {
      return sendError(reply, 'CAPABILITY_INVALID', parsedCap.reason as string, 403);
    }

    if (parsedCap.runId !== run.id) {
      return sendError(reply, 'CAPABILITY_MISMATCH', 'Capability does not match this run', 403);
    }

    if (parsedCap.snapshotHash !== run.snapshotHash) {
      return sendError(reply, 'SNAPSHOT_CHANGED', 'Offboarding snapshot changed since preparation; prepare again', 409);
    }

    if (parsedCap.credentialGeneration !== currentGeneration) {
      return sendError(reply, 'CREDENTIAL_GENERATION_CHANGED', 'Credential generation changed since preparation; prepare again', 409);
    }

    if (parsedCap.approvingAdmin !== subject) {
      return sendError(reply, 'CAPABILITY_ADMIN_MISMATCH', 'Capability token was issued to a different admin', 403);
    }

    try {
      await clientOffboardingService.confirmRun({ runId: run.id, actorId: subject });
      await dispatchOffboardingRun(run.id);

      const sanitizedRun = await clientOffboardingService.getRun({ runId: run.id });
      return reply.send({ data: sanitizedRun, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm offboarding run';
      return sendError(reply, 'CONFIRM_FAILED', message, 400);
    }
  });

  fastify.get('/agencies/:agencyId/connections/:connectionId/offboarding/runs/:runId', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply, 'agencyId');
    if (!agencyId) return;

    const { connectionId, runId } = request.params as { connectionId: string; runId: string };
    const connectionError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (connectionError) return reply.code(404).send({ data: null, error: connectionError });

    const runError = await ensureRunBelongsToAgency(runId, agencyId);
    if (runError) return reply.code(404).send({ data: null, error: runError });

    const sanitizedRun = await clientOffboardingService.getRun({ runId });
    if (!sanitizedRun) return sendError(reply, 'RUN_NOT_FOUND', 'Offboarding run not found', 404);

    const attempts = await clientOffboardingService.getItemAttempts({ itemId: '', runId });
    return reply.send({ data: { ...sanitizedRun, attempts }, error: null });
  });

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/runs/:runId/retry', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply, 'agencyId');
    if (!agencyId) return;

    const { connectionId, runId } = request.params as { connectionId: string; runId: string };
    const connectionError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (connectionError) return reply.code(404).send({ data: null, error: connectionError });

    const runError = await ensureRunBelongsToAgency(runId, agencyId);
    if (runError) return reply.code(404).send({ data: null, error: runError });

    const run = await prisma.googleOffboardingRun.findUnique({ where: { id: runId } });
    if (!run) return sendError(reply, 'RUN_NOT_FOUND', 'Offboarding run not found', 404);

    if (run.status !== 'incomplete' && run.status !== 'completed_with_manual_follow_up') {
      return sendError(reply, 'INVALID_RUN_STATUS', `Retry is only allowed for 'incomplete' or 'completed_with_manual_follow_up' runs (current: ${run.status})`, 409);
    }

    const retryableItems = await prisma.googleOffboardingItem.findMany({
      where: { runId, status: 'failed_retryable' },
    });

    if (retryableItems.length === 0) {
      return sendError(reply, 'NO_RETRYABLE_ITEMS', 'No retryable items found', 400);
    }

    try {
      const itemIds = retryableItems.map((item) => item.id);
      await prisma.googleOffboardingItem.updateMany({
        where: { id: { in: itemIds } },
        data: { status: 'pending' },
      });
      await dispatchOffboardingRun(runId);

      const sanitizedRun = await clientOffboardingService.getRun({ runId });
      return reply.send({ data: sanitizedRun, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry offboarding run';
      return sendError(reply, 'RETRY_FAILED', message, 400);
    }
  });

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/runs/:runId/attest', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply, 'agencyId');
    if (!agencyId) return;

    const { connectionId, runId } = request.params as { connectionId: string; runId: string };
    const connectionError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (connectionError) return reply.code(404).send({ data: null, error: connectionError });

    const runError = await ensureRunBelongsToAgency(runId, agencyId);
    if (runError) return reply.code(404).send({ data: null, error: runError });

    const subject = ownerSubject(request);
    if (!subject) return sendError(reply, 'UNAUTHORIZED', 'Authenticated identity is required', 401);

    const parsed = AttestBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 'VALIDATION_ERROR', 'Item ID and attestation are required', 400, parsed.error.flatten());
    }

    const item = await prisma.googleOffboardingItem.findFirst({
      where: { id: parsed.data.itemId, runId },
    });
    if (!item) return sendError(reply, 'ITEM_NOT_FOUND', 'Offboarding item not found', 404);

    if (item.status !== 'manual_action_required' && item.status !== 'failed_retryable') {
      return sendError(reply, 'ITEM_NOT_ATTESTABLE', 'Item is not in an attestable state', 400);
    }

    try {
      await clientOffboardingService.updateItemStatus({
        itemId: item.id,
        status: 'attestation_recorded',
        providerOutcome: 'human_attestation',
        reason: parsed.data.attestation,
      });

      await clientOffboardingService.addAttempt({
        itemId: item.id,
        runId,
        action: 'human_attestation',
        providerOutcome: 'human_attestation',
        responseClassification: 'success',
        errorMessage: parsed.data.attestation,
      });

      await clientOffboardingService.deriveRunOutcome({ runId });
      const sanitizedRun = await clientOffboardingService.getRun({ runId });
      return reply.send({ data: sanitizedRun, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record attestation';
      return sendError(reply, 'ATTESTATION_FAILED', message, 400);
    }
  });
}
