import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { DeleteClientModal } from '../DeleteClientModal';

const mockPush = vi.fn();
const mockGetToken = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
  }),
}));

function renderWithProviders(
  ui: ReactNode,
  queryClient: QueryClient,
) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('DeleteClientModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue('token-123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
    }));
  });

  it('removes the deleted client from cached client list queries after a successful delete', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnMount: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    const deletedClient = {
      id: 'client-1',
      name: 'Delete Me',
      company: 'Acme',
      email: 'delete@acme.com',
      platforms: [],
      status: 'none',
      connectionCount: 0,
      lastActivityAt: '2026-03-10T12:00:00.000Z',
      createdAt: '2026-03-10T12:00:00.000Z',
    };

    const keepClient = {
      ...deletedClient,
      id: 'client-2',
      name: 'Keep Me',
      email: 'keep@acme.com',
    };

    queryClient.setQueryData(['clients-with-connections', ''], {
      data: {
        data: [deletedClient, keepClient],
        pagination: { total: 2, limit: 50, offset: 0 },
      },
    });

    queryClient.setQueryData(['clients-with-connections', 'acme'], {
      data: {
        data: [deletedClient],
        pagination: { total: 1, limit: 50, offset: 0 },
      },
    });

    renderWithProviders(
      <DeleteClientModal
        client={{
          id: deletedClient.id,
          name: deletedClient.name,
          company: deletedClient.company,
          email: deletedClient.email,
        }}
        onClose={vi.fn()}
      />,
      queryClient,
    );

    await userEvent.type(
      screen.getByPlaceholderText(deletedClient.email),
      deletedClient.email,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete client/i }));

    await waitFor(() => {
      const defaultList = queryClient.getQueryData<{
        data: { data: Array<{ id: string }>; pagination: { total: number } };
      }>(['clients-with-connections', '']);
      const filteredList = queryClient.getQueryData<{
        data: { data: Array<{ id: string }>; pagination: { total: number } };
      }>(['clients-with-connections', 'acme']);

      expect(defaultList?.data.data).toEqual([expect.objectContaining({ id: keepClient.id })]);
      expect(defaultList?.data.pagination.total).toBe(1);
      expect(filteredList?.data.data).toEqual([]);
      expect(filteredList?.data.pagination.total).toBe(0);
    });
  });
});
