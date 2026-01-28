import { MetaConnector } from '@/services/connectors/meta';
import { GoogleConnector } from '@/services/connectors/google';
import { LinkedInConnector } from '@/services/connectors/linkedin';
// Kit now uses team invitation flow (manual), not OAuth
// import { KitConnector } from '@/services/connectors/kit';
import { BeehiivConnector } from '@/services/connectors/beehiiv';
import { TikTokConnector } from '@/services/connectors/tiktok';
import { MailchimpConnector } from '@/services/connectors/mailchimp';
// Pinterest uses manual invitation flow (team partnership), not OAuth
// import { PinterestConnector } from '@/services/connectors/pinterest';
import { KlaviyoConnector } from '@/services/connectors/klaviyo';
import { ShopifyConnector } from '@/services/connectors/shopify';
import type { Platform } from '@agency-platform/shared';

export const PLATFORM_NAMES: Record<Platform, string> = {
  google: 'Google',
  meta: 'Meta',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  ga4: 'Google Analytics',
  tiktok: 'TikTok Ads',
  tiktok_ads: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
  linkedin_ads: 'LinkedIn Ads',
  snapchat: 'Snapchat Ads',
  snapchat_ads: 'Snapchat Ads',
  instagram: 'Instagram',
  kit: 'Kit',
  beehiiv: 'Beehiiv',
  mailchimp: 'Mailchimp',
  pinterest: 'Pinterest',
  klaviyo: 'Klaviyo',
  shopify: 'Shopify',
};

export function getPlatformCategory(platform: Platform): 'recommended' | 'other' {
  const recommended: Platform[] = ['google', 'meta', 'linkedin'];
  return recommended.includes(platform) ? 'recommended' : 'other';
}

export const SUPPORTED_PLATFORMS = [
  'google',
  'meta',
  'linkedin',
  'kit',
  'beehiiv',
  'tiktok',
  'mailchimp',
  'pinterest',
  'klaviyo',
  'shopify',
] as const;
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export const MANUAL_PLATFORMS = ['kit', 'mailchimp', 'beehiiv', 'klaviyo', 'pinterest'] as const;

export const PLATFORM_CONNECTORS = {
  google: GoogleConnector,
  meta: MetaConnector,
  linkedin: LinkedInConnector,
  // Kit uses team invitation flow (manual), not OAuth - no connector needed
  // kit: KitConnector,
  beehiiv: BeehiivConnector,
  tiktok: TikTokConnector,
  mailchimp: MailchimpConnector,
  // Pinterest uses manual invitation flow (team partnership), not OAuth
  // pinterest: PinterestConnector,
  klaviyo: KlaviyoConnector,
  shopify: ShopifyConnector,
} as const;

export function getPlatformDisplayName(platform: string): string {
  const displayNames: Record<string, string> = {
    meta: 'Meta',
    google: 'Google',
    linkedin: 'LinkedIn',
  };
  return displayNames[platform] || platform;
}
