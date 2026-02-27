/**
 * Response Helper for API Endpoints
 *
 * Provides standardized response formatting for all API routes.
 * Follows the pattern: { data, error } with proper TypeScript typing.
 */

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export interface SuccessResponse<T = unknown> {
  data: T;
  error: null;
}

export interface ErrorResponse {
  data: null;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Send successful response with data
 */
export function sendSuccess<T>(
  reply: any,
  data: T,
  statusCode: number = 200
): any {
  return reply.code(statusCode).send({
    data,
    error: null,
  });
}

/**
 * Send error response with code, message, and optional details
 */
export function sendError(
  reply: any,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): any {
  return reply.code(statusCode).send({
    data: null,
    error: {
      code,
      message,
      details,
    },
  });
}

/**
 * Send validation error (400 status code)
 */
export function sendValidationError(
  reply: any,
  message: string
): void {
  sendError(reply, 'VALIDATION_ERROR', message, 400);
}

/**
 * Send not found error (404 status code)
 */
export function sendNotFound(
  reply: any,
  message: string = 'Resource not found'
): void {
  sendError(reply, 'NOT_FOUND', message, 404);
}

/**
 * Send conflict error (409 status code)
 */
export function sendConflict(
  reply: any,
  message: string
): void {
  sendError(reply, 'CONFLICT', message, 409);
}

/**
 * Send unauthorized error (401 status code)
 */
export function sendUnauthorized(
  reply: any,
  message: string = 'Unauthorized'
): void {
  sendError(reply, 'UNAUTHORIZED', message, 401);
}

/**
 * Send forbidden error (403 status code)
 */
export function sendForbidden(
  reply: any,
  message: string = 'Forbidden'
): void {
  sendError(reply, 'FORBIDDEN', message, 403);
}
