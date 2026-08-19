import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../../services/access-request.service.js';
import { submitIntakeSchema } from './schemas.js';
import { sendError } from '../../lib/response.js';

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
      return sendError(reply, 'VALIDATION_ERROR', 'Invalid intake responses', 400, validated.error.errors,);
    }

    // TODO: Store intake responses temporarily
    // They'll be saved to ClientConnection when connection is created

    return reply.send({
      data: { success: true, message: 'Intake responses saved' },
      error: null,
    });
  });
}
