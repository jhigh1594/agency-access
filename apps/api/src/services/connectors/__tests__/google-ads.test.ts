import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleAdsConnector } from '../google-ads.js';

describe('GoogleAdsConnector manager linking', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'dev-token';
  });

  it('creates a CustomerClientLink invitation from the agency manager account', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          resourceName: 'customers/6449142979/customerClientLinks/123',
        },
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();
    const result = await connector.createManagerLinkInvitation({
      accessToken: 'access-token',
      managerCustomerId: '6449142979',
      clientCustomerId: '9756457868',
    });

    expect(result).toEqual({
      resourceName: 'customers/6449142979/customerClientLinks/123',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://googleads.googleapis.com/v22/customers/6449142979/customerClientLinks:mutate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'developer-token': 'dev-token',
          'login-customer-id': '6449142979',
        }),
        body: JSON.stringify({
          operation: {
            create: {
              clientCustomer: 'customers/9756457868',
              status: 'PENDING',
            },
          },
        }),
      })
    );
  });

  it('looks up the pending manager link id from the client account relationship graph', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              customerClientLink: {
                resourceName: 'customers/6449142979/customerClientLinks/123',
                clientCustomer: 'customers/9756457868',
                managerLinkId: '123',
                status: 'PENDING',
              },
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();
    const result = await connector.findManagerLink({
      accessToken: 'access-token',
      managerCustomerId: '6449142979',
      clientCustomerId: '9756457868',
    });

    expect(result).toEqual({
      managerLinkId: '123',
      resourceName: 'customers/6449142979/customerClientLinks/123',
      status: 'PENDING',
    });
  });

  it('verifies when the client account is actively linked to the agency manager account', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            customerManagerLink: {
              managerCustomer: 'customers/6449142979',
              managerLinkId: '123',
              status: 'ACTIVE',
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();
    const result = await connector.verifyManagerLink({
      accessToken: 'access-token',
      managerCustomerId: '6449142979',
      clientCustomerId: '9756457868',
      managerLinkId: '123',
    });

    expect(result).toEqual({
      isLinked: true,
      status: 'ACTIVE',
      managerLinkId: '123',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://googleads.googleapis.com/v22/customers/9756457868/googleAds:searchStream',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'developer-token': 'dev-token',
          'login-customer-id': '6449142979',
        }),
      })
    );
  });

  it('creates a CustomerUserAccessInvitation for a direct agency-user invite', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          resourceName:
            'customers/9756457868/customerUserAccessInvitations/jon.highmu@gmail.com',
        },
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();
    const result = await connector.createUserAccessInvitation({
      accessToken: 'client-access-token',
      clientCustomerId: '9756457868',
      emailAddress: 'jon.highmu@gmail.com',
      accessRole: 'ADMIN',
    });

    expect(result).toEqual({
      resourceName:
        'customers/9756457868/customerUserAccessInvitations/jon.highmu@gmail.com',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://googleads.googleapis.com/v22/customers/9756457868/customerUserAccessInvitations:mutate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer client-access-token',
          'developer-token': 'dev-token',
        }),
        body: JSON.stringify({
          operation: {
            create: {
              emailAddress: 'jon.highmu@gmail.com',
              accessRole: 'ADMIN',
            },
          },
        }),
      })
    );
  });

  it('looks up a pending direct user invitation by email address', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          results: [
            {
              customerUserAccessInvitation: {
                resourceName:
                  'customers/9756457868/customerUserAccessInvitations/jon.highmu@gmail.com',
                invitationId: '555',
                emailAddress: 'jon.highmu@gmail.com',
                accessRole: 'ADMIN',
              },
            },
          ],
        },
      ]),
    });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();
    const result = await connector.findUserAccessInvitation({
      accessToken: 'client-access-token',
      clientCustomerId: '9756457868',
      emailAddress: 'jon.highmu@gmail.com',
    });

    expect(result).toEqual({
      invitationId: '555',
      resourceName:
        'customers/9756457868/customerUserAccessInvitations/jon.highmu@gmail.com',
      emailAddress: 'jon.highmu@gmail.com',
      accessRole: 'ADMIN',
    });
  });

  it('verifies when the invited agency user has accepted Google Ads access', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          results: [
            {
              customerUserAccess: {
                emailAddress: 'jon.highmu@gmail.com',
                accessRole: 'ADMIN',
              },
            },
          ],
        },
      ]),
    });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();
    const result = await connector.verifyUserAccess({
      accessToken: 'client-access-token',
      clientCustomerId: '9756457868',
      emailAddress: 'jon.highmu@gmail.com',
    });

    expect(result).toEqual({
      hasAccess: true,
      accessRole: 'ADMIN',
      emailAddress: 'jon.highmu@gmail.com',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://googleads.googleapis.com/v22/customers/9756457868/googleAds:searchStream',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer client-access-token',
          'developer-token': 'dev-token',
        }),
      })
    );
  });

  it('surfaces retryable Google Ads API failures with structured retry metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () =>
        JSON.stringify({
          error: {
            code: 14,
            status: 'UNAVAILABLE',
            message: 'Temporary Google Ads outage',
          },
        }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();

    await expect(
      connector.createManagerLinkInvitation({
        accessToken: 'access-token',
        managerCustomerId: '6449142979',
        clientCustomerId: '9756457868',
      })
    ).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      retryable: true,
    });
  });

  it('extracts actionable Google Ads authorization error codes from GoogleAdsFailure details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            message: 'Request contains an invalid argument.',
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v22.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: {
                      authorizationError: 'USER_PERMISSION_DENIED',
                    },
                    message: 'The customer does not have permission to access the manager account.',
                  },
                ],
              },
            ],
          },
        }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const connector = new GoogleAdsConnector();

    await expect(
      connector.createManagerLinkInvitation({
        accessToken: 'access-token',
        managerCustomerId: '6449142979',
        clientCustomerId: '9756457868',
      })
    ).rejects.toMatchObject({
      code: 'USER_PERMISSION_DENIED',
      retryable: false,
    });
  });
});
