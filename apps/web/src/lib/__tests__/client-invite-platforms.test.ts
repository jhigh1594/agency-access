import { describe, expect, it } from 'vitest';
import {
  getClientInvitePlatformCapability,
  getInviteSecuritySummary,
  isClientInviteManualCallbackPlatform,
} from '../client-invite-platforms';

describe('client invite platform capabilities', () => {
  it('treats beehiiv as a manual client invite platform despite api-key agency auth', () => {
    expect(getClientInvitePlatformCapability('beehiiv')).toMatchObject({
      flow: 'manual',
      manualRoute: 'beehiiv/manual',
      manualCallback: true,
    });
  });

  it('routes mailchimp and klaviyo through manual invite flows', () => {
    expect(getClientInvitePlatformCapability('mailchimp')).toMatchObject({
      flow: 'manual',
      manualRoute: 'mailchimp/manual',
      manualCallback: true,
    });

    expect(getClientInvitePlatformCapability('klaviyo')).toMatchObject({
      flow: 'manual',
      manualRoute: 'klaviyo/manual',
      manualCallback: true,
    });
  });

  it('keeps linkedin on oauth flow', () => {
    expect(getClientInvitePlatformCapability('linkedin')).toMatchObject({
      flow: 'oauth',
      manualRoute: null,
      manualCallback: false,
    });
  });

  it('reports mixed security copy when both oauth and manual platforms are requested', () => {
    expect(getInviteSecuritySummary(['google', 'mailchimp'])).toMatchObject({
      badge: expect.stringMatching(/platform-native/i),
      detail: expect.stringMatching(/oauth/i),
      usesManualFlow: true,
      usesOAuthFlow: true,
    });
  });

  it('flags mailchimp manual callback handling as complete-on-return', () => {
    expect(isClientInviteManualCallbackPlatform('mailchimp')).toBe(true);
    expect(isClientInviteManualCallbackPlatform('google')).toBe(false);
  });
});
