/**
 * Template Service
 *
 * Business logic for managing access request templates.
 * Templates are agency-wide reusable configurations.
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const intakeFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['text', 'email', 'phone', 'url', 'dropdown', 'textarea']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  order: z.number(),
});

const brandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').default('#6366f1'),
  subdomain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/, 'Invalid subdomain').optional(),
});

const createTemplateSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  platforms: z.record(z.array(z.string())).optional().default({}),
  globalAccessLevel: z.enum(['admin', 'standard', 'read_only', 'email_only']).default('standard'),
  intakeFields: z.array(intakeFieldSchema).optional().default([]),
  branding: brandingSchema.optional().default({}),
  isDefault: z.boolean().optional().default(false),
  createdBy: z.string().min(1, 'Creator email is required'),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  platforms: z.record(z.array(z.string())).optional(),
  globalAccessLevel: z.enum(['admin', 'standard', 'read_only', 'email_only']).optional(),
  intakeFields: z.array(intakeFieldSchema).optional(),
  branding: brandingSchema.optional(),
  isDefault: z.boolean().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

/**
 * Get all templates for an agency
 */
export async function getAgencyTemplates(agencyId: string) {
  try {
    const templates = await prisma.accessRequestTemplate.findMany({
      where: { agencyId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return { data: templates, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve templates',
      },
    };
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string) {
  try {
    const template = await prisma.accessRequestTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      };
    }

    return { data: template, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve template',
      },
    };
  }
}

/**
 * Create a new template
 */
export async function createTemplate(input: CreateTemplateInput) {
  try {
    const validated = createTemplateSchema.parse(input);

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

    // Check for duplicate name
    const existing = await prisma.accessRequestTemplate.findFirst({
      where: {
        agencyId: validated.agencyId,
        name: validated.name,
      },
    });

    if (existing) {
      return {
        data: null,
        error: {
          code: 'DUPLICATE_NAME',
          message: 'A template with this name already exists',
        },
      };
    }

    // If setting as default, remove default from all other templates
    if (validated.isDefault) {
      await prisma.accessRequestTemplate.updateMany({
        where: {
          agencyId: validated.agencyId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create the template
    const template = await prisma.accessRequestTemplate.create({
      data: {
        agencyId: validated.agencyId,
        name: validated.name,
        description: validated.description,
        platforms: validated.platforms as any,
        intakeFields: validated.intakeFields as any,
        branding: validated.branding as any,
        isDefault: validated.isDefault,
        createdBy: validated.createdBy,
      },
    });

    return { data: template, error: null };
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
        message: 'Failed to create template',
      },
    };
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(templateId: string, input: UpdateTemplateInput) {
  try {
    const validated = updateTemplateSchema.parse(input);

    // Check if template exists
    const existing = await prisma.accessRequestTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existing) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      };
    }

    // If updating name, check for duplicates
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.accessRequestTemplate.findFirst({
        where: {
          agencyId: existing.agencyId,
          name: validated.name,
          id: { not: templateId },
        },
      });

      if (duplicate) {
        return {
          data: null,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'A template with this name already exists',
          },
        };
      }
    }

    // If setting as default, remove default from all other templates
    if (validated.isDefault === true) {
      await prisma.accessRequestTemplate.updateMany({
        where: {
          agencyId: existing.agencyId,
          isDefault: true,
          id: { not: templateId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the template
    const template = await prisma.accessRequestTemplate.update({
      where: { id: templateId },
      data: validated as any,
    });

    return { data: template, error: null };
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
          message: 'Template not found',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update template',
      },
    };
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string) {
  try {
    await prisma.accessRequestTemplate.delete({
      where: { id: templateId },
    });

    return { data: { success: true }, error: null };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete not found')) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete template',
      },
    };
  }
}

/**
 * Set a template as the default (removes default from others)
 */
export async function setDefaultTemplate(templateId: string) {
  try {
    // Get the template
    const template = await prisma.accessRequestTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      };
    }

    // Remove default from all other templates in the agency
    await prisma.accessRequestTemplate.updateMany({
      where: {
        agencyId: template.agencyId,
        id: { not: templateId },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this template as default
    const updated = await prisma.accessRequestTemplate.update({
      where: { id: templateId },
      data: {
        isDefault: true,
      },
    });

    return { data: updated, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to set default template',
      },
    };
  }
}

/**
 * Template Service
 * Exports all template-related service functions as a single object
 */
export const templateService = {
  getAgencyTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};
