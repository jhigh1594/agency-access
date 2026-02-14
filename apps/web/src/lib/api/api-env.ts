/**
 * API environment helpers for browser-side API calls.
 */

const LOCAL_API_FALLBACK = 'http://localhost:3001';

/**
 * Resolve the backend API base URL.
 * In production, NEXT_PUBLIC_API_URL must be configured explicitly.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL is required in production for onboarding API calls.');
  }

  return LOCAL_API_FALLBACK;
}

