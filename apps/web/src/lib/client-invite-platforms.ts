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
      badge: 'Platform-native access only',
      detail: 'Some platforms use OAuth and others use platform-native invite steps. Passwords are never requested.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  if (usesManualFlow) {
    return {
      badge: 'Platform-native invite only',
      detail: 'This request uses platform-native invite steps only. Passwords are never requested.',
      usesOAuthFlow,
      usesManualFlow,
    };
  }

  return {
    badge: 'OAuth only',
    detail: 'This request uses official OAuth connections only. Passwords are never requested.',
    usesOAuthFlow,
    usesManualFlow,
  };
}

export function getClientInviteManualRoute(platform: Platform): string | null {
  return getClientInvitePlatformCapability(platform).manualRoute;
}
