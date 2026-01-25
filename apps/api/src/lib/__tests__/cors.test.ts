import { describe, it, expect } from 'vitest';
import { getCorsOptions } from '@/lib/cors';

describe('getCorsOptions', () => {
  it('includes x-agency-id headers and exposes cache headers', () => {
    const options = getCorsOptions('http://localhost:3000');

    expect(options.allowedHeaders).toEqual(
      expect.arrayContaining(['x-agency-id', 'X-Agency-Id'])
    );

    expect(options.exposedHeaders).toEqual(
      expect.arrayContaining(['x-cache', 'x-response-time', 'x-cache-hit-rate'])
    );

    expect(options.methods).toEqual(
      expect.arrayContaining(['OPTIONS'])
    );
  });
});
