/**
 * Agency Service
 *
 * Business logic for agency management operations.
 * All methods follow the { data, error } response pattern.
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createAgencySchema = z.object({
  name: z.string().min(1, 'Agency name is required'),
  adminEmail: z.string().email('Invalid email address'),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/**
 * Create a new agency with an admin member
 */
export async function createAgency(input: CreateAgencyInput) {
  try {
    const validated = createAgencySchema.parse(input);

    // Check if agency with this name already exists
    const existing = await prisma.agency.findFirst({
      where: { name: validated.name },
    });

    if (existing) {
      return {
        data: null,
        error: {
          code: 'AGENCY_EXISTS',
          message: 'An agency with this name already exists',
        },
      };
    }

    // Use transaction to create agency and admin member atomically
    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: validated.name,
          email: validated.adminEmail, // Use admin email as agency email
          subscriptionTier: 'STARTER',
        },
      });

      const admin = await tx.agencyMember.create({
        data: {
          agencyId: agency.id,
          email: validated.adminEmail,
          role: 'admin',
        },
      });

      return { agency, admin };
    });

    return { data: result, error: null };
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
 * List agencies with optional filters
 */
export async function listAgencies(filters: { email?: string; clerkUserId?: string } = {}) {
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
      include: {
        members: true,
      },
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
export async function updateAgency(agencyId: string, input: Partial<{ name: string; subscriptionTier: string }>) {
  try {
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
    if (input.name && input.name !== existing.name) {
      const nameConflict = await prisma.agency.findFirst({
        where: { name: input.name },
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

    const agency = await prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.subscriptionTier && { subscriptionTier: input.subscriptionTier as any }),
        updatedAt: new Date(),
      },
    });

    return { data: agency, error: null };
  } catch (error) {
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
  createAgency,
  getAgency,
  updateAgency,
  getAgencyMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getOnboardingStatus,
  bulkInviteMembers,
};
