import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { clientOffboardingRoutes } from '@/routes/client-offboarding.routes.js';
import * as authorization from '@/lib/authorization.js';
import { clientOffboardingService } from '@/services/client-offboarding.service.js';
import { dispatchOffboardingRun } from '@/services/google-offboarding-executor.js';
import { prisma } from '@/lib/prisma.js';

vi.mock('@/services/client-offboarding.service.js', () => ({
  clientOffboardingService: {
    prepare: vi.fn(),
    getRun: vi.fn(),
    confirmRun: vi.fn(),
    transition: vi.fn(),
    updateItemStatus: vi.fn(),
    addAttempt: vi.fn(),
    deriveRunOutcome: vi.fn(),
    getItemAttempts: vi.fn(),
  },
}));

vi.mock('@/services/google-offboarding-executor.js', () => ({
  dispatchOffboardingRun: vi.fn(),
}));

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    clientConnection: { findFirst: vi.fn() },
    googleOffboardingRun: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    googleOffboardingItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/env.js', () => ({
  env: { FRONTEND_URL: 'https://app.example.com' },
  isOffboardingEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/authorization.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/authorization.js')>();
  return {
    ...actual,
    resolvePrincipalAgency: vi.fn(),
  };
});

vi.mock('@/middleware/auth.js', () => ({
  authenticate: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' },
      });
    }
    request.user = { sub: 'admin-user-1', orgId: 'org-admin-1' };
  },
}));

