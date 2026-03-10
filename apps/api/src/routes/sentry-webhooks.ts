/**
 * Sentry Webhook Routes
 *
 * Receives error alerts from Sentry and creates task files in the project
 * that AI agents (Claude Code) can read and process automatically.
 *
 * Integration: Configure Sentry → Settings → Alerts → Add Webhook
 * Webhook URL: https://your-api-domain.com/api/webhooks/sentry
 */

import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Directory where Sentry task files will be created
const SENTRY_TASKS_DIR = join(process.cwd(), '.claude', 'tasks', 'sentry-issues');

/**
 * Sentry webhook payload structure (partial - covers common event types)
 */
type SentryWebhookPayload = {
  action: 'created' | 'resolved' | 'ignored' | 'assigned' | 'unassigned';
  data: {
    issue: {
      id: string;
      shortId: string;
      title: string;
      level: 'error' | 'warning' | 'info';
      type: string;
      culprit: string;
      firstSeen: string;
      lastSeen: string;
      count: number;
      permalink: string;
      metadata: {
        type?: string;
        value?: string;
        filename?: string;
        lineno?: number;
        colno?: number;
        function?: string;
        [key: string]: any;
      };
      tags: Array<{ key: string; value: string }>;
      extras?: Record<string, any>;
      breadcrumbs?: Array<{
        category: string;
        message: string;
        level: string;
        timestamp: string;
      }>;
      request?: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        env?: Record<string, string>;
      };
      stacktrace?: {
        frames: Array<{
          filename: string;
          lineno: number;
          colno?: number;
          function: string;
          inApp: boolean;
        }>;
      };
    };
    event: {
      eventID: string;
      receivedAt: string;
      tags: Array<{ key: string; value: string }>;
      user?: {
        id: string;
        email?: string;
        username?: string;
        ipAddress?: string;
      };
      contexts: {
        trace?: { trace_id: string; span_id: string };
        browser?: { name: string; version: string };
        os?: { name: string; version: string };
        runtime?: { name: string; version: string };
        [key: string]: any;
      };
      request?: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        env?: Record<string, string>;
      };
      breadcrumbs?: Array<{
        category: string;
        message: string;
        level: string;
        timestamp: string;
      }>;
    };
    trigger: {
      type: string;
      label: string;
      description?: string;
    };
  };
  installationId?: string;
  projectId?: string;
  organizationId?: string;
};

/**
 * Format Sentry issue as a markdown task file
 */
function formatSentryIssueAsTask(payload: SentryWebhookPayload): string {
  const { issue, event, trigger } = payload.data;
  const timestamp = new Date().toISOString();

  let markdown = `# Sentry Issue: ${issue.shortId} - ${issue.title}

**Generated:** ${timestamp}
**Level:** ${issue.level}
**Status:** ${payload.action}
**Environment:** ${issue.tags.find((t) => t.key === 'environment')?.value || 'unknown'}
**Project:** ${issue.tags.find((t) => t.key === 'project')?.value || 'unknown'}

## 📋 Issue Details

- **Issue ID:** \`${issue.id}\`
- **Short ID:** \`${issue.shortId}\`
- **Type:** ${issue.type}
- **Culprit:** \`${issue.culprit}\`
- **First Seen:** ${new Date(issue.firstSeen).toISOString()}
- **Last Seen:** ${new Date(issue.lastSeen).toISOString()}
- **Occurrences:** ${issue.count}
- **Sentry Link:** ${issue.permalink}

## 🔔 Alert Trigger

- **Type:** ${trigger.type}
- **Label:** ${trigger.label}
${trigger.description ? `- **Description:** ${trigger.description}` : ''}

## 🏷️ Tags

${issue.tags.map((tag) => `- **${tag.key}:** ${tag.value}`).join('\n')}

## 📍 Metadata

${Object.entries(issue.metadata)
  .filter(([key]) => key !== 'title' && key !== 'type' && key !== 'value')
  .map(([key, value]) => `- **${key}:** \`${value}\``)
  .join('\n')}

## 📍 Location

