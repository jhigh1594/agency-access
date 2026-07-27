import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { agentAccessOperationsService } from '@/services/agent-access-operations.service.js';
import { agentOperationService } from '@/services/agent-operation.service.js';
import { clientService } from '@/services/client.service.js';
import { templateService } from '@/services/template.service.js';
import { agencyPlatformService } from '@/services/agency-platform.service.js';
import { accessRequestService } from '@/services/access-request.service.js';
import { accessRequestNotificationService } from '@/services/access-request-notification.service.js';
import { connectionService } from '@/services/connection.service.js';

vi.mock('@/lib/env.js', () => ({ env: { FRONTEND_URL: 'https://app.example.com' } }));
vi.mock('@/lib/prisma.js', () => ({ prisma: { agency: { findFirst: vi.fn(), findUnique: vi.fn() }, auditLog: { create: vi.fn() } } }));
vi.mock('@/services/client.service.js', () => ({ clientService: { getClients: vi.fn(), getClientById: vi.fn(), createClient: vi.fn(), updateClient: vi.fn() } }));
vi.mock('@/services/template.service.js', () => ({ templateService: { getAgencyTemplates: vi.fn(), getTemplate: vi.fn() } }));
vi.mock('@/services/agency-platform.service.js', () => ({ agencyPlatformService: { getConnections: vi.fn() } }));
vi.mock('@/services/connection.service.js', () => ({ connectionService: { getAgencyTokenHealth: vi.fn() } }));
vi.mock('@/services/agency.service.js', () => ({ agencyService: { updateAgency: vi.fn() } }));
vi.mock('@/services/access-request.service.js', () => ({ accessRequestService: { getAgencyAccessRequests: vi.fn(), getAccessRequestById: vi.fn(), findByAgentOperation: vi.fn(), createAccessRequest: vi.fn(), cancelAccessRequest: vi.fn() } }));
vi.mock('@/services/access-request-notification.service.js', () => ({ accessRequestNotificationService: { sendClientInvite: vi.fn() } }));
vi.mock('@/services/agent-operation.service.js', () => ({ agentOperationService: { prepare: vi.fn(), execute: vi.fn(), getScoped: vi.fn() } }));

const principal: AgentPrincipal = {
  kind: 'agent', ownerSubject: 'user-1', agencyId: 'agency-1', oauthClientId: 'oauth-1', grantId: 'grant-1', displayName: 'Assistant',
  permissions: ['workspace:read', 'clients:read', 'clients:write', 'templates:read', 'connections:read', 'connections:handoff', 'requests:read', 'requests:prepare', 'requests:dispatch', 'operations:read'],
  requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: 'req-1' },
};

