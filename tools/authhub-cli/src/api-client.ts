import { loadCredentials } from './config.js';

export function getApiBaseUrl(): string {
  const creds = loadCredentials();
  if (creds?.apiBaseUrl) return creds.apiBaseUrl;
  return process.env.AUTHHUB_API_URL || 'http://localhost:3001';
}

export function getAccessToken(): string | null {
  const creds = loadCredentials();
  return creds?.accessToken || null;
}

export function getAgencyId(): string | null {
  const creds = loadCredentials();
  return creds?.agencyId || null;
}

export interface ApiResponse<T = unknown> {
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const credentials = loadCredentials();
  const token = credentials?.accessToken || null;
  if (!token) {
    const error = new Error('Not authenticated. Run `authhub login` first.') as Error & { code: string; status: number };
    error.code = 'UNAUTHORIZED';
    error.status = 401;
    throw error;
  }

  const baseUrl = credentials?.apiBaseUrl || process.env.AUTHHUB_API_URL || 'http://localhost:3001';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  let payload: ApiResponse<T>;
  try {
    payload = await response.json();
  } catch {
    const error = new Error(`Request failed: ${response.status} ${response.statusText}`) as Error & { code: string; status: number; retryable: boolean };
    error.code = 'REQUEST_FAILED';
    error.status = response.status;
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }

  if (!response.ok || payload.error) {
    const error = new Error(payload.error?.message || `Request failed with status ${response.status}`) as Error & { code: string; status: number; retryable: boolean; details?: unknown };
    error.code = payload.error?.code || 'REQUEST_FAILED';
    error.status = response.status;
    error.retryable = response.status === 429;
    error.details = payload.error?.details;
    throw error;
  }

  return payload.data as T;
}
