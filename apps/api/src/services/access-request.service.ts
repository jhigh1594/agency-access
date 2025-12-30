/**
 * Access Request Service
 *
 * Business logic for creating and managing access requests.
 * Generates unique tokens for client authorization links.
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Platform, AccessRequestStatus } from '@agency-platform/shared';

// Validation schemas
const createAccessRequestSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  platforms: z.array(
    z.object({
      platform: z.enum(['meta_ads', 'google_ads', 'ga4', 'linkedin', 'instagram', 'tiktok', 'snapchat']),
      accessLevel: z.enum(['manage', 'view_only']),
    })
  ).min(1, 'At least one platform must be selected'),
  intakeFields: z.array(
    z.object({
      label: z.string(),
      type: z.enum(['text', 'email', 'phone', 'url', 'dropdown', 'textarea']),
      required: z.boolean(),
      options: z.array(z.string()).optional(), // For dropdown type
      order: z.number(),
    })
  ).optional(),
  branding: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
    subdomain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/, 'Invalid subdomain').optional(),
  }).optional(),
});

const updateAccessRequestSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  status: z.enum(['pending', 'authorized', 'expired', 'cancelled']).optional(),
});

export type CreateAccessRequestInput = z.infer<typeof createAccessRequestSchema>;
export type UpdateAccessRequestInput = z.infer<typeof updateAccessRequestSchema>;

/**
 * Generate a unique 12-character token for access requests
 * Uses crypto.randomBytes for secure random generation
 */
export function generateUniqueToken(): string {
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(6); // 6 bytes = 12 hex characters
  return bytes.toString('hex').toLowerCase();
}

/**
 * Create a new access request
 */
export async function createAccessRequest(input: CreateAccessRequestInput) {
  try {
    const validated = createAccessRequestSchema.parse(input);

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: validated.agencyId },
    });

    if (!agency) {
      return {
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      };
    }

    // Check if subdomain is already taken (if provided)
    if (validated.branding?.subdomain) {
      // Query all access requests for this agency and check branding JSON
      const agencyRequests = await prisma.accessRequest.findMany({
        where: { agencyId: validated.agencyId },
        select: { branding: true },
      });

      const subdomainTaken = agencyRequests.some((req) => {
        const branding = req.branding as any;
        return branding?.subdomain === validated.branding?.subdomain;
      });

      if (subdomainTaken) {
        return {
          data: null,
          error: {
            code: 'SUBDOMAIN_TAKEN',
            message: 'This subdomain is already in use',
          },
        };
      }
    }

    // Generate unique token with retry on collision
    let uniqueToken = generateUniqueToken();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const existingToken = await prisma.accessRequest.findUnique({
        where: { uniqueToken },
      });

      if (!existingToken) {
        break; // Found a unique token
      }

      uniqueToken = generateUniqueToken();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return {
        data: null,
        error: {
          code: 'TOKEN_COLLISION',
          message: 'Unable to generate unique token. Please try again.',
        },
      };
    }

    // Create the access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        agencyId: validated.agencyId,
        clientName: validated.clientName,
        clientEmail: validated.clientEmail,
        uniqueToken,
        platforms: validated.platforms as any,
        intakeFields: validated.intakeFields as any,
        branding: validated.branding as any,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    return { data: accessRequest, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create access request',
      },
    };
  }
}

/**
 * Get access request by ID
 */
export async function getAccessRequestById(id: string) {
  try {
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
    });

    if (!accessRequest) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    return { data: accessRequest, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve access request',
      },
    };
  }
}

/**
 * Get access request by unique token (for client authorization flow)
 */
export async function getAccessRequestByToken(token: string) {
  try {
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { uniqueToken: token },
    });

    if (!accessRequest) {
      return {
        data: null,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    // Check if expired
    if (accessRequest.expiresAt < new Date()) {
      return {
        data: null,
        error: {
          code: 'REQUEST_EXPIRED',
          message: 'Access request has expired',
        },
      };
    }

    return { data: accessRequest, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve access request',
      },
    };
  }
}

/**
 * Get all access requests for an agency
 */
export async function getAgencyAccessRequests(
  agencyId: string,
  filters?: { status?: AccessRequestStatus; limit?: number; offset?: number }
) {
  try {
    const where: any = { agencyId };
    if (filters?.status) {
      where.status = filters.status;
    }

    const requests = await prisma.accessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return { data: requests, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve access requests',
      },
    };
  }
}

/**
 * Update access request
 */
export async function updateAccessRequest(
  id: string,
  input: UpdateAccessRequestInput
) {
  try {
    const validated = updateAccessRequestSchema.parse(input);

    const accessRequest = await prisma.accessRequest.update({
      where: { id },
      data: validated,
    });

    return { data: accessRequest, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      };
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update access request',
      },
    };
  }
}

/**
 * Mark access request as authorized (when client completes OAuth)
 */
export async function markRequestAuthorized(requestId: string) {
  try {
    const accessRequest = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        authorizedAt: new Date(),
      },
    });

    return { data: accessRequest, error: null };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return {
        data: null,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update access request',
      },
    };
  }
}

/**
 * Cancel an access request
 */
export async function cancelAccessRequest(id: string) {
  try {
    await prisma.accessRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return { data: { success: true }, error: null };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to cancel access request',
      },
    };
  }
}

/**
 * Delete expired access requests (cleanup job)
 */
export async function deleteExpiredRequests() {
  try {
    const result = await prisma.accessRequest.deleteMany({
      where: {
        status: 'expired',
        expiresAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Expired more than 90 days ago
        },
      },
    });

    return {
      data: {
        deleted: result.count,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete expired requests',
      },
    };
  }
}

/**
 * Access Request Service
 * Exports all access request-related service functions as a single object
 */
export const accessRequestService = {
  createAccessRequest,
  getAccessRequestById,
  getAccessRequestByToken,
  getAgencyAccessRequests,
  updateAccessRequest,
  markRequestAuthorized,
  cancelAccessRequest,
  deleteExpiredRequests,
  generateUniqueToken,
};
