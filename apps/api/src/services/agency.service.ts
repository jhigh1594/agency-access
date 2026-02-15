/**
 * Agency Service
 *
 * Business logic for agency management operations.
 * All methods follow the { data, error } response pattern.
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCached, CacheKeys, CacheTTL } from '@/lib/cache.js';
import { creem } from '@/lib/creem.js';
import { getProductId } from '@/config/creem.config';

// Validation schemas
const createAgencySchema = z.object({
  name: z.string().min(1, 'Agency name is required'),
  email: z.string().email('Invalid email address'),
  clerkUserId: z.string().optional(),
  subscriptionTier: z.enum(['STARTER', 'AGENCY']).optional(),
  settings: z.record(z.any()).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
});

const updateAgencySchema = z.object({
  name: z.string().min(1, 'Agency name is required').optional(),
  subscriptionTier: z.enum(['STARTER', 'AGENCY']).optional(),
  settings: z.record(z.any()).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;

/**
 * Create a new agency with an admin member
 */
export async function createAgency(input: CreateAgencyInput) {
  try {
    const validated = createAgencySchema.parse(input);

    // Check if agency with this clerkUserId already exists
    if (validated.clerkUserId) {
      const existingByClerk = await prisma.agency.findUnique({
        where: { clerkUserId: validated.clerkUserId },
      });

      if (existingByClerk) {
        return {
          data: null,
          error: {
            code: 'AGENCY_EXISTS',
            message: 'An agency already exists for this user',
          },
        };
      }
    }

    // Check if agency with this email already exists
    const existingByEmail = await prisma.agency.findUnique({
      where: { email: validated.email },
    });

    if (existingByEmail) {
      return {
        data: null,
        error: {
          code: 'AGENCY_EXISTS',
          message: 'An agency with this email already exists',
        },
      };
    }

    // Check if agency with this name already exists
    const existingByName = await prisma.agency.findFirst({
      where: { name: validated.name },
    });

    if (existingByName) {
      return {
        data: null,
        error: {
          code: 'AGENCY_EXISTS',
          message: 'An agency with this name already exists',
        },
      };
    }

    // Use transaction to create agency and admin member atomically
    const result = await prisma.$transaction(async (tx: any) => {
      const agency = await tx.agency.create({
        data: {
          name: validated.name,
          email: validated.email,
          clerkUserId: validated.clerkUserId || null,
          settings: validated.settings || null,
          subscriptionTier: validated.subscriptionTier || 'STARTER',
        },
      });

      const admin = await tx.agencyMember.create({
        data: {
          agencyId: agency.id,
          email: validated.email,
          role: 'admin',
        },
      });

      return { agency, admin };
    });

    return { data: result.agency, error: null };
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
        message: 'Failed to create agency',
      },
    };
  }
}

/**
 * Create a new agency with Creem checkout session
 * Creates agency, admin member, and checkout URL atomically in a single transaction
 */
export interface CreateAgencyWithCheckoutInput {
  clerkUserId: string;
  name: string;
  email: string;
  selectedTier: 'STARTER' | 'AGENCY';
  billingInterval: 'monthly' | 'yearly';
  settings?: Record<string, any>;
}

