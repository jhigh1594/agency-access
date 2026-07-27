import { z } from 'zod';
import {
  PLATFORM_NAMES,
  SUPPORTED_CONNECTION_PLATFORMS,
  PlatformSchema,
  type AgentCompletionState,
} from '@agency-platform/shared';
import { env } from '@/lib/env.js';
import { prisma } from '@/lib/prisma.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { accessRequestNotificationService } from '@/services/access-request-notification.service.js';
import { accessRequestService } from '@/services/access-request.service.js';
import { agencyPlatformService } from '@/services/agency-platform.service.js';
import { agencyService } from '@/services/agency.service.js';
import { agentOperationService } from '@/services/agent-operation.service.js';
import { agentPolicyService } from '@/services/agent-policy.service.js';
import { clientService } from '@/services/client.service.js';
import { connectionService } from '@/services/connection.service.js';
import { templateService } from '@/services/template.service.js';

const PaginationSchema = z.object({ limit: z.number().int().min(1).max(100).default(25), offset: z.number().int().min(0).default(0) }).strict();
const RequestedPlatformSchema = z.object({
  platform: PlatformSchema,
  accessLevel: z.enum(['manage', 'view_only']),
  accountId: z.string().min(1).max(200).optional(),
}).strict();
const DispatchSnapshotSchema = z.object({
  clientId: z.string().min(1), clientName: z.string().min(1), clientEmail: z.string().email(),
  platforms: z.array(RequestedPlatformSchema).min(1),
  intakeFields: z.array(z.any()).optional(), branding: z.record(z.any()).optional(),
}).strict();
const CancelSnapshotSchema = z.object({ requestId: z.string().min(1), currentStatus: z.string().min(1) }).strict();

class RetryableAgentEffectError extends Error {
  readonly retryable = true;
}

