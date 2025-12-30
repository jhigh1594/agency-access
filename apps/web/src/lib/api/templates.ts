/**
 * Templates API Client
 *
 * Client for managing access request templates.
 */

import type {
  AccessRequestTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateResponse,
  TemplatesListResponse,
} from '@agency-platform/shared';

// ============================================================
// API CLIENT
// ============================================================

/**
 * Get all templates for an agency
 */
export async function getAgencyTemplates(agencyId: string): Promise<TemplatesListResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agencies/${agencyId}/templates`);

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          code: data.errorCode || 'UNKNOWN_ERROR',
          message: data.error || data.message || 'Failed to fetch templates',
        },
      };
    }

    return {
      data: data.data || data,
    };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string): Promise<TemplateResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}`);

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          code: data.errorCode || 'UNKNOWN_ERROR',
          message: data.error || data.message || 'Failed to fetch template',
        },
      };
    }

    return {
      data: data.data || data,
    };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Create a new template
 */
export async function createTemplate(input: CreateTemplateInput): Promise<TemplateResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agencies/${input.agencyId}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          code: data.errorCode || 'UNKNOWN_ERROR',
          message: data.error || data.message || 'Failed to create template',
          details: data.details,
        },
      };
    }

    return {
      data: data.data || data,
    };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Update a template
 */
export async function updateTemplate(id: string, input: UpdateTemplateInput): Promise<TemplateResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          code: data.errorCode || 'UNKNOWN_ERROR',
          message: data.error || data.message || 'Failed to update template',
        },
      };
    }

    return {
      data: data.data || data,
    };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<{ data?: { success: boolean }; error?: any }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          code: data.errorCode || 'UNKNOWN_ERROR',
          message: data.error || data.message || 'Failed to delete template',
        },
      };
    }

    return {
      data: data.data || data,
    };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}

/**
 * Set a template as the default
 */
export async function setDefaultTemplate(id: string): Promise<TemplateResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}/set-default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          code: data.errorCode || 'UNKNOWN_ERROR',
          message: data.error || data.message || 'Failed to set default template',
        },
      };
    }

    return {
      data: data.data || data,
    };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error. Please try again.',
      },
    };
  }
}
