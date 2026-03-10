import { env } from '../../lib/env.js';

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveAllowedOrigin(candidate?: string | null): string | null {
  if (!candidate) return null;

  const origin = normalizeOrigin(candidate);
  if (!origin) return null;

  const allowedOrigins = new Set<string>([
    normalizeOrigin(env.FRONTEND_URL) || env.FRONTEND_URL,
    ...env.CORS_ALLOWED_ORIGINS.map((value) => normalizeOrigin(value)).filter(Boolean) as string[],
  ]);

  return allowedOrigins.has(origin) ? origin : null;
}

export function resolveClientInviteCallbackUrl(headers: {
  origin?: string | string[];
  referer?: string | string[];
}): string {
  const originHeader = Array.isArray(headers.origin) ? headers.origin[0] : headers.origin;
  const refererHeader = Array.isArray(headers.referer) ? headers.referer[0] : headers.referer;

  const resolvedOrigin =
    resolveAllowedOrigin(originHeader) ||
    resolveAllowedOrigin(refererHeader) ||
    normalizeOrigin(env.FRONTEND_URL) ||
    env.FRONTEND_URL;

  return `${resolvedOrigin}/invite/oauth-callback`;
}