describe('agentAccessOperationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.agency.findFirst).mockResolvedValue({ id: 'agency-1', name: 'Agency', settings: {} } as any);
    vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({ data: [{ id: 'connection-1', platform: 'google', status: 'active' }], error: null } as any);
    vi.mocked(connectionService.getAgencyTokenHealth).mockResolvedValue({ data: [], error: null } as any);
  });

  it('returns an agency-scoped, bounded, secret-free workspace context', async () => {
    vi.mocked(clientService.getClients).mockResolvedValue({ data: [{ id: 'client-1', agencyId: 'agency-1', name: 'Jamie', company: 'Acme', email: 'private@example.com', website: null, language: 'en', createdAt: new Date() }], pagination: { total: 1, limit: 10, offset: 0 } } as any);
    vi.mocked(templateService.getAgencyTemplates).mockResolvedValue({ data: [], error: null });
    vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({ data: [{ id: 'connection-1', platform: 'google', status: 'active', secretId: 'never-return', metadata: { accessToken: 'never-return' } }], error: null } as any);
    vi.mocked(connectionService.getAgencyTokenHealth).mockResolvedValue({
      data: [{
        id: 'authorization-1', connectionId: 'connection-1', platform: 'google', status: 'active',
        health: 'healthy', daysUntilExpiry: 30, expiresAt: new Date('2026-08-16T00:00:00.000Z'),
        canRefresh: true, secretId: 'never-return', clientName: 'private@example.com',
      }],
      error: null,
    } as any);
    vi.mocked(accessRequestService.getAgencyAccessRequests).mockResolvedValue({ data: [], error: null });

    const result = await agentAccessOperationsService.getWorkspaceContext(principal, { limit: 10 });
    expect(clientService.getClients).toHaveBeenCalledWith(expect.objectContaining({ agencyId: 'agency-1', limit: 10 }));
    expect(JSON.stringify(result)).not.toMatch(/private@example|secretId|accessToken|never-return/);
    expect(result.clients.items[0]).toEqual(expect.objectContaining({ id: 'client-1', company: 'Acme' }));
    expect(result.supportedPlatforms).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'google' })]));
    expect(result.tokenHealth).toEqual([expect.objectContaining({ id: 'authorization-1', health: 'healthy' })]);
  });

  it('reports missing or unhealthy connections with authenticated human handoffs', async () => {
    vi.mocked(agencyPlatformService.getConnections).mockResolvedValue({ data: [{ id: 'c-1', platform: 'google', status: 'expired', secretId: 'secret' }], error: null } as any);
    const result = await agentAccessOperationsService.getReadiness(principal, ['google', 'meta']);
    expect(result.ready).toBe(false);
    expect(result.connections).toEqual(expect.arrayContaining([expect.objectContaining({ platform: 'meta', state: 'missing', handoffUrl: expect.stringContaining('/settings') })]));
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('prepares a dispatch approval without creating a canonical request', async () => {
    vi.mocked(clientService.getClientById).mockResolvedValue({ id: 'client-1', agencyId: 'agency-1', name: 'Jamie', company: 'Acme', email: 'jamie@example.com' } as any);
    vi.mocked(agentOperationService.prepare).mockResolvedValue({ id: 'op-1', status: 'pending_approval' } as any);
    const result = await agentAccessOperationsService.prepareAccessRequest(principal, {
      clientId: 'client-1', platforms: [{ platform: 'google_ads', accessLevel: 'manage' }], idempotencyKey: 'prepare-1',
    });
    expect(result).toMatchObject({ id: 'op-1', status: 'pending_approval' });
    expect(accessRequestService.createAccessRequest).not.toHaveBeenCalled();
    expect(agentOperationService.prepare).toHaveBeenCalledWith(expect.objectContaining({ actionType: 'access_request.dispatch', approvalPreview: expect.objectContaining({ agency: { id: 'agency-1', name: 'Agency' } }) }));
  });

  it('retries only invitation delivery after a post-create failure and never creates a duplicate request', async () => {
    vi.mocked(agentOperationService.getScoped).mockResolvedValue({ id: 'op-1', actionType: 'access_request.dispatch' } as any);
    vi.mocked(clientService.getClientById).mockResolvedValue({ id: 'client-1', agencyId: 'agency-1', name: 'Jamie', email: 'jamie@example.com' } as any);
    const snapshot = { clientId: 'client-1', clientName: 'Jamie', clientEmail: 'jamie@example.com', platforms: [{ platform: 'google_ads', accessLevel: 'manage' }] };
    vi.mocked(agentOperationService.execute).mockImplementation(async ({ effect }: any) => {
      try {
        return { operation: { id: 'op-1', status: 'succeeded', result: await effect(snapshot) }, claimed: true };
      } catch {
        return { operation: { id: 'op-1', status: 'failed_retryable' }, claimed: true };
      }
    });
    const request = { id: 'request-1', uniqueToken: 'token-1', clientName: 'Jamie', clientEmail: 'jamie@example.com' };
    vi.mocked(accessRequestService.findByAgentOperation)
      .mockResolvedValueOnce({ data: null, error: null } as any)
      .mockResolvedValueOnce({ data: request, error: null } as any);
    vi.mocked(accessRequestService.createAccessRequest).mockResolvedValue({ data: request, error: null } as any);
    vi.mocked(accessRequestNotificationService.sendClientInvite)
      .mockResolvedValueOnce({ data: null, error: { code: 'INVITE_DELIVERY_FAILED', message: 'Delivery failed', retryable: true } } as any)
      .mockResolvedValueOnce({ data: { accessRequestId: 'request-1' }, error: null });

    const first = await agentAccessOperationsService.executePreparedOperation(principal, 'op-1');
    const retry = await agentAccessOperationsService.executePreparedOperation(principal, 'op-1');

    expect(first.operation).toMatchObject({ status: 'failed_retryable' });
    expect(retry.operation).toMatchObject({ status: 'succeeded' });
    expect(accessRequestService.createAccessRequest).toHaveBeenCalledTimes(1);
    expect(accessRequestNotificationService.sendClientInvite).toHaveBeenCalledTimes(2);
    expect(accessRequestNotificationService.sendClientInvite).toHaveBeenNthCalledWith(2, expect.objectContaining({ operationId: 'op-1', accessRequestId: 'request-1' }));
  });

  it('makes connection handoff initiation durable and idempotent', async () => {
    vi.mocked(agentOperationService.prepare).mockResolvedValue({ id: 'op-handoff-1', status: 'prepared' } as any);
    vi.mocked(agentOperationService.execute).mockImplementation(async ({ effect }: any) => ({
      operation: { id: 'op-handoff-1', status: 'succeeded', result: await effect({ platform: 'google' }) },
      claimed: true,
    }));

    const result: any = await agentAccessOperationsService.initiateConnectionHandoff(principal, {
      platform: 'google',
      idempotencyKey: 'handoff-1',
    });

    expect(agentOperationService.prepare).toHaveBeenCalledWith(expect.objectContaining({
      actionType: 'connection.handoff',
      idempotencyKey: 'handoff-1',
    }));
    expect(result.operation.result.remediation[0]).toContain('/settings?tab=connections&platform=google');
  });

  it('refuses an approved dispatch when the client changed after approval', async () => {
    vi.mocked(agentOperationService.getScoped).mockResolvedValue({ id: 'op-1', actionType: 'access_request.dispatch' } as any);
    vi.mocked(agentOperationService.execute).mockImplementation(async ({ effect }: any) => effect({ clientId: 'client-1', clientName: 'Jamie', clientEmail: 'old@example.com', platforms: [{ platform: 'google_ads', accessLevel: 'manage' }] }));
    vi.mocked(clientService.getClientById).mockResolvedValue({ id: 'client-1', agencyId: 'agency-1', name: 'Jamie', email: 'new@example.com' } as any);

    await expect(agentAccessOperationsService.executePreparedOperation(principal, 'op-1')).rejects.toThrow('Client changed after approval');
    expect(accessRequestService.createAccessRequest).not.toHaveBeenCalled();
  });

  it('uses the operation id as the deterministic client id for retry-safe creation', async () => {
    vi.mocked(agentOperationService.prepare).mockResolvedValue({ id: 'op-client-1', status: 'prepared' } as any);
    vi.mocked(agentOperationService.execute).mockImplementation(async ({ effect }: any) => ({ operation: await effect({ name: 'Jamie', company: 'Acme', email: 'jamie@example.com' }), claimed: true }));
    vi.mocked(clientService.getClientById).mockResolvedValue(null);
    vi.mocked(clientService.createClient).mockResolvedValue({ id: 'op-client-1', agencyId: 'agency-1', name: 'Jamie', company: 'Acme', email: 'jamie@example.com' } as any);

    await agentAccessOperationsService.saveClient(principal, {
      name: 'Jamie', company: 'Acme', email: 'jamie@example.com', idempotencyKey: 'client-create-1',
    });

    expect(clientService.createClient).toHaveBeenCalledWith(expect.objectContaining({ id: 'op-client-1', agencyId: 'agency-1' }));
  });

  it('preserves truthful partial fulfillment and unresolved products', async () => {
    vi.mocked(accessRequestService.getAccessRequestById).mockResolvedValue({ data: { id: 'request-1', agencyId: 'agency-1', status: 'partial', platforms: [], uniqueToken: 'never-return', clientEmail: 'private@example.com', authorizationProgress: { isComplete: false, unresolvedProducts: ['ga4'] } }, error: null } as any);
    const result = await agentAccessOperationsService.getRequestState(principal, 'request-1');
    expect(result).toMatchObject({ id: 'request-1', completionState: 'follow_up_needed', unresolvedProducts: ['ga4'] });
    expect(JSON.stringify(result)).not.toMatch(/never-return|private@example/);
  });
});
