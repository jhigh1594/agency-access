/**
 * TrialBanner Design System Compliance Tests
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../trial-banner.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('TrialBanner - Static Design Validation', () => {
  it('should not use raw red-600 or amber-500 colors', () => {
    const code = readComponent();
    expect(code).not.toContain('red-600');
    expect(code).not.toContain('amber-500');
  });

  it('should use design token bg-coral for expired state', () => {
    const code = readComponent();
    expect(code).toMatch(/bg-coral/);
  });

  it('should use design token bg-warning for active trial state', () => {
    const code = readComponent();
    expect(code).toMatch(/bg-warning/);
  });
});