${issue.metadata.filename ? `**File:** \`${issue.metadata.filename}\`
${issue.metadata.lineno ? `**Line:** \`${issue.metadata.lineno}\`
` : ''}` : ''}

## 🔍 User Context

${event.user ? `- **User ID:** \`${event.user.id}\`
${event.user.email ? `- **Email:** \`${event.user.email}\`` : ''}
${event.user.username ? `- **Username:** \`${event.user.username}\`` : ''}` : 'No user information available'}

## 🌐 Request Context

${event.request ? `- **URL:** \`${event.request.url || 'N/A'}\`
- **Method:** ${event.request.method || 'N/A'}
${event.request.url ? `- **Route:** \`${
    event.request.url.split('?')[0]
  }\`` : ''}` : 'No request information available'}

## 🧭 Stack Trace (Most Relevant Frame)

${issue.stacktrace?.frames
  ?.filter((f) => f.inApp)
  .slice(-5)
  .map(
    (frame) => `
\`\`\`
${frame.function || '<anonymous>'}
  at ${frame.filename}:${frame.lineno}${frame.colno ? `:${frame.colno}` : ''}
\`\`\`
`
  )
  .join('\n') || 'No stack trace available'}

## 🍞 Breadcrumbs (Recent Events)

${event.breadcrumbs ? event.breadcrumbs.slice(-10).map((crumb) => `
- **[${crumb.category}]** ${crumb.level}: ${crumb.message} (${new Date(crumb.timestamp).toISOString()})
`).join('') : 'No breadcrumbs available'}

## 🔧 Suggested Investigation Steps

1. Review the stack trace to identify the root cause
2. Check if this is a recurring issue (${issue.count} occurrence${issue.count > 1 ? 's' : ''})
3. Examine user context to understand who is affected
4. Review recent deployments that may have introduced this issue
5. Check for related issues with similar stack traces or tags

## 📝 Notes

