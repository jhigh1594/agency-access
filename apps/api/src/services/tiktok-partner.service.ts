import type { AccessLevel } from '@agency-platform/shared';

const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

type TikTokEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

export type TikTokPartnerRole = 'ADMIN' | 'OPERATOR' | 'ANALYST';

export type TikTokPartnerShareStatus = 'granted' | 'failed' | 'already_granted';

export interface TikTokPartnerShareResultItem {
  advertiserId: string;
  status: TikTokPartnerShareStatus;
  error?: string;
}

export interface TikTokPartnerShareRequest {
  accessToken: string;
  clientBusinessCenterId: string;
  agencyBusinessCenterId: string;
  advertiserIds: string[];
  advertiserRole: TikTokPartnerRole;
  alreadyGrantedAdvertiserIds?: string[];
}

export interface TikTokPartnerShareResult {
  success: boolean;
  results: TikTokPartnerShareResultItem[];
}

export interface TikTokPartnerVerifyRequest {
  accessToken: string;
  clientBusinessCenterId: string;
  agencyBusinessCenterId: string;
  advertiserId: string;
}

export function mapAccessLevelToTikTokRole(accessLevel: AccessLevel | string): TikTokPartnerRole {
  if (accessLevel === 'admin' || accessLevel === 'manage') return 'ADMIN';
  if (accessLevel === 'standard') return 'OPERATOR';
  if (
    accessLevel === 'read_only' ||
    accessLevel === 'view_only' ||
    accessLevel === 'email_only'
  ) {
    return 'ANALYST';
  }

  throw new Error(`Unsupported access level: ${accessLevel}`);
}

class TikTokPartnerService {
  async shareAdvertiserAssets(input: TikTokPartnerShareRequest): Promise<TikTokPartnerShareResult> {
    const advertiserIds = Array.from(new Set(input.advertiserIds.filter(Boolean)));
    const alreadyGranted = new Set(input.alreadyGrantedAdvertiserIds || []);
    const results: TikTokPartnerShareResultItem[] = [];

    for (const advertiserId of advertiserIds) {
      if (alreadyGranted.has(advertiserId)) {
        results.push({ advertiserId, status: 'already_granted' });
        continue;
      }

      try {
        await this.addPartnerToAdvertiser({
          accessToken: input.accessToken,
          clientBusinessCenterId: input.clientBusinessCenterId,
          agencyBusinessCenterId: input.agencyBusinessCenterId,
          advertiserId,
          advertiserRole: input.advertiserRole,
        });
        results.push({ advertiserId, status: 'granted' });
      } catch (error) {
        results.push({
          advertiserId,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: results.every((item) => item.status !== 'failed'),
      results,
    };
  }

  async verifyAdvertiserShare(input: TikTokPartnerVerifyRequest): Promise<boolean> {
    const url = new URL(`${TIKTOK_API_BASE}/bc/partner/asset/get/`);
    url.searchParams.set('bc_id', input.clientBusinessCenterId);
    url.searchParams.set('partner_id', input.agencyBusinessCenterId);
    url.searchParams.set('asset_type', 'ADVERTISER');
    url.searchParams.set('share_type', 'SHARING');
    url.searchParams.set('page_size', '50');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Access-Token': input.accessToken,
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as TikTokEnvelope<{ list?: Array<Record<string, unknown>> }>;
    if (typeof payload.code === 'number' && payload.code !== 0) {
      return false;
    }

    const list = Array.isArray(payload.data?.list) ? payload.data.list : [];
    return list.some((item) => {
      const assetId =
        item.asset_id ??
        item.assetId ??
        item.advertiser_id ??
        item.advertiserId ??
        item.id;
      return String(assetId) === input.advertiserId;
    });
  }

  private async addPartnerToAdvertiser(input: {
    accessToken: string;
    clientBusinessCenterId: string;
    agencyBusinessCenterId: string;
    advertiserId: string;
    advertiserRole: TikTokPartnerRole;
  }): Promise<void> {
    const response = await fetch(`${TIKTOK_API_BASE}/bc/partner/add/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': input.accessToken,
      },
      body: JSON.stringify({
        bc_id: input.clientBusinessCenterId,
        partner_id: input.agencyBusinessCenterId,
        asset_type: 'ADVERTISER',
        asset_ids: [input.advertiserId],
        advertiser_role: input.advertiserRole,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TikTok partner share request failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as TikTokEnvelope<unknown>;
    if (typeof payload.code === 'number' && payload.code !== 0) {
      throw new Error(payload.message || 'TikTok partner share API returned an error');
    }
  }
}

export const tiktokPartnerService = new TikTokPartnerService();
