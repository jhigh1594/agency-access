import { describe, expect, it } from 'vitest';
import { resolveGoogleNativeGrantDispatchMode } from '../worker-runtime.js';

describe('resolveGoogleNativeGrantDispatchMode', () => {
  it('queues grants when general background workers are enabled', () => {
    expect(resolveGoogleNativeGrantDispatchMode('true')).toBe('queued');
  });

  it.each(['false', '0', 'no', 'off'])(
    'executes grants inline when general workers use the disabled value %s',
    (value) => {
      expect(resolveGoogleNativeGrantDispatchMode(value)).toBe('inline');
    }
  );

  it('uses the enabled default when the environment variable is omitted', () => {
    expect(resolveGoogleNativeGrantDispatchMode(undefined)).toBe('queued');
  });
});
