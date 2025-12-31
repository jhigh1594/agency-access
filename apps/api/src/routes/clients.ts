/**
 * Client Routes
 *
 * API endpoints for client CRUD operations.
 * Part of Phase 5: Enhanced Access Request Creation.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  findClientByEmail,
  deleteClient,
  getClientsWithConnections,
  getClientDetail,
  ClientError,
} from '@/services/client.service';
import type { ClientLanguage } from '@agency-platform/shared';
import { prisma } from '@/lib/prisma';

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  email: z.string().email('Invalid email format'),
  website: z.string().url('Invalid URL format').optional(),
  language: z.enum(['en', 'es', 'nl']).optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  language: z.enum(['en', 'es', 'nl']).optional(),
});

const getClientsSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function clientRoutes(fastify: FastifyInstance) {
  // Set 404 handler for this route scope
  fastify.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Client not found',
      },
    });
  });

  // Authentication hook - verifies x-agency-id header and auto-provisions agency
  fastify.addHook('onRequest', async (request, reply) => {
    const clerkUserId = request.headers['x-agency-id'] as string;

    if (!clerkUserId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'x-agency-id header is required',
        },
      });
    }

    // Resolve agency using centralized service (prevents duplicates)
    const { agencyResolutionService } = await import('../services/agency-resolution.service');
    const agencyResult = await agencyResolutionService.getOrCreateAgency(clerkUserId, {
      userEmail: `${clerkUserId}@clerk.temp`, // Will be improved with actual Clerk user data
      agencyName: 'My Agency',
    });

    if (agencyResult.error) {
      return reply.code(400).send({
        error: {
          code: agencyResult.error.code,
          message: agencyResult.error.message,
        },
      });
    }

    // Attach the actual agency UUID to request for use in route handlers
    (request as any).agencyId = agencyResult.data!.agencyId;
  });

  /**
   * POST /api/clients
   * Create a new client
   */
  fastify.post('/clients', async (request, reply) => {
    const agencyId = (request as any).agencyId;

    // Validate request body
    const validationResult = createClientSchema.safeParse(request.body);
    if (!validationResult.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error.errors[0].message,
          details: validationResult.error.errors,
        },
      });
    }

    try {
      const client = await createClient({
        agencyId,
        ...validationResult.data,
      });
      return reply.code(201).send({ data: client });
    } catch (error) {
      if (error instanceof Error && error.message.includes('EMAIL_EXISTS')) {
        return reply.code(409).send({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'A client with this email already exists',
          },
        });
      }
      // For unexpected errors, let Fastify handle them (will result in 500)
      throw error;
    }
  });

  /**
   * GET /api/clients
   * List clients with pagination and search
   */
  fastify.get('/clients', async (request, reply) => {
    const agencyId = (request as any).agencyId;

    // Validate query params
    const validationResult = getClientsSchema.safeParse(request.query);
    if (!validationResult.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error.errors[0].message,
          details: validationResult.error.errors,
        },
      });
    }

    const result = await getClientsWithConnections({
      agencyId,
      ...validationResult.data,
    });

    return reply.send({ data: result });
  });

  /**
   * GET /api/clients/:id
   * Get a client by ID
   */
  fastify.get('/clients/:id', async (request, reply) => {
    const agencyId = (request as any).agencyId;
    const { id } = request.params as { id: string };

    const client = await getClientById(id, agencyId);

    if (!client) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    return reply.send({ data: client });
  });

  /**
   * GET /api/clients/:id/detail
   * Get detailed client information including stats, access requests, and activity
   */
  fastify.get('/clients/:id/detail', async (request, reply) => {
    const agencyId = (request as any).agencyId;
    const { id } = request.params as { id: string };

    const detail = await getClientDetail({ clientId: id, agencyId });

    if (!detail) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    return reply.send({ data: detail });
  });

  /**
   * PUT /api/clients/:id
   * Update a client
   */
  fastify.put('/clients/:id', async (request, reply) => {
    const agencyId = (request as any).agencyId;
    const { id } = request.params as { id: string };

    // Validate request body
    const validationResult = updateClientSchema.safeParse(request.body);
    if (!validationResult.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error.errors[0].message,
          details: validationResult.error.errors,
        },
      });
    }

    try {
      const client = await updateClient(id, agencyId, validationResult.data);

      if (!client) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Client not found',
          },
        });
      }

      return reply.send({ data: client });
    } catch (error) {
      if (error instanceof Error && error.message.includes('EMAIL_EXISTS')) {
        return reply.code(409).send({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'A client with this email already exists',
          },
        });
      }
      // For unexpected errors, let Fastify handle them (will result in 500)
      throw error;
    }
  });

  /**
   * DELETE /api/clients/:id
   * Delete a client
   */
  fastify.delete('/clients/:id', async (request, reply) => {
    const agencyId = (request as any).agencyId;
    const { id } = request.params as { id: string };

    const deleted = await deleteClient(id, agencyId);

    if (!deleted) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    return reply.code(204).send();
  });

  /**
   * GET /api/clients/search
   * Search for a client by email
   */
  fastify.get('/clients/search', async (request, reply) => {
    const agencyId = (request as any).agencyId;
    const { email } = request.query as { email?: string };

    if (!email) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email query parameter is required',
        },
      });
    }

    const client = await findClientByEmail(agencyId, email);

    if (!client) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    return reply.send({ data: client });
  });
}
