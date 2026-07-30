import { createHmac } from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { assertAgencyAccess, resolvePrincipalAgency } from '@/lib/authorization.js';
import { authenticate } from '@/middleware/auth.js';
import { prisma } from '@/lib/prisma.js';
import { clientOffboardingService } from '@/services/client-offboarding.service.js';
import { dispatchOffboardingRun } from '@/services/google-offboarding-executor.js';

const CAPABILITY_EXPIRY_MS = 15 * 60 * 1000;
const CAPABILITY_HMAC_SECRET = process.env.OFFBOARDING_CAPABILITY_SECRET || 'dev-offboarding-fallback-key';

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
  return CAPABILITY_HMAC_SECRET;
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

  let sigMatch = true;
  for (let i = 0; i < signature.length; i++) {
    if (signature.charCodeAt(i) !== expectedSig.charCodeAt(i)) {
      sigMatch = false;
    }
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

async function requireAgencyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const principal = await resolvePrincipalAgency(request);
  if (principal.error || !principal.data) {
    return reply.code(principal.error?.code === 'UNAUTHORIZED' ? 401 : 403).send({
      data: null,
      error: principal.error || { code: 'FORBIDDEN', message: 'Unable to resolve agency' },
    });
  }
  (request as any).principalAgencyId = principal.data.agencyId;
  (request as any).principalId = principal.data.principalId;
}

