import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../meta-unified-settings.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('MetaUnifiedSettings - Static Design Validation', () => {
  it('should not contain slate colors', () => {
    const code = readComponent();
    expect(code).not.toMatch(/(?<![a-z])slate-/);
  });

  it('should not contain indigo colors', () => {
    const code = readComponent();
    expect(code).not.toContain('indigo-');
  });

  it('should use ink for primary text', () => {
    const code = readComponent();
    expect(code).toMatch(/text-ink/);
  });

  it('should keep asset row visually lighter than the section shell', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-brutalist-sm/);
    expect(code).toMatch(/border-border bg-paper/);
  });
});
