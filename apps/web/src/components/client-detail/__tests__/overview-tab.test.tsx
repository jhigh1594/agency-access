import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OverviewTab } from '../OverviewTab';

describe('OverviewTab', () => {
  it('shows requested access summary before access request history', () => {
    render(
      <OverviewTab
        platformGroups={[
          {
            platformGroup: 'meta',
            status: 'connected',
            fulfilledCount: 1,
            requestedCount: 1,
            latestRequestId: 'request-1',
            latestRequestName: 'Initial setup',
            latestRequestedAt: new Date('2026-03-08T00:00:00.000Z'),
            products: [{ product: 'meta_ads', status: 'connected' }],
          },
        ]}
        accessRequests={[
          {
            id: 'request-1',
            name: 'Initial setup',
            platforms: ['meta_ads'],
            status: 'completed',
            createdAt: new Date('2026-03-08T00:00:00.000Z'),
            authorizedAt: new Date('2026-03-08T01:00:00.000Z'),
            connectionStatus: 'active',
          },
        ]}
      />
    );

    const requestedAccessHeading = screen.getByText(/requested access/i);
    const accessRequestsHeading = screen.getByText(/^access requests$/i);

    expect(
      requestedAccessHeading.compareDocumentPosition(accessRequestsHeading)
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
