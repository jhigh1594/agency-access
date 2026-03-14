/**
 * Clients Page Design System Compliance Tests
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../page.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('Clients Page - Static Design Validation', () => {
  it('should not have double-negative translate (hover:-translate-y-[-Npx])', () => {
    const code = readComponent();
    expect(code).not.toMatch(/hover:-translate-y-\[-/);
  });

  it('should not use rgb(var()) inside Tailwind arbitrary values', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-\[.*rgb\(var\(/);
  });

  it('should use design system hover pattern for cards', () => {
    const code = readComponent();
    // Cards should either use clean-card (static) or standard hover-lift
    expect(code).toMatch(/hover:-translate-y-\[1px\]|hover:translate-y-\[-1px\]|clean-card/);
  });
});
