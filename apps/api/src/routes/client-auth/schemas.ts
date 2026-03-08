import { z } from 'zod';

export const submitIntakeSchema = z.object({
  intakeResponses: z.record(z.any()),
});

export const createOAuthStateSchema = z.object({
  platform: z.enum([
    'google',
    'meta',
    'meta_ads',
    'google_ads',
    'ga4',
    'linkedin',
    'instagram',
    'tiktok',
    'mailchimp',
    'pinterest',
    'klaviyo',
  ]),
});

export const oauthExchangeSchema = z.object({
  code: z.string(),
  state: z.string(),
  platform: z.enum([
    'google',
    'meta',
    'meta_ads',
    'google_ads',
    'ga4',
    'linkedin',
    'instagram',
    'tiktok',
    'mailchimp',
    'pinterest',
    'klaviyo',
  ]).optional(),
});

export const saveAssetsSchema = z.object({
  connectionId: z.string(),
  platform: z.string(),
  selectedAssets: z.object({
    adAccounts: z.array(z.string()).optional(),
    advertisers: z.array(z.string()).optional(),
    pages: z.array(z.string()).optional(),
    instagramAccounts: z.array(z.string()).optional(),
    properties: z.array(z.string()).optional(),
    businessAccounts: z.array(z.string()).optional(),
    containers: z.array(z.string()).optional(),
    sites: z.array(z.string()).optional(),
    merchantAccounts: z.array(z.string()).optional(),
    selectedBusinessCenterId: z.string().optional(),
    selectedAdvertiserIds: z.array(z.string()).optional(),
    availableBusinessCenters: z.array(z.any()).optional(),
    availableAdvertisers: z.array(z.any()).optional(),
  }),
});

export const grantPagesAccessSchema = z.object({
  connectionId: z.string(),
  pageIds: z.array(z.string()),
});

export const adAccountsSharedSchema = z.object({
  connectionId: z.string(),
  sharedAdAccountIds: z.array(z.string()).optional(),
});

export const tiktokPartnerShareSchema = z.object({
  connectionId: z.string(),
  advertiserIds: z.array(z.string()).optional(),
  selectedBusinessCenterId: z.string().optional(),
});

export const tiktokPartnerVerifySchema = z.object({
  connectionId: z.string(),
  advertiserIds: z.array(z.string()).optional(),
});
