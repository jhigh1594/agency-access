import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { env } from '@/lib/env.js';
import { infisical } from '@/lib/infisical.js';
import { prisma } from '@/lib/prisma.js';
import { signWebhookPayload } from '@/lib/webhook-signature.js';

interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

const DeliveryInputSchema = z.object({
  eventId: z.string().min(1),
  attemptNumber: z.number().int().min(1),
});

const MAX_RESPONSE_SNIPPET_LENGTH = 1000;
const WEBHOOK_RETRY_BASE_DELAY_MS = 30_000;
const WEBHOOK_RETRY_MAX_DELAY_MS = 15 * 60 * 1000;

function buildTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function toSnippet(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, MAX_RESPONSE_SNIPPET_LENGTH);
}

function getRetryDelayMs(attemptNumber: number): number {
  return Math.min(
    WEBHOOK_RETRY_MAX_DELAY_MS,
    WEBHOOK_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attemptNumber - 1)
  );
}

function isRetryableStatusCode(statusCode: number): boolean {
  return statusCode === 429 || statusCode >= 500;
}

function isRetryableError(error: unknown): boolean {
  const message = String(error ?? '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('etimedout') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('aborted')
  );
}

export async function deliverWebhookEvent(
  input: z.infer<typeof DeliveryInputSchema>
): Promise<ServiceResult<{
  deliveryId: string;
  retryable: boolean;
  responseStatus: number | null;
}>> {
  try {
    const validated = DeliveryInputSchema.parse(input);

    const event = await prisma.webhookEvent.findUnique({
      where: { id: validated.eventId },
      include: {
        endpoint: true,
      },
    });

    if (!event) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Webhook event not found',
        },
      };
    }

    if (event.endpoint.status !== 'active') {
      return {
        data: null,
        error: {
          code: 'ENDPOINT_DISABLED',
          message: 'Webhook endpoint is not active',
        },
      };
    }

    const payload = JSON.stringify(event.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signingSecret = await infisical.getPlainSecret(event.endpoint.secretId);

    const deliveryId = randomUUID();
    const headers = {
      'Content-Type': 'application/json',
      'X-AgencyAccess-Event': event.type,
      'X-AgencyAccess-Delivery-Id': deliveryId,
      'X-AgencyAccess-Timestamp': timestamp,
      'X-AgencyAccess-Signature': signWebhookPayload(payload, signingSecret, timestamp),
    };

    const pendingDelivery = await prisma.webhookDelivery.create({
      data: {
        id: deliveryId,
        endpointId: event.endpoint.id,
        eventId: event.id,
        attemptNumber: validated.attemptNumber,
        status: 'pending',
        requestHeaders: headers,
      },
    });

    try {
      const response = await fetch(event.endpoint.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: buildTimeoutSignal(env.WEBHOOK_DELIVERY_TIMEOUT_MS),
      });
      const responseText = toSnippet(await response.text());
      const deliveredAt = new Date();

      if (response.ok) {
        await prisma.webhookDelivery.update({
          where: { id: pendingDelivery.id },
          data: {
            status: 'delivered',
            responseStatus: response.status,
            responseBodySnippet: responseText,
            deliveredAt,
            nextAttemptAt: null,
          },
        });

        await prisma.webhookEndpoint.update({
          where: { id: event.endpoint.id },
          data: {
            failureCount: 0,
            status: 'active',
            disabledAt: null,
            lastDeliveredAt: deliveredAt,
          },
        });

        return {
          data: {
            deliveryId: pendingDelivery.id,
            retryable: false,
            responseStatus: response.status,
          },
          error: null,
        };
      }

      const retryable =
        validated.attemptNumber < env.WEBHOOK_MAX_ATTEMPTS &&
        isRetryableStatusCode(response.status);
      const failedAt = new Date();
      const failureCount = (event.endpoint.failureCount ?? 0) + 1;
      const disabled = failureCount >= env.WEBHOOK_FAILURE_DISABLE_THRESHOLD;

      await prisma.webhookDelivery.update({
        where: { id: pendingDelivery.id },
        data: {
          status: 'failed',
          responseStatus: response.status,
          responseBodySnippet: responseText,
          errorCode: `HTTP_${response.status}`,
          errorMessage: `Webhook endpoint returned ${response.status}`,
          nextAttemptAt: retryable
            ? new Date(failedAt.getTime() + getRetryDelayMs(validated.attemptNumber))
            : null,
        },
      });

      await prisma.webhookEndpoint.update({
        where: { id: event.endpoint.id },
        data: {
          failureCount,
          lastFailedAt: failedAt,
          status: disabled ? 'disabled' : 'active',
          disabledAt: disabled ? failedAt : null,
        },
      });

      return {
        data: {
          deliveryId: pendingDelivery.id,
          retryable,
          responseStatus: response.status,
        },
        error: {
          code: 'DELIVERY_FAILED',
          message: `Webhook endpoint returned ${response.status}`,
        },
      };
    } catch (error) {
      const retryable =
        validated.attemptNumber < env.WEBHOOK_MAX_ATTEMPTS &&
        isRetryableError(error);
      const failedAt = new Date();
      const failureCount = (event.endpoint.failureCount ?? 0) + 1;
      const disabled = failureCount >= env.WEBHOOK_FAILURE_DISABLE_THRESHOLD;
      const message = error instanceof Error ? error.message : 'Webhook delivery failed';

      await prisma.webhookDelivery.update({
        where: { id: pendingDelivery.id },
        data: {
          status: 'failed',
          errorCode: isRetryableError(error) ? 'NETWORK_ERROR' : 'DELIVERY_ERROR',
          errorMessage: message,
          nextAttemptAt: retryable
            ? new Date(failedAt.getTime() + getRetryDelayMs(validated.attemptNumber))
            : null,
        },
      });

      await prisma.webhookEndpoint.update({
        where: { id: event.endpoint.id },
        data: {
          failureCount,
          lastFailedAt: failedAt,
          status: disabled ? 'disabled' : 'active',
          disabledAt: disabled ? failedAt : null,
        },
      });

      return {
        data: {
          deliveryId: pendingDelivery.id,
          retryable,
          responseStatus: null,
        },
        error: {
          code: 'DELIVERY_FAILED',
          message,
        },
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook delivery input',
          details: error.errors,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to deliver webhook event',
      },
    };
  }
}

export const webhookDeliveryService = {
  deliverWebhookEvent,
};
