import { FastifyInstance } from 'fastify';
import { accessRequestService } from '../../services/access-request.service.js';
import { notificationService } from '../../services/notification.service.js';
import { prisma } from '../../lib/prisma.js';

export async function registerCompletionRoutes(fastify: FastifyInstance) {
  // Complete client authorization
  fastify.post('/client/:token/complete', async (request, reply) => {
    const { token } = request.params as { token: string };

    const accessRequestResult = await accessRequestService.getAccessRequestByToken(token);

    if (accessRequestResult.error || !accessRequestResult.data) {
      return reply.code(404).send({
        data: null,
        error: accessRequestResult.error || {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const accessRequest = accessRequestResult.data;

    const result = await accessRequestService.markRequestAuthorized(accessRequest.id);

    if (result.error) {
      return reply.code(404).send({
        data: null,
        error: result.error,
      });
    }

    const connection = await prisma.clientConnection.findFirst({
      where: { accessRequestId: accessRequest.id },
    });

    await notificationService.queueNotification({
      agencyId: accessRequest.agencyId,
      accessRequestId: accessRequest.id,
      clientEmail: accessRequest.clientEmail,
      clientName: accessRequest.clientEmail.split('@')[0],
      platforms: connection?.grantedAssets ? Object.keys(connection.grantedAssets as any) : [],
      completedAt: new Date(),
    });

    return reply.send({
      data: {
        success: true,
        message: 'Authorization complete',
      },
      error: null,
    });
  });
}