describe('client offboarding routes security', () => {
  let app: FastifyInstance;

  const originalSecret = process.env.OFFBOARDING_CAPABILITY_SECRET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.OFFBOARDING_CAPABILITY_SECRET = 'test-offboarding-secret-key';
    app = Fastify();
    await app.register(clientOffboardingRoutes);
    await app.ready();
  });

  afterEach(async () => {
    process.env.OFFBOARDING_CAPABILITY_SECRET = originalSecret;
    await app.close();
  });

  function mockPrincipal(agencyId = 'agency-admin') {
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId, principalId: 'org-admin-1', agency: { id: agencyId, name: 'Admin', email: 'admin@example.com' } },
      error: null,
    });
  }

  function mockConnectionOwned() {
    vi.mocked(prisma.clientConnection.findFirst).mockResolvedValue({ id: 'conn-1' } as any);
  }

  function mockConnectionNotOwned() {
    vi.mocked(prisma.clientConnection.findFirst).mockResolvedValue(null);
  }

  describe('cross-agency protection', () => {
    it('rejects prepare for a cross-agency connection', async () => {
      mockPrincipal('agency-admin');
      mockConnectionNotOwned();

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-external/offboarding/prepare',
        headers: { authorization: 'Bearer session' },
        payload: { idempotencyKey: 'prep-1', intentHash: 'hash-abc' },
      });

      expect(response.statusCode).toBe(404);
      expect(clientOffboardingService.prepare).not.toHaveBeenCalled();
    });

    it('rejects confirm for a cross-agency connection', async () => {
      mockPrincipal('agency-admin');
      mockConnectionNotOwned();

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-external/offboarding/confirm',
        headers: { authorization: 'Bearer session' },
        payload: { capabilityToken: 'bad-token' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejects get for a cross-agency run', async () => {
      mockPrincipal('agency-admin');
      mockConnectionNotOwned();

      const response = await app.inject({
        method: 'GET',
        url: '/agencies/agency-admin/connections/conn-external/offboarding/runs/run-1',
        headers: { authorization: 'Bearer session' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejects retry for a cross-agency run', async () => {
      mockPrincipal('agency-admin');
      mockConnectionNotOwned();

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-external/offboarding/runs/run-1/retry',
        headers: { authorization: 'Bearer session' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('rejects attest for a cross-agency run', async () => {
      mockPrincipal('agency-admin');
      mockConnectionNotOwned();

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-external/offboarding/runs/run-1/attest',
        headers: { authorization: 'Bearer session' },
        payload: { itemId: 'item-1', attestation: 'Verified by admin' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('agency enforcement', () => {
    it('rejects operations when principal agency mismatches route agency', async () => {
      mockPrincipal('agency-other');

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/prepare',
        headers: { authorization: 'Bearer session' },
        payload: { idempotencyKey: 'prep-1', intentHash: 'hash-abc' },
      });

      expect(response.statusCode).toBe(403);
      expect(clientOffboardingService.prepare).not.toHaveBeenCalled();
    });
  });

  describe('non-admin rejection', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/prepare',
        payload: { idempotencyKey: 'prep-1', intentHash: 'hash-abc' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('prepare idempotency', () => {
    it('returns sanitized run with capability token on successful prepare', async () => {
      mockPrincipal();
      mockConnectionOwned();

      vi.mocked(prisma.googleOffboardingRun.update).mockResolvedValue({} as any);
      vi.mocked(clientOffboardingService.prepare).mockResolvedValue({
        id: 'run-1',
        agencyId: 'agency-admin',
        connectionId: 'conn-1',
        status: 'prepared',
        idempotencyKey: 'prep-1',
        snapshotHash: 'hash-abc',
      } as any);
      vi.mocked(clientOffboardingService.getRun).mockResolvedValue({
        id: 'run-1',
        status: 'prepared',
        items: [],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/prepare',
        headers: { authorization: 'Bearer session' },
        payload: { idempotencyKey: 'prep-1', intentHash: 'hash-abc' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.id).toBe('run-1');
      expect(body.data.status).toBe('prepared');
      expect(body.data.capabilityToken).toBeDefined();
      expect(typeof body.data.capabilityToken).toBe('string');
    });
  });

  describe('confirmation capability', () => {
    it('rejects confirmation without valid capability token', async () => {
      mockPrincipal();
      mockConnectionOwned();

      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue({
        id: 'run-1',
        status: 'prepared',
        snapshotHash: 'hash-abc',
        credentialGeneration: 'gen-conn-1',
        approvedById: null,
        approvedAt: null,
      } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/confirm',
        headers: { authorization: 'Bearer session' },
        payload: { capabilityToken: 'invalid-token-format' },
      });

      expect(response.statusCode).toBe(403);
      const body = response.json();
      expect(body.error.code).toBe('CAPABILITY_INVALID');
      expect(dispatchOffboardingRun).not.toHaveBeenCalled();
    });

    it('rejects replayed capability after confirmation', async () => {
      mockPrincipal();
      mockConnectionOwned();

      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue({
        id: 'run-1',
        status: 'prepared',
        snapshotHash: 'hash-abc',
        credentialGeneration: 'gen-conn-1',
        approvedById: 'admin-user-1',
        approvedAt: new Date(),
      } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/confirm',
        headers: { authorization: 'Bearer session' },
        payload: { capabilityToken: 'any-token' },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('ALREADY_CONFIRMED');
    });

    it('rejects capability with mismatched snapshot hash', async () => {
      mockPrincipal();
      mockConnectionOwned();

      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue({
        id: 'run-1',
        status: 'prepared',
        snapshotHash: 'original-hash',
        credentialGeneration: 'gen-conn-1',
        approvedById: null,
        approvedAt: null,
      } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/confirm',
        headers: { authorization: 'Bearer session' },
        payload: { capabilityToken: 'any-token' },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('attestation requires admin', () => {
    it('records attestation for admin and returns updated run', async () => {
      mockPrincipal();
      mockConnectionOwned();

      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue({ id: 'run-1' } as any);
      vi.mocked(prisma.googleOffboardingItem.findFirst).mockResolvedValue({
        id: 'item-sc-1',
        status: 'manual_action_required',
      } as any);
      vi.mocked(clientOffboardingService.updateItemStatus).mockResolvedValue({ count: 1 } as any);
      vi.mocked(clientOffboardingService.addAttempt).mockResolvedValue({} as any);
      vi.mocked(clientOffboardingService.deriveRunOutcome).mockResolvedValue('completed_with_manual_follow_up');
      vi.mocked(clientOffboardingService.getRun).mockResolvedValue({
        id: 'run-1',
        status: 'completed_with_manual_follow_up',
        items: [],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/runs/run-1/attest',
        headers: { authorization: 'Bearer session' },
        payload: { itemId: 'item-sc-1', attestation: 'Verified in Search Console manually' },
      });

      expect(response.statusCode).toBe(200);
      expect(clientOffboardingService.updateItemStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'attestation_recorded' }),
      );
    });

    it('rejects attestation for non-attestable item state', async () => {
      mockPrincipal();
      mockConnectionOwned();

      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue({ id: 'run-1' } as any);
      vi.mocked(prisma.googleOffboardingItem.findFirst).mockResolvedValue({
        id: 'item-1',
        status: 'revoked_verified',
      } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/runs/run-1/attest',
        headers: { authorization: 'Bearer session' },
        payload: { itemId: 'item-1', attestation: 'Already done' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('ITEM_NOT_ATTESTABLE');
    });
  });

  describe('validation', () => {
    it('rejects prepare with missing idempotencyKey', async () => {
      mockPrincipal();
      mockConnectionOwned();

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/prepare',
        headers: { authorization: 'Bearer session' },
        payload: { intentHash: 'hash-abc' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects attest with missing fields', async () => {
      mockPrincipal();
      mockConnectionOwned();

      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue({ id: 'run-1' } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/agencies/agency-admin/connections/conn-1/offboarding/runs/run-1/attest',
        headers: { authorization: 'Bearer session' },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });
  });
});