function baseUrl() {
  return (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function safeAgencySettings(settings: unknown) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
  const value = settings as Record<string, unknown>;
  return {
    ...(typeof value.website === 'string' ? { website: value.website } : {}),
    ...(typeof value.logoUrl === 'string' ? { logoUrl: value.logoUrl } : {}),
  };
}

function safeConnection(connection: any) {
  return {
    id: connection.id,
    platform: connection.platform,
    state: connection.status,
    mode: connection.connectionMode,
    expiresAt: connection.expiresAt instanceof Date ? connection.expiresAt.toISOString() : connection.expiresAt || null,
    verificationStatus: connection.verificationStatus || null,
  };
}

function safeClient(client: any) {
  return { id: client.id, name: client.name, company: client.company, website: client.website || null, language: client.language || 'en' };
}

function safeTemplate(template: any) {
  return { id: template.id, name: template.name, description: template.description || null, platforms: template.platforms, isDefault: Boolean(template.isDefault) };
}

function safeRequest(request: any) {
  return {
    id: request.id,
    clientId: request.clientId || null,
    clientName: request.clientName,
    status: request.status,
    platforms: request.platforms,
    expiresAt: request.expiresAt instanceof Date ? request.expiresAt.toISOString() : request.expiresAt,
    createdAt: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
  };
}

async function auditRead(principal: AgentPrincipal, action: string, resourceType: string, resourceId: string) {
  await prisma.auditLog.create({
    data: {
      agencyId: principal.agencyId,
      action,
      resourceType,
      resourceId,
      actorType: 'agent',
      actorId: principal.ownerSubject,
      agentGrantId: principal.grantId,
      oauthClientId: principal.oauthClientId,
      ipAddress: principal.requestMetadata.ipAddress,
      userAgent: principal.requestMetadata.userAgent,
      metadata: { correlationId: principal.requestMetadata.correlationId },
    },
  });
}

function platformsFromTemplate(value: unknown) {
  if (Array.isArray(value)) return RequestedPlatformSchema.array().parse(value);
  if (!value || typeof value !== 'object') return [];
  const platforms: Array<z.infer<typeof RequestedPlatformSchema>> = [];
  for (const products of Object.values(value as Record<string, unknown>)) {
    if (!Array.isArray(products)) continue;
    for (const product of products) {
      platforms.push(RequestedPlatformSchema.parse({ platform: product, accessLevel: 'manage' }));
    }
  }
  return platforms;
}

function completionState(status: string, unresolvedCount: number): AgentCompletionState {
  if (status === 'completed' && unresolvedCount === 0) return 'completed';
  if (status === 'expired') return 'expired';
  if (status === 'revoked') return 'revoked';
  if (status === 'partial' || unresolvedCount > 0) return 'follow_up_needed';
  if (status === 'pending') return 'pending';
  return 'invalid';
}

function connectionPlatform(platform: string): string {
  if (platform === 'google_ads' || platform === 'ga4') return 'google';
  if (platform === 'meta_ads' || platform === 'meta_pages' || platform === 'instagram') return 'meta';
  if (platform === 'tiktok_ads') return 'tiktok';
  if (platform === 'linkedin_ads' || platform === 'linkedin_pages') return 'linkedin';
  if (platform === 'snapchat_ads') return 'snapchat';
  return platform;
}

export const agentAccessOperationsService = {
  async getWorkspaceContext(principal: AgentPrincipal, paginationInput: { limit?: number; offset?: number } = {}) {
    agentPolicyService.authorize(principal, 'workspace.read');
    const pagination = PaginationSchema.parse(paginationInput);
    const [agency, clients, templates, connections, requests, tokenHealth] = await Promise.all([
      prisma.agency.findFirst({ where: { id: principal.agencyId }, select: { id: true, name: true, settings: true } }),
      clientService.getClients({ agencyId: principal.agencyId, limit: pagination.limit, offset: pagination.offset }),
      templateService.getAgencyTemplates(principal.agencyId),
      agencyPlatformService.getConnections(principal.agencyId),
      accessRequestService.getAgencyAccessRequests(principal.agencyId, { limit: pagination.limit, offset: pagination.offset }),
      connectionService.getAgencyTokenHealth(principal.agencyId),
    ]);
    if (!agency) throw new Error('Agency not found');
    if (templates.error || connections.error || requests.error || tokenHealth.error) throw new Error('Workspace context is temporarily unavailable');
    await auditRead(principal, 'AGENT_WORKSPACE_READ', 'agency', principal.agencyId);
    return {
      agency: { id: agency.id, name: agency.name, settings: safeAgencySettings(agency.settings) },
      clients: { items: clients.data.map(safeClient), pagination: clients.pagination },
      templates: (templates.data || []).map(safeTemplate),
      supportedPlatforms: SUPPORTED_CONNECTION_PLATFORMS.map((platform) => ({
        id: platform,
        name: PLATFORM_NAMES[platform],
      })),
      connections: (connections.data || []).map(safeConnection),
      tokenHealth: (tokenHealth.data || []).map((authorization) => ({
        id: authorization.id,
        connectionId: authorization.connectionId,
        platform: authorization.platform,
        status: authorization.status,
        health: authorization.health,
        daysUntilExpiry: authorization.daysUntilExpiry,
        expiresAt: authorization.expiresAt instanceof Date
          ? authorization.expiresAt.toISOString()
          : authorization.expiresAt || null,
        canRefresh: authorization.canRefresh,
      })),
      requests: (requests.data || []).map(safeRequest),
    };
  },

  async getReadiness(principal: AgentPrincipal, requestedPlatforms: string[]) {
    agentPolicyService.authorize(principal, 'connection.read');
    const platforms = z.array(PlatformSchema).min(1).max(25).parse([...new Set(requestedPlatforms)]);
    const result = await agencyPlatformService.getConnections(principal.agencyId);
    if (result.error) throw new Error('Connection readiness is temporarily unavailable');
    const byPlatform = new Map((result.data || []).map((connection: any) => [connection.platform, connection]));
    const connections = platforms.map((platform) => {
      const connection: any = byPlatform.get(platform) || byPlatform.get(connectionPlatform(platform));
      const state = connection?.status || 'missing';
      const healthy = state === 'active';
      return {
        platform,
        state,
        healthy,
        ...(healthy ? {} : { handoffUrl: `${baseUrl()}/settings?tab=connections&platform=${encodeURIComponent(platform)}` }),
      };
    });
    await auditRead(principal, 'AGENT_READINESS_READ', 'agency', principal.agencyId);
    return { ready: connections.every((connection) => connection.healthy), connections };
  },

  async prepareAccessRequest(principal: AgentPrincipal, input: {
    clientId: string;
    templateId?: string;
    platforms?: Array<{ platform: string; accessLevel: 'manage' | 'view_only'; accountId?: string }>;
    idempotencyKey: string;
  }) {
    agentPolicyService.authorize(principal, 'request.prepare');
    const [agency, client] = await Promise.all([
      prisma.agency.findFirst({ where: { id: principal.agencyId }, select: { id: true, name: true } }),
      clientService.getClientById(input.clientId, principal.agencyId),
    ]);
    if (!agency || !client) throw new Error('Client not found in the authorized agency');
    const template = input.templateId ? await templateService.getTemplate(input.templateId, principal.agencyId) : null;
    if (template?.error) throw new Error('Template not found in the authorized agency');
    const platforms = input.platforms
      ? RequestedPlatformSchema.array().min(1).max(25).parse(input.platforms)
      : platformsFromTemplate(template?.data?.platforms);
    if (platforms.length === 0) throw new Error('At least one supported platform is required');
    const readiness = await this.getReadiness(principal, platforms.map((item) => item.platform));
    if (!readiness.ready) {
      const error = new Error('Agency connections must be ready before preparing this request') as Error & { readiness?: unknown };
      error.readiness = readiness;
      throw error;
    }
    const snapshot = DispatchSnapshotSchema.parse({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      platforms,
      ...(template?.data?.intakeFields ? { intakeFields: template.data.intakeFields } : {}),
      ...(template?.data?.branding ? { branding: template.data.branding } : {}),
    });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    return agentOperationService.prepare({
      principal,
      actionType: 'access_request.dispatch',
      idempotencyKey: input.idempotencyKey,
      input: snapshot,
      approvalPreview: {
        agency: { id: agency.id, name: agency.name },
        client: { id: client.id, name: client.name },
        platforms: platforms.map((item) => item.platform),
        permissions: platforms.map((item) => item.accessLevel),
        externalEffect: `Create one access request and email one authorization link to the selected client`,
        requestingAgent: { grantId: principal.grantId, oauthClientId: principal.oauthClientId, displayName: principal.displayName },
        expiresAt,
        changes: [],
      },
    });
  },

  async executePreparedOperation(principal: AgentPrincipal, operationId: string) {
    const prepared: any = await agentOperationService.getScoped(principal, operationId);
    if (!prepared) throw new Error('Agent operation not found');
    return agentOperationService.execute({
      principal,
      operationId,
      effect: async (rawSnapshot) => {
        if (prepared.actionType === 'access_request.cancel') {
          const snapshot = CancelSnapshotSchema.parse(rawSnapshot);
          const current = await accessRequestService.getAccessRequestById(snapshot.requestId, principal.agencyId);
          if (current.error || !current.data) throw new Error('Access request not found in the authorized agency');
          if (current.data.status === 'revoked') {
            return { resourceType: 'access_request', resourceId: snapshot.requestId, completionState: 'revoked' as const, message: 'The access request was canceled', retryable: false, remediation: [] };
          }
          if (current.data.status !== snapshot.currentStatus) {
            throw new Error('Access request changed after approval; prepare a new cancellation');
          }
          const canceled = await accessRequestService.cancelAccessRequest(snapshot.requestId);
          if (canceled.error) throw new RetryableAgentEffectError('Unable to cancel the access request');
          return { resourceType: 'access_request', resourceId: snapshot.requestId, completionState: 'revoked' as const, message: 'The access request was canceled', retryable: false, remediation: [] };
        }
        if (prepared.actionType !== 'access_request.dispatch') throw new Error('Unsupported approved operation action');
        const snapshot = DispatchSnapshotSchema.parse(rawSnapshot);
        const currentClient = await clientService.getClientById(snapshot.clientId, principal.agencyId);
        if (!currentClient || currentClient.name !== snapshot.clientName || currentClient.email !== snapshot.clientEmail) {
          throw new Error('Client changed after approval; prepare a new access request');
        }
        const existing = await accessRequestService.findByAgentOperation(principal.agencyId, operationId);
        if (existing.error) throw new RetryableAgentEffectError('Unable to resolve the existing request');
        let accessRequest: any = existing.data;
        if (!accessRequest) {
          const created = await accessRequestService.createAccessRequest({
            agencyId: principal.agencyId,
            clientId: snapshot.clientId,
            clientName: snapshot.clientName,
            clientEmail: snapshot.clientEmail,
            platforms: snapshot.platforms,
            intakeFields: snapshot.intakeFields,
            branding: snapshot.branding,
            externalReference: `agent-operation:${operationId}`,
          });
          if (created.error || !created.data) throw new RetryableAgentEffectError('Unable to create the access request');
          accessRequest = created.data;
        }
        const agency = await prisma.agency.findFirst({ where: { id: principal.agencyId }, select: { name: true } });
        if (!agency) throw new Error('Agency not found');
        const delivery = await accessRequestNotificationService.sendClientInvite({
          operationId,
          accessRequestId: accessRequest.id,
          uniqueToken: accessRequest.uniqueToken,
          clientName: accessRequest.clientName,
          clientEmail: accessRequest.clientEmail,
          agencyName: agency.name,
        });
        if (delivery.error) throw new RetryableAgentEffectError(delivery.error.message);
        return {
          resourceType: 'access_request',
          resourceId: accessRequest.id,
          completionState: 'pending' as const,
          message: 'The access request was created and the client invitation was dispatched',
          retryable: false,
          remediation: [],
        };
      },
    });
  },

  async prepareCancelAccessRequest(principal: AgentPrincipal, input: { requestId: string; idempotencyKey: string }) {
    const policy = agentPolicyService.authorize(principal, 'access_request.cancel');
    if (policy.riskClass !== 'consequential') throw new Error('Cancel policy must remain consequential');
    const result = await accessRequestService.getAccessRequestById(input.requestId, principal.agencyId);
    if (result.error || !result.data) throw new Error('Access request not found in the authorized agency');
    const request: any = result.data;
    if (['revoked', 'expired'].includes(request.status)) throw new Error('Access request is already terminal');
    const agency = await prisma.agency.findFirst({ where: { id: principal.agencyId }, select: { id: true, name: true } });
    if (!agency) throw new Error('Agency not found');
    return agentOperationService.prepare({
      principal, actionType: 'access_request.cancel', idempotencyKey: input.idempotencyKey,
      input: { requestId: request.id, currentStatus: request.status },
      approvalPreview: {
        agency, client: request.clientId && request.clientName ? { id: request.clientId, name: request.clientName } : null,
        platforms: Array.isArray(request.platforms) ? request.platforms.map((item: any) => item.platform || item.platformGroup).filter(Boolean) : [],
        permissions: [], externalEffect: 'Cancel this access request and prevent further client authorization',
        requestingAgent: { grantId: principal.grantId, oauthClientId: principal.oauthClientId, displayName: principal.displayName },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        changes: [{ field: 'status', before: request.status, after: 'revoked' }],
      },
    });
  },

  async saveClient(principal: AgentPrincipal, input: {
    id?: string;
    name: string;
    company: string;
    email: string;
    website?: string;
    language?: 'en' | 'es' | 'nl';
    idempotencyKey: string;
  }) {
    agentPolicyService.authorize(principal, 'client.upsert');
    const { idempotencyKey, ...clientPayload } = input;
    const snapshot = z.object({
      id: z.string().min(1).optional(),
      name: z.string().min(1).max(120),
      company: z.string().min(1).max(160),
      email: z.string().email(),
      website: z.string().url().optional(),
      language: z.enum(['en', 'es', 'nl']).optional(),
    }).strict().parse(clientPayload);
    if (snapshot.id && !(await clientService.getClientById(snapshot.id, principal.agencyId))) {
      throw new Error('Client not found in the authorized agency');
    }
    const operation: any = await agentOperationService.prepare({
      principal,
      actionType: 'client.upsert',
      idempotencyKey,
      input: snapshot,
    });
    if (operation.status === 'succeeded') return { operation, claimed: false };
    return agentOperationService.execute({
      principal,
      operationId: operation.id,
      effect: async (rawSnapshot) => {
        const clientInput = z.object({
          id: z.string().min(1).optional(), name: z.string(), company: z.string(), email: z.string().email(),
          website: z.string().url().optional(), language: z.enum(['en', 'es', 'nl']).optional(),
        }).parse(rawSnapshot);
        const { id, ...clientData } = clientInput;
        let client;
        if (id) {
          client = await clientService.updateClient(id, principal.agencyId, clientData);
        } else {
          client = await clientService.getClientById(operation.id, principal.agencyId);
          if (!client) {
            client = await clientService.createClient({ id: operation.id, agencyId: principal.agencyId, ...clientData });
          }
        }
        if (!client) throw new Error('Client not found in the authorized agency');
        return { resourceType: 'client', resourceId: client.id, completionState: 'completed', message: 'Client profile saved', retryable: false, remediation: [] };
      },
    });
  },

  async updateAgencyProfile(principal: AgentPrincipal, input: {
    name?: string;
    website?: string;
    logoUrl?: string;
    idempotencyKey: string;
  }) {
    agentPolicyService.authorize(principal, 'agency.update');
    const { idempotencyKey, ...agencyPayload } = input;
    const snapshot = z.object({
      name: z.string().min(1).max(160).optional(),
      website: z.string().url().optional(),
      logoUrl: z.string().url().optional(),
    }).strict().refine((value) => Object.keys(value).length > 0).parse(agencyPayload);
    const operation: any = await agentOperationService.prepare({
      principal,
      actionType: 'agency.update',
      idempotencyKey,
      input: snapshot,
    });
    if (operation.status === 'succeeded') return { operation, claimed: false };
    return agentOperationService.execute({
      principal,
      operationId: operation.id,
      effect: async (rawSnapshot) => {
        const update = z.object({ name: z.string().optional(), website: z.string().url().optional(), logoUrl: z.string().url().optional() }).parse(rawSnapshot);
        const result = await agencyService.updateAgency(principal.agencyId, {
          ...(update.name ? { name: update.name } : {}),
          ...(update.website || update.logoUrl ? { settings: { ...(update.website ? { website: update.website } : {}), ...(update.logoUrl ? { logoUrl: update.logoUrl } : {}) } } : {}),
        });
        if (result.error || !result.data) throw new Error('Agency profile could not be updated');
        return { resourceType: 'agency', resourceId: principal.agencyId, completionState: 'completed', message: 'Agency profile updated', retryable: false, remediation: [] };
      },
    });
  },

  async getRequestState(principal: AgentPrincipal, requestId: string) {
    agentPolicyService.authorize(principal, 'request.read');
    const result = await accessRequestService.getAccessRequestById(requestId, principal.agencyId);
    if (result.error || !result.data) throw new Error('Access request not found');
    const progress = (result.data as any).authorizationProgress || {};
    const unresolved = Array.isArray(progress.unresolvedProducts) ? progress.unresolvedProducts : [];
    const unresolvedProducts = unresolved.map((item: any) => typeof item === 'string' ? item : item.product).filter(Boolean);
    await auditRead(principal, 'AGENT_ACCESS_REQUEST_READ', 'access_request', requestId);
    return {
      id: (result.data as any).id,
      status: (result.data as any).status,
      completionState: completionState((result.data as any).status, unresolvedProducts.length),
      platforms: (result.data as any).platforms,
      fulfilledProducts: Array.isArray(progress.fulfilledProducts) ? progress.fulfilledProducts : [],
      unresolvedProducts,
      nextActions: unresolvedProducts.length > 0 ? ['Ask the client to select the required assets in the existing authorization flow'] : [],
    };
  },

  async initiateConnectionHandoff(principal: AgentPrincipal, input: { platform: string; idempotencyKey: string }) {
    agentPolicyService.authorize(principal, 'connection.handoff');
    const parsedPlatform = PlatformSchema.parse(input.platform);
    const operation: any = await agentOperationService.prepare({
      principal,
      actionType: 'connection.handoff',
      idempotencyKey: input.idempotencyKey,
      input: { platform: parsedPlatform },
    });
    if (operation.status === 'succeeded') return { operation, claimed: false };
    return agentOperationService.execute({
      principal,
      operationId: operation.id,
      effect: async (rawSnapshot) => {
        const snapshot = z.object({ platform: PlatformSchema }).strict().parse(rawSnapshot);
        const handoffUrl = `${baseUrl()}/settings?tab=connections&platform=${encodeURIComponent(snapshot.platform)}`;
        return {
          resourceType: 'agency',
          resourceId: principal.agencyId,
          completionState: 'follow_up_needed' as const,
          message: 'The agency owner must complete provider authorization in AuthHub',
          retryable: false,
          remediation: [handoffUrl],
        };
      },
    });
  },
};
