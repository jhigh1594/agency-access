/**
 * Template Routes
 *
 * API endpoints for managing access request templates.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { templateService } from '../services/template.service.js';

export async function templateRoutes(fastify: FastifyInstance) {
  // Get all templates for an agency
  fastify.get('/agencies/:agencyId/templates', async (request, reply) => {
    const { agencyId } = request.params as { agencyId: string };

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

    const result = await templateService.getTemplate(id);

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
  fastify.post('/agencies/:agencyId/templates', async (request, reply) => {
    const { agencyId } = request.params as { agencyId: string };
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
  });

  // Update a template
  fastify.patch('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

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
