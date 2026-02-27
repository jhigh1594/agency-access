/**
 * Access Request Service
 *
 * Business logic for creating and managing access requests.
 * Generates unique tokens for client authorization links.
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { PlatformSchema, type Platform, type AccessRequestStatus } from '@agency-platform/shared';
import { invalidateCache } from '@/lib/cache.js';

const LegacyPlatformSchema = z.enum([
  'whatsapp_business',
  'google_tag_manager',
  'google_merchant_center',
  'google_search_console',
  'youtube_studio',
  'google_business_profile',
  'display_video_360',
]);

const AccessRequestPlatformSchema = z.union([PlatformSchema, LegacyPlatformSchema]);

// Validation schemas
const createAccessRequestSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  clientId: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  authModel: z.enum(['client_authorization', 'delegated_access']).optional().default('client_authorization'),
  platforms: z.array(
    z.object({
      platform: AccessRequestPlatformSchema,
      accessLevel: z.enum(['manage', 'view_only']),
    })
  ).min(1, 'At least one platform must be selected'),
  intakeFields: z.array(
    z.object({
      id: z.string().optional(), // Frontend may send id
      label: z.string(),
      type: z.enum(['text', 'email', 'phone', 'url', 'dropdown', 'textarea']),
      required: z.boolean(),
      options: z.array(z.string()).optional(), // For dropdown type
      order: z.number().optional(), // Frontend may not send order, we'll assign it
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
 * Platform group mapping - defined once at module load time
 * Maps platform products to their parent groups
 */
const PLATFORM_GROUP_MAP: Record<string, string> = {
  // Google products
  'google_ads': 'google',
  'ga4': 'google',
  'google_tag_manager': 'google',
  'google_merchant_center': 'google',
  'google_search_console': 'google',
  'youtube_studio': 'google',
  'google_business_profile': 'google',
  'display_video_360': 'google',
  // Meta products
  'meta_ads': 'meta',
  'instagram': 'meta',
  'whatsapp_business': 'meta',
  // Other platforms (standalone)
  'linkedin': 'linkedin',
  'linkedin_ads': 'linkedin',
  'tiktok': 'tiktok',
  'tiktok_ads': 'tiktok',
  'snapchat': 'snapchat',
  'snapchat_ads': 'snapchat',
};

/**
 * Access level mapping - defined once at module load time
 * Maps backend access levels to frontend access levels
 */
const ACCESS_LEVEL_MAP: Record<string, 'admin' | 'standard' | 'read_only' | 'email_only'> = {
  'manage': 'admin',
  'view_only': 'read_only',
};

/**
 * Generate a unique 12-character token for access requests
 * Uses crypto.randomBytes for secure random generation
 */
