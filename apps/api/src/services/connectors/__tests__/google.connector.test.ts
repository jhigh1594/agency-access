import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleConnector } from '../google.js';

// Mock env used by GoogleConnector constructor
vi.mock('../../../lib/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    API_URL: 'http://localhost:3001',
    PORT: 3001,
    // Optional: not needed for this test
    GOOGLE_ADS_DEVELOPER_TOKEN: undefined,
  },
}));

describe('GoogleConnector', () => {
  const accessToken = 'test-access-token';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
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

      // All other Google product endpoints can fail; connector should degrade gracefully.
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
});

