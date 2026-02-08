/**
 * Error Sanitization Utility
 *
 * Sanitizes error messages to prevent information leakage.
 * OAuth errors can contain sensitive implementation details that
 * should not be exposed to clients.
 */

export interface SanitizedError {
  code: string;
  message: string;
}

/**
 * Sanitize OAuth-related errors
 * Maps internal error patterns to user-safe messages
 */
export function sanitizeOAuthError(error: any): SanitizedError {
  const errorMessage = error?.message || String(error);
  const errorString = errorMessage.toLowerCase();

  // Invalid or expired authorization code
  if (
    errorString.includes('invalid_grant') ||
    errorString.includes('invalid code') ||
    errorString.includes('code expired')
  ) {
    return {
      code: 'OAUTH_INVALID_GRANT',
      message: 'Authorization code is invalid or expired. Please restart the authorization process.',
    };
  }

  // Redirect URI mismatch
  if (
    errorString.includes('redirect_uri_mismatch') ||
    errorString.includes('redirect uri') ||
    errorString.includes('redirecturi')
  ) {
    return {
      code: 'OAUTH_REDIRECT_MISMATCH',
      message: 'Redirect URI configuration error. Please contact support.',
    };
  }

  // Access denied / user cancelled
  if (
    errorString.includes('access_denied') ||
    errorString.includes('user denied') ||
    errorString.includes('cancelled')
  ) {
    return {
      code: 'OAUTH_ACCESS_DENIED',
      message: 'Authorization was cancelled or denied. Please try again if you wish to continue.',
    };
  }

  // Invalid client credentials
  if (
    errorString.includes('invalid_client') ||
    errorString.includes('unauthorized_client') ||
    errorString.includes('client authentication failed')
  ) {
    return {
      code: 'OAUTH_CLIENT_ERROR',
      message: 'Authentication configuration error. Please contact support.',
    };
  }

  // Rate limiting by OAuth provider
  if (
    errorString.includes('rate limit') ||
    errorString.includes('too_many_requests') ||
    errorString.includes('temporarily_unavailable')
  ) {
    return {
      code: 'OAUTH_RATE_LIMITED',
      message: 'The service is temporarily unavailable. Please try again in a few minutes.',
    };
  }

  // Network / connection errors
  if (
    errorString.includes('etwork') ||
    errorString.includes('timeout') ||
    errorString.includes('econnrefused') ||
    errorString.includes('etimedout')
  ) {
    return {
      code: 'OAUTH_NETWORK_ERROR',
      message: 'Unable to connect to the authorization service. Please check your connection and try again.',
    };
  }

  // Default generic error (hides implementation details)
  return {
    code: 'OAUTH_ERROR',
    message: 'Failed to complete authorization. Please try again or contact support if the problem persists.',
  };
}

/**
 * Sanitize API errors for public consumption
 */
export function sanitizeApiError(error: any): SanitizedError {
  const errorMessage = error?.message || String(error);

  // Don't expose database errors
  if (errorMessage.toLowerCase().includes('prisma') || errorMessage.toLowerCase().includes('database')) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'A database error occurred. Please try again.',
    };
  }

  // Don't expose Redis errors
  if (errorMessage.toLowerCase().includes('redis')) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'A cache error occurred. Please try again.',
    };
  }

  // Don't expose Infisical errors
  if (errorMessage.toLowerCase().includes('infisical')) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'A secure storage error occurred. Please try again.',
    };
  }

  // Generic fallback
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  };
}
