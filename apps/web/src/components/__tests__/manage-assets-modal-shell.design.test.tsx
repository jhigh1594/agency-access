import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../manage-assets-modal-shell.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
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
