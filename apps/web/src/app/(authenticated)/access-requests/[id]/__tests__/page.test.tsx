import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AccessRequestDetailPage from '../page';
import * as accessRequestsApi from '@/lib/api/access-requests';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('token-123'),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/api/access-requests', () => ({
  getAccessRequest: vi.fn(),
  getAuthorizationUrl: vi.fn((request: any) => `https://app.authhub.co/invite/${request.uniqueToken}`),
}));

describe('AccessRequestDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editable actions for pending requests', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-1',
        agencyId: 'agency-1',
        clientName: 'Acme Client',
        clientEmail: 'owner@acme.com',
        authModel: 'delegated_access',
        status: 'pending',
        uniqueToken: 'token-123',
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

    render(<AccessRequestDetailPage params={Promise.resolve({ id: 'request-1' })} />);

    expect(await screen.findByText('Access Request Details')).toBeInTheDocument();
    expect(screen.getByText('Acme Client')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit request/i })).toHaveAttribute('href', '/access-requests/request-1/edit');
  });

  it('renders replacement action for completed requests', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-2',
        agencyId: 'agency-1',
        clientName: 'Completed Client',
        clientEmail: 'done@acme.com',
        authModel: 'delegated_access',
        status: 'completed',
        uniqueToken: 'token-456',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [],
        intakeFields: [],
        branding: { primaryColor: '#FF6B35' },
      } as any,
    });

    render(<AccessRequestDetailPage params={Promise.resolve({ id: 'request-2' })} />);

    await screen.findByText('Access Request Details');
    expect(screen.queryByRole('link', { name: /edit request/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create new request from this/i })).toBeInTheDocument();
  });

  it('renders recovery state when request load fails', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      error: {
        code: 'NOT_FOUND',
        message: 'Access request not found',
      },
    } as any);

    render(<AccessRequestDetailPage params={Promise.resolve({ id: 'missing' })} />);

    await waitFor(() => {
      expect(screen.getByText('Request Not Found')).toBeInTheDocument();
    });
    expect(screen.getByText('Access request not found')).toBeInTheDocument();
  });

  it('renders Shopify submission details when client has submitted store info', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-3',
        agencyId: 'agency-1',
        clientName: 'Shopify Client',
        clientEmail: 'ops@shopclient.com',
        authModel: 'client_authorization',
        status: 'partial',
        uniqueToken: 'token-789',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [
          {
            platformGroup: 'shopify',
            products: [{ product: 'shopify', accessLevel: 'admin', accounts: [] }],
          },
        ],
        shopifySubmission: {
          status: 'submitted',
          shopDomain: 'littlestore.myshopify.com',
          collaboratorCode: '1234',
          submittedAt: '2026-03-03T00:00:00.000Z',
        },
      } as any,
    });

    render(<AccessRequestDetailPage params={Promise.resolve({ id: 'request-3' })} />);

    expect(await screen.findByText('Shopify Submission')).toBeInTheDocument();
    expect(screen.getByText('littlestore.myshopify.com')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('renders Shopify re-confirmation guidance for legacy unreadable submissions', async () => {
    vi.mocked(accessRequestsApi.getAccessRequest).mockResolvedValue({
      data: {
        id: 'request-4',
        agencyId: 'agency-1',
        clientName: 'Legacy Shopify Client',
        clientEmail: 'owner@legacy.com',
        authModel: 'client_authorization',
        status: 'partial',
        uniqueToken: 'token-999',
        expiresAt: '2026-03-14T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        platforms: [
          {
            platformGroup: 'shopify',
            products: [{ product: 'shopify', accessLevel: 'admin', accounts: [] }],
          },
        ],
        shopifySubmission: {
          status: 'legacy_unreadable',
          shopDomain: 'legacy-store.myshopify.com',
        },
      } as any,
    });

    render(<AccessRequestDetailPage params={Promise.resolve({ id: 'request-4' })} />);

    expect(await screen.findByText('Client Re-confirmation Needed')).toBeInTheDocument();
    expect(screen.getByText('legacy-store.myshopify.com')).toBeInTheDocument();
  });
});
