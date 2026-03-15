import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../page.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('Access Request New Page - Static Design Validation', () => {
  it('should not use hover:scale-105 (non-standard interaction)', () => {
    const code = readComponent();
    expect(code).not.toContain('hover:scale-105');
  });

  it('should not use shadow-sm hover:shadow-md on buttons (non-brutalist shadows)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-sm hover:shadow-md/);
  });
});
