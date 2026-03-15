import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../hierarchical-platform-selector.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('HierarchicalPlatformSelector - Static Design Validation', () => {
  it('should not use verbose rgb(var()) syntax for tokens', () => {
    const code = readComponent();
    expect(code).not.toMatch(/\[rgb\(var\(/);
  });

  it('should not contain soft shadows (shadow-sm)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-sm/);
  });

  it('should use coral token directly', () => {
    const code = readComponent();
    expect(code).toMatch(/text-coral/);
    expect(code).toMatch(/bg-coral/);
    expect(code).toMatch(/border-coral/);
  });
});
