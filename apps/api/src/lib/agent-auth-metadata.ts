import { z } from 'zod';
import { env } from '@/lib/env.js';

const ClerkOAuthVerificationSchema = z
  .object({
    active: z.boolean().optional(),
    sub: z.string().optional(),
    subject: z.string().optional(),
    user_id: z.string().optional(),
    org_id: z.string().optional(),
    client_id: z.string().optional(),
    azp: z.string().optional(),
    iss: z.string().optional(),
    aud: z.union([z.string(), z.array(z.string())]).optional(),
    exp: z.number().optional(),
  })
  .passthrough();

export interface VerifiedAgentAccessToken {
  ownerSubject: string;
  clerkPrincipalId: string;
  oauthClientId: string;
  issuer: string;
  audience: string[];
}

function normalizeResource(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function asAudienceList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function verifyAgentAccessToken(token: string): Promise<VerifiedAgentAccessToken> {
  const response = await fetch(env.CLERK_OAUTH_VERIFY_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ access_token: token }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error('OAuth access token verification failed');
  }

  const parsed = ClerkOAuthVerificationSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.active === false) {
    throw new Error('OAuth access token is inactive');
  }

  const claims = parsed.data;
  const ownerSubject = claims.sub || claims.subject || claims.user_id;
  const oauthClientId = claims.client_id || claims.azp;
  const audience = asAudienceList(claims.aud);
  const expectedResource = normalizeResource(env.AGENT_MCP_RESOURCE_URL);

  if (!ownerSubject || !oauthClientId || !claims.iss) {
    throw new Error('OAuth access token is missing required identity claims');
  }

  if (normalizeResource(claims.iss) !== normalizeResource(env.CLERK_OAUTH_ISSUER)) {
    throw new Error('OAuth access token issuer is not authorized');
  }

  if (!audience.some((candidate) => normalizeResource(candidate) === expectedResource)) {
    throw new Error('OAuth access token is not issued for this resource');
  }

  if (claims.exp !== undefined && claims.exp * 1000 <= Date.now()) {
    throw new Error('OAuth access token is expired');
  }

  return {
    ownerSubject,
    clerkPrincipalId: claims.org_id || ownerSubject,
    oauthClientId,
    issuer: claims.iss,
    audience,
  };
}
