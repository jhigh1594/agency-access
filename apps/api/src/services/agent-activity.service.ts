import { prisma } from '@/lib/prisma.js';

function encodeCursor(createdAt: Date, id: bigint) {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id: id.toString() }), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { createdAt?: string; id?: string };
    const createdAt = new Date(parsed.createdAt || '');
    const id = BigInt(parsed.id || '');
    if (Number.isNaN(createdAt.getTime())) throw new Error();
    return { createdAt, id };
  } catch {
    throw new Error('Invalid activity cursor');
  }
}

function safeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  const value = metadata as Record<string, unknown>;
  return {
    ...(typeof value.actionType === 'string' ? { actionType: value.actionType } : {}),
    ...(typeof value.riskClass === 'string' ? { riskClass: value.riskClass } : {}),
    ...(typeof value.status === 'string' ? { status: value.status } : {}),
  };
}

export const agentActivityService = {
  async list(input: { agencyId: string; grantId?: string; cursor?: string; limit?: number }) {
    const limit = Math.min(Math.max(input.limit || 25, 1), 100);
    const cursor = input.cursor ? decodeCursor(input.cursor) : null;
    const rows = await prisma.auditLog.findMany({
      where: {
        agencyId: input.agencyId,
        ...(input.grantId ? { agentGrantId: input.grantId } : { agentGrantId: { not: null } }),
        ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    return {
      items: page.map((row) => ({
        id: row.id.toString(), action: row.action, resourceType: row.resourceType, resourceId: row.resourceId,
        grantId: row.agentGrantId, operationId: row.agentOperationId, createdAt: row.createdAt.toISOString(), metadata: safeMetadata(row.metadata),
      })),
      nextCursor: rows.length > limit && page.length > 0 ? encodeCursor(page[page.length - 1]!.createdAt, page[page.length - 1]!.id) : null,
    };
  },

  recoveryFor(state: { kind: 'access_request' | 'connection' | 'operation' | 'grant'; status: string; unresolvedProducts?: string[] }) {
    if (state.kind === 'grant' && state.status === 'revoked') return { nextAction: 'reconnect_agent', retryable: false, humanRequired: true };
    if (state.kind === 'connection' && ['invalid', 'expired', 'revoked'].includes(state.status)) return { nextAction: 'owner_connection_handoff', retryable: false, humanRequired: true };
    if (state.kind === 'operation' && state.status === 'failed_retryable') return { nextAction: 'retry_operation', retryable: true, humanRequired: false };
    if (state.kind === 'operation' && ['expired', 'declined', 'canceled'].includes(state.status)) return { nextAction: 'prepare_new_operation', retryable: false, humanRequired: true };
    if (state.kind === 'access_request' && (state.status === 'partial' || (state.unresolvedProducts?.length || 0) > 0)) return { nextAction: 'client_follow_up', retryable: false, humanRequired: true };
    return { nextAction: 'monitor', retryable: false, humanRequired: false };
  },
};
