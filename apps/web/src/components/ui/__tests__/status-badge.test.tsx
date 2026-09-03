import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge subscription statuses', () => {
  it.each([
    ['incomplete', 'Incomplete'],
    ['incomplete_expired', 'Incomplete Expired'],
    ['trialing', 'Trialing'],
  ])('renders %s as a known status', (status, label) => {
    render(<StatusBadge status={status as any} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });
});

/**
 * v2.0 contrast contract: status TEXT must clear WCAG AA (4.5:1) on its ground.
 * Raw teal (#00A896) as text on white measures ~3.0:1; raw coral (#FF6B35) ~2.9:1.
 * Text carries the darkened ink tokens; raw teal/coral are fills and borders only.
 */
describe('StatusBadge AA contrast contract (v2.0)', () => {
  const badgeClasses = (status: string) => {
    const { container } = render(<StatusBadge status={status as any} />);
    return container.firstElementChild?.className ?? '';
  };

  it.each(['authorized', 'active', 'healthy'])(
    'renders %s text with success-ink, not raw teal',
    (status) => {
      const classes = badgeClasses(status);
      expect(classes).toContain('text-success-ink');
      expect(classes).not.toContain('text-teal');
      // fill stays in the teal family
      expect(classes).toContain('bg-teal/10');
    }
  );

  it.each(['expired', 'revoked', 'invalid', 'incomplete_expired'])(
    'renders %s text with danger-ink, not raw coral',
    (status) => {
      const classes = badgeClasses(status);
      expect(classes).toContain('text-danger-ink');
      expect(classes).not.toContain('text-coral');
      // fill stays in the coral family
      expect(classes).toContain('bg-coral/10');
    }
  );

  it('renders the success variant with success-ink text', () => {
    const { container } = render(<StatusBadge badgeVariant="success">Done</StatusBadge>);
    const classes = container.firstElementChild?.className ?? '';
    expect(classes).toContain('text-success-ink');
    expect(classes).not.toContain('text-teal');
  });

  it('keeps warning states on the accessible warning token', () => {
    const classes = badgeClasses('pending');
    expect(classes).toContain('text-warning');
    expect(classes).not.toContain('text-teal');
    expect(classes).not.toContain('text-coral');
  });

  it('declares light-mode ink tokens that clear AA (>= 4.5:1) on white', () => {
    // src/app/globals.css, resolved from this test's directory
    const globalsPath = join(__dirname, '../../../app/globals.css');
    const globals = readFileSync(globalsPath, 'utf-8');
    // Light mode comes first: everything before the .dark block is :root.
    const rootBlock = globals.slice(0, globals.indexOf('.dark'));

    const parseInk = (token: string): [number, number, number] => {
      const match = rootBlock.match(new RegExp(`--${token}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`));
      if (!match) throw new Error(`missing --${token} in the :root block of globals.css`);
      return [Number(match[1]), Number(match[2]), Number(match[3])];
    };

    const srgbToLinear = (value: number) => {
      const channel = value / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    const contrastOnWhite = ([r, g, b]: [number, number, number]) => {
      const luminance =
        0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
      return 1.05 / (luminance + 0.05);
    };

    for (const token of ['success-ink', 'danger-ink']) {
      const ratio = contrastOnWhite(parseInk(token));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
