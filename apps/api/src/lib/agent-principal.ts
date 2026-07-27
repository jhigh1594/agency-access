import type { AgentPermission } from '@agency-platform/shared';

export interface AgentRequestMetadata {
  ipAddress: string;
  userAgent: string;
  correlationId?: string;
}

export interface AgentPrincipal {
  kind: 'agent';
  ownerSubject: string;
  agencyId: string;
  oauthClientId: string;
  grantId: string;
  displayName: string;
  permissions: AgentPermission[];
  requestMetadata: AgentRequestMetadata;
}

export function hasAgentPermission(
  principal: AgentPrincipal,
  permission: AgentPermission
): boolean {
  return principal.permissions.includes(permission);
}
