import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManualInvitationModal } from '../manual-invitation-modal';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('test-token'),
  }),
}));

describe('ManualInvitationModal - Shopify', () => {
  const renderWithQueryClient = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ManualInvitationModal
          isOpen={true}
          onClose={vi.fn()}
          platform="shopify"
          agencyId="agency-1"
        />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  });

  it('renders Shopify connect as info-only flow without entry inputs', async () => {
    renderWithQueryClient();

    expect(screen.getByText(/enable shopify for access requests/i)).toBeInTheDocument();
    expect(screen.getByText(/client enters store details in the invite flow/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email to receive invitations/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pinterest business id/i)).not.toBeInTheDocument();
  });

  it('submits Shopify connect payload with agencyId only', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { success: true }, error: null }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient();

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/agency-platforms/shopify/manual-connect'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ agencyId: 'agency-1' }),
        })
      );
    });
  });
});
