import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../page.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('New Access Request Page - Static Design Validation', () => {
  it('should not use hover:scale-105 (non-standard interaction)', () => {
    const code = readComponent();
    expect(code).not.toContain('hover:scale-105');
  });

  it('should not contain soft shadows (shadow-sm, shadow-md)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-sm/);
    expect(code).not.toMatch(/\bshadow-md\b/);
  });

  it('should use design token colors', () => {
    const code = readComponent();
    expect(code).toMatch(/text-ink/);
    expect(code).toMatch(/text-muted-foreground/);
    expect(code).toMatch(/bg-coral/);
    expect(code).toMatch(/border-border/);
  });
});
