import { AgentPermissionSchema, type AgentPermission } from '@agency-platform/shared';
import { prisma } from '@/lib/prisma.js';
import type { AgentRequestMetadata } from '@/lib/agent-principal.js';
import { agentTelemetryService } from '@/services/agent-telemetry.service.js';

const permissionListSchema = AgentPermissionSchema.array().min(1);

function parsePermissions(value: unknown): AgentPermission[] {
  return permissionListSchema.parse(value);
}

function sanitizeGrant<T extends { permissions: unknown }>(grant: T) {
  return {
    ...grant,
    permissions: parsePermissions(grant.permissions),
  };
}

export const agentGrantService = {
  async resolveActiveGrant(input: {
    ownerSubject: string;
    oauthClientId: string;
    clerkPrincipalId: string;
  }) {
    const grant = await prisma.agentGrant.findFirst({
      where: {
        ownerSubject: input.ownerSubject,
        oauthClientId: input.oauthClientId,
        state: 'active',
        agency: { clerkUserId: input.clerkPrincipalId },
      },
    });

    return grant ? sanitizeGrant(grant) : null;
  },

  async listGrants(agencyId: string) {
    const grants = await prisma.agentGrant.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
    return grants.map(sanitizeGrant);
  },

  async createOrReactivateGrant(input: {
    agencyId: string;
    ownerSubject: string;
    oauthClientId: string;
    displayName: string;
    permissions: AgentPermission[];
    requestMetadata: AgentRequestMetadata;
  }) {
    const permissions = permissionListSchema.parse(input.permissions);
    const grant = await prisma.$transaction(async (transaction) => {
      const savedGrant = await transaction.agentGrant.upsert({
        where: {
          agencyId_ownerSubject_oauthClientId: {
            agencyId: input.agencyId,
            ownerSubject: input.ownerSubject,
            oauthClientId: input.oauthClientId,
          },
        },
        create: {
          agencyId: input.agencyId,
          ownerSubject: input.ownerSubject,
          oauthClientId: input.oauthClientId,
          displayName: input.displayName,
          permissions,
          state: 'active',
        },
        update: {
          displayName: input.displayName,
          permissions,
          state: 'active',
          revokedAt: null,
          revokedBy: null,
        },
      });
      await transaction.auditLog.create({
        data: {
          agencyId: input.agencyId,
          action: 'AGENT_GRANT_CREATED',
          resourceType: 'agent_grant',
          resourceId: savedGrant.id,
          actorType: 'human',
          actorId: input.ownerSubject,
          agentGrantId: savedGrant.id,
          oauthClientId: input.oauthClientId,
          ipAddress: input.requestMetadata.ipAddress,
          userAgent: input.requestMetadata.userAgent,
          metadata: { displayName: input.displayName, permissions },
        },
      });
      return savedGrant;
    });

    agentTelemetryService.recordConnection({
      agencyId: input.agencyId,
      grantId: grant.id,
      oauthClientId: input.oauthClientId,
    });

    return sanitizeGrant(grant);
  },

  async updateGrant(input: {
    agencyId: string;
    grantId: string;
    updatedBy: string;
    displayName?: string;
    permissions?: AgentPermission[];
    requestMetadata: AgentRequestMetadata;
  }) {
    const permissions = input.permissions
      ? permissionListSchema.parse(input.permissions)
      : undefined;
    const grant = await prisma.$transaction(async (transaction) => {
      const result = await transaction.agentGrant.updateMany({
        where: { id: input.grantId, agencyId: input.agencyId, state: 'active' },
        data: {
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(permissions !== undefined ? { permissions } : {}),
        },
      });
      if (result.count === 0) return null;
      const savedGrant = await transaction.agentGrant.findFirst({
        where: { id: input.grantId, agencyId: input.agencyId },
      });
      if (!savedGrant) return null;
      await transaction.auditLog.create({
        data: {
          agencyId: input.agencyId,
          action: 'AGENT_GRANT_UPDATED',
          resourceType: 'agent_grant',
          resourceId: savedGrant.id,
          actorType: 'human',
          actorId: input.updatedBy,
          agentGrantId: savedGrant.id,
          oauthClientId: savedGrant.oauthClientId,
          ipAddress: input.requestMetadata.ipAddress,
          userAgent: input.requestMetadata.userAgent,
          metadata: {
            ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
            ...(permissions !== undefined ? { permissions } : {}),
          },
        },
      });
      return savedGrant;
    });
    if (!grant) return null;
    return sanitizeGrant(grant);
  },

  async revokeGrant(input: {
    agencyId: string;
    grantId: string;
    revokedBy: string;
    requestMetadata: AgentRequestMetadata;
  }): Promise<boolean> {
    const revoked = await prisma.$transaction(async (transaction) => {
      const revokedAt = new Date();
      const result = await transaction.agentGrant.updateMany({
        where: { id: input.grantId, agencyId: input.agencyId, state: 'active' },
        data: { state: 'revoked', revokedAt, revokedBy: input.revokedBy },
      });
      if (result.count === 0) return false;

      await transaction.agentOperation.updateMany({
        where: {
          grantId: input.grantId,
          agencyId: input.agencyId,
          status: { in: ['prepared', 'pending_approval', 'approved'] },
        },
        data: { status: 'canceled', completedAt: revokedAt, retryable: false },
      });

      const grant = await transaction.agentGrant.findFirst({
        where: { id: input.grantId, agencyId: input.agencyId },
        select: { oauthClientId: true },
      });
      if (grant) {
        await transaction.auditLog.create({
          data: {
            agencyId: input.agencyId,
            action: 'AGENT_GRANT_REVOKED',
            resourceType: 'agent_grant',
            resourceId: input.grantId,
            actorType: 'human',
            actorId: input.revokedBy,
            agentGrantId: input.grantId,
            oauthClientId: grant.oauthClientId,
            ipAddress: input.requestMetadata.ipAddress,
            userAgent: input.requestMetadata.userAgent,
          },
        });
      }

      return true;
    });
    if (revoked) {
      agentTelemetryService.recordRevocation({ agencyId: input.agencyId, grantId: input.grantId });
    }
    return revoked;
  },

  async touchGrant(grantId: string): Promise<void> {
    await prisma.agentGrant.updateMany({
      where: { id: grantId, state: 'active' },
      data: { lastUsedAt: new Date() },
    });
  },
};
