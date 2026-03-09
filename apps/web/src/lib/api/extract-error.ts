/**
 * Extract user-facing error message from a parsed API response body.
 * Handles our format ({ error: { message } }), Fastify default ({ message }).
 */
export function extractMessageFromBody(body: unknown, fallback = 'Request failed'): string {
  if (!body || typeof body !== 'object') return fallback;
  const obj = body as Record<string, unknown>;
  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
  }
  if (typeof obj.message === 'string') return obj.message;
  return fallback;
}

/**
 * Extract user-facing error message from API Response.
 * Handles our format ({ error: { message } }), Fastify default ({ message }), and non-JSON bodies.
 */
export async function extractApiErrorMessage(
  response: Response,
  fallback = 'Request failed'
): Promise<string> {
  try {
    const body = await response.json();
    return extractMessageFromBody(body, response.statusText || fallback);
  } catch {
    return response.statusText || fallback;
  }
}
