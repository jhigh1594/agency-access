import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequestPlatformsCard } from '../request-platforms-card';

vi.mock('../shopify-submission-panel', () => ({
  ShopifySubmissionPanel: () => <div>Shopify Submission Panel</div>,
}));

describe('RequestPlatformsCard', () => {
  it('shows unresolved requested products when authorization progress includes follow-up items', () => {
    render(
      <RequestPlatformsCard
        request={{
          id: 'request-1',
          agencyId: 'agency-1',
          clientName: 'Client',
          clientEmail: 'client@example.com',
          platforms: [
            {
              platformGroup: 'google',
              products: [{ product: 'google_ads', accessLevel: 'admin', accounts: [] }],
            },
          ],
          status: 'partial',
          uniqueToken: 'token-123',
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorizationProgress: {
            completedPlatforms: [],
            isComplete: false,
            fulfilledProducts: [],
            unresolvedProducts: [
              {
                product: 'google_ads',
                platformGroup: 'google',
                reason: 'no_assets',
              },
            ],
          },
        }}
      />
    );

    expect(screen.getByText(/still needs follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/google ads · no assets found/i)).toBeInTheDocument();
  });
});
