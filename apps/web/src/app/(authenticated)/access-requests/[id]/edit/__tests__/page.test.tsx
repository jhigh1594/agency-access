import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditAccessRequestPage from '../page';
import * as accessRequestsApi from '@/lib/api/access-requests';

const pushMock = vi.fn();
const getTokenMock = vi.fn().mockResolvedValue('token-123');
const routerMock = { push: pushMock };

function renderEdit(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditAccessRequestPage params={Promise.resolve({ id })} />
    </QueryClientProvider>
  );
}

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: getTokenMock,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@/lib/api/access-requests', () => ({
  getAccessRequest: vi.fn(),
  updateAccessRequest: vi.fn(),
}));

describe('EditAccessRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTokenMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        return {
          ok: true,
          json: async () => ({
            data: url.includes('/meta/destinations')
              ? [{ id: 'destination-ready', name: 'Agency Portfolio', businessId: 'biz-1', readinessStatus: 'ready', isDefault: true }]
              : [{ platform: 'meta', status: 'active', agencyEmail: 'ops@agency.com' }],
          }),
        } as Response;
      })
    );
  });

  it('renders request-configuration fields and client profile guidance', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ platform: 'beehiiv', status: 'active', agencyEmail: 'ops@agency.com' }],
        }),
      })
    );

    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-1',
        agencyId: 'agency-1',
        clientId: 'client-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        status: 'pending',
        uniqueToken: 'token-1',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [],
        intakeFields: [{ id: '1', label: 'Website', type: 'url', required: true, order: 0 }],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });

    renderEdit('request-1');

    expect(await screen.findByText('Edit Access Request')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /show advanced settings/i }));
    expect(screen.getByText(/client name and email are managed in the client profile/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit client profile/i })).toBeInTheDocument();
    expect(await screen.findByText('Beehiiv')).toBeInTheDocument();
    expect(screen.queryByText('Meta')).not.toBeInTheDocument();
  });

  it('redirects to detail page when request is non-editable', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-2',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        status: 'completed',
        uniqueToken: 'token-2',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [],
        intakeFields: [],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });

    renderEdit('request-2');

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/access-requests/request-2');
    });
  });

  it('submits request configuration updates and shows success state', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-3',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        externalReference: 'crm-initial',
        status: 'pending',
        uniqueToken: 'token-3',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_ads', accessLevel: 'admin', accounts: [] }],
          },
        ],
        intakeFields: [{ id: '1', label: 'Website', type: 'url', required: true, order: 0 }],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });
    vi.mocked(accessRequestsApi.updateAccessRequest).mockResolvedValue({
      data: {
        id: 'request-3',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        externalReference: 'crm-updated',
        status: 'pending',
        uniqueToken: 'token-3',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_ads', accessLevel: 'standard', accounts: [] }],
          },
        ],
        intakeFields: [{ id: '1', label: 'Business Website', type: 'url', required: true, order: 0 }],
        branding: { primaryColor: '#00AA55' },
        authorizationLinkChanged: false,
      } as any,
    });

    renderEdit('request-3');

    await screen.findByText('Edit Access Request');
    await userEvent.click(screen.getByRole('button', { name: /show advanced settings/i }));

    fireEvent.change(screen.getByLabelText('External Reference'), { target: { value: 'crm-updated' } });
    fireEvent.change(screen.getByDisplayValue('Website'), { target: { value: 'Business Website' } });
    fireEvent.change(screen.getByLabelText('Primary Color'), { target: { value: '#00AA55' } });
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(accessRequestsApi.updateAccessRequest).toHaveBeenCalledWith(
        'request-3',
        expect.objectContaining({
          externalReference: 'crm-updated',
          platforms: expect.any(Array),
          intakeFields: expect.arrayContaining([
            expect.objectContaining({ label: 'Business Website' }),
          ]),
          branding: expect.objectContaining({ primaryColor: '#00AA55' }),
        }),
        expect.any(Function)
      );
    });
    expect(screen.getByText(/request updated\./i)).toBeInTheDocument();
  });

  it('shows loading on Save immediately while update is pending', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-4',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        status: 'pending',
        uniqueToken: 'token-4',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_ads', accessLevel: 'admin', accounts: [] }],
          },
        ],
        intakeFields: [],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });

    let resolveSave!: (value: Awaited<ReturnType<typeof accessRequestsApi.updateAccessRequest>>) => void;
    vi.mocked(accessRequestsApi.updateAccessRequest).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );

    renderEdit('request-4');

    await screen.findByText('Edit Access Request');
    await userEvent.click(screen.getByTestId('edit-access-request-save'));

    const saveBtn = screen.getByTestId('edit-access-request-save');
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveAttribute('aria-busy', 'true');

    resolveSave!({
      data: {
        id: 'request-4',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        status: 'pending',
        uniqueToken: 'token-4',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_ads', accessLevel: 'admin', accounts: [] }],
          },
        ],
        intakeFields: [],
        branding: { primaryColor: '#FF6B35' },
        authorizationLinkChanged: false,
      } as any,
    });

    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });
  });

  it('keeps a legacy Meta request legacy when saving unrelated edits', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-legacy',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        externalReference: 'old-reference',
        status: 'pending',
        uniqueToken: 'token-legacy',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [{
          platformGroup: 'meta',
          products: [{ product: 'meta_ads', accessLevel: 'admin', accounts: [] }],
        }],
        intakeFields: [],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });
    vi.mocked(accessRequestsApi.updateAccessRequest).mockResolvedValue({
      data: { id: 'request-legacy', status: 'pending', authorizationLinkChanged: false } as any,
    });

    renderEdit('request-legacy');

    expect(await screen.findByText('Legacy Meta request')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /show advanced settings/i }));
    fireEvent.change(screen.getByLabelText('External Reference'), { target: { value: 'new-reference' } });
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(accessRequestsApi.updateAccessRequest).toHaveBeenCalled());
    const payload = vi.mocked(accessRequestsApi.updateAccessRequest).mock.calls[0][1] as any;
    expect(payload.externalReference).toBe('new-reference');
    expect(payload).not.toHaveProperty('metaAccess');
  });

  it('requires an explicit recipe preview confirmation before converting a legacy Meta request', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-convert',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        status: 'pending',
        uniqueToken: 'token-convert',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [{
          platformGroup: 'meta',
          products: [{ product: 'meta_ads', accessLevel: 'admin', accounts: [] }],
        }],
        intakeFields: [],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });
    vi.mocked(accessRequestsApi.updateAccessRequest).mockResolvedValue({
      data: { id: 'request-convert', status: 'pending', authorizationLinkChanged: false } as any,
    });

    renderEdit('request-convert');

    await userEvent.click(await screen.findByRole('button', { name: /convert to outcome-based meta access/i }));
    await userEvent.click(await screen.findByRole('button', { name: /run meta ads/i }));
    expect(screen.getByText('Requirements-change preview')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/confirm the Meta requirements change/i)).toBeInTheDocument();
    expect(accessRequestsApi.updateAccessRequest).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: /i confirm this replaces/i }));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(accessRequestsApi.updateAccessRequest).toHaveBeenCalledWith(
        'request-convert',
        expect.objectContaining({
          metaAccess: { recipeId: 'meta_run_ads', destinationId: 'destination-ready' },
        }),
        expect.any(Function)
      );
    });
  });

  it('loads and preserves an existing outcome snapshot without a conversion confirmation', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-outcome',
        agencyId: 'agency-1',
        clientName: 'Acme',
        clientEmail: 'owner@acme.com',
        status: 'pending',
        uniqueToken: 'token-outcome',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [{
          platformGroup: 'meta',
          products: [{ product: 'meta_ads', accessLevel: 'standard', accounts: [] }],
        }],
        metaAccessConfig: {
          recipeId: 'meta_run_ads',
          recipeVersion: 1,
          destinationId: 'destination-ready',
          requirements: [],
        },
        intakeFields: [],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });
    vi.mocked(accessRequestsApi.updateAccessRequest).mockResolvedValue({
      data: { id: 'request-outcome', status: 'pending', authorizationLinkChanged: false } as any,
    });

    renderEdit('request-outcome');

    expect(await screen.findByRole('button', { name: /run meta ads/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Requirements-change preview')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(accessRequestsApi.updateAccessRequest).toHaveBeenCalledWith(
        'request-outcome',
        expect.objectContaining({
          metaAccess: { recipeId: 'meta_run_ads', destinationId: 'destination-ready' },
        }),
        expect.any(Function)
      );
    });
  });
});