- This task was automatically generated from a Sentry alert
- Assign to appropriate agent based on the issue type and location
- Update this file with investigation findings and resolution
`;

  return markdown;
}

/**
 * Create a task file from a Sentry issue
 */
async function createSentryTaskFile(
  payload: SentryWebhookPayload
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Ensure directory exists
    await fs.mkdir(SENTRY_TASKS_DIR, { recursive: true });

    const { issue } = payload.data;

    // Create a safe filename from the issue ID and title
    const safeTitle = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    const filename = `sentry-${issue.shortId}-${safeTitle}.md`;
    const filePath = join(SENTRY_TASKS_DIR, filename);

    // Check if file already exists (idempotency)
    try {
      await fs.access(filePath);
      return { success: true, filePath, error: 'File already exists' };
    } catch {
      // File doesn't exist, proceed with creation
    }

    // Write the task file
    const content = formatSentryIssueAsTask(payload);
    await fs.writeFile(filePath, content, 'utf-8');

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        action: 'SENTRY_WEBHOOK_ISSUE_CREATED',
        resourceId: issue.id,
        resourceType: 'sentry_issue',
        metadata: {
          issueShortId: issue.shortId,
          title: issue.title,
          level: issue.level,
          filePath,
          action: payload.action,
        },
      },
    });

    return { success: true, filePath };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error creating task file',
    };
  }
}

/**
 * Verify Sentry webhook signature
 * Uses HMAC SHA-256 with the webhook secret
 */
function verifySentrySignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader) {
    return false;
  }

  // Sentry sends signature as: sentry_timestamp=<timestamp>, sentry_signature=<signature>
  const signatureMatch = signatureHeader.match(/sentry_signature=([^,]+)/);
  if (!signatureMatch) {
    return false;
  }

  const providedSignature = signatureMatch[1];
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest();

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedSignature, 'base64'),
    expectedSignature
  );
}

export async function sentryWebhooksRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/webhooks/sentry/ping
   *
   * Simple unauthenticated ping to verify route is registered
   */
  fastify.get('/webhooks/sentry/ping', async () => {
    return { pong: true, message: 'sentry-webhooks routes are loaded' };
  });

  /**
   * POST /api/webhooks/sentry
   *
   * Receives Sentry alert webhooks and creates task files
   * that AI agents can read and process.
   *
   * Expected headers:
   * - x-sentry-signature: HMAC signature verification
   *
   * Configured in Sentry:
   * Settings → Alerts → Add Webhook → URL
   */
  fastify.post('/webhooks/sentry', { config: { rawBody: true } }, async (request, reply) => {
    // LOG IMMEDIATELY - before any processing to confirm receipt
    const payload = request.body as SentryWebhookPayload;
    const signatureHeader = request.headers['x-sentry-signature'] as string | undefined;
    const rawBody = (request as any).rawBody;

    // Capture Sentry-specific headers
    const sentryHookResource = request.headers['sentry-hook-resource'] as string | undefined;
    const sentryHookSignature = request.headers['sentry-hook-signature'] as string | undefined;

    // Always log receipt of webhook for debugging
    fastify.log.info(
      {
        action: payload?.action,
        sentryHookResource,
        issueId: payload?.data?.issue?.id,
        issueTitle: payload?.data?.issue?.title,
        triggeredRule: (payload as any)?.triggered_rule,
        hasSignature: !!signatureHeader,
        hasSentryHookSignature: !!sentryHookSignature,
        hasRawBody: !!rawBody,
      },
      '[SENTRY WEBHOOK] Received webhook request'
    );

    const payloadString = typeof rawBody === 'string' ? rawBody : JSON.stringify(payload ?? {});

    // Get webhook secret from environment
    const webhookSecret = process.env.SENTRY_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && !verifySentrySignature(payloadString, signatureHeader, webhookSecret)) {
      fastify.log.warn({ signaturePresent: !!signatureHeader }, '[SENTRY WEBHOOK] Signature verification failed');
      return reply.code(401).send({
        data: null,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Webhook signature verification failed',
        },
      });
    }

    try {
      // Process various action types
      // 'created' = new issue, 'assigned' = issue assigned, 'fired' = alert rule triggered
      const processedActions = ['created', 'assigned', 'fired'];
      if (!processedActions.includes(payload.action)) {
        fastify.log.info(
          {
            action: payload.action,
            issueId: payload.data?.issue?.id,
            processedActions,
          },
          '[SENTRY WEBHOOK] Action type not processed'
        );
        return { received: true, skipped: true, reason: `Action '${payload.action}' not in processed list: ${processedActions.join(', ')}` };
      }

      fastify.log.info(
        {
          action: payload.action,
          issueId: payload.data?.issue?.id,
          issueTitle: payload.data?.issue?.title,
        },
        '[SENTRY WEBHOOK] Processing action'
      );

      // Check for idempotency via audit log
      const existing = await prisma.auditLog.findFirst({
        where: {
          action: 'SENTRY_WEBHOOK_ISSUE_CREATED',
          resourceId: payload.data.issue.id,
        },
      });

      if (existing) {
        return { received: true, duplicate: true };
      }

      // Create the task file
      const result = await createSentryTaskFile(payload);

      if (!result.success) {
        fastify.log.error({ error: result.error }, 'Failed to create Sentry task file');
        return reply.code(500).send({
          data: null,
          error: {
            code: 'TASK_CREATION_FAILED',
            message: 'Failed to create task file',
            details: result.error,
          },
        });
      }

      fastify.log.info(
        {
          issueId: payload.data.issue.id,
          shortId: payload.data.issue.shortId,
          filePath: result.filePath,
        },
        'Sentry issue task file created'
      );

      return {
        data: {
          received: true,
          processed: true,
          filePath: result.filePath,
        },
        error: null,
      };
    } catch (error: any) {
      fastify.log.error({ error: error.message, stack: error.stack }, 'Sentry webhook processing failed');

      return reply.code(500).send({
        data: null,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Webhook processing failed',
          details: error.message,
        },
      });
    }
  });

  /**
   * GET /api/webhooks/sentry/health
   *
   * Health check endpoint for Sentry webhook integration
   */
  fastify.get('/webhooks/sentry/health', async (_request, reply) => {
    return {
      data: {
        status: 'ok',
        integration: 'sentry-webhooks',
        tasksDirectory: SENTRY_TASKS_DIR,
        timestamp: new Date().toISOString(),
      },
      error: null,
    };
  });
}
