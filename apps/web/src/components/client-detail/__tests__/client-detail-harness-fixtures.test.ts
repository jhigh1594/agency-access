import { describe, expect, it } from 'vitest';
import {
  CLIENT_DETAIL_HARNESS_PRESET_NAMES,
  getClientDetailHarnessFixture,
} from '../__fixtures__/client-detail-fixtures';

describe('client detail harness fixtures', () => {
  it('exposes the required named presets', () => {
    expect(CLIENT_DETAIL_HARNESS_PRESET_NAMES).toEqual([
      'fully-connected',
      'mixed-google',
      'revoked-meta',
      'empty-client',
      'multi-request-history',
    ]);
  });

  it('returns fixture data for the named presets', () => {
    const fixture = getClientDetailHarnessFixture('revoked-meta');

    expect(fixture.client.name).toBe('Atlas Peak');
    expect(fixture.platformGroups[0]?.status).toBe('revoked');
  });
});
