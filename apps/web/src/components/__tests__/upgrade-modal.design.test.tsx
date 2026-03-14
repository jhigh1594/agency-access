/**
 * UpgradeModal Design System Compliance Tests
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../upgrade-modal.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('UpgradeModal - Static Design Validation', () => {
  it('should not contain gray colors', () => {
    const code = readComponent();
    expect(code).not.toContain('gray-');
  });

  it('should not contain bg-white', () => {
    const code = readComponent();
    expect(code).not.toContain('bg-white');
  });

  it('should import m from framer-motion (tree-shaken), not motion', () => {
    const code = readComponent();
    expect(code).toMatch(/import\s*{[^}]*\bm\b[^}]*}\s*from\s*['"]framer-motion['"]/);
    expect(code).not.toMatch(/import\s*{[^}]*\bmotion\b[^}]*}\s*from\s*['"]framer-motion['"]/);
  });

  it('should use design token colors for text', () => {
    const code = readComponent();
    expect(code).toMatch(/text-ink/);
    expect(code).toMatch(/text-foreground/);
    expect(code).toMatch(/text-muted-foreground/);
  });
});
