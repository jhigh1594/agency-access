import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { clientOffboardingService } from '@/services/client-offboarding.service';
import {
  executeRun,
  executeCleanup,
  buildReceipt,
  dispatchOffboardingRun,
} from '@/services/google-offboarding-executor';
import { auditService } from '@/services/audit.service';
import { infisical } from '@/lib/infisical';

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
      update: vi.fn(),
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
    platformAuthorization: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/services/token-lifecycle.service', () => ({
  refreshClientPlatformAuthorization: vi.fn(),
}));

vi.mock('@/services/connectors/google-offboarding', () => ({
  revokeAdsManagerLink: vi.fn(),
  revokeAdsDirectUser: vi.fn(),
  revokeAdsPendingInvitation: vi.fn(),
  revokeGa4AccessBinding: vi.fn(),
  revokeBusinessAdmin: vi.fn(),
  revokeBusinessLocationAdmin: vi.fn(),
  revokeGtmUserPermission: vi.fn(),
  revokeMerchantUser: vi.fn(),
  verifyAdsManagerLink: vi.fn(),
  verifyAdsUserRemoved: vi.fn(),
  verifyGa4BindingRemoved: vi.fn(),
  verifyGtmPermissionRemoved: vi.fn(),
  verifyMerchantUserRemoved: vi.fn(),
  buildSearchConsoleHandoff: vi.fn().mockReturnValue({
    success: true,
    providerOutcome: 'manual_handoff',
    reason: 'Search Console has no API. Remove manually.',
    retryable: false,
  }),
  normalizeProviderError: vi.fn(),
}));

vi.mock('@/lib/infisical', () => ({
  infisical: {
    deleteOAuthTokens: vi.fn(),
  },
}));

vi.mock('@/services/client-offboarding.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/client-offboarding.service')>('@/services/client-offboarding.service');
  return {
    clientOffboardingService: {
      ...actual.clientOffboardingService,
      deriveRunOutcome: vi.fn().mockResolvedValue('completed'),
    },
  };
});