export function generateUniqueToken(): string {
  const bytes = randomBytes(6); // 6 bytes = 12 hex characters
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

      const subdomainTaken = agencyRequests.some((req: any) => {
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

    // Normalize intakeFields - add order if missing
    const normalizedIntakeFields = validated.intakeFields?.map((field, index) => ({
      ...field,
      order: field.order ?? index,
    }));

    // Create the access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        agencyId: validated.agencyId,
        clientId: validated.clientId,
        clientName: validated.clientName,
        clientEmail: validated.clientEmail,
        authModel: validated.authModel,
        uniqueToken,
        platforms: validated.platforms as any,
        intakeFields: normalizedIntakeFields as any,
        branding: validated.branding as any,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Invalidate dashboard cache for this agency
    await invalidateCache(`dashboard:${validated.agencyId}:*`);

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

    // Log the actual error for debugging
    console.error('Failed to create access request:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create access request',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Transform flat platforms array to hierarchical format for frontend
 * Flat: [{ platform: 'google_ads', accessLevel: 'manage' }]
 * Hierarchical: [{ platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] }]
 *
 * OPTIMIZED: Uses module-level constants instead of creating objects on every call
 */
function transformPlatformsToHierarchical(platforms: any[]): any[] {
  // Group platforms by platformGroup
  const grouped = platforms.reduce((acc, platform) => {
    const platformGroup = PLATFORM_GROUP_MAP[platform.platform] || platform.platform;

    if (!acc[platformGroup]) {
      acc[platformGroup] = [];
    }

    acc[platformGroup].push({
      product: platform.platform,
      accessLevel: ACCESS_LEVEL_MAP[platform.accessLevel] || 'admin',
      accounts: [], // Empty for client_authorization flow
    });

    return acc;
  }, {} as Record<string, any[]>);

  // Convert to hierarchical format
  return Object.entries(grouped).map(([platformGroup, products]) => ({
    platformGroup,
    products,
  }));
}

function normalizePlatformGroup(platform: string): string {
  if (PLATFORM_GROUP_MAP[platform]) {
    return PLATFORM_GROUP_MAP[platform];
  }

  // Already a top-level group (e.g. google, meta, beehiiv, kit, pinterest).
  return platform;
}

function getIdentityFromConnection(connection: {
  agencyEmail: string | null;
  businessId: string | null;
  connectedBy: string;
  metadata: unknown;
}) {
  const metadata = (connection.metadata as Record<string, unknown> | null) || null;

  const metadataEmail =
    typeof metadata?.email === 'string'
      ? metadata.email
      : typeof metadata?.userEmail === 'string'
      ? metadata.userEmail
      : typeof metadata?.businessEmail === 'string'
      ? metadata.businessEmail
      : undefined;

  const metadataBusinessId =
    typeof metadata?.businessId === 'string' ? metadata.businessId : undefined;

  return {
    agencyEmail: connection.agencyEmail || metadataEmail || connection.connectedBy,
    businessId: connection.businessId || metadataBusinessId,
  };
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

    // Transform platforms from flat to hierarchical format for frontend
    const platforms = accessRequest.platforms as any[];
    const hierarchicalPlatforms = Array.isArray(platforms) && platforms.length > 0 && platforms[0]?.platform
      ? transformPlatformsToHierarchical(platforms)
      : platforms; // Already in hierarchical format or empty

    return {
      data: {
        ...accessRequest,
        platforms: hierarchicalPlatforms,
      },
      error: null,
    };
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

    // Transform platforms from flat to hierarchical format for frontend.
    const platforms = accessRequest.platforms as any[];
    const hierarchicalPlatforms = Array.isArray(platforms) && platforms.length > 0 && platforms[0]?.platform
      ? transformPlatformsToHierarchical(platforms)
      : platforms; // Already in hierarchical format or empty

    const requestedPlatformGroups = Array.isArray(hierarchicalPlatforms)
      ? hierarchicalPlatforms
          .map((group: any) => group?.platformGroup)
          .filter((group: unknown): group is string => typeof group === 'string')
      : [];

    const [agency, platformConnections, clientConnections] = await Promise.all([
      prisma.agency.findUnique({
        where: { id: accessRequest.agencyId },
        select: { name: true },
      }),
      requestedPlatformGroups.length > 0
        ? prisma.agencyPlatformConnection.findMany({
            where: {
              agencyId: accessRequest.agencyId,
              platform: { in: requestedPlatformGroups },
              status: 'active',
            },
            select: {
              platform: true,
              agencyEmail: true,
              businessId: true,
              connectedBy: true,
              metadata: true,
            },
          })
        : Promise.resolve([]),
      prisma.clientConnection.findMany({
        where: { accessRequestId: accessRequest.id },
        select: {
          grantedAssets: true,
          authorizations: {
            select: {
              platform: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const manualInviteTargets = requestedPlatformGroups.reduce((acc, platform) => {
      acc[platform] = {};
      return acc;
    }, {} as Record<string, { agencyEmail?: string; businessId?: string }>);

    for (const connection of platformConnections) {
      manualInviteTargets[connection.platform] = getIdentityFromConnection(connection);
    }

    const completedPlatformsSet = new Set<string>();

    for (const connection of clientConnections) {
      for (const authorization of connection.authorizations || []) {
        if (authorization.status !== 'revoked') {
          completedPlatformsSet.add(normalizePlatformGroup(authorization.platform));
        }
      }

      const grantedAssets = (connection.grantedAssets as Record<string, unknown> | null) || null;
      if (grantedAssets && typeof grantedAssets.platform === 'string') {
        completedPlatformsSet.add(normalizePlatformGroup(grantedAssets.platform));
      }
    }

    const completedPlatforms = Array.from(completedPlatformsSet);
    const isComplete =
      requestedPlatformGroups.length > 0 &&
      requestedPlatformGroups.every((platform) => completedPlatformsSet.has(platform));

    return {
      data: {
        ...accessRequest,
        agencyName: agency?.name || 'Agency',
        platforms: hierarchicalPlatforms,
        manualInviteTargets,
        authorizationProgress: {
          completedPlatforms,
          isComplete,
        },
      },
      error: null,
    };
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

    // Transform platforms from flat to hierarchical format for frontend
    const transformedRequests = requests.map((request: any) => {
      const platforms = request.platforms as any[];
      const hierarchicalPlatforms = Array.isArray(platforms) && platforms.length > 0 && platforms[0]?.platform
        ? transformPlatformsToHierarchical(platforms)
        : platforms; // Already in hierarchical format or empty

      return {
        ...request,
        platforms: hierarchicalPlatforms,
      };
    });

    return { data: transformedRequests, error: null };
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
