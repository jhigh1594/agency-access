import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/lib/env.js';
import { verifyAgentAccessToken } from '@/lib/agent-auth-metadata.js';

vi.mock('@/lib/env.js', () => ({
  env: {
    CLERK_OAUTH_VERIFY_URL: 'https://clerk.example/oauth/verify',
    CLERK_SECRET_KEY: 'sk_test_agent_verifier',
    CLERK_OAUTH_ISSUER: 'https://issuer.example',
    AGENT_MCP_RESOURCE_URL: 'https://api.example/mcp',
  },
}));

function verifiedResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      active: true,
      sub: 'user_1',
      org_id: 'org_1',
      client_id: 'oauth_client_1',
      iss: env.CLERK_OAUTH_ISSUER,
      aud: env.AGENT_MCP_RESOURCE_URL,
      exp: Math.floor(Date.now() / 1000) + 300,
      ...overrides,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

describe('verifyAgentAccessToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('verifies the token with Clerk and returns only bound identity metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(verifiedResponse());
    vi.stubGlobal('fetch', fetchMock);

    await expect(verifyAgentAccessToken('opaque-agent-token')).resolves.toEqual({
      ownerSubject: 'user_1',
      clerkPrincipalId: 'org_1',
      oauthClientId: 'oauth_client_1',
      issuer: env.CLERK_OAUTH_ISSUER,
      audience: [env.AGENT_MCP_RESOURCE_URL],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      env.CLERK_OAUTH_VERIFY_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ access_token: 'opaque-agent-token' }),
      })
    );
  });

  it.each([
    ['inactive', { active: false }],
    ['missing owner', { sub: undefined }],
    ['missing client', { client_id: undefined }],
    ['wrong issuer', { iss: 'https://attacker.example' }],
    ['wrong resource', { aud: 'https://other.example/mcp' }],
    ['expired', { exp: Math.floor(Date.now() / 1000) - 1 }],
  ])('rejects %s token metadata', async (_label, overrides) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(verifiedResponse(overrides)));
    await expect(verifyAgentAccessToken('untrusted-token')).rejects.toThrow();
  });

  it('uses the owner subject as the agency principal for non-organization accounts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(verifiedResponse({ org_id: undefined })));
    await expect(verifyAgentAccessToken('personal-account-token')).resolves.toMatchObject({
      ownerSubject: 'user_1',
      clerkPrincipalId: 'user_1',
    });
  });

  it('does not expose Clerk verification response details on rejection', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errors: [{ message: 'internal Clerk detail' }] }), {
          status: 401,
        })
      )
    );

    await expect(verifyAgentAccessToken('provider-token')).rejects.toThrow(
      'OAuth access token verification failed'
    );
  });
});
