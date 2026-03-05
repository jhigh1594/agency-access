import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TikTokConnector } from '../tiktok.js';
import { ConnectorError } from '../base.connector.js';

vi.mock('../../../lib/env', () => ({
  env: {
    TIKTOK_CLIENT_ID: 'test-tiktok-client-id',
    TIKTOK_CLIENT_SECRET: 'test-tiktok-client-secret',
    API_URL: 'http://localhost:3001',
  },
}));

describe('TikTokConnector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('builds TikTok authorization URL with expected params', () => {
    const connector = new TikTokConnector();

    const authUrl = connector.getAuthUrl(
      'state-123',
      ['advertiser.info', 'bc.asset.read'],
      'http://localhost:3000/invite/oauth-callback'
    );

    const parsed = new URL(authUrl);
    expect(parsed.pathname).toContain('/open_api/v1.3/oauth2/authorize/');
    expect(parsed.searchParams.get('state')).toBe('state-123');
    expect(parsed.searchParams.get('redirect_uri')).toBe('http://localhost:3000/invite/oauth-callback');
    expect(parsed.searchParams.get('scope')).toBe('advertiser.info,bc.asset.read');
    expect(parsed.searchParams.get('app_id')).toBe('test-tiktok-client-id');
  });

  it('exchanges code using oauth/token and normalizes long-term token response', async () => {
    const connector = new TikTokConnector();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          access_token: 'tiktok-access-token',
          scope: ['advertiser.info'],
        },
      }),
    } as Response);

    const tokens = await connector.exchangeCode('auth-code-123', 'http://localhost:3000/invite/oauth-callback');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(tokens.accessToken).toBe('tiktok-access-token');
    expect(tokens.refreshToken).toBeUndefined();
    expect(tokens.expiresIn).toBeGreaterThan(0);
    expect(tokens.scope).toBe('advertiser.info');
  });

  it('falls back to oauth2/access_token when oauth/token fails', async () => {
    const connector = new TikTokConnector();

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            access_token: 'fallback-token',
            expires_in: 86400,
          },
        }),
      } as Response);

    const tokens = await connector.exchangeCode('auth-code-123');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(tokens.accessToken).toBe('fallback-token');
    expect(tokens.expiresIn).toBe(86400);
  });

  it('verifies token via advertiser endpoint', async () => {
    const connector = new TikTokConnector();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { list: [] } }),
    } as Response);

    await expect(connector.verifyToken('test-token')).resolves.toBe(true);
  });

  it('returns false when verify endpoint returns non-success code', async () => {
    const connector = new TikTokConnector();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 40100, message: 'invalid token' }),
    } as Response);

    await expect(connector.verifyToken('invalid-token')).resolves.toBe(false);
  });

  it('revokes token without leaking secrets in thrown errors', async () => {
    const connector = new TikTokConnector();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'server failure',
    } as Response);

    await expect(connector.revokeToken?.('access-token')).rejects.toBeInstanceOf(ConnectorError);

    try {
      await connector.revokeToken?.('access-token');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain('test-tiktok-client-secret');
    }
  });
});
