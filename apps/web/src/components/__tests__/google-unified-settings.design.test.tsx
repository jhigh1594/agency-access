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

  it('should keep ProductCard visually lighter than the section shell', () => {
    const code = readComponent();
    // Product rows should not use the heavy brutalist shadow; the section card is the anchor.
    expect(code).not.toMatch(/shadow-brutalist-sm/);
    // Enabled state can tighten border color on hover but stays border-based, not full brutalist.
    expect(code).toMatch(/border-border bg-paper/);
  });
});
