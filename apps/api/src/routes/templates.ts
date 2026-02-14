/**
 * Template Routes
 *
 * API endpoints for managing access request templates.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { templateService } from '../services/template.service.js';
import { quotaMiddleware } from '../middleware/quota.middleware.js';
import { authenticate } from '@/middleware/auth.js';
import { assertAgencyAccess, resolvePrincipalAgency } from '@/lib/authorization.js';

export async function templateRoutes(fastify: FastifyInstance) {
  const requirePrincipalAgency = async (request: any, reply: any) => {
    const principalResult = await resolvePrincipalAgency(request);
    if (principalResult.error || !principalResult.data) {
      const code = principalResult.error?.code === 'UNAUTHORIZED' ? 401 : 403;
      return reply.code(code).send({
        data: null,
        error: principalResult.error || {
          code: 'FORBIDDEN',
          message: 'Unable to resolve agency for authenticated user',
        },
      });
    }

    request.principalAgencyId = principalResult.data.agencyId;
    request.agencyId = principalResult.data.agencyId;
  };

  fastify.addHook('onRequest', authenticate());
  fastify.addHook('onRequest', requirePrincipalAgency);

  // Get all templates for an agency
  fastify.get('/agencies/:agencyId/templates', async (request, reply) => {
    const { agencyId } = request.params as { agencyId: string };
    const principalAgencyId = (request as any).principalAgencyId as string;

    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    const result = await templateService.getAgencyTemplates(agencyId);

    if (result.error) {
      return reply.code(500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Get single template by ID
  fastify.get('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const principalAgencyId = (request as any).principalAgencyId as string;

    const result = await templateService.getTemplate(id);

    if (!result.error && result.data) {
      const accessError = assertAgencyAccess((result.data as any).agencyId, principalAgencyId);
      if (accessError) {
        return reply.code(403).send({ data: null, error: accessError });
      }
    }

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Create a new template
  fastify.post(
    '/agencies/:agencyId/templates',
    {
      onRequest: [quotaMiddleware({
        metric: 'templates',
        getAgencyId: (request) => (request.params as any).agencyId,
      })],
    },
    async (request, reply) => {
    const { agencyId } = request.params as { agencyId: string };
    const principalAgencyId = (request as any).principalAgencyId as string;
    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    const input = { ...(request.body as any), agencyId };

    const result = await templateService.createTemplate(input);

    if (result.error) {
      const statusCode = result.error.code === 'DUPLICATE_NAME' ? 409 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.code(201).send(result);
    },
  );

  // Update a template
  fastify.patch('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const principalAgencyId = (request as any).principalAgencyId as string;

    const existing = await templateService.getTemplate(id);
    if (!existing.error && existing.data) {
      const accessError = assertAgencyAccess((existing.data as any).agencyId, principalAgencyId);
      if (accessError) {
        return reply.code(403).send({ data: null, error: accessError });
      }
    }

    const result = await templateService.updateTemplate(id, request.body as any);

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 400;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Delete a template
  fastify.delete('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const principalAgencyId = (request as any).principalAgencyId as string;

    const existing = await templateService.getTemplate(id);
    if (!existing.error && existing.data) {
      const accessError = assertAgencyAccess((existing.data as any).agencyId, principalAgencyId);
      if (accessError) {
        return reply.code(403).send({ data: null, error: accessError });
      }
    }

    const result = await templateService.deleteTemplate(id);

    if (result.error) {
      return reply.code(404).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send({ data: { success: true }, error: null });
  });

  // Set template as default
  fastify.post('/templates/:id/set-default', async (request, reply) => {
    const { id } = request.params as { id: string };
    const principalAgencyId = (request as any).principalAgencyId as string;

    const existing = await templateService.getTemplate(id);
    if (!existing.error && existing.data) {
      const accessError = assertAgencyAccess((existing.data as any).agencyId, principalAgencyId);
      if (accessError) {
        return reply.code(403).send({ data: null, error: accessError });
      }
    }

    const result = await templateService.setDefaultTemplate(id);

    if (result.error) {
      return reply.code(404).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });
}
