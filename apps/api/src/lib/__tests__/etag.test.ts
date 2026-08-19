/**
 * Characterization test for computeEtag (U11): the shared helper must
 * produce the same digest as both former inline implementations.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import { computeEtag } from '../etag';

describe('computeEtag', () => {
  const payload = {
    platforms: [
      { platform: 'google', connected: true },
      { platform: 'meta', connected: false },
    ],
    generatedAt: '2026-08-18T00:00:00.000Z',
    count: 2,
  };

  it('matches the inline createHash implementation for a fixed payload', () => {
    const inline = createHash('md5').update(JSON.stringify(payload)).digest('hex');
    expect(computeEtag(payload)).toBe(inline);
  });

  it('is deterministic for identical payloads', () => {
    expect(computeEtag(payload)).toBe(computeEtag(payload));
  });

  it('differs when the payload differs', () => {
    expect(computeEtag(payload)).not.toBe(computeEtag({ ...payload, count: 3 }));
  });
});
