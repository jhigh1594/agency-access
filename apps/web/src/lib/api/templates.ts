/**
 * Templates API Client
 *
 * Client for managing access request templates.
 */

import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateResponse,
  TemplatesListResponse,
} from '@agency-platform/shared';

import { AuthorizedApiError, authorizedApiFetch } from './authorized-api-fetch';

type TokenProvider = () => Promise<string | null>;

function toTemplateError(err: unknown, fallback: string) {
  if (err instanceof AuthorizedApiError) {
    return {
      code: err.code,
      message: err.message || fallback,
      details: err.details,
    };
  }

  return {
    code: 'NETWORK_ERROR',
    message: err instanceof Error ? err.message : 'Network error. Please try again.',
  };
}

/**
 * Get all templates for an agency
 */
export async function getAgencyTemplates(
  agencyId: string,
  getToken: TokenProvider
): Promise<TemplatesListResponse> {
  try {
    return await authorizedApiFetch<TemplatesListResponse>(`/api/agencies/${agencyId}/templates`, { getToken });
  } catch (err) {
    return { error: toTemplateError(err, 'Failed to fetch templates') };
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string, getToken: TokenProvider): Promise<TemplateResponse> {
  try {
    return await authorizedApiFetch<TemplateResponse>(`/api/templates/${id}`, { getToken });
  } catch (err) {
    return { error: toTemplateError(err, 'Failed to fetch template') };
  }
}

/**
 * Create a new template
 */
export async function createTemplate(
  input: CreateTemplateInput,
  getToken: TokenProvider
): Promise<TemplateResponse> {
  try {
    return await authorizedApiFetch<TemplateResponse>(`/api/agencies/${input.agencyId}/templates`, {
      method: 'POST',
      body: JSON.stringify(input),
      getToken,
    });
  } catch (err) {
    return { error: toTemplateError(err, 'Failed to create template') };
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
  getToken: TokenProvider
): Promise<TemplateResponse> {
  try {
    return await authorizedApiFetch<TemplateResponse>(`/api/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
      getToken,
    });
  } catch (err) {
    return { error: toTemplateError(err, 'Failed to update template') };
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(
  id: string,
  getToken: TokenProvider
): Promise<{ data?: { success: boolean }; error?: any }> {
  try {
    return await authorizedApiFetch<{ data: { success: boolean }; error: null }>(`/api/templates/${id}`, {
      method: 'DELETE',
      getToken,
    });
  } catch (err) {
    return { error: toTemplateError(err, 'Failed to delete template') };
  }
}

/**
 * Set a template as the default
 */
export async function setDefaultTemplate(id: string, getToken: TokenProvider): Promise<TemplateResponse> {
  try {
    return await authorizedApiFetch<TemplateResponse>(`/api/templates/${id}/set-default`, {
      method: 'POST',
      getToken,
    });
  } catch (err) {
    return { error: toTemplateError(err, 'Failed to set default template') };
  }
}
