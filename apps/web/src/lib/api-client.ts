/**
 * API Client Utilities
 * 
 * Centralized functions for making API calls to the backend.
 * Handles authentication headers, error formatting, and type safety.
 */

export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Generic fetch wrapper for API calls
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: result.error || {
          code: 'FETCH_ERROR',
          message: `Request failed with status ${response.status}`,
        },
      };
    }

    return result as ApiResponse<T>;
  } catch (error) {
    console.error('API call failed:', error);
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

/**
 * Agency Resolution Helper
 * Fetches agency details by email
 */
export async function resolveAgencyByEmail(email: string) {
  return apiFetch<any[]>(`/api/agencies?email=${encodeURIComponent(email)}`);
}

/**
 * Dashboard Stats
 */
export async function getDashboardStats(agencyId: string) {
  return apiFetch<any>(`/api/dashboard/stats?agencyId=${agencyId}`);
}

/**
 * Access Requests
 */
export async function getAccessRequests(agencyId: string, limit = 10) {
  return apiFetch<any[]>(`/api/agencies/${agencyId}/access-requests?limit=${limit}`);
}

/**
 * Client Connections
 */
export async function getAgencyConnections(agencyId: string) {
  return apiFetch<any[]>(`/api/connections?agencyId=${agencyId}`);
}

/**
 * Clients with Connections
 */
export async function getClientsWithConnections(agencyId: string, searchQuery?: string) {
  const endpoint = searchQuery 
    ? `/api/clients?search=${encodeURIComponent(searchQuery)}` 
    : '/api/clients';
    
  return apiFetch<any>(endpoint);
}

export const apiClient = {
  fetch: apiFetch,
  resolveAgencyByEmail,
  getDashboardStats,
  getAccessRequests,
  getAgencyConnections,
  getClientsWithConnections,
};
