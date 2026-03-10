import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RequestedAccessBoard } from '../RequestedAccessBoard';

describe('RequestedAccessBoard', () => {
  it('renders platform-group progress and expands product details', async () => {
    const user = userEvent.setup();

    render(
      <RequestedAccessBoard
        platformGroups={[
          {
            platformGroup: 'google',
            status: 'needs_follow_up',
            fulfilledCount: 4,
            requestedCount: 5,
            latestRequestId: 'request-1',
            latestRequestName: 'Q1 access refresh',
            latestRequestedAt: new Date('2026-03-08T00:00:00.000Z'),
            products: [
              { product: 'google_ads', status: 'connected' },
              { product: 'ga4', status: 'connected' },
              { product: 'google_tag_manager', status: 'connected' },
              { product: 'google_search_console', status: 'connected' },
              { product: 'google_merchant_center', status: 'no_assets', note: 'No assets found' },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText(/requested access/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/5 connected/i)).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /expand google details/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/google merchant center/i)).toBeInTheDocument();
    expect(screen.getByText('No assets found')).toBeInTheDocument();
  });
});