function enforceRouteAgency(request: FastifyRequest, reply: FastifyReply): string | null {
  const { agencyId } = request.params as { agencyId: string };
  const accessError = assertAgencyAccess(agencyId, (request as any).principalAgencyId);
  if (accessError) {
    void reply.code(403).send({ data: null, error: accessError });
    return null;
  }
  return agencyId;
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
  const adminHooks = [authenticate(), requireAgencyAdmin];

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/prepare', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;

    const { connectionId } = request.params as { connectionId: string };
    const ownershipError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (ownershipError) return reply.code(404).send({ data: null, error: ownershipError });

    const parsed = PrepareBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid prepare input', details: parsed.error.flatten() } });
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
      return reply.code(400).send({ data: null, error: { code: 'PREPARE_FAILED', message } });
    }
  });

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/confirm', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;

    const { connectionId } = request.params as { connectionId: string };
    const ownershipError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (ownershipError) return reply.code(404).send({ data: null, error: ownershipError });

    const parsed = ConfirmBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Capability token is required' } });
    }

    const subject = ownerSubject(request);
    if (!subject) return reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authenticated identity is required' } });

    const run = await prisma.googleOffboardingRun.findFirst({
      where: { connectionId, agencyId, status: { in: ['prepared'] } },
      select: { id: true, status: true, snapshotHash: true, credentialGeneration: true, approvedById: true, approvedAt: true },
    });

    if (!run) {
      return reply.code(404).send({ data: null, error: { code: 'RUN_NOT_FOUND', message: 'No prepared offboarding run found for this connection' } });
    }

    if (run.approvedAt) {
      return reply.code(409).send({ data: null, error: { code: 'ALREADY_CONFIRMED', message: 'Run has already been confirmed' } });
    }

    if (!run.credentialGeneration) {
      return reply.code(409).send({ data: null, error: { code: 'CAPABILITY_REQUIRED', message: 'Confirmation capability is required; call prepare first' } });
    }

    const currentGeneration = run.credentialGeneration;

    const parsedCap = parseCapability(parsed.data.capabilityToken);
    if (!parsedCap.valid) {
      return reply.code(403).send({ data: null, error: { code: 'CAPABILITY_INVALID', message: parsedCap.reason } });
    }

    if (parsedCap.runId !== run.id) {
      return reply.code(403).send({ data: null, error: { code: 'CAPABILITY_MISMATCH', message: 'Capability does not match this run' } });
    }

    if (parsedCap.snapshotHash !== run.snapshotHash) {
      return reply.code(409).send({ data: null, error: { code: 'SNAPSHOT_CHANGED', message: 'Offboarding snapshot changed since preparation; prepare again' } });
    }

    if (parsedCap.credentialGeneration !== currentGeneration) {
      return reply.code(409).send({ data: null, error: { code: 'CREDENTIAL_GENERATION_CHANGED', message: 'Credential generation changed since preparation; prepare again' } });
    }

    try {
      await clientOffboardingService.confirmRun({ runId: run.id, actorId: subject });
      await dispatchOffboardingRun(run.id);

      const sanitizedRun = await clientOffboardingService.getRun({ runId: run.id });
      return reply.send({ data: sanitizedRun, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm offboarding run';
      return reply.code(400).send({ data: null, error: { code: 'CONFIRM_FAILED', message } });
    }
  });

  fastify.get('/agencies/:agencyId/connections/:connectionId/offboarding/runs/:runId', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;

    const { connectionId, runId } = request.params as { connectionId: string; runId: string };
    const connectionError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (connectionError) return reply.code(404).send({ data: null, error: connectionError });

    const runError = await ensureRunBelongsToAgency(runId, agencyId);
    if (runError) return reply.code(404).send({ data: null, error: runError });

    const sanitizedRun = await clientOffboardingService.getRun({ runId });
    if (!sanitizedRun) return reply.code(404).send({ data: null, error: { code: 'RUN_NOT_FOUND', message: 'Offboarding run not found' } });

    const attempts = await clientOffboardingService.getItemAttempts({ itemId: '', runId });
    return reply.send({ data: { ...sanitizedRun, attempts }, error: null });
  });

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/runs/:runId/retry', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;

    const { connectionId, runId } = request.params as { connectionId: string; runId: string };
    const connectionError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (connectionError) return reply.code(404).send({ data: null, error: connectionError });

    const runError = await ensureRunBelongsToAgency(runId, agencyId);
    if (runError) return reply.code(404).send({ data: null, error: runError });

    const run = await prisma.googleOffboardingRun.findUnique({ where: { id: runId } });
    if (!run) return reply.code(404).send({ data: null, error: { code: 'RUN_NOT_FOUND', message: 'Offboarding run not found' } });

    const retryableItems = await prisma.googleOffboardingItem.findMany({
      where: { runId, status: 'failed_retryable' },
    });

    if (retryableItems.length === 0) {
      return reply.code(400).send({ data: null, error: { code: 'NO_RETRYABLE_ITEMS', message: 'No retryable items found' } });
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
      return reply.code(400).send({ data: null, error: { code: 'RETRY_FAILED', message } });
    }
  });

  fastify.post('/agencies/:agencyId/connections/:connectionId/offboarding/runs/:runId/attest', { onRequest: adminHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;

    const { connectionId, runId } = request.params as { connectionId: string; runId: string };
    const connectionError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (connectionError) return reply.code(404).send({ data: null, error: connectionError });

    const runError = await ensureRunBelongsToAgency(runId, agencyId);
    if (runError) return reply.code(404).send({ data: null, error: runError });

    const subject = ownerSubject(request);
    if (!subject) return reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authenticated identity is required' } });

    const parsed = AttestBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Item ID and attestation are required', details: parsed.error.flatten() } });
    }

    const item = await prisma.googleOffboardingItem.findFirst({
      where: { id: parsed.data.itemId, runId },
    });
    if (!item) return reply.code(404).send({ data: null, error: { code: 'ITEM_NOT_FOUND', message: 'Offboarding item not found' } });

    if (item.status !== 'manual_action_required' && item.status !== 'failed_retryable') {
      return reply.code(400).send({ data: null, error: { code: 'ITEM_NOT_ATTESTABLE', message: 'Item is not in an attestable state' } });
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
      return reply.code(400).send({ data: null, error: { code: 'ATTESTATION_FAILED', message } });
    }
  });
}
