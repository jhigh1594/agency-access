import { env } from '@/lib/env.js';
import { sendEmail } from '@/services/email.service.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export const accessRequestNotificationService = {
  async sendClientInvite(input: {
    operationId: string;
    accessRequestId: string;
    uniqueToken: string;
    clientName: string;
    clientEmail: string;
    agencyName: string;
  }) {
    const baseUrl = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const authorizationUrl = `${baseUrl}/client/${encodeURIComponent(input.uniqueToken)}`;
    const result = await sendEmail({
      to: input.clientEmail,
      subject: `${input.agencyName} requested access through AuthHub`,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto">
        <h2>Access request from ${escapeHtml(input.agencyName)}</h2>
        <p>Hi ${escapeHtml(input.clientName)}, review the requested platforms and authorize access in AuthHub.</p>
        <p><a href="${authorizationUrl}">Review access request</a></p>
        <p>If you were not expecting this request, contact the agency before continuing.</p>
      </div>`,
      text: `Review the access request from ${input.agencyName}: ${authorizationUrl}`,
      idempotencyKey: `agent-access-request-${input.operationId}`,
    });
    if (result.error) {
      return {
        data: null,
        error: {
          code: 'INVITE_DELIVERY_FAILED',
          message: 'The client invitation could not be delivered',
          retryable: true as const,
        },
      };
    }
    return { data: { accessRequestId: input.accessRequestId }, error: null };
  },
};
