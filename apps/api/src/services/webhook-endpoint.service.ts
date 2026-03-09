import { randomBytes, randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { auditService } from '@/services/audit.service';

interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

const WebhookEndpointMutationSchema = z.object({
  url: z.string().url(),
  subscribedEvents: z.array(z.enum([
    'webhook.test',
    'access_request.partial',
    'access_request.completed',
  ])).min(1).max(3),
  agencyId: z.string().min(1),
});

const WebhookCreateSchema = WebhookEndpointMutationSchema.extend({
  createdBy: z.string().email(),
});

const WebhookUpdateSchema = WebhookEndpointMutationSchema.extend({
  updatedBy: z.string().email(),
});

const WebhookRotateSchema = z.object({
  agencyId: z.string().min(1),
  rotatedBy: z.string().email(),
});

const WebhookDisableSchema = z.object({
  agencyId: z.string().min(1),
  disabledBy: z.string().email(),
});

function buildSigningSecret(): string {
  return randomBytes(32).toString('hex');
}

function toEndpointSummary(endpoint: any) {
  return {
    id: endpoint.id,
    agencyId: endpoint.agencyId,
    url: endpoint.url,
    status: endpoint.status,
    subscribedEvents: Array.isArray(endpoint.subscribedEvents) ? endpoint.subscribedEvents : [],
    failureCount: endpoint.failureCount ?? 0,
    secretLastFour: typeof endpoint.secretId === 'string' ? endpoint.secretId.slice(-4) : null,
    lastDeliveredAt: endpoint.lastDeliveredAt ? endpoint.lastDeliveredAt.toISOString() : null,
    lastFailedAt: endpoint.lastFailedAt ? endpoint.lastFailedAt.toISOString() : null,
    createdAt: endpoint.createdAt.toISOString(),
    updatedAt: endpoint.updatedAt.toISOString(),
  };
}

export async function getWebhookEndpoint(agencyId: string): Promise<ServiceResult<{ endpoint: ReturnType<typeof toEndpointSummary> }>> {
  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { agencyId },
  });

  if (!endpoint) {
    return {
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Webhook endpoint not found',
      },
    };
  }

  return {
    data: {
      endpoint: toEndpointSummary(endpoint),
    },
    error: null,
  };
}

export async function createWebhookEndpoint(
  input: z.infer<typeof WebhookCreateSchema>
): Promise<ServiceResult<{ endpoint: ReturnType<typeof toEndpointSummary>; signingSecret: string }>> {
  try {
    const validated = WebhookCreateSchema.parse(input);

    const existing = await prisma.webhookEndpoint.findUnique({
      where: { agencyId: validated.agencyId },
    });

    if (existing) {
      return {
        data: null,
        error: {
          code: 'WEBHOOK_ENDPOINT_EXISTS',
          message: 'A webhook endpoint already exists for this agency',
        },
      };
    }

    const endpointId = randomUUID();
    const secretId = infisical.generateSecretName('webhook', endpointId);
    const signingSecret = buildSigningSecret();

    const endpoint = await prisma.webhookEndpoint.upsert({
      where: { agencyId: validated.agencyId },
      create: {
        id: endpointId,
        agencyId: validated.agencyId,
        url: validated.url,
        status: 'active',
        subscribedEvents: validated.subscribedEvents,
        secretId,
        createdBy: validated.createdBy,
      },
      update: {
        url: validated.url,
        status: 'active',
        subscribedEvents: validated.subscribedEvents,
      },
    });

    await infisical.storePlainSecret(secretId, signingSecret);

    await auditService.createAuditLog({
      agencyId: validated.agencyId,
      userEmail: validated.createdBy,
      action: 'WEBHOOK_ENDPOINT_CREATED',
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
      metadata: {
        subscribedEvents: validated.subscribedEvents,
      },
    });

    return {
      data: {
        endpoint: toEndpointSummary(endpoint),
        signingSecret,
      },
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook endpoint input',
          details: error.errors,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create webhook endpoint',
      },
    };
  }
}

export async function updateWebhookEndpoint(
  input: z.infer<typeof WebhookUpdateSchema>
): Promise<ServiceResult<{ endpoint: ReturnType<typeof toEndpointSummary> }>> {
  try {
    const validated = WebhookUpdateSchema.parse(input);
    const existing = await prisma.webhookEndpoint.findUnique({
      where: { agencyId: validated.agencyId },
    });

    if (!existing) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Webhook endpoint not found',
        },
      };
    }

    const endpoint = await prisma.webhookEndpoint.update({
      where: { agencyId: validated.agencyId },
      data: {
        url: validated.url,
        status: 'active',
        subscribedEvents: validated.subscribedEvents,
        disabledAt: null,
      },
    });

    await auditService.createAuditLog({
      agencyId: validated.agencyId,
      userEmail: validated.updatedBy,
      action: 'WEBHOOK_ENDPOINT_UPDATED',
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
      metadata: {
        subscribedEvents: validated.subscribedEvents,
      },
    });

    return {
      data: { endpoint: toEndpointSummary(endpoint) },
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook endpoint input',
          details: error.errors,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update webhook endpoint',
      },
    };
  }
}

export async function rotateWebhookEndpointSecret(
  input: z.infer<typeof WebhookRotateSchema>
): Promise<ServiceResult<{ endpoint: ReturnType<typeof toEndpointSummary>; signingSecret: string }>> {
  try {
    const validated = WebhookRotateSchema.parse(input);
    const existing = await prisma.webhookEndpoint.findUnique({
      where: { agencyId: validated.agencyId },
    });

    if (!existing) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Webhook endpoint not found',
        },
      };
    }

    const rotatedSecretId = infisical.generateSecretName('webhook', `${existing.id}_rotated`);
    const signingSecret = buildSigningSecret();

    await infisical.storePlainSecret(rotatedSecretId, signingSecret);

    const endpoint = await prisma.webhookEndpoint.update({
      where: { agencyId: validated.agencyId },
      data: {
        secretId: rotatedSecretId,
      },
    });

    await infisical.deleteSecret(existing.secretId);

    await auditService.createAuditLog({
      agencyId: validated.agencyId,
      userEmail: validated.rotatedBy,
      action: 'WEBHOOK_ENDPOINT_SECRET_ROTATED',
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
    });

    return {
      data: {
        endpoint: toEndpointSummary(endpoint),
        signingSecret,
      },
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook rotation input',
          details: error.errors,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to rotate webhook endpoint secret',
      },
    };
  }
}

export async function disableWebhookEndpoint(
  input: z.infer<typeof WebhookDisableSchema>
): Promise<ServiceResult<{ endpoint: ReturnType<typeof toEndpointSummary> }>> {
  try {
    const validated = WebhookDisableSchema.parse(input);
    const existing = await prisma.webhookEndpoint.findUnique({
      where: { agencyId: validated.agencyId },
    });

    if (!existing) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Webhook endpoint not found',
        },
      };
    }

    const endpoint = await prisma.webhookEndpoint.update({
      where: { agencyId: validated.agencyId },
      data: {
        status: 'disabled',
        disabledAt: new Date(),
      },
    });

    await auditService.createAuditLog({
      agencyId: validated.agencyId,
      userEmail: validated.disabledBy,
      action: 'WEBHOOK_ENDPOINT_DISABLED',
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
    });

    return {
      data: { endpoint: toEndpointSummary(endpoint) },
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook disable input',
          details: error.errors,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to disable webhook endpoint',
      },
    };
  }
}

export const webhookEndpointService = {
  getWebhookEndpoint,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  rotateWebhookEndpointSecret,
  disableWebhookEndpoint,
};
