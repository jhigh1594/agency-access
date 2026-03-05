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
