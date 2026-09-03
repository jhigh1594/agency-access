import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render } from '@testing-library/react';
import { Button } from '../button';

const COMPONENT_PATH = join(__dirname, '..', 'button.tsx');
const source = readFileSync(COMPONENT_PATH, 'utf-8');

/**
 * v2.0 button contract: five variants (primary, secondary, ghost, danger,
 * brutalist), binary radius (square buttons; icon keeps its circle), and a
 * two-ring focus system derived from the accent.
 */
describe('Button v2.0 variant consolidation', () => {
  it('declares exactly the five v2.0 variants', () => {
    const declared = [...source.matchAll(/^\s{6}([a-z-]+): '/gm)]
      .map(m => m[1])
      .filter(k => ['primary', 'secondary', 'success', 'warning', 'danger', 'ghost', 'brutalist', 'brutalist-ghost', 'brutalist-rounded', 'brutalist-ghost-rounded'].includes(k));
    expect(declared.sort()).toEqual(['brutalist', 'danger', 'ghost', 'primary', 'secondary']);
  });

  it('no longer declares deprecated variants in the type', () => {
    expect(source).not.toContain("'brutalist-ghost'");
    expect(source).not.toContain("'brutalist-rounded'");
    expect(source).not.toContain("'brutalist-ghost-rounded'");
    expect(source).not.toContain("'success'");
    expect(source).not.toContain("'warning'");
  });

  it('renders danger visually distinct from primary', () => {
    const { container: primary } = render(<Button variant="primary">x</Button>);
    const { container: danger } = render(<Button variant="danger">x</Button>);
    const primaryCls = primary.firstElementChild?.className ?? '';
    const dangerCls = danger.firstElementChild?.className ?? '';
    expect(dangerCls).toContain('bg-danger-ink');
    expect(primaryCls).not.toContain('bg-danger-ink');
    expect(dangerCls).not.toBe(primaryCls);
  });

  it('keeps square corners on standard sizes (binary radius)', () => {
    const { container } = render(<Button variant="primary">x</Button>);
    const cls = container.firstElementChild?.className ?? '';
    expect(cls).not.toMatch(/rounded-(sm|md|lg|xl|2xl)/);
  });

  it('keeps the icon size circular', () => {
    const { container } = render(<Button variant="primary" size="icon" aria-label="close">x</Button>);
    const cls = container.firstElementChild?.className ?? '';
    expect(cls).toContain('rounded-full');
  });

  it('uses the accent-derived two-ring focus system', () => {
    const { container } = render(<Button variant="primary">x</Button>);
    const cls = container.firstElementChild?.className ?? '';
    expect(cls).toContain('focus-visible:outline-[3px]');
    expect(cls).toContain('focus-visible:outline-coral/25');
    expect(cls).toContain('focus-visible:[box-shadow:0_0_0_6px_rgb(var(--primary)/0.08)]');
  });
});
