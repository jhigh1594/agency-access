/**
 * Contact Routes
 *
 * Public API endpoint for contact form submissions.
 * Sends notification email to team and confirmation email to submitter.
 */

import { FastifyInstance } from 'fastify';
import { sendEmail } from '../services/email.service.js';
import { sendError, sendValidationError } from '../lib/response.js';

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export async function contactRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/contact
   *
   * Handle contact form submissions.
   * No authentication required - this is a public endpoint.
   */
  fastify.post('/api/contact', async (request, reply) => {
    try {
      const { name, email, company, message } = request.body as ContactFormData;

      // Validate required fields
      if (!name || !name.trim()) {
        return sendValidationError(reply, 'Name is required');
      }
      if (!email || !email.trim()) {
        return sendValidationError(reply, 'Email is required');
      }
      if (!message || !message.trim()) {
        return sendValidationError(reply, 'Message is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendValidationError(reply, 'Please provide a valid email address');
      }

      fastify.log.info({ email, name, company }, 'POST /api/contact: Processing contact form');

      // Send notification email to team
      const notificationResult = await sendEmail({
        to: 'jon@pillaraiagency.com',
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">New Contact Request</h2>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #FF6B35;">${escapeHtml(email)}</a></p>
              <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${company ? escapeHtml(company) : 'Not provided'}</p>
            </div>

            <h3 style="color: #1e293b;">Message:</h3>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #FF6B35;">
              <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>

            <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <p style="font-size: 12px; color: #64748b;">
              This message was sent via the AuthHub contact form.
            </p>
          </div>
        `,
      });

      if (notificationResult.error) {
        fastify.log.error({ error: notificationResult.error }, 'POST /api/contact: Failed to send notification email');
        // Still try to send confirmation to user
      }

      // Send confirmation email to submitter
      const confirmationResult = await sendEmail({
        to: email,
        subject: 'We received your message - AuthHub',
        html: `
          <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">Thanks for reaching out!</h2>

            <p>Hi ${escapeHtml(name)},</p>

            <p>We&apos;ve received your message and will get back to you within 24 hours.</p>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00A896;">
              <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Your message:</strong></p>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>

            <p>In the meantime, feel free to check out our <a href="https://authhub.co/pricing" style="color: #FF6B35;">pricing page</a> or <a href="https://authhub.co/pricing#faq" style="color: #FF6B35;">FAQ section</a>.</p>

            <p style="margin-top: 24px;">
              Best,<br />
              The AuthHub Team
            </p>

            <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <p style="font-size: 12px; color: #64748b;">
              This is an automated confirmation from AuthHub.
            </p>
          </div>
        `,
      });

      if (confirmationResult.error) {
        fastify.log.error({ error: confirmationResult.error }, 'POST /api/contact: Failed to send confirmation email');
      }

      fastify.log.info({ email }, 'POST /api/contact: Contact form processed successfully');

      return reply.send({
        data: { success: true },
        error: null,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error in POST /api/contact');
      return sendError(reply, 'INTERNAL_ERROR', 'Failed to process contact form', 500);
    }
  });
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
