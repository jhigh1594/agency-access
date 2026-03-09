import { describe, expect, it } from 'vitest';
import type { ClientAccessRequestPlatformGroup, Platform } from '@agency-platform/shared';
import { buildInvitePlatformQueue } from '../invite-platform-queue';

const REQUESTED_PLATFORMS: ClientAccessRequestPlatformGroup[] = [
  {
    platformGroup: 'google',
    products: [{ product: 'google_ads', accessLevel: 'admin' }],
  },
  {
    platformGroup: 'meta',
    products: [{ product: 'meta_ads', accessLevel: 'admin' }],
  },
  {
    platformGroup: 'mailchimp',
    products: [{ product: 'mailchimp', accessLevel: 'admin' }],
  },
];

describe('buildInvitePlatformQueue', () => {
  it('uses the first incomplete platform as the active platform by default', () => {
    const queue = buildInvitePlatformQueue({
      platforms: REQUESTED_PLATFORMS,
      completedPlatforms: new Set<Platform>(['google']),
    });

    expect(queue.activePlatform?.platformGroup).toBe('meta');
    expect(queue.completedPlatforms.map((group) => group.platformGroup)).toEqual(['google']);
    expect(queue.remainingPlatforms.map((group) => group.platformGroup)).toEqual(['mailchimp']);
    expect(queue.nextPlatform?.platformGroup).toBe('mailchimp');
  });

  it('restores the returning oauth platform as active when it is still incomplete', () => {
    const queue = buildInvitePlatformQueue({
      platforms: REQUESTED_PLATFORMS,
      completedPlatforms: new Set<Platform>(),
      returningPlatform: 'meta',
    });

    expect(queue.activePlatform?.platformGroup).toBe('meta');
    expect(queue.remainingPlatforms.map((group) => group.platformGroup)).toEqual([
      'google',
      'mailchimp',
    ]);
    expect(queue.nextPlatform?.platformGroup).toBe('google');
  });

  it('returns no active platform when every requested platform is already completed', () => {
    const queue = buildInvitePlatformQueue({
      platforms: REQUESTED_PLATFORMS,
      completedPlatforms: new Set<Platform>(['google', 'meta', 'mailchimp']),
      returningPlatform: 'meta',
    });

    expect(queue.activePlatform).toBeNull();
    expect(queue.remainingPlatforms).toEqual([]);
    expect(queue.nextPlatform).toBeNull();
  });
});