export async function createAgencyWithCheckout(input: CreateAgencyWithCheckoutInput) {
  try {
    // Validate input
    const schema = z.object({
      clerkUserId: z.string().min(1, 'Clerk user ID is required'),
      name: z.string().min(1, 'Agency name is required'),
      email: z.string().email('Invalid email address'),
      selectedTier: z.enum(['STARTER', 'AGENCY']),
      billingInterval: z.enum(['monthly', 'yearly']),
      settings: z.record(z.any()).optional(),
    });

    const validated = schema.parse(input);

    // Check if agency with this clerkUserId already exists
    if (validated.clerkUserId) {
      const existingByClerk = await prisma.agency.findUnique({
        where: { clerkUserId: validated.clerkUserId },
      });

      if (existingByClerk) {
        return {
          data: null,
          error: {
            code: 'AGENCY_EXISTS',
            message: 'An agency already exists for this user',
          },
        };
      }
    }

    // Check if agency with this email already exists
    const existingByEmail = await prisma.agency.findUnique({
      where: { email: validated.email },
    });

    if (existingByEmail) {
      return {
        data: null,
        error: {
          code: 'AGENCY_EXISTS',
          message: 'An agency with this email already exists',
        },
      };
    }

    // Check if agency with this name already exists
    const existingByName = await prisma.agency.findFirst({
      where: { name: validated.name },
    });

    if (existingByName) {
      return {
        data: null,
        error: {
          code: 'AGENCY_EXISTS',
          message: 'An agency with this name already exists',
        },
      };
    }

    // Use transaction to create agency and admin member atomically
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create agency with selected tier
      const agency = await tx.agency.create({
        data: {
          name: validated.name,
          email: validated.email,
          clerkUserId: validated.clerkUserId || null,
          subscriptionTier: validated.selectedTier,
          settings: validated.settings || null,
        },
      });

      // 2. Create admin member
      await tx.agencyMember.create({
        data: {
          agencyId: agency.id,
          email: validated.email,
          role: 'admin',
        },
      });

      return { agency };
    });

    // 3. Create Creem checkout session (outside transaction - agency is already created)
    const productId = getProductId(validated.selectedTier, validated.billingInterval);

    const checkout = await creem.createCheckoutSession({
      customer: result.agency.email,
      customerEmail: result.agency.email,
      productId,
      successUrl: `${process.env.FRONTEND_URL}/checkout/success?agency=${result.agency.id}`,
      cancelUrl: `${process.env.FRONTEND_URL}/checkout/cancel?agency=${result.agency.id}`,
      metadata: {
        agencyId: result.agency.id,
        tier: validated.selectedTier,
        billingInterval: validated.billingInterval,
      },
    });

    if (checkout.error) {
      // Agency was created but checkout failed - log and return error
      console.error('Failed to create Creem checkout:', checkout.error);
      return {
        data: { agency: result.agency, checkoutUrl: null },
        error: {
          code: 'CREEM_CHECKOUT_FAILED',
          message: 'Agency created but checkout session failed. Please try again from settings.',
          details: checkout.error,
        },
      };
    }

    return {
      data: {
        agency: result.agency,
        checkoutUrl: checkout.data?.url || null,
      },
      error: null,
    };
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
        message: 'Failed to create agency with checkout',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * List agencies with optional filters
 * @param filters - Email or clerkUserId to filter by
 * @param includeMembers - Whether to include members relationship (default: true for backward compatibility)
 */
export async function listAgencies(
  filters: { email?: string; clerkUserId?: string } = {},
  includeMembers: boolean = true
) {
  try {
    const { email, clerkUserId } = filters;

    const where: any = {};

    if (email) {
      where.email = email;
    }

    if (clerkUserId) {
      where.clerkUserId = clerkUserId;
    }

    const agencies = await prisma.agency.findMany({
      where,
      include: includeMembers ? { members: true } : undefined,
    });

    return { data: agencies, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve agencies',
      },
    };
  }
}

/**
 * Get agency by email with caching
 *
 * Lightweight lookup that returns only the agency record (no members).
 * Uses extended cache TTL (30 minutes) since agency data rarely changes.
 *
 * @param email - Agency email address
 * @returns Agency record or null
 */
export async function getAgencyByEmail(email: string) {
  const cacheKey = CacheKeys.agencyByEmail(email);

  const result = await getCached<{
    id: string;
    name: string;
    email: string;
    clerkUserId: string | null;
  }>({
    key: cacheKey,
    ttl: CacheTTL.EXTENDED, // 30 minutes
    fetch: async () => {
      const agency = await prisma.agency.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          clerkUserId: true,
        },
      });

      return { data: agency, error: null };
    },
  });

  return result;
}

/**
 * Get agency by ID
 */
export async function getAgency(agencyId: string) {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
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

    return { data: agency, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve agency',
      },
    };
  }
}

/**
 * Update agency
 */
export async function updateAgency(agencyId: string, input: UpdateAgencyInput) {
  try {
    const validated = updateAgencySchema.parse(input);

    // Verify agency exists
    const existing = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!existing) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Agency not found',
        },
      };
    }

    // If updating name, check for conflicts
    if (validated.name && validated.name !== existing.name) {
      const nameConflict = await prisma.agency.findFirst({
        where: { name: validated.name },
      });

      if (nameConflict) {
        return {
          data: null,
          error: {
            code: 'AGENCY_EXISTS',
            message: 'An agency with this name already exists',
          },
        };
      }
    }

    const existingSettings = (
      existing.settings &&
      typeof existing.settings === 'object' &&
      !Array.isArray(existing.settings)
    ) ? existing.settings as Record<string, any> : {};

    const mergedSettings = validated.settings === undefined
      ? undefined
      : {
        ...existingSettings,
        ...(validated.settings || {}),
      };

    const agency = await prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.subscriptionTier && { subscriptionTier: validated.subscriptionTier as any }),
        ...(mergedSettings !== undefined && { settings: mergedSettings }),
        updatedAt: new Date(),
      },
    });

    return { data: agency, error: null };
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
        message: 'Failed to update agency',
      },
    };
  }
}

/**
 * Get all members of an agency
 */
