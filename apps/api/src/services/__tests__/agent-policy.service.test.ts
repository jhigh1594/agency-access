import { describe, expect, it } from 'vitest';
import { AgentPolicyError, agentPolicyService } from '@/services/agent-policy.service.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';

const principal: AgentPrincipal = {
  kind: 'agent',
  ownerSubject: 'user-1',
  agencyId: 'agency-1',
  oauthClientId: 'oauth-1',
  grantId: 'grant-1',
  displayName: 'Assistant',
  permissions: ['workspace:read', 'clients:write', 'requests:dispatch'],
  requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: 'req-1' },
};

describe('agentPolicyService', () => {
  it('classifies actions and enforces the required permission', () => {
    expect(agentPolicyService.authorize(principal, 'workspace.read')).toMatchObject({
      riskClass: 'read',
      permission: 'workspace:read',
    });
    expect(agentPolicyService.authorize(principal, 'client.upsert').riskClass).toBe('reversible');
    expect(agentPolicyService.authorize(principal, 'access_request.dispatch').riskClass).toBe(
      'consequential'
    );
  });

  it('denies missing permissions and human-only actions', () => {
    expect(() => agentPolicyService.authorize(principal, 'request.prepare')).toThrow(
      AgentPolicyError
    );
    expect(() => agentPolicyService.authorize(principal, 'provider.consent.complete')).toThrow(
      /human/i
    );
  });

  it('fails closed for unknown actions', () => {
    expect(() => agentPolicyService.authorize(principal, 'unknown.action')).toThrow(/not recognized/i);
  });
});
