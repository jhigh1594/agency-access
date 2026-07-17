import type { AgentPermission, AgentRiskClass } from '@agency-platform/shared';
import type { AgentPrincipal } from '@/lib/agent-principal.js';

export type AgentActionType =
  | 'workspace.read'
  | 'agency.update'
  | 'client.list'
  | 'client.upsert'
  | 'template.list'
  | 'connection.read'
  | 'connection.handoff'
  | 'request.list'
  | 'request.read'
  | 'request.prepare'
  | 'access_request.dispatch'
  | 'access_request.cancel'
  | 'operation.read'
  | 'provider.consent.complete';

export interface AgentActionPolicy {
  permission: AgentPermission | null;
  riskClass: AgentRiskClass;
}

const policies: Record<AgentActionType, AgentActionPolicy> = {
  'workspace.read': { permission: 'workspace:read', riskClass: 'read' },
  'agency.update': { permission: 'agency:write', riskClass: 'reversible' },
  'client.list': { permission: 'clients:read', riskClass: 'read' },
  'client.upsert': { permission: 'clients:write', riskClass: 'reversible' },
  'template.list': { permission: 'templates:read', riskClass: 'read' },
  'connection.read': { permission: 'connections:read', riskClass: 'read' },
  'connection.handoff': { permission: 'connections:handoff', riskClass: 'reversible' },
  'request.list': { permission: 'requests:read', riskClass: 'read' },
  'request.read': { permission: 'requests:read', riskClass: 'read' },
  'request.prepare': { permission: 'requests:prepare', riskClass: 'reversible' },
  'access_request.dispatch': { permission: 'requests:dispatch', riskClass: 'consequential' },
  'access_request.cancel': { permission: 'requests:cancel', riskClass: 'consequential' },
  'operation.read': { permission: 'operations:read', riskClass: 'read' },
  'provider.consent.complete': { permission: null, riskClass: 'human_only' },
};

export class AgentPolicyError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNKNOWN_ACTION' | 'PERMISSION_DENIED' | 'HUMAN_ACTION_REQUIRED'
  ) {
    super(message);
    this.name = 'AgentPolicyError';
  }
}

export const agentPolicyService = {
  authorize(principal: Pick<AgentPrincipal, 'permissions'>, actionType: string): AgentActionPolicy {
    const policy = policies[actionType as AgentActionType];
    if (!policy) throw new AgentPolicyError('Agent action is not recognized', 'UNKNOWN_ACTION');
    if (policy.riskClass === 'human_only') {
      throw new AgentPolicyError('This action requires a verified human handoff', 'HUMAN_ACTION_REQUIRED');
    }
    if (!policy.permission || !principal.permissions.includes(policy.permission)) {
      throw new AgentPolicyError('The agent grant does not include this permission', 'PERMISSION_DENIED');
    }
    return policy;
  },
};
