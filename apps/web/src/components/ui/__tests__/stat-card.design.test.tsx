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
    // bare legacy tokens only — text-success-ink is the sanctioned v2.0 token
    expect(code).not.toMatch(/text-success(?![-\w])/);
    expect(code).not.toMatch(/text-error(?![-\w])/);
  });

  it('should use text-foreground for stat value display', () => {
    const code = readComponent();
    expect(code).toMatch(/text-foreground/);
  });

  it('should use text-success-ink for positive trends', () => {
    const code = readComponent();
    expect(code).toMatch(/text-success-ink/);
  });

  it('should use text-danger-ink for negative trends', () => {
    const code = readComponent();
    expect(code).toMatch(/text-danger-ink/);
  });
});
