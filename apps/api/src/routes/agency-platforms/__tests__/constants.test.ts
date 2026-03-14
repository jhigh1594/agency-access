import { describe, expect, it } from 'vitest';
import {
  MANUAL_PLATFORMS,
  PLATFORM_CONNECTORS,
  SUPPORTED_PLATFORMS,
} from '../constants.js';
import { getPlatformTokenCapability } from '@agency-platform/shared';

describe('agency-platform constants', () => {
  it('marks Klaviyo as a manual platform', () => {
    expect(MANUAL_PLATFORMS).toContain('klaviyo');
    expect(getPlatformTokenCapability('klaviyo').connectionMethod).toBe('manual');
  });

  it('does not expose manual platforms as OAuth connectors', () => {
    for (const platform of MANUAL_PLATFORMS) {
      expect(PLATFORM_CONNECTORS).not.toHaveProperty(platform);
    }
  });

  it('only exposes supported platforms in the agency platform surface', () => {
    for (const platform of Object.keys(PLATFORM_CONNECTORS)) {
      expect(SUPPORTED_PLATFORMS).toContain(platform);
    }
  });
});
