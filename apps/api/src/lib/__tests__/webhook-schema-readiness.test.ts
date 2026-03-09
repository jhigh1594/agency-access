import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { assertWebhookSchemaReady } from '@/lib/webhook-schema-readiness';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    webhookEndpoint: {
      findFirst: vi.fn(),
    },
    webhookEvent: {
      findFirst: vi.fn(),
    },
    webhookDelivery: {
      findFirst: vi.fn(),
    },
  },
}));

describe('webhook-schema-readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.webhookEndpoint.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.webhookEvent.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.webhookDelivery.findFirst).mockResolvedValue(null);
  });

  it('passes when webhook models are queryable', async () => {
    await expect(assertWebhookSchemaReady()).resolves.toBeUndefined();
  });

  it('throws a deployment-actionable error when a webhook table is missing', async () => {
    vi.mocked(prisma.webhookEndpoint.findFirst).mockRejectedValue({
      code: 'P2021',
      message: 'The table `public.webhook_endpoints` does not exist in the current database.',
    });

    await expect(assertWebhookSchemaReady()).rejects.toThrow(
      'Webhook schema is not ready for this deployment.'
    );

    await expect(assertWebhookSchemaReady()).rejects.toThrow(
      'Run `npm run db:push --workspace=apps/api` against the target database before starting the API.'
    );
  });

  it('includes the failing model name when schema verification fails', async () => {
    vi.mocked(prisma.webhookDelivery.findFirst).mockRejectedValue(new Error('relation "webhook_deliveries" does not exist'));

    await expect(assertWebhookSchemaReady()).rejects.toThrow('webhookDeliveries');
  });
});
