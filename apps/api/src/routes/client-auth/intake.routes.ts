import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../../services/access-request.service.js';
import { submitIntakeSchema } from './schemas.js';

export async function registerIntakeRoutes(fastify: FastifyInstance) {
  // Submit intake form responses
  fastify.post('/client/:token/intake', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequest = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequest.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const validated = submitIntakeSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid intake responses',
          details: validated.error.errors,
        },
      });
    }

    // TODO: Store intake responses temporarily
    // They'll be saved to ClientConnection when connection is created

    return reply.send({
      data: { success: true, message: 'Intake responses saved' },
      error: null,
    });
  });
}
