import { prisma } from '@/lib/prisma';

interface SchemaProbe {
  label: string;
  check: () => Promise<unknown>;
}

function isMissingSchemaError(error: unknown): boolean {
  const prismaCode = typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined;
  const message = error instanceof Error ? error.message : String(error ?? '');

  return (
    prismaCode === 'P2021' ||
    prismaCode === 'P2022' ||
    message.toLowerCase().includes('does not exist') ||
    message.toLowerCase().includes('unknown column') ||
    message.toLowerCase().includes('missing column')
  );
}

export async function assertWebhookSchemaReady(): Promise<void> {
  const probes: SchemaProbe[] = [
    {
      label: 'webhookEndpoints',
      check: () => prisma.webhookEndpoint.findFirst({ select: { id: true } }),
    },
    {
      label: 'webhookEvents',
      check: () => prisma.webhookEvent.findFirst({ select: { id: true } }),
    },
    {
      label: 'webhookDeliveries',
      check: () => prisma.webhookDelivery.findFirst({ select: { id: true } }),
    },
  ];

  for (const probe of probes) {
    try {
      await probe.check();
    } catch (error) {
      const detail = isMissingSchemaError(error)
        ? `${probe.label} table or columns are missing`
        : `${probe.label} probe failed: ${error instanceof Error ? error.message : String(error)}`;

      throw new Error(
        `Webhook schema is not ready for this deployment. ${detail}. Run \`npm run db:push --workspace=apps/api\` against the target database before starting the API.`
      );
    }
  }
}