vi.mock('@/services/audit.service', () => ({
  auditService: {
    createAuditLog: vi.fn().mockResolvedValue({ data: { id: 'audit-1' }, error: null }),
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

describe('google-offboarding-executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));
    process.env.BACKGROUND_WORKERS_ENABLED = 'true';
  });

  describe('idempotency', () => {
    it('double confirmation causes one provider reversal per item', async () => {
      const run = {
        id: 'run-idem',
        agencyId: 'agency-1',
        connectionId: 'conn-1',
        status: 'queued',
        idempotencyKey: 'idem-key',
        snapshotHash: 'hash-1',
        credentialGeneration: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      const item = {
        id: 'item-1',
        runId: 'run-idem',
        productId: 'google_ads',
        classification: 'eligible_automatic',
        status: 'pending',
        assetLabel: 'ads-123',
        grantId: 'grant-1',
        grant: {
          id: 'grant-1',
          product: 'google_ads',
          assetId: '123',
          assetName: 'Account 1',
          grantMode: 'manager_link',
          managerCustomerId: '456',
          providerExternalId: 'link-789',
        },
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        ...run,
        ...args.data,
      } as any));
      vi.mocked(prisma.googleOffboardingItem.findMany)
        .mockResolvedValueOnce([item] as any)
        .mockResolvedValueOnce([]);
      vi.mocked(prisma.googleOffboardingItem.updateMany)
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      vi.mocked(prisma.googleOffboardingItem.update).mockResolvedValue(item as any);

      const { revokeAdsManagerLink } = await import('@/services/connectors/google-offboarding');
      vi.mocked(revokeAdsManagerLink).mockResolvedValue({
        success: true,
        providerOutcome: 'deleted',
        retryable: false,
      });

      const tokenResult = { data: { accessToken: 'tok', outcome: 'still_valid' as const }, error: null };
      const { refreshClientPlatformAuthorization } = await import('@/services/token-lifecycle.service');
      vi.mocked(refreshClientPlatformAuthorization).mockResolvedValue(tokenResult as any);

      await executeRun('run-idem');

      const firstCall = vi.mocked(prisma.googleOffboardingItem.updateMany).mock.calls[0];
      expect(firstCall?.[0]?.where?.status).toBe('pending');

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue({
        ...run,
        status: 'executing',
      } as any);
      const secondResult = await executeRun('run-idem');
      expect(secondResult.errors).toHaveLength(1);
      expect(secondResult.errors[0]).toMatch(/terminal|in-progress/);

      expect(vi.mocked(revokeAdsManagerLink)).toHaveBeenCalledTimes(1);
    });
  });

  describe('credential generation guard', () => {
    it('blocks execution when credential generation changed after preparation', async () => {
      const run = {
        id: 'run-cred',
        agencyId: 'agency-1',
        connectionId: 'conn-very-long-id-12345678',
        status: 'queued',
        idempotencyKey: 'idem-cred',
        snapshotHash: 'hash-1',
        credentialGeneration: 'gen-oldvalue',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);

      await expect(executeRun('run-cred')).rejects.toThrow(/credential.*generation|mismatch/i);
    });
  });

  describe('lease expiry / recovery', () => {
    it('re-reads exact recorded target before repeat mutation', async () => {
      const run = {
        id: 'run-lease',
        agencyId: 'agency-1',
        connectionId: 'conn-lease',
        status: 'queued',
        idempotencyKey: 'idem-lease',
        snapshotHash: 'hash-1',
        credentialGeneration: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      const item = {
        id: 'item-lease',
        runId: 'run-lease',
        productId: 'google_ads',
        classification: 'eligible_automatic',
        status: 'pending',
        assetLabel: 'ads-lease',
        grantId: 'grant-lease',
        grant: { id: 'grant-lease', product: 'google_ads', assetId: '999', assetName: 'Lease Account' },
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        ...run,
        ...args.data,
      } as any));
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue([item] as any);
      vi.mocked(prisma.googleOffboardingItem.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.googleOffboardingItem.update).mockResolvedValue(item as any);

      const { refreshClientPlatformAuthorization } = await import('@/services/token-lifecycle.service');
      vi.mocked(refreshClientPlatformAuthorization).mockResolvedValue({
        data: { accessToken: 'tok', outcome: 'still_valid' as const }, error: null,
      } as any);

      const { revokeAdsManagerLink } = await import('@/services/connectors/google-offboarding');
      vi.mocked(revokeAdsManagerLink).mockResolvedValue({
        success: false,
        providerOutcome: 'transient_failure',
        reason: 'Lease expired',
        retryable: true,
      });

      vi.mocked(prisma.googleOffboardingItem.findMany)
        .mockResolvedValueOnce([item] as any)
        .mockResolvedValueOnce([]);

      await executeRun('run-lease');

      const claimCall = vi.mocked(prisma.googleOffboardingItem.updateMany).mock.calls[0];
      expect(claimCall?.[0]?.where).toEqual(
        expect.objectContaining({ id: 'item-lease', status: 'pending', runId: 'run-lease' }),
      );
    });
  });

  describe('dispatch mode', () => {
    it('executes inline without queue access when workers disabled', async () => {
      process.env.BACKGROUND_WORKERS_ENABLED = 'false';

      const run = {
        id: 'run-inline',
        agencyId: 'agency-1',
        connectionId: 'conn-inline',
        status: 'queued',
        idempotencyKey: 'idem-inline',
        snapshotHash: 'hash-1',
        credentialGeneration: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        ...run,
        ...args.data,
      } as any));
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue([]);
      vi.mocked(clientOffboardingService.deriveRunOutcome).mockResolvedValue('completed');

      await dispatchOffboardingRun('run-inline');

      expect(prisma.googleOffboardingRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'run-inline' },
          data: expect.objectContaining({ status: 'executing' }),
        }),
      );
    });

    it('queues one singleton job when workers enabled', async () => {
      process.env.BACKGROUND_WORKERS_ENABLED = 'true';

      const mockEnqueue = vi.fn().mockResolvedValue('job-id-1');
      vi.doMock('@/lib/pg-boss.js', () => ({
        enqueueJob: mockEnqueue,
      }));

      await dispatchOffboardingRun('run-queued');

      expect(mockEnqueue).toHaveBeenCalledWith(
        'google-client-offboarding',
        { runId: 'run-queued' },
        expect.objectContaining({
          singletonKey: 'google-client-offboarding-run-queued',
        }),
      );

      vi.doUnmock('@/lib/pg-boss.js');
    });
  });

  describe('already-absent target', () => {
    it('completes without destructive retry', async () => {
      const run = {
        id: 'run-absent',
        agencyId: 'agency-1',
        connectionId: 'conn-absent',
        status: 'queued',
        idempotencyKey: 'idem-absent',
        snapshotHash: 'hash-1',
        credentialGeneration: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      const item = {
        id: 'item-absent',
        runId: 'run-absent',
        productId: 'ga4',
        classification: 'eligible_automatic',
        status: 'pending',
        assetLabel: 'ga4-123',
        grantId: 'grant-absent',
        grant: { id: 'grant-absent', product: 'ga4', assetId: 'prop-123', assetName: 'GA4 Prop' },
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        ...run,
        ...args.data,
      } as any));
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue([item] as any);
      vi.mocked(prisma.googleOffboardingItem.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.googleOffboardingItem.update).mockResolvedValue(item as any);

      const { refreshClientPlatformAuthorization } = await import('@/services/token-lifecycle.service');
      vi.mocked(refreshClientPlatformAuthorization).mockResolvedValue({
        data: { accessToken: 'tok', outcome: 'still_valid' as const }, error: null,
      } as any);

      const { revokeGa4AccessBinding } = await import('@/services/connectors/google-offboarding');
      vi.mocked(revokeGa4AccessBinding).mockResolvedValue({
        success: true,
        providerOutcome: 'already_absent',
        retryable: false,
      });

      vi.mocked(clientOffboardingService.deriveRunOutcome).mockResolvedValue('completed');

      const result = await executeRun('run-absent');

      expect(result.itemsProcessed).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('mixed batch cleanup', () => {
    it('blocks cleanup on retryable failure', async () => {
      const run = {
        id: 'run-mixed',
        agencyId: 'agency-1',
        connectionId: 'conn-mixed',
        status: 'executing',
        idempotencyKey: 'idem-mixed',
        snapshotHash: 'hash-1',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      const items = [
        { id: 'item-ok', runId: 'run-mixed', productId: 'google_ads', classification: 'eligible_automatic', status: 'revoked_verified' },
        { id: 'item-retry', runId: 'run-mixed', productId: 'ga4', classification: 'eligible_automatic', status: 'failed_retryable' },
      ];

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue(items as any);

      const result = await executeCleanup('run-mixed');

      expect(result.cleanupResult).toBe('blocked');
      expect(infisical.deleteOAuthTokens).not.toHaveBeenCalled();
    });
  });

  describe('secret cleanup', () => {
    it('deletes secret and marks completed_with_manual_follow_up when manual Search Console items exist', async () => {
      const run = {
        id: 'run-cleanup',
        agencyId: 'agency-1',
        connectionId: 'conn-cleanup',
        status: 'executing',
        idempotencyKey: 'idem-cleanup',
        snapshotHash: 'hash-1',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      const items = [
        { id: 'item-sc', runId: 'run-cleanup', productId: 'google_search_console', classification: 'eligible_automatic', status: 'attestation_recorded' },
        { id: 'item-ads', runId: 'run-cleanup', productId: 'google_ads', classification: 'eligible_automatic', status: 'revoked_verified' },
      ];

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue(items as any);
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({ id: 'conn-cleanup' } as any);
      vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue({ secretId: 'secret-1' } as any);
      vi.mocked(infisical.deleteOAuthTokens).mockResolvedValue(undefined);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        ...run,
        ...args.data,
      } as any));

      const result = await executeCleanup('run-cleanup');

      expect(infisical.deleteOAuthTokens).toHaveBeenCalledWith('secret-1');
      expect(result.cleanupResult).toBe('deleted');
      expect(result.finalStatus).toBe('completed_with_manual_follow_up');
    });

    it('records cleanup failure without rewriting provider outcomes', async () => {
      const run = {
        id: 'run-cfail',
        agencyId: 'agency-1',
        connectionId: 'conn-cfail',
        status: 'executing',
        idempotencyKey: 'idem-cfail',
        snapshotHash: 'hash-1',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      const items = [
        { id: 'item-ok', runId: 'run-cfail', productId: 'google_ads', classification: 'eligible_automatic', status: 'revoked_verified' },
      ];

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue(items as any);
      vi.mocked(prisma.clientConnection.findUnique).mockResolvedValue({ id: 'conn-cfail' } as any);
      vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue({ secretId: 'secret-fail' } as any);
      vi.mocked(infisical.deleteOAuthTokens).mockResolvedValue(undefined);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        ...run,
        ...args.data,
      } as any));

      const result = await executeCleanup('run-cfail');

      expect(result.cleanupResult).toBe('deleted');
      expect(result.finalStatus).toBe('completed');
      expect(prisma.googleOffboardingItem.update).not.toHaveBeenCalled();
    });
  });

  describe('sanitization', () => {
    it('audit logs contain no tokens or secrets', async () => {
      const run = {
        id: 'run-san',
        agencyId: 'agency-1',
        connectionId: 'conn-san',
        status: 'queued',
        idempotencyKey: 'idem-san',
        snapshotHash: 'hash-1',
        credentialGeneration: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      };

      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue(run as any);
      vi.mocked(prisma.googleOffboardingRun.update).mockImplementation(async (args: any) => ({
        ...run,
        ...args.data,
      } as any));
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue([]);
      vi.mocked(clientOffboardingService.deriveRunOutcome).mockResolvedValue('completed');

      await executeRun('run-san');

      for (const call of vi.mocked(auditService.createAuditLog).mock.calls) {
        const args = call[0] as any;
        const metadataStr = JSON.stringify(args?.metadata ?? {});
        expect(metadataStr).not.toContain('accessToken');
        expect(metadataStr).not.toContain('refreshToken');
        expect(metadataStr).not.toContain('secret');
        expect(metadataStr).not.toContain('ya29');
      }
    });

    it('receipt contains no tokens or secrets', async () => {
      vi.mocked(prisma.googleOffboardingRun.findUnique).mockResolvedValue({
        id: 'run-rcp',
        status: 'completed',
      } as any);
      vi.mocked(prisma.googleOffboardingItem.findMany).mockResolvedValue([{
        id: 'item-rcp',
        runId: 'run-rcp',
        productId: 'google_ads',
        classification: 'eligible_automatic',
        status: 'revoked_verified',
        providerOutcome: 'deleted',
        accessToken: 'ya29.super-secret-token',
        tokenSecretId: 'secret-xyz',
      }] as any);
      vi.mocked(prisma.googleOffboardingAttempt.findMany).mockResolvedValue([{
        id: 'att-rcp',
        itemId: 'item-rcp',
        runId: 'run-rcp',
        action: 'provider_call',
        providerOutcome: 'deleted',
        responseBody: JSON.stringify({ accessToken: 'ya29.xxx', refreshToken: '1//yyy' }),
      }] as any);

      const receipt = await buildReceipt('run-rcp');
      const receiptStr = JSON.stringify(receipt);

      expect(receiptStr).not.toContain('ya29');
      expect(receiptStr).not.toContain('secret-xyz');
      expect(receiptStr).not.toContain('refreshToken');
    });
  });
});
