import { getApiBaseUrl } from './api-env';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export class AuthorizedApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor({ code, message, status, details }: { code: string; message: string; status: number; details?: any }) {
    super(message);
    this.name = 'AuthorizedApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface AuthorizedApiFetchOptions extends Omit<RequestInit, 'headers'> {
  getToken: () => Promise<string | null>;
  headers?: HeadersInit;
}

function resolveUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

export async function authorizedApiFetch<TResponse = any>(
  endpoint: string,
  options: AuthorizedApiFetchOptions
): Promise<TResponse> {
  const { getToken, headers, method = 'GET', ...rest } = options;

  const token = await getToken();
  if (!token) {
    throw new AuthorizedApiError({
      code: 'UNAUTHORIZED',
      message: 'Missing authentication token',
      status: 401,
    });
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Authorization', `Bearer ${token}`);
  if (!requestHeaders.has('Content-Type') && rest.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(resolveUrl(endpoint), {
    ...rest,
    method,
    headers: requestHeaders,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const responseError = payload?.error;
  if (!response.ok || responseError) {
    throw new AuthorizedApiError({
      code: responseError?.code || 'REQUEST_FAILED',
      message: responseError?.message || `Request failed with status ${response.status}`,
      status: response.status,
      details: responseError?.details,
    });
  }

  return payload as TResponse;
}

