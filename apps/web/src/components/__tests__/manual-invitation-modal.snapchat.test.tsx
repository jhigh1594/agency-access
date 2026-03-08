import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManualInvitationModal } from '../manual-invitation-modal';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('test-token'),
  }),
}));

describe('ManualInvitationModal - Snapchat', () => {
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
          platform="snapchat"
          agencyId="agency-1"
        />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  });

  it('renders Snapchat business email copy', () => {
    renderWithQueryClient();

    expect(screen.getByText(/snapchat business email/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/this email will be given access to your client's snapchat accounts/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/clients will use this email twice/i)
    ).toBeInTheDocument();
  });

  it('submits Snapchat manual connect with invitation email', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { success: true }, error: null }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient();

    fireEvent.change(screen.getByRole('textbox', { name: /snapchat business email/i }), {
      target: { value: 'snap@agency.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/agency-platforms/snapchat/manual-connect'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ agencyId: 'agency-1', invitationEmail: 'snap@agency.com' }),
        })
      );
    });
  });
});
