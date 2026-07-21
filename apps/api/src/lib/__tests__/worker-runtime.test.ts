import { describe, expect, it } from 'vitest';
import { resolveWorkerRuntimeMode } from '../worker-runtime.js';

describe('resolveWorkerRuntimeMode', () => {
  it('starts every handler when general background workers are enabled', () => {
    expect(resolveWorkerRuntimeMode({
      backgroundWorkersEnabled: true,
      googleAdsDeveloperToken: undefined,
    })).toBe('all');
  });

  it('keeps the product-critical Google grant handler running when general workers are disabled', () => {
    expect(resolveWorkerRuntimeMode({
      backgroundWorkersEnabled: false,
      googleAdsDeveloperToken: 'standard-developer-token',
    })).toBe('google-native-only');
  });

  it('disables the queue runtime when neither general workers nor Google Ads grants are configured', () => {
    expect(resolveWorkerRuntimeMode({
      backgroundWorkersEnabled: false,
      googleAdsDeveloperToken: undefined,
    })).toBe('disabled');
  });
});
