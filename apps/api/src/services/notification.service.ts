/**
 * Notification Service
 *
 * Sends notifications to agencies when clients complete authorization.
 * Supports multiple notification channels: email, webhook, Slack, etc.
 */

import { prisma } from '../lib/prisma.js';
import { notificationQueue } from '../lib/queue.js';

export interface NotificationPayload {
  agencyId: string;
  accessRequestId: string;
  clientEmail: string;
  clientName: string;
  platforms: string[];
  completedAt: Date;
}

/**
 * Queue a notification to be sent to the agency
 */
export async function queueNotification(payload: NotificationPayload) {
  try {
    await notificationQueue.add('client-authorized', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    console.log('Notification queued', {
      agencyId: payload.agencyId,
      accessRequestId: payload.accessRequestId,
    });

    return { data: true, error: null };
  } catch (error: any) {
    // Gracefully degrade if Redis is unavailable (development mode)
    if (error?.code === 'ECONNREFUSED' && process.env.NODE_ENV !== 'production') {
      console.warn('Notification not queued (Redis unavailable)');
      return { data: true, error: null }; // Don't fail the request
    }

    console.error('Failed to queue notification', error);
    return {
      data: null,
      error: {
        code: 'NOTIFICATION_QUEUE_FAILED',
        message: 'Failed to queue notification',
      },
    };
  }
}

/**
 * Send notification via chosen channel
 *
 * TODO: Implement notification sending logic
 *
 * Options to consider:
 * 1. Email (Resend, SendGrid, Postmark)
 *    - Install: npm install resend
 *    - Pros: Direct, professional, audit trail
 *    - Cons: Can be missed, delayed
 *
 * 2. Webhook
 *    - POST to agency.webhookUrl with payload
 *    - Pros: Real-time, flexible integration
 *    - Cons: Requires agency setup, reliability depends on their endpoint
 *
 * 3. Slack
 *    - Install: npm install @slack/web-api
 *    - Pros: Instant, visible to team
 *    - Cons: Requires Slack integration, not all agencies use it
 *
 * 4. In-app notification
 *    - Store in NotificationInbox table, poll/WebSocket on frontend
 *    - Pros: Always visible in dashboard
 *    - Cons: Requires user to be logged in
 *
 * Implementation Notes:
 * - Fetch agency details from database (email, webhook URL, Slack channel, etc.)
 * - Format notification message with client name, platforms authorized
 * - Handle failures gracefully (log, retry, fallback channel)
 * - Consider agency preferences (allow agencies to configure notification method)
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    // Fetch agency details
    const agency = await prisma.agency.findUnique({
      where: { id: payload.agencyId },
      select: {
        id: true,
        name: true,
        // TODO: Add notification preferences fields to Agency model
        // webhookUrl: true,
        // notificationEmail: true,
        // slackChannelId: true,
      },
    });

    if (!agency) {
      console.error('Agency not found for notification', payload.agencyId);
      return {
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      };
    }

    // TODO: Implement your chosen notification method here
    //
    // Example email implementation:
    // if (agency.notificationEmail) {
    //   await sendEmail({
    //     to: agency.notificationEmail,
    //     subject: `${payload.clientName} authorized access`,
    //     html: `
    //       <h2>Client Authorization Complete</h2>
    //       <p>${payload.clientName} (${payload.clientEmail}) has authorized access to:</p>
    //       <ul>${payload.platforms.map(p => `<li>${p}</li>`).join('')}</ul>
    //       <p>You can now access their advertising accounts.</p>
    //     `,
    //   });
    // }
    //
    // Example webhook implementation:
    // if (agency.webhookUrl) {
    //   await fetch(agency.webhookUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       event: 'client.authorized',
    //       data: payload,
    //     }),
    //   });
    // }

    console.log('Notification sent (placeholder)', {
      agencyId: payload.agencyId,
      platforms: payload.platforms,
    });

    return { data: true, error: null };
  } catch (error) {
    console.error('Failed to send notification', error);
    return {
      data: null,
      error: {
        code: 'NOTIFICATION_SEND_FAILED',
        message: 'Failed to send notification',
      },
    };
  }
}

export const notificationService = {
  queueNotification,
  sendNotification,
};
