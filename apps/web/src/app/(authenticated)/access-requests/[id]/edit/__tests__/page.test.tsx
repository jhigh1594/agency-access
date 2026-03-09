import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditAccessRequestPage from '../page';
import * as accessRequestsApi from '@/lib/api/access-requests';

const pushMock = vi.fn();
const getTokenMock = vi.fn().mockResolvedValue('token-123');
const routerMock = { push: pushMock };

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
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ platform: 'google', status: 'active', agencyEmail: 'ops@agency.com' }],
        }),
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
        authModel: 'delegated_access',
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

    render(<EditAccessRequestPage params={Promise.resolve({ id: 'request-1' })} />);

    expect(await screen.findByText('Edit Access Request')).toBeInTheDocument();
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
        authModel: 'delegated_access',
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

    render(<EditAccessRequestPage params={Promise.resolve({ id: 'request-2' })} />);

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
        authModel: 'delegated_access',
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
        authModel: 'client_authorization',
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

    render(<EditAccessRequestPage params={Promise.resolve({ id: 'request-3' })} />);

    await screen.findByText('Edit Access Request');

    fireEvent.change(screen.getByLabelText('Authorization Model'), { target: { value: 'client_authorization' } });
    fireEvent.change(screen.getByLabelText('External Reference'), { target: { value: 'crm-updated' } });
    fireEvent.change(screen.getByDisplayValue('Website'), { target: { value: 'Business Website' } });
    fireEvent.change(screen.getByLabelText('Primary Color'), { target: { value: '#00AA55' } });
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(accessRequestsApi.updateAccessRequest).toHaveBeenCalledWith(
        'request-3',
        expect.objectContaining({
          authModel: 'client_authorization',
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
});
