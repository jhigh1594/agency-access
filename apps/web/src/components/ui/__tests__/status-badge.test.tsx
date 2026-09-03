import { describe, expect, it } from 'vitest';
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
});
