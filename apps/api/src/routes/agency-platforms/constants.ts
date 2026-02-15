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
// Zapier uses manual invitation flow (like Beehiiv/Kit), not OAuth
import {
  type Platform,
  PLATFORM_NAMES,
  RECOMMENDED_CONNECTION_PLATFORMS,
  SUPPORTED_CONNECTION_PLATFORMS,
} from '@agency-platform/shared';

export { PLATFORM_NAMES };

export function getPlatformCategory(platform: Platform): 'recommended' | 'other' {
  return RECOMMENDED_CONNECTION_PLATFORMS.includes(platform as any) ? 'recommended' : 'other';
}

export const SUPPORTED_PLATFORMS = SUPPORTED_CONNECTION_PLATFORMS;
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export const MANUAL_PLATFORMS = ['kit', 'mailchimp', 'beehiiv', 'klaviyo', 'pinterest', 'zapier'] as const;

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
  // zapier: uses manual invitation flow, not OAuth
} as const;

export function getPlatformDisplayName(platform: string): string {
  const displayNames: Record<string, string> = {
    meta: 'Meta',
    google: 'Google',
    linkedin: 'LinkedIn',
  };
  return displayNames[platform] || platform;
}
