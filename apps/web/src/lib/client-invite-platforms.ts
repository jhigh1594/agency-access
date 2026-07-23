import { getPlatformTokenCapability, type Platform } from '@agency-platform/shared';

type ClientInviteFlow = 'oauth' | 'manual';

interface ClientInvitePlatformCapability {
  flow: ClientInviteFlow;
  manualRoute: string | null;
  manualCallback: boolean;
}

const CLIENT_INVITE_MANUAL_ROUTE_SEGMENTS: Partial<Record<Platform, string>> = {
  beehiiv: 'beehiiv/manual',
  kit: 'kit/manual',
  mailchimp: 'mailchimp/manual',
  klaviyo: 'klaviyo/manual',
  pinterest: 'pinterest/manual',
  snapchat: 'snapchat/manual',
  shopify: 'shopify/manual',
};

const CLIENT_INVITE_MANUAL_PLATFORMS = new Set<Platform>([
  'beehiiv',
  'kit',
  'mailchimp',
  'klaviyo',
  'pinterest',
  'snapchat',
  'shopify',
]);

export function getClientInvitePlatformCapability(platform: Platform): ClientInvitePlatformCapability {
  const sharedCapability = getPlatformTokenCapability(platform);
  const manualRoute = CLIENT_INVITE_MANUAL_ROUTE_SEGMENTS[platform] || null;
  const flow: ClientInviteFlow =
    CLIENT_INVITE_MANUAL_PLATFORMS.has(platform) || sharedCapability.connectionMethod === 'manual'
      ? 'manual'
      : 'oauth';

  return {
    flow,
    manualRoute,
    manualCallback: flow === 'manual',
  };
}

export function isClientInviteManualPlatform(platform: Platform): boolean {
  return getClientInvitePlatformCapability(platform).flow === 'manual';
}

export function isClientInviteManualCallbackPlatform(platform: Platform): boolean {
  return getClientInvitePlatformCapability(platform).manualCallback;
}

export function getInviteSecuritySummary(platforms: Platform[]): {
  badge: string;
  detail: string;
  usesOAuthFlow: boolean;
  usesManualFlow: boolean;
} {
  const capabilities = platforms.map((platform) => getClientInvitePlatformCapability(platform));
  const usesOAuthFlow = capabilities.some((capability) => capability.flow === 'oauth');
  const usesManualFlow = capabilities.some((capability) => capability.flow === 'manual');

  if (usesOAuthFlow && usesManualFlow) {
    return {
      badge: 'Secure — passwords never requested',
      detail: 'You will connect some accounts directly and authorize others through official login screens.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  if (usesManualFlow) {
    return {
      badge: 'Secure — passwords never requested',
      detail: 'You will invite your agency through each platform\'s own settings. No login credentials are shared.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  return {
    badge: 'Secure — passwords never requested',
    detail: 'You will authorize access through each platform\'s official login screen. Your credentials stay with the platform.',
    usesOAuthFlow,
    usesManualFlow,
  };
}

export function getClientInviteManualRoute(platform: Platform): string | null {
  return getClientInvitePlatformCapability(platform).manualRoute;
}

export function buildClientInviteConnectViewUrl(token: string, platform?: Platform | null): string {
  const searchParams = new URLSearchParams({ view: 'connect' });
  if (platform) {
    searchParams.set('platform', platform);
  }

  return `/invite/${token}?${searchParams.toString()}`;
}
