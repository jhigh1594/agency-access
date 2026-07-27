export function mcpStructuredResult(data: Record<string, unknown>, message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    structuredContent: data,
  };
}

export function sanitizeOperationForAgent(operation: any) {
  if (!operation) return null;
  return {
    id: operation.id,
    actionType: operation.actionType,
    riskClass: operation.riskClass,
    status: operation.status,
    approvalPreview: operation.approvalPreview || null,
    result: operation.result || null,
    failureCode: operation.failureCode || null,
    failureMessage: operation.failureMessage || null,
    retryable: Boolean(operation.retryable),
    expiresAt: operation.expiresAt instanceof Date ? operation.expiresAt.toISOString() : operation.expiresAt || null,
    createdAt: operation.createdAt instanceof Date ? operation.createdAt.toISOString() : operation.createdAt,
    updatedAt: operation.updatedAt instanceof Date ? operation.updatedAt.toISOString() : operation.updatedAt,
  };
}
