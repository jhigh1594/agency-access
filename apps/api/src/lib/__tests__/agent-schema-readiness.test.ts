import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { assertAgentSchemaReady } from '@/lib/agent-schema-readiness';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

describe('agent-schema-readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
  });

  it('passes when every required table, column, index, and foreign key exists', async () => {
    await expect(assertAgentSchemaReady()).resolves.toBeUndefined();
  });

  it('reports every missing schema requirement as a launch-blocking error', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { kind: 'table', name: 'agent_grants' },
      { kind: 'index', name: 'agent_operations_grant_id_idempotency_key_key' },
    ]);

    await expect(assertAgentSchemaReady()).rejects.toThrow(
      'Agent schema is not ready for this deployment: missing table agent_grants, index agent_operations_grant_id_idempotency_key_key.'
    );
  });

  it('wraps probe failures without recommending db push in production', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('permission denied'));

    await expect(assertAgentSchemaReady()).rejects.toThrow(
      'Agent schema readiness probe failed: permission denied. Run committed Prisma migrations before enabling agent-native access.'
    );
  });
});
