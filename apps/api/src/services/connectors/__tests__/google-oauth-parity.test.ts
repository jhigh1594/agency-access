import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GA4Connector } from '../ga4.js';
import { GoogleAdsConnector } from '../google-ads.js';
import { GoogleConnector, buildAdsHeaders, normalizeCustomerId } from '../google.js';
import { sanitizeOAuthError } from '../../../lib/errors.js';

// Mock env used by the Google connector family constructors.
// Values recorded 2026-08-18 from the hand-rolled connectors (pre-refactor).
vi.mock('../../../lib/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'parity-google-client-id',
    GOOGLE_CLIENT_SECRET: 'parity-google-client-secret',
    API_URL: 'http://localhost:3001',
    PORT: 3001,
    GOOGLE_ADS_DEVELOPER_TOKEN: undefined,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: undefined,
  },
}));

const GA4_AUTH_URL_DEFAULT =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=parity-google-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fagency-platforms%2Fga4%2Fcallback&state=state-123&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly&response_type=code&access_type=offline&prompt=consent';

const GOOGLE_ADS_AUTH_URL_DEFAULT =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=parity-google-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fagency-platforms%2Fgoogle_ads%2Fcallback&state=state-123&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadwords&response_type=code&access_type=offline&prompt=consent';

const GOOGLE_AUTH_URL_DEFAULT =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=parity-google-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fagency-platforms%2Fgoogle%2Fcallback&state=state-123&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadwords+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fbusiness.manage+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ftagmanager.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fwebmasters+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcontent&response_type=code&access_type=offline&prompt=consent';

const GA4_AUTH_URL_EXPLICIT_SCOPES_AND_REDIRECT =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=parity-google-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Finvite%2Foauth-callback&state=state-123&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadwords+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly&response_type=code&access_type=offline&prompt=consent';

const GA4_EXCHANGE_BODY_DEFAULT_REDIRECT =
  'code=code-xyz&client_id=parity-google-client-id&client_secret=parity-google-client-secret&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fagency-platforms%2Fga4%2Fcallback&grant_type=authorization_code';

