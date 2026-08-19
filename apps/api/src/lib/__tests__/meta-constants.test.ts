import { describe, it, expect } from 'vitest';
import { META_GRAPH_VERSION } from '../meta-constants';

describe('META_GRAPH_VERSION', () => {
  it('is pinned to v21.0', () => {
    expect(META_GRAPH_VERSION).toBe('v21.0');
  });
});
