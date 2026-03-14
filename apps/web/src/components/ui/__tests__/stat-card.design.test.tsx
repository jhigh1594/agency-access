/**
 * StatCard Design System Compliance Tests
 *
 * Ensures stat-card.tsx uses valid design tokens only.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../stat-card.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('StatCard - Static Design Validation', () => {
  it('should not reference non-existent color tokens (text-technical, text-success, text-error)', () => {
    const code = readComponent();
    expect(code).not.toContain('text-technical');
    expect(code).not.toContain('text-success');
    expect(code).not.toContain('text-error');
  });

  it('should use text-foreground for stat value display', () => {
    const code = readComponent();
    expect(code).toMatch(/text-foreground/);
  });

  it('should use text-teal for positive trends', () => {
    const code = readComponent();
    expect(code).toMatch(/text-teal/);
  });

  it('should use text-coral for negative trends', () => {
    const code = readComponent();
    expect(code).toMatch(/text-coral/);
  });
});