describe('Google OAuth family transport parity', () => {
  let ga4: GA4Connector;
  let googleAds: GoogleAdsConnector;
  let google: GoogleConnector;

  beforeEach(() => {
    ga4 = new GA4Connector();
    googleAds = new GoogleAdsConnector();
    google = new GoogleConnector();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  });

  describe('getAuthUrl byte parity', () => {
    it('ga4 default auth URL is byte-identical (client id, scope, redirect)', () => {
      expect(ga4.getAuthUrl('state-123')).toBe(GA4_AUTH_URL_DEFAULT);
    });

    it('google_ads default auth URL is byte-identical (client id, scope, redirect)', () => {
      expect(googleAds.getAuthUrl('state-123')).toBe(GOOGLE_ADS_AUTH_URL_DEFAULT);
    });

    it('google default auth URL keeps the six combined product scopes in order', () => {
      expect(google.getAuthUrl('state-123')).toBe(GOOGLE_AUTH_URL_DEFAULT);
    });

    it('ga4 honors explicit product-union scopes and client redirect override', () => {
      expect(
        ga4.getAuthUrl(
          'state-123',
          [
            'https://www.googleapis.com/auth/adwords',
            'https://www.googleapis.com/auth/analytics.readonly',
          ],
          'http://localhost:3000/invite/oauth-callback'
        )
      ).toBe(GA4_AUTH_URL_EXPLICIT_SCOPES_AND_REDIRECT);
    });
  });

  describe('exchangeCode parity', () => {
    it('ga4 posts the recorded URL, headers, and form body and maps the token response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'at-1',
            refresh_token: 'rt-1',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
      });

      const tokens = await ga4.exchangeCode('code-xyz');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('https://oauth2.googleapis.com/token');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
      expect(init.body).toBe(GA4_EXCHANGE_BODY_DEFAULT_REDIRECT);

      // Exactly the four hand-rolled fields; token_type/scope must NOT leak in.
      expect(Object.keys(tokens).sort()).toEqual([
        'accessToken',
        'expiresAt',
        'expiresIn',
        'refreshToken',
      ]);
      expect(tokens.accessToken).toBe('at-1');
      expect(tokens.refreshToken).toBe('rt-1');
      expect(tokens.expiresIn).toBe(3600);
      expect(tokens.expiresAt).toBeInstanceOf(Date);
    });

    it.each([
      ['ga4', () => ga4, 'GA4'],
      ['google_ads', () => googleAds, 'Google Ads'],
    ] as const)(
      '%s token exchange error mapping through sanitizeOAuthError is unchanged',
      async (_name, make, _label) => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
          ok: false,
          text: () =>
            Promise.resolve('{"error":"invalid_grant","error_description":"Bad Request"}'),
        });

        await expect(make().exchangeCode('bad-code')).rejects.toThrow();
        let sanitized: unknown;
        try {
          await make().exchangeCode('bad-code');
        } catch (error) {
          sanitized = sanitizeOAuthError(error);
        }
        expect(sanitized).toEqual({
          code: 'OAUTH_INVALID_GRANT',
          message:
            'Authorization code is invalid or expired. Please restart the authorization process.',
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
          ok: false,
          text: () => Promise.resolve('{"error":"redirect_uri_mismatch"}'),
        });
        try {
          await make().exchangeCode('bad-code');
        } catch (error) {
          sanitized = sanitizeOAuthError(error);
        }
        expect(sanitized).toEqual({
          code: 'OAUTH_REDIRECT_MISMATCH',
          message: 'Redirect URI configuration error. Please contact support.',
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
          ok: false,
          text: () => Promise.resolve('{"error":"internal_failure"}'),
        });
        try {
          await make().exchangeCode('bad-code');
        } catch (error) {
          sanitized = sanitizeOAuthError(error);
        }
        expect(sanitized).toEqual({
          code: 'OAUTH_ERROR',
          message:
            'Failed to complete authorization. Please try again or contact support if the problem persists.',
        });
      }
    );
  });

  describe('per-product discovery regression lock', () => {
    it('ga4 verifyToken still hits the analyticsadmin endpoint with a query-param token', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      await expect(ga4.verifyToken('tok-ga4')).resolves.toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?access_token=tok-ga4',
        { method: 'GET' }
      );
    });

    it('google_ads verifyToken still hits listAccessibleCustomers with developer-token headers', async () => {
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'dev-token';
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      await expect(googleAds.verifyToken('tok-ads')).resolves.toBe(true);
      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('https://googleads.googleapis.com/v22/customers:listAccessibleCustomers');
      expect(init.method).toBe('GET');
      expect(init.headers).toEqual({
        Authorization: 'Bearer tok-ads',
        'developer-token': 'dev-token',
        'Content-Type': 'application/json',
      });
    });
  });

  describe('shared Ads helpers', () => {
    it('buildAdsHeaders output is identical for a fixed token, developer token, and customer id', () => {
      expect(buildAdsHeaders('tok-abc', 'dev-token', '123-456-789')).toEqual({
        Authorization: 'Bearer tok-abc',
        'developer-token': 'dev-token',
        'Content-Type': 'application/json',
        'login-customer-id': '123-456-789',
      });

      expect(buildAdsHeaders('tok-abc', 'dev-token')).toEqual({
        Authorization: 'Bearer tok-abc',
        'developer-token': 'dev-token',
        'Content-Type': 'application/json',
      });
    });

    it('normalizeCustomerId strips the customers/ prefix and non-digits', () => {
      expect(normalizeCustomerId('customers/123-456-789')).toBe('123456789');
      expect(normalizeCustomerId('123-456-789')).toBe('123456789');
      expect(normalizeCustomerId('123456789')).toBe('123456789');
    });
  });
});
