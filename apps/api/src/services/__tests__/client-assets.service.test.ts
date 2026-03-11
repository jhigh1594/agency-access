import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientAssetsService } from '../client-assets.service.js';

describe('ClientAssetsService - TikTok', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetches TikTok advertisers, business centers, and BC assets', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/oauth2/advertiser/get/')) {
        return {
          ok: true,
          json: async () => ({
            code: 0,
            data: {
              list: [
                {
                  advertiser_id: 'adv_1',
                  advertiser_name: 'Acme Advertiser',
                  status: 'STATUS_ENABLE',
                },
              ],
            },
          }),
        } as Response;
      }

      if (url.includes('/bc/get/')) {
        return {
          ok: true,
          json: async () => ({
            code: 0,
            data: {
              list: [
                {
                  bc_id: 'bc_1',
                  name: 'Acme Business Center',
                },
              ],
            },
          }),
        } as Response;
      }

      if (url.includes('/bc/asset/get/')) {
        return {
          ok: true,
          json: async () => ({
            code: 0,
            data: {
              list: [
                {
                  asset_id: 'adv_1',
                  asset_name: 'Acme Advertiser',
                  asset_type: 'ADVERTISER',
                },
              ],
            },
          }),
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => 'not found',
      } as Response;
    });

    const result = await clientAssetsService.fetchTikTokAssets('token-123');

    expect(result.advertisers).toHaveLength(1);
    expect(result.businessCenters).toHaveLength(1);
    expect(result.businessCenterAssets).toHaveLength(1);
    expect(result.businessCenterAssets[0].bcId).toBe('bc_1');
    expect(result.businessCenterAssets[0].advertisers).toHaveLength(1);
  });

  it('returns empty arrays when TikTok API fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    } as Response);

    const result = await clientAssetsService.fetchTikTokAssets('token-123');

    expect(result.advertisers).toEqual([]);
    expect(result.businessCenters).toEqual([]);
    expect(result.businessCenterAssets).toEqual([]);
  });
});

describe('ClientAssetsService - LinkedIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetches LinkedIn Pages from organization ACLs and organization details', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/rest/organizationAcls')) {
        return {
          ok: true,
          json: async () => ({
            elements: [
              {
                role: 'ADMINISTRATOR',
                state: 'APPROVED',
                organizationTarget: 'urn:li:organization:789',
              },
            ],
          }),
        } as Response;
      }

      if (url === 'https://api.linkedin.com/rest/organizations/789') {
        return {
          ok: true,
          json: async () => ({
            id: 789,
            localizedName: 'Northwind',
            vanityName: 'northwind',
            primaryOrganizationType: 'COMPANY',
          }),
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => 'not found',
      } as Response;
    });

    const result = await clientAssetsService.fetchLinkedInPages('token-123');

    expect(result).toEqual([
      {
        id: '789',
        name: 'Northwind',
        urn: 'urn:li:organization:789',
        vanityName: 'northwind',
        type: 'COMPANY',
      },
    ]);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('https://api.linkedin.com/rest/organizationAcls'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
        }),
      })
    );
  });

  it('throws when all LinkedIn organization detail lookups fail', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/rest/organizationAcls')) {
        return {
          ok: true,
          json: async () => ({
            elements: [
              {
                role: 'ADMINISTRATOR',
                state: 'APPROVED',
                organizationTarget: 'urn:li:organization:789',
              },
            ],
          }),
        } as Response;
      }

      if (url === 'https://api.linkedin.com/rest/organizations/789') {
        return {
          ok: false,
          status: 403,
          text: async () => 'forbidden',
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        text: async () => 'not found',
      } as Response;
    });

    await expect(clientAssetsService.fetchLinkedInPages('token-123')).rejects.toThrow(
      /failed to fetch linkedin organization details/i
    );
  });
});
