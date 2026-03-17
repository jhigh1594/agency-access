import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../google-unified-settings.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('GoogleUnifiedSettings - Static Design Validation', () => {
  it('should not contain slate colors', () => {
    const code = readComponent();
    expect(code).not.toMatch(/(?<![a-z])slate-/);
  });

  it('should not contain indigo colors', () => {
    const code = readComponent();
    expect(code).not.toContain('indigo-');
  });

  it('should not contain raw red colors', () => {
    const code = readComponent();
    expect(code).not.toContain('red-');
  });

  it('should not contain raw orange colors', () => {
    const code = readComponent();
    expect(code).not.toContain('orange-');
  });

  it('should not contain raw blue colors', () => {
    const code = readComponent();
    expect(code).not.toContain('blue-');
  });

  it('should not contain raw green colors', () => {
    const code = readComponent();
    expect(code).not.toContain('green-');
  });

  it('should use ink for primary text', () => {
    const code = readComponent();
    expect(code).toMatch(/text-ink/);
  });

  it('should retain brutalist shadow on ProductCard when disabled', () => {
    const code = readComponent();
    // Per DESIGN_SYSTEM.md: disabled states should maintain brutalist language
    // The ProductCard should use shadow-brutalist-sm in both states
    expect(code).toMatch(/shadow-brutalist-sm/);
  });

  it('should use black-derived border on ProductCard when disabled', () => {
    const code = readComponent();
    // Disabled ProductCard should use border-black/30, not generic border-border
    // This maintains the hard-edge brutalist language
    expect(code).toMatch(/border-black\/30/);
    expect(code).not.toMatch(/disabled.*border-border/);
  });
});
