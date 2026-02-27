import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { accessRequestService } from '../../services/access-request.service.js';
import { metaAssetCreationService } from '../../services/meta-asset-creation.service.js';
import { prisma } from '../../lib/prisma.js';

// Validation schemas
const createAdAccountSchema = z.object({
  connectionId: z.string().min(1, 'Connection ID is required'),
  businessId: z.string().min(1, 'Business ID is required'),
  name: z.string().min(1, 'Ad account name is required').max(100, 'Name too long'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  timezoneId: z.string().min(1, 'Timezone ID is required'),
});

const createProductCatalogSchema = z.object({
  connectionId: z.string().min(1, 'Connection ID is required'),
  businessId: z.string().min(1, 'Business ID is required'),
  name: z.string().min(1, 'Catalog name is required').max(100, 'Name too long'),
});

const getLinksSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
});

/**
 * Resolve and validate an authorized connection for an access request token
 */
async function resolveAuthorizedConnection(token: string, connectionId: string) {
  const accessRequest = await accessRequestService.getAccessRequestByToken(token);
  if (accessRequest.error || !accessRequest.data) {
    return {
      accessRequest: null,
      connection: null,
      error: {
        code: 'ACCESS_REQUEST_NOT_FOUND',
        message: 'Access request not found',
      },
    };
  }

  const connection = await prisma.clientConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return {
      accessRequest: accessRequest.data,
      connection: null,
      error: {
        code: 'CONNECTION_NOT_FOUND',
        message: 'Client connection not found',
      },
    };
  }

  const isAuthorizedConnection =
    connection.accessRequestId === accessRequest.data.id &&
    connection.agencyId === accessRequest.data.agencyId;

  if (!isAuthorizedConnection) {
    return {
      accessRequest: accessRequest.data,
      connection: null,
      error: {
        code: 'FORBIDDEN',
        message: 'Connection does not belong to this access request',
      },
    };
  }

  return {
    accessRequest: accessRequest.data,
    connection,
    error: null,
  };
}

export async function registerAssetCreationRoutes(fastify: FastifyInstance) {
  /**
   * Create a new Meta ad account
   * POST /api/client/:token/create/meta/ad-account
   */
  fastify.post('/client/:token/create/meta/ad-account', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Validate request body
    const validated = createAdAccountSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: validated.error.errors,
        },
      });
    }

    const { connectionId, businessId, name, currency, timezoneId } = validated.data;

    // Resolve and authorize connection
    const authContext = await resolveAuthorizedConnection(token, connectionId);
    if (authContext.error || !authContext.connection || !authContext.accessRequest) {
      const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
      return reply.code(statusCode).send({
        data: null,
        error: authContext.error,
      });
    }

    // Create ad account
    const result = await metaAssetCreationService.createAdAccount(
      connectionId,
      businessId,
      { name, currency, timezoneId },
      authContext.connection.clientEmail,
      authContext.accessRequest.agencyId
    );

    if (result.error) {
      const statusCode =
        result.error.code === 'AUTHORIZATION_NOT_FOUND' ||
        result.error.code === 'TOKEN_NOT_FOUND'
          ? 404
          : result.error.code === 'TOKEN_EXPIRED' ||
            result.error.code === 'AUTHORIZATION_INACTIVE'
          ? 400
          : 500;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send({
      data: result.data,
      error: null,
    });
  });

  /**
   * Create a new Meta product catalog
   * POST /api/client/:token/create/meta/product-catalog
   */
  fastify.post('/client/:token/create/meta/product-catalog', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Validate request body
    const validated = createProductCatalogSchema.safeParse(request.body);
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: validated.error.errors,
        },
      });
    }

    const { connectionId, businessId, name } = validated.data;

    // Resolve and authorize connection
    const authContext = await resolveAuthorizedConnection(token, connectionId);
    if (authContext.error || !authContext.connection || !authContext.accessRequest) {
      const statusCode = authContext.error?.code === 'FORBIDDEN' ? 403 : 404;
      return reply.code(statusCode).send({
        data: null,
        error: authContext.error,
      });
    }

    // Create product catalog
    const result = await metaAssetCreationService.createProductCatalog(
      connectionId,
      businessId,
      { name },
      authContext.connection.clientEmail,
      authContext.accessRequest.agencyId
    );

    if (result.error) {
      const statusCode =
        result.error.code === 'AUTHORIZATION_NOT_FOUND' ||
        result.error.code === 'TOKEN_NOT_FOUND'
          ? 404
          : result.error.code === 'TOKEN_EXPIRED' ||
            result.error.code === 'AUTHORIZATION_INACTIVE'
          ? 400
          : 500;
      return reply.code(statusCode).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send({
      data: result.data,
      error: null,
    });
  });

  /**
   * Get asset creation links (for pages and pixels - manual creation)
   * GET /api/client/:token/create/meta/links
   */
  fastify.get('/client/:token/create/meta/links', async (request, reply) => {
    const { token } = request.params as { token: string };
    const { businessId } = request.query as { businessId?: string };

    // Validate businessId
    const validated = getLinksSchema.safeParse({ businessId });
    if (!validated.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Business ID is required',
          details: validated.error.errors,
        },
      });
    }

    // Get access request to verify token is valid
    const accessRequest = await accessRequestService.getAccessRequestByToken(token);
    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'ACCESS_REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    // Get creation links
    const links = metaAssetCreationService.getAssetCreationLinks(validated.data.businessId);

    return reply.send({
      data: links,
      error: null,
    });
  });

  /**
   * Get supported currencies for ad account creation
   * GET /api/client/:token/create/meta/currencies
   */
  fastify.get('/client/:token/create/meta/currencies', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Get access request to verify token is valid
    const accessRequest = await accessRequestService.getAccessRequestByToken(token);
    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'ACCESS_REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const currencies = metaAssetCreationService.getSupportedCurrencies();

    return reply.send({
      data: { currencies },
      error: null,
    });
  });

  /**
   * Get supported timezones for ad account creation
   * GET /api/client/:token/create/meta/timezones
   */
  fastify.get('/client/:token/create/meta/timezones', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Get access request to verify token is valid
    const accessRequest = await accessRequestService.getAccessRequestByToken(token);
    if (accessRequest.error || !accessRequest.data) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'ACCESS_REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      });
    }

    const timezones = metaAssetCreationService.getSupportedTimezones();

    return reply.send({
      data: { timezones },
      error: null,
    });
  });
}
