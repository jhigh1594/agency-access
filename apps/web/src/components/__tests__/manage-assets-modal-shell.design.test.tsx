import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../manage-assets-modal-shell.tsx');
const UI_COMPONENTS_PATH = resolve(__dirname, '../manage-assets-ui.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

function readUIComponents(): string {
  return readFileSync(UI_COMPONENTS_PATH, 'utf-8');
}

describe('ManageAssetsModalShell - Static Design Validation', () => {
  it('should exist as a shared shell component', () => {
    expect(existsSync(COMPONENT_PATH)).toBe(true);
  });

  it('should use semantic brutalist shell tokens', () => {
    const code = readComponent();
    expect(code).toMatch(/bg-card/);
    expect(code).toMatch(/bg-paper/);
    expect(code).toMatch(/shadow-brutalist/);
    expect(code).toMatch(/text-ink/);
  });

  it('should not contain slate or indigo classes', () => {
    const code = readComponent();
    expect(code).not.toMatch(/(?<![a-z])slate-/);
    expect(code).not.toContain('indigo-');
  });
});

describe('ManageAssetsStatusPanel - Accessibility Compliance', () => {
  it('should use --warning token for warning tone, not --acid (WCAG AA compliance)', () => {
    const code = readUIComponents();

    // Per DESIGN_SYSTEM.md v1.3.0:
    // --acid has 1.4:1 contrast (fails WCAG AA)
    // --warning has 5.2:1 contrast (passes WCAG AA)
    expect(code).toMatch(/warning.*border-warning/);
    expect(code).not.toMatch(/warning.*border-acid/);
  });

  it('should not use acid color for any status or warning contexts', () => {
    const code = readUIComponents();

    // Acid is DECORATIVE ONLY per design system
    // It should never appear in toneClasses for status/warning
    const toneClassesMatch = code.match(/toneClasses\s*=\s*\{[^}]+\}/);
    expect(toneClassesMatch).not.toBeNull();

    const toneClasses = toneClassesMatch![0];
    expect(toneClasses).not.toContain('acid');
  });
});
