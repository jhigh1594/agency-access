import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { clientOffboardingService } from '@/services/client-offboarding.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    googleNativeGrant: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      groupBy: vi.fn(),
    },
    googleOffboardingRun: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    googleOffboardingItem: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    googleOffboardingAttempt: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    clientConnection: {
      findUnique: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const TERMINAL_STATUSES = ['completed', 'completed_with_manual_follow_up', 'incomplete', 'canceled'];

const NOW = new Date('2026-07-30T12:00:00.000Z');
vi.useFakeTimers({ now: NOW });

describe('client-offboarding.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));
  });

  describe('idempotency', () => {
    it('returns the existing non-terminal run for a duplicate prepare request on the same active connection', async () => {
      const existingRun = {
        id: 'run-1',
        agencyId: 'agency-1',
        connectionId: 'conn-1',
        status: 'prepared',
        idempotencyKey: 'idem-key-abc',
        snapshotHash: 'hash-001',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue(existingRun as any);
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
        id: 'conn-1',
        agencyId: 'agency-1',
        status: 'active',
      } as any);

      const result = await clientOffboardingService.prepare({
        agencyId: 'agency-1',
        connectionId: 'conn-1',
        idempotencyKey: 'idem-key-abc',
        intentHash: 'hash-001',
      });

      expect(result).toBe(existingRun);
      expect(prisma.googleOffboardingRun.create).not.toHaveBeenCalled();
    });

    it('conflicts when the same idempotency key is used with a different intent hash', async () => {
      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.googleOffboardingRun.count).mockResolvedValue(0);
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
        id: 'conn-1',
        agencyId: 'agency-1',
        status: 'active',
      } as any);
      vi.mocked(prisma.googleNativeGrant.findMany).mockResolvedValue([]);
      vi.mocked(prisma.googleOffboardingRun.create).mockRejectedValue(
        new Error('Unique constraint failed: idempotency_key')
      );

      await expect(
        clientOffboardingService.prepare({
          agencyId: 'agency-1',
          connectionId: 'conn-1',
          idempotencyKey: 'idem-key-abc',
          intentHash: 'hash-002',
        })
      ).rejects.toThrow(/idempotenc|conflict|constraint/i);
    });
  });

  describe('lifecycle', () => {
    it('creates a run in prepared status with items in pending status', async () => {
      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.googleOffboardingRun.count).mockResolvedValue(0);
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
        id: 'conn-1',
        agencyId: 'agency-1',
        status: 'active',
      } as any);
      vi.mocked(prisma.googleNativeGrant.findMany).mockResolvedValue([
        {
          id: 'grant-1',
          productId: 'google_ads',
          fulfillmentMode: 'user_invite',
          grantStatus: 'verified',
        },
        {
          id: 'grant-2',
          productId: 'ga4',
          fulfillmentMode: 'user_invite',
          grantStatus: 'verified',
        },
      ] as any);
      vi.mocked(prisma.googleOffboardingRun.create).mockImplementation(async (args: any) => ({
        id: 'run-new',
        agencyId: args.data.agencyId,
        connectionId: args.data.connectionId,
        status: args.data.status,
        idempotencyKey: args.data.idempotencyKey,
        snapshotHash: args.data.snapshotHash,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      }));
      vi.mocked(prisma.googleOffboardingItem.createMany).mockResolvedValue({ count: 2 });

      const run = await clientOffboardingService.prepare({
        agencyId: 'agency-1',
        connectionId: 'conn-1',
        idempotencyKey: 'idem-new',
        intentHash: 'hash-new',
      });

      expect(run.status).toBe('prepared');
      expect(prisma.googleOffboardingRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'prepared' }),
        })
      );
      expect(prisma.googleOffboardingItem.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ status: 'pending' }),
          ]),
        })
      );
    });

    it('transitions a run through the state machine correctly', async () => {
      const validTransitions: Array<{ from: string; to: string }> = [
        { from: 'prepared', to: 'awaiting_approval' },
        { from: 'awaiting_approval', to: 'queued' },
        { from: 'queued', to: 'executing' },
        { from: 'executing', to: 'receipt_pending' },
        { from: 'receipt_pending', to: 'completed' },
        { from: 'executing', to: 'completed_with_manual_follow_up' },
        { from: 'executing', to: 'incomplete' },
        { from: 'prepared', to: 'canceled' },
        { from: 'awaiting_approval', to: 'canceled' },
      ];

      for (const { from, to } of validTransitions) {
        vi.clearAllMocks();
        vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));

        vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue({
          id: 'run-1',
          status: from,
          connectionId: 'conn-1',
          agencyId: 'agency-1',
        } as any);
        vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
          id: 'run-1',
          status: args.data.status,
        } as any));

        const result = await clientOffboardingService.transition({
          runId: 'run-1',
          to: to as any,
          actorId: 'user-1',
        });

        expect(result.status).toBe(to);
      }
    });

    it('rejects executing a canceled run', async () => {
      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue({
        id: 'run-1',
        status: 'canceled',
        connectionId: 'conn-1',
        agencyId: 'agency-1',
      } as any);

      await expect(
        clientOffboardingService.transition({
          runId: 'run-1',
          to: 'executing',
          actorId: 'user-1',
        })
      ).rejects.toThrow(/canceled|terminal|invalid/i);
    });
  });

  describe('snapshot immutability', () => {
    it('prevents a new onboarding upsert from altering an existing offboarding item snapshot', async () => {
      const existingItem = {
        id: 'item-1',
        runId: 'run-1',
        productId: 'google_ads',
        classification: 'eligible_automatic',
        status: 'revoked_verified',
        assetLabel: 'ads-account-123',
        grantId: 'grant-1',
        createdAt: '2026-07-29T12:00:00.000Z',
        updatedAt: '2026-07-30T12:00:00.000Z',
      };

      vi.mocked(prisma.googleOffboardingItem.findFirst).mockResolvedValue(existingItem as any);

      await expect(
        clientOffboardingService.updateItemSnapshot({
          itemId: 'item-1',
          productId: 'google_ads',
          classification: 'manual_action_required',
        })
      ).rejects.toThrow(/immutable|frozen|locked|terminal/i);

      expect(prisma.googleOffboardingItem.updateMany).not.toHaveBeenCalled();
    });

    it('excludes tokens, secret IDs, and raw provider responses from receipt serialization', async () => {
      const item = {
        id: 'item-1',
        runId: 'run-1',
        productId: 'google_ads',
        classification: 'eligible_automatic',
        status: 'revoked_verified',
        assetLabel: 'ads-account-123',
        grantId: 'grant-1',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      const attempt = {
        id: 'attempt-1',
        itemId: 'item-1',
        providerOutcome: 'deleted',
        responseBody: JSON.stringify({ accessToken: 'ya29.xxx', refreshToken: '1//xxx' }),
        tokenSecretId: 'secret-abc',
        rawProviderResponse: JSON.stringify({ debugToken: 'debug-123' }),
        errorCode: null,
        errorMessage: null,
        createdAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue({
        id: 'run-1',
        agencyId: 'agency-1',
        status: 'receipt_pending',
      } as any);
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue([item] as any);
      vi.mocked(prisma.googleOffboardingAttempt.findMany).mockResolvedValue([attempt] as any);

      const receipt = await clientOffboardingService.serializeReceipt({ runId: 'run-1' });

      const receiptStr = JSON.stringify(receipt);
      expect(receiptStr).not.toContain('accessToken');
      expect(receiptStr).not.toContain('refreshToken');
      expect(receiptStr).not.toContain('secret-abc');
      expect(receiptStr).not.toContain('rawProviderResponse');
    });
  });

  describe('database constraint simulation', () => {
    it('rejects a second active run for the same connection', async () => {
      vi.mocked(prisma.googleOffboardingRun.count).mockResolvedValue(1);
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
        id: 'conn-1',
        agencyId: 'agency-1',
        status: 'active',
      } as any);
      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue(null);

      await expect(
        clientOffboardingService.prepare({
          agencyId: 'agency-1',
          connectionId: 'conn-1',
          idempotencyKey: 'idem-different',
          intentHash: 'hash-new',
        })
      ).rejects.toThrow(/active.*run|already.*run|constraint|conflict/i);

      expect(prisma.googleOffboardingRun.create).not.toHaveBeenCalled();
    });

    it('rejects cross-agency source grant binding', async () => {
      vi.mocked(prisma.googleOffboardingRun.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.googleOffboardingRun.count).mockResolvedValue(0);
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({
        id: 'conn-1',
        agencyId: 'agency-1',
        status: 'active',
      } as any);
      vi.mocked(prisma.googleNativeGrant.findMany).mockResolvedValue([
        {
          id: 'grant-x',
          productId: 'google_ads',
          fulfillmentMode: 'user_invite',
          grantStatus: 'verified',
          agencyId: 'agency-2',
        },
      ] as any);

      await expect(
        clientOffboardingService.prepare({
          agencyId: 'agency-1',
          connectionId: 'conn-1',
          idempotencyKey: 'idem-cross',
          intentHash: 'hash-cross',
        })
      ).rejects.toThrow(/cross.agency|agency.*mismatch|binding.*rejected|ownership/i);
    });

    it('prevents updating an attempt record (insert-only)', async () => {
      vi.mocked(prisma.googleOffboardingAttempt.updateMany).mockResolvedValue({ count: 1 });

      await expect(
        clientOffboardingService.recordAttemptUpdate({
          attemptId: 'attempt-1',
          errorCode: 'PERMISSION_DENIED',
          errorMessage: 'Insufficient scope',
        })
      ).rejects.toThrow(/insert.only|immutable|read.only|cannot.*update/i);
    });
  });

  describe('mixed outcome aggregation', () => {
    it('derives incomplete status when items are verified, manual, and retryable', async () => {
      const items = [
        {
          id: 'item-1',
          runId: 'run-1',
          status: 'revoked_verified',
          classification: 'eligible_automatic',
        },
        {
          id: 'item-2',
          runId: 'run-1',
          status: 'manual_action_required',
          classification: 'manual_action_required',
        },
        {
          id: 'item-3',
          runId: 'run-1',
          status: 'failed_retryable',
          classification: 'eligible_automatic',
        },
      ];

      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue(items as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        id: 'run-1',
        status: args.data.status,
      } as any));

      const aggregate = await clientOffboardingService.deriveRunStatus({ runId: 'run-1' });

      expect(aggregate).toBe('incomplete');
      expect(prisma.googleOffboardingRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'incomplete' }),
        })
      );
    });

    it('derives completed status when all automatic items are verified with no manual items', async () => {
      const items = [
        {
          id: 'item-1',
          runId: 'run-1',
          status: 'revoked_verified',
          classification: 'eligible_automatic',
        },
        {
          id: 'item-2',
          runId: 'run-1',
          status: 'revoked_verified',
          classification: 'eligible_automatic',
        },
        {
          id: 'item-3',
          runId: 'run-1',
          status: 'already_absent',
          classification: 'eligible_automatic',
        },
      ];

      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue(items as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        id: 'run-1',
        status: args.data.status,
      } as any));

      const aggregate = await clientOffboardingService.deriveRunStatus({ runId: 'run-1' });

      expect(aggregate).toBe('completed');
    });

    it('derives completed_with_manual_follow_up when all automatic items succeed but manual items remain', async () => {
      const items = [
        {
          id: 'item-1',
          runId: 'run-1',
          status: 'revoked_verified',
          classification: 'eligible_automatic',
        },
        {
          id: 'item-2',
          runId: 'run-1',
          status: 'already_absent',
          classification: 'eligible_automatic',
        },
        {
          id: 'item-3',
          runId: 'run-1',
          status: 'attestation_recorded',
          classification: 'not_safely_reversible',
        },
        {
          id: 'item-4',
          runId: 'run-1',
          status: 'attestation_recorded',
          classification: 'not_safely_reversible',
        },
      ];

      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue(items as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        id: 'run-1',
        status: args.data.status,
      } as any));

      const aggregate = await clientOffboardingService.deriveRunStatus({ runId: 'run-1' });

      expect(aggregate).toBe('completed_with_manual_follow_up');
    });
  });
});
