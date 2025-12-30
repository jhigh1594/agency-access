import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgencyMetaAssetSelector } from '../agency-meta/AgencyMetaAssetSelector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AgencyMetaAssetSelector', () => {
  const defaultProps = {
    businessId: 'biz-1',
    businessName: 'Test Business',
    onSelectionChange: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should show loading state while fetching assets', async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<AgencyMetaAssetSelector {...defaultProps} />, { wrapper });

    expect(screen.getByText(/Loading Meta assets/i)).toBeInTheDocument();
  });

  it('should render asset sections after loading', async () => {
    const mockAssets = {
      data: {
        businessId: 'biz-1',
        businessName: 'Test Business',
        adAccounts: [{ id: 'act_1', name: 'Ad Account 1', accountStatus: 'ACTIVE', currency: 'USD' }],
        pages: [{ id: 'page_1', name: 'Page 1', category: 'Test', tasks: ['ADVERTISE'] }],
        instagramAccounts: [],
        productCatalogs: [],
      },
      error: null,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockAssets,
    } as Response);

    render(<AgencyMetaAssetSelector {...defaultProps} />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/Loading Meta assets/i)).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /Ad Accounts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Pages/i })).toBeInTheDocument();
    expect(screen.getByText('Ad Account 1')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('should select an asset when clicked', async () => {
    const user = userEvent.setup();
    const mockAssets = {
      data: {
        businessId: 'biz-1',
        businessName: 'Test Business',
        adAccounts: [{ id: 'act_1', name: 'Ad Account 1', accountStatus: 'ACTIVE', currency: 'USD' }],
        pages: [],
        instagramAccounts: [],
        productCatalogs: [],
      },
      error: null,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockAssets,
    } as Response);

    render(<AgencyMetaAssetSelector {...defaultProps} />, { wrapper });

    await waitFor(() => screen.getByText('Ad Account 1'));

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ assetId: 'act_1', selected: true }),
      ])
    );
  });
});

