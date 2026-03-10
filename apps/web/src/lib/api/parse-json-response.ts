import { extractMessageFromBody } from './extract-error';

interface ParseJsonResponseOptions {
  fallbackErrorMessage?: string;
  fallbackParseMessage?: string;
}

export async function parseJsonResponse<T>(
  response: Response,
  options: ParseJsonResponseOptions = {}
): Promise<T> {
  const {
    fallbackErrorMessage = 'Request failed',
    fallbackParseMessage = 'Authorization service returned an unexpected response. Please try again.',
  } = options;

  const rawBody = await response.text();

  if (!rawBody) {
    if (!response.ok) {
      throw new Error(response.statusText || fallbackErrorMessage);
    }

    throw new Error(fallbackParseMessage);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    if (!response.ok) {
      throw new Error(response.statusText || fallbackErrorMessage);
    }

    throw new Error(fallbackParseMessage);
  }

  if (!response.ok) {
    throw new Error(extractMessageFromBody(payload, response.statusText || fallbackErrorMessage));
  }

  return payload as T;
}
