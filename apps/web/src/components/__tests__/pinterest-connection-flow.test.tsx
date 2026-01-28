import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PinterestConnectionFlow } from '../pinterest-connection-flow';

describe('PinterestConnectionFlow', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it('should show Business ID input after successful OAuth', async () => {
    render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="success"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Pinterest Business ID')).toBeInTheDocument();
    });
  });

  it('should call API to save Business ID and then onSuccess', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { metadata: { businessId: '123456' } } }),
      } as Response)
    );

    render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="success"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    const input = await screen.findByPlaceholderText('e.g., 664351519939856629');
    const continueButton = screen.getByRole('button', { name: /Continue/i });

    await user.type(input, '123456');
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should skip Business ID and call onSuccess when Skip is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="success"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    const skipButton = await screen.findByRole('button', { name: /Skip for now/i });
    await user.click(skipButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should return null when connection status is pending', () => {
    const { container } = render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="pending"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    expect(container.firstChild).toBeNull();
  });

  it('should return null when connection status is error', () => {
    const { container } = render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="error"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    expect(container.firstChild).toBeNull();
  });
});
