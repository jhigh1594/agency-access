import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleConnector } from '../google.js';
import { env } from '../../../lib/env.js';

// Mock env used by GoogleConnector constructor
vi.mock('../../../lib/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    API_URL: 'http://localhost:3001',
    PORT: 3001,
    GOOGLE_ADS_DEVELOPER_TOKEN: undefined,
  },
}));

describe('GoogleConnector', () => {
  const accessToken = 'test-access-token';
  const originalDeveloperToken = env.GOOGLE_ADS_DEVELOPER_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    env.GOOGLE_ADS_DEVELOPER_TOKEN = originalDeveloperToken;
  });

  it('includes Search Console webmasters scope in the default auth URL', () => {
    const connector = new GoogleConnector();

    const authUrl = connector.getAuthUrl('state-123');
    const parsed = new URL(authUrl);
    const scope = parsed.searchParams.get('scope') || '';

    expect(scope).toContain('https://www.googleapis.com/auth/webmasters');
  });

  it('parses GA4 properties from Analytics Admin accountSummaries and uses Authorization header', async () => {
    const connector = new GoogleConnector();

    vi.mocked(fetch).mockImplementation(async (input: any, init?: any) => {
      const url = String(input);

      if (url.includes('https://analyticsadmin.googleapis.com/v1beta/accountSummaries')) {
        expect(init?.headers?.Authorization).toBe(`Bearer ${accessToken}`);
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            accountSummaries: [
              {
                account: 'accounts/111',
                displayName: 'Test Account',
                propertySummaries: [
                  {
                    property: 'properties/222',
                    displayName: 'Test Property',
                  },
                ],
              },
            ],
          }),
        } as any;
      }

      return {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Forbidden',
        json: async () => ({}),
      } as any;
    });

    const result = await connector.getAllGoogleAccounts(accessToken);

    expect(result.analyticsProperties).toEqual([
      {
        id: '222',
        name: 'properties/222',
        displayName: 'Test Property',
        type: 'ga4',
        accountName: 'Test Account',
      },
    ]);
    expect(result.hasAccess).toBe(true);
  });

  it('maps Business Profile locations instead of only top-level business accounts', async () => {
    const connector = new GoogleConnector();

    vi.mocked(fetch).mockImplementation(async (input: any) => {
      const url = String(input);

      if (url.includes('https://mybusinessaccountmanagement.googleapis.com/v1/accounts')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            accounts: [
              {
                name: 'accounts/123',
                accountName: 'Agency Test Business',
              },
            ],
          }),
        } as any;
      }

      if (url.includes('https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?readMask=name,title')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            locations: [
              {
                name: 'accounts/123/locations/456',
                title: 'Main Street Store',
              },
            ],
          }),
        } as any;
      }

      return {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Forbidden',
        json: async () => ({}),
      } as any;
    });

    const result = await connector.getAllGoogleAccounts(accessToken);

    expect(result.businessAccounts).toEqual([
      {
        id: '456',
        name: 'Main Street Store',
        type: 'google_business',
        accountName: 'Agency Test Business',
      },
    ]);
  });

  it('follows Business Profile pagination for accounts and locations', async () => {
    const connector = new GoogleConnector();

    vi.mocked(fetch).mockImplementation(async (input: any) => {
      const url = String(input);

      if (url === 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            accounts: [{ name: 'accounts/123', accountName: 'First Account' }],
            nextPageToken: 'accounts-page-2',
          }),
        } as any;
      }

      if (url.includes('https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageToken=accounts-page-2')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            accounts: [{ name: 'accounts/999', accountName: 'Second Account' }],
          }),
        } as any;
      }

      if (url === 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?readMask=name,title') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            locations: [{ name: 'accounts/123/locations/456', title: 'Store 456' }],
            nextPageToken: 'locations-page-2',
          }),
        } as any;
      }

      if (url.includes('https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?readMask=name,title&pageToken=locations-page-2')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            locations: [{ name: 'accounts/123/locations/457', title: 'Store 457' }],
          }),
        } as any;
      }

      if (url === 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts/999/locations?readMask=name,title') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            locations: [{ name: 'accounts/999/locations/990', title: 'Store 990' }],
          }),
        } as any;
      }

      return {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Forbidden',
        json: async () => ({}),
      } as any;
    });

    const result = await connector.getAllGoogleAccounts(accessToken);

    expect(result.businessAccounts).toEqual([
      {
        id: '456',
        name: 'Store 456',
        type: 'google_business',
        accountName: 'First Account',
      },
      {
        id: '457',
        name: 'Store 457',
        type: 'google_business',
        accountName: 'First Account',
      },
      {
        id: '990',
        name: 'Store 990',
        type: 'google_business',
        accountName: 'Second Account',
      },
    ]);
  });

  it('resolves Merchant Center account details and accessible sub-accounts from authinfo', async () => {
    const connector = new GoogleConnector();

    vi.mocked(fetch).mockImplementation(async (input: any) => {
      const url = String(input);

      if (url.includes('https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            accountIdentifiers: [{ merchantId: '7890' }],
          }),
        } as any;
      }

      if (url.includes('https://shoppingcontent.googleapis.com/content/v2.1/7890/accounts/7890')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            id: '7890',
            name: 'Primary Merchant Center',
            websiteUrl: 'https://primary.example',
          }),
        } as any;
      }

      if (url.includes('https://shoppingcontent.googleapis.com/content/v2.1/7890/accounts')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            resources: [
              {
                id: '7891',
                name: 'Sub Account One',
                websiteUrl: 'https://sub.example',
              },
            ],
          }),
        } as any;
      }

      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found',
        json: async () => ({}),
      } as any;
    });

    const result = await connector.getAllGoogleAccounts(accessToken);

    expect(result.merchantCenterAccounts).toEqual([
      {
        id: '7890',
        name: 'Primary Merchant Center',
        type: 'google_merchant_center',
        websiteUrl: 'https://primary.example',
      },
      {
        id: '7891',
        name: 'Sub Account One',
        type: 'google_merchant_center',
        websiteUrl: 'https://sub.example',
      },
    ]);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      })
    );
  });

  it('falls back to a neutral Ads account label when account detail lookup returns 403', async () => {
    env.GOOGLE_ADS_DEVELOPER_TOKEN = 'test-developer-token';
    const connector = new GoogleConnector();

    vi.mocked(fetch).mockImplementation(async (input: any) => {
      const url = String(input);

      if (url.includes('https://googleads.googleapis.com/v22/customers:listAccessibleCustomers')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            resourceNames: ['customers/6449142979'],
          }),
        } as any;
      }

      if (url.includes('https://googleads.googleapis.com/v22/customers/6449142979/googleAds:search')) {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          text: async () => JSON.stringify({
            error: {
              code: 403,
              message: 'Permission denied',
            },
          }),
        } as any;
      }

      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found',
        json: async () => ({}),
      } as any;
    });

    const result = await connector.getAllGoogleAccounts(accessToken);

    expect(result.adsAccounts).toEqual([
      {
        id: '6449142979',
        name: 'Account 644-914-2979',
        type: 'google_ads',
        status: 'active',
      },
    ]);
    expect(result.adsAccounts[0]?.name).not.toContain('Restricted');
    expect(result.hasAccess).toBe(true);
  });
});