export async function getAgencyMembers(agencyId: string) {
  try {
    const members = await prisma.agencyMember.findMany({
      where: { agencyId },
      orderBy: { invitedAt: 'asc' },
    });

    return { data: members, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve agency members',
      },
    };
  }
}

/**
 * Invite a member to an agency
 */
export async function inviteMember(agencyId: string, input: InviteMemberInput) {
  try {
    const validated = inviteMemberSchema.parse(input);

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
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

    // Check if member already exists
    const existing = await prisma.agencyMember.findFirst({
      where: {
        agencyId,
        email: validated.email,
      },
    });

    if (existing) {
      return {
        data: null,
        error: {
          code: 'MEMBER_EXISTS',
          message: 'This email is already a member of this agency',
        },
      };
    }

    const member = await prisma.agencyMember.create({
      data: {
        agencyId,
        email: validated.email,
        role: validated.role,
      },
    });

    return { data: member, error: null };
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
        message: 'Failed to invite member',
      },
    };
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(memberId: string, role: 'admin' | 'member' | 'viewer') {
  try {
    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role',
        },
      };
    }

    // Get current member to check if they're the last admin
    const currentMember = await prisma.agencyMember.findFirst({
      where: { id: memberId },
    });

    if (!currentMember) {
      return {
        data: null,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    // If changing from admin to something else, check if this is the last admin
    if (currentMember.role === 'admin' && role !== 'admin') {
      const adminCount = await prisma.agencyMember.count({
        where: {
          agencyId: currentMember.agencyId,
          role: 'admin',
        },
      });

      if (adminCount === 1) {
        return {
          data: null,
          error: {
            code: 'LAST_ADMIN',
            message: 'Cannot remove the last admin from an agency',
          },
        };
      }
    }

    const member = await prisma.agencyMember.update({
      where: { id: memberId },
      data: { role },
    });

    return { data: member, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update member role',
      },
    };
  }
}

/**
 * Remove member from agency
 */
export async function removeMember(memberId: string) {
  try {
    // Get current member to check if they're the last admin
    const currentMember = await prisma.agencyMember.findFirst({
      where: { id: memberId },
    });

    if (!currentMember) {
      return {
        data: null,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    // If removing an admin, check if this is the last admin
    if (currentMember.role === 'admin') {
      const adminCount = await prisma.agencyMember.count({
        where: {
          agencyId: currentMember.agencyId,
          role: 'admin',
        },
      });

      if (adminCount === 1) {
        return {
          data: null,
          error: {
            code: 'LAST_ADMIN',
            message: 'Cannot remove the last admin from an agency',
          },
        };
      }
    }

    // Delete and return the member
    const member = await prisma.agencyMember.delete({
      where: { id: memberId },
    });

    return { data: member, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove member',
      },
    };
  }
}

/**
 * Get onboarding completion status for an agency
 * Checks if agency has completed initial setup (profile + team members)
 */
export async function getOnboardingStatus(agencyId: string) {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        members: true,
        accessRequests: true,
      },
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

    // Check onboarding completion
    const hasProfile = !!(agency.name && agency.settings);
    const hasMembers = agency.members.length > 1; // More than just the creator
    const hasRequests = agency.accessRequests.length > 0;

    return {
      data: {
        completed: hasProfile && hasMembers,
        step: {
          profile: hasProfile,
          members: hasMembers,
          firstRequest: hasRequests,
        },
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check onboarding status',
      },
    };
  }
}

/**
 * Bulk invite team members to an agency
 * Creates/updates multiple AgencyMember records in a single transaction
 */
export async function bulkInviteMembers(
  agencyId: string,
  invitations: Array<{ email: string; role: 'admin' | 'member' | 'viewer' }>
) {
  try {
    // Verify agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
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

    // Validate all invitations
    const bulkInviteSchema = z.array(
      z.object({
        email: z.string().email(),
        role: z.enum(['admin', 'member', 'viewer']),
      })
    );

    const validated = bulkInviteSchema.parse(invitations);

    // Use transaction to create/update all members atomically
    const results = await prisma.$transaction(
      validated.map((invite) =>
        prisma.agencyMember.upsert({
          where: {
            agencyId_email: { agencyId, email: invite.email },
          },
          update: { role: invite.role },
          create: {
            agencyId,
            email: invite.email,
            role: invite.role,
          },
        })
      )
    );

    return { data: results, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invitation data',
          details: error.errors,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to invite members',
      },
    };
  }
}

/**
 * Agency Service
 * Exports all agency-related service functions as a single object
 */
export const agencyService = {
  listAgencies,
  getAgencyByEmail,
  createAgency,
  createAgencyWithCheckout,
  getAgency,
  updateAgency,
  getAgencyMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getOnboardingStatus,
  bulkInviteMembers,
};
