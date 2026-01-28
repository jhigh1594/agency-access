import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinterestBusinessSettings } from '../pinterest-business-settings';

describe('PinterestBusinessSettings', () => {
  it('should display Business ID when present', () => {
    render(
      <PinterestBusinessSettings
        agencyId="test-agency"
        businessId="664351519939856629"
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('664351519939856629')).toBeInTheDocument();
    expect(screen.getByText('Pinterest Business ID')).toBeInTheDocument();
  });

  it('should show add button when no Business ID', () => {
    render(
      <PinterestBusinessSettings
        agencyId="test-agency"
        businessId={undefined}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();
    expect(screen.getByText('No Business ID set')).toBeInTheDocument();
  });

  it('should show deep link to Pinterest Business Manager', () => {
    render(
      <PinterestBusinessSettings
        agencyId="test-agency"
        businessId="664351519939856629"
        onUpdate={vi.fn()}
      />
    );

    const link = screen.getByRole('link', { name: /View in Business Manager/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('pinterest.com'));
  });
});
