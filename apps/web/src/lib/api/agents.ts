import type { AgentPermission } from '@agency-platform/shared';
import { authorizedApiFetch } from './authorized-api-fetch';

export interface AgentGrantRecord {
  id: string;
  agencyId: string;
  displayName: string;
  oauthClientId: string;
  permissions: AgentPermission[];
  state: 'active' | 'revoked';
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentApprovalPreviewRecord {
  agency: { id: string; name: string };
  client?: { id: string; name: string } | null;
  platforms: string[];
  permissions: string[];
  externalEffect: string;
  requestingAgent: { grantId: string; oauthClientId: string; displayName: string };
  expiresAt: string;
  changes: Array<{ field: string; before: string | null; after: string | null }>;
}

export interface AgentOperationRecord {
  id: string;
  actionType: string;
  riskClass: string;
  status: string;
  approvalPreview?: AgentApprovalPreviewRecord | null;
  result?: { message?: string; remediation?: string[] } | null;
  expiresAt?: string | null;
  decidedAt?: string | null;
}

type GetToken = () => Promise<string | null>;

export async function listAgentGrants(agencyId: string, getToken: GetToken) {
  const response = await authorizedApiFetch<{ data: AgentGrantRecord[] }>(`/api/agencies/${agencyId}/agent-grants`, { getToken });
  return response.data;
}

export async function createAgentGrant(agencyId: string, input: { oauthClientId: string; displayName: string; permissions: AgentPermission[] }, getToken: GetToken) {
  const response = await authorizedApiFetch<{ data: AgentGrantRecord }>(`/api/agencies/${agencyId}/agent-grants`, {
    method: 'POST', body: JSON.stringify(input), getToken,
  });
  return response.data;
}

export async function updateAgentGrant(
  agencyId: string,
  grantId: string,
  input: { displayName: string; permissions: AgentPermission[] },
  getToken: GetToken,
) {
  const response = await authorizedApiFetch<{ data: AgentGrantRecord }>(`/api/agencies/${agencyId}/agent-grants/${grantId}`, {
    method: 'PATCH', body: JSON.stringify(input), getToken,
  });
  return response.data;
}

export async function revokeAgentGrant(agencyId: string, grantId: string, getToken: GetToken) {
  const response = await authorizedApiFetch<{ data: { id: string; state: 'revoked' } }>(`/api/agencies/${agencyId}/agent-grants/${grantId}`, { method: 'DELETE', getToken });
  return response.data;
}

export async function getAgentOperation(agencyId: string, operationId: string, getToken: GetToken) {
  const response = await authorizedApiFetch<{ data: AgentOperationRecord }>(`/api/agencies/${agencyId}/agent-operations/${operationId}`, { getToken });
  return response.data;
}

export async function decideAgentOperation(agencyId: string, operationId: string, decision: 'approved' | 'declined', getToken: GetToken) {
  const response = await authorizedApiFetch<{ data: AgentOperationRecord }>(`/api/agencies/${agencyId}/agent-operations/${operationId}/decision`, {
    method: 'POST', body: JSON.stringify({ decision }), getToken,
  });
  return response.data;
}
