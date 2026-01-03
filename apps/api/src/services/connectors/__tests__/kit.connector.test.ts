import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KitConnector } from '../kit.js';

// Mock env
vi.mock('../../../lib/env', () => ({
  env: {
    KIT_CLIENT_ID: 'test-client-id',
    KIT_CLIENT_SECRET: 'test-client-secret',
    API_URL: 'http://localhost:3001',
  },
}));

describe('KitConnector', () => {
  let connector: KitConnector;

  beforeEach(() => {
    connector = new KitConnector();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getAuthUrl', () => {
    it('should generate correct authorization URL', () => {
      const url = connector.getAuthUrl('test-state');

      expect(url).toContain('api.kit.com/v4/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('state=test-state');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=public');
    });

    it('should include custom redirect uri if provided', () => {
      const customRedirect = 'https://example.com/callback';
      const url = connector.getAuthUrl('test-state', ['public'], customRedirect);

      expect(url).toContain(`redirect_uri=${encodeURIComponent(customRedirect)}`);
    });

    it('should use default redirect uri if not provided', () => {
      const url = connector.getAuthUrl('test-state');

      expect(url).toContain(`redirect_uri=${encodeURIComponent('http://localhost:3001/api/oauth/kit/callback')}`);
    });

    it('should join multiple scopes with space separator', () => {
      const url = connector.getAuthUrl('test-state', ['public', 'subscribers']);

      expect(url).toContain('scope=public+subscribers');
    });
  });

  describe('exchangeCode', () => {
    it('should exchange code for tokens (JSON body)', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 172800,
        refresh_token: 'test-refresh-token',
        scope: 'public',
        created_at: 1234567890,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const tokens = await connector.exchangeCode('test-code');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.kit.com/v4/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // Kit uses JSON, not form-encoded
          },
        })
      );

      expect(tokens.accessToken).toBe('test-access-token');
      expect(tokens.refreshToken).toBe('test-refresh-token');
      expect(tokens.expiresIn).toBe(172800);
      expect(tokens.tokenType).toBe('Bearer');
    });

    it('should use custom redirect uri if provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          expires_in: 172800,
          refresh_token: 'refresh-token',
          created_at: 1234567890,
        }),
      } as Response);

      await connector.exchangeCode('test-code', 'https://custom.com/callback');

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);

      expect(body.redirect_uri).toBe('https://custom.com/callback');
    });

    it('should throw error on failed token exchange', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid grant',
      } as Response);

      await expect(connector.exchangeCode('invalid-code')).rejects.toThrow('Kit token exchange failed');
    });

    it('should include all required parameters in request body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          expires_in: 172800,
          refresh_token: 'refresh-token',
          created_at: 1234567890,
        }),
      } as Response);

      await connector.exchangeCode('test-code');

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);

      expect(body).toMatchObject({
        grant_type: 'authorization_code',
        code: 'test-code',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 172800,
        scope: 'public',
        created_at: 1234567890,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockRefreshResponse,
      } as Response);

      const tokens = await connector.refreshToken('test-refresh-token');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.kit.com/v4/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(tokens.accessToken).toBe('new-access-token');
      expect(tokens.expiresIn).toBe(172800);
    });

    it('should include correct grant type and refresh token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          expires_in: 172800,
          created_at: 1234567890,
        }),
      } as Response);

      await connector.refreshToken('test-refresh-token');

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);

      expect(body).toMatchObject({
        grant_type: 'refresh_token',
        refresh_token: 'test-refresh-token',
        client_id: 'test-client-id',
      });
    });

    it('should throw error on failed refresh', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid refresh token',
      } as Response);

      await expect(connector.refreshToken('invalid-refresh-token')).rejects.toThrow('Kit token refresh failed');
    });
  });

  describe('verifyToken', () => {
    it('should verify token validity', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '123', name: 'Test' }),
      } as Response);

      const isValid = await connector.verifyToken('valid-token');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.kit.com/v4/account',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer valid-token',
          },
        })
      );

      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const isValid = await connector.verifyToken('invalid-token');

      expect(isValid).toBe(false);
    });

    it('should return false on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const isValid = await connector.verifyToken('token');

      expect(isValid).toBe(false);
    });
  });

  describe('getUserInfo', () => {
    it('should fetch account info', async () => {
      const mockUserInfo = {
        id: '123',
        name: 'Test Account',
        primary_email_address: 'test@example.com',
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUserInfo,
      } as Response);

      const info = await connector.getUserInfo('valid-token');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.kit.com/v4/account',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token',
          },
        })
      );

      expect(info).toMatchObject({
        id: '123',
        email: 'test@example.com',
        name: 'Test Account',
      });
    });

    it('should map primary_email_address to email field', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '456',
          name: 'Another Account',
          primary_email_address: 'another@example.com',
        }),
      } as Response);

      const info = await connector.getUserInfo('token');

      expect(info.email).toBe('another@example.com');
    });

    it('should throw error on failed user info fetch', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      await expect(connector.getUserInfo('invalid-token')).rejects.toThrow('Kit user info fetch failed');
    });
  });
});
