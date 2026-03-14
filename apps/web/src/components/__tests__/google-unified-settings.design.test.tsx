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
    expect(code).not.toContain('slate-');
  });

  it('should not contain indigo colors', () => {
    const code = readComponent();
    expect(code).not.toContain('indigo-');
  });

  it('should not contain raw red colors', () => {
    const code = readComponent();
    expect(code).not.toContain('red-');
  });

  it('should not contain raw blue colors (blue-400, blue-500, blue-600)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/blue-[0-9]/);
  });

  it('should not contain raw orange colors', () => {
    const code = readComponent();
    expect(code).not.toContain('orange-');
  });

  it('should not contain soft shadows (shadow-xl)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
  });

  it('should use design token colors', () => {
    const code = readComponent();
    expect(code).toMatch(/text-ink/);
    expect(code).toMatch(/text-foreground/);
    expect(code).toMatch(/text-muted-foreground/);
    expect(code).toMatch(/border-border/);
  });
});
