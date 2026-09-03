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
