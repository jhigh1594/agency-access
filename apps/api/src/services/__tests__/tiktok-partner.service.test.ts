import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mapAccessLevelToTikTokRole, tiktokPartnerService } from '../tiktok-partner.service.js';

describe('TikTokPartnerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('mapAccessLevelToTikTokRole', () => {
    it('maps internal access levels to TikTok roles', () => {
      expect(mapAccessLevelToTikTokRole('admin')).toBe('ADMIN');
      expect(mapAccessLevelToTikTokRole('standard')).toBe('OPERATOR');
      expect(mapAccessLevelToTikTokRole('read_only')).toBe('ANALYST');
    });

    it('throws for unsupported access levels', () => {
      expect(() => mapAccessLevelToTikTokRole('invalid-level')).toThrow('Unsupported access level');
    });
  });

  it('shares advertiser assets and returns per-account results', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, message: 'OK' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'server error',
      } as Response);

    const result = await tiktokPartnerService.shareAdvertiserAssets({
      accessToken: 'token-123',
      clientBusinessCenterId: 'bc_client_1',
      agencyBusinessCenterId: 'bc_agency_1',
      advertiserIds: ['adv_1', 'adv_2'],
      advertiserRole: 'OPERATOR',
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toEqual(
      expect.objectContaining({ advertiserId: 'adv_1', status: 'granted' })
    );
    expect(result.results[1]).toEqual(
      expect.objectContaining({ advertiserId: 'adv_2', status: 'failed' })
    );
    expect(result.success).toBe(false);
  });

  it('verifies partner share using bc/partner/asset/get', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          list: [{ asset_id: 'adv_1' }],
        },
      }),
    } as Response);

    const verified = await tiktokPartnerService.verifyAdvertiserShare({
      accessToken: 'token-123',
      clientBusinessCenterId: 'bc_client_1',
      agencyBusinessCenterId: 'bc_agency_1',
      advertiserId: 'adv_1',
    });

    expect(verified).toBe(true);
  });
});
