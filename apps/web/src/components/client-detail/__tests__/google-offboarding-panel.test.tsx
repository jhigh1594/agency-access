import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockPrepareOffboarding = vi.fn();
const mockConfirmOffboarding = vi.fn();
const mockGetOffboardingRun = vi.fn();
const mockRetryOffboardingRun = vi.fn();
const mockAttestOffboardingItem = vi.fn();
const mockGetToken = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
  }),
}));

vi.mock('@/lib/api/client-offboarding', () => ({
  prepareOffboarding: (...args: any[]) => mockPrepareOffboarding(...args),
  confirmOffboarding: (...args: any[]) => mockConfirmOffboarding(...args),
  getOffboardingRun: (...args: any[]) => mockGetOffboardingRun(...args),
  retryOffboardingRun: (...args: any[]) => mockRetryOffboardingRun(...args),
  attestOffboardingItem: (...args: any[]) => mockAttestOffboardingItem(...args),
}));

import { GoogleOffboardingPanel } from '../GoogleOffboardingPanel';

function renderWithProviders(ui: ReactNode, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnMount: false, refetchInterval: false },
      mutations: { retry: false },
    },
  });
}

const PREPARE_SUCCESS = {
  data: {
    runId: 'run-1',
    capabilityToken: 'cap-token-abc',
    items: [
      {
        id: 'item-ads',
        product: 'google_ads',
        productName: 'Google Ads',
        classification: 'eligible_automatic' as const,
        description: 'Revoke manager access to Google Ads accounts',
      },
      {
        id: 'item-ga4',
        product: 'ga4',
        productName: 'Google Analytics 4',
        classification: 'eligible_automatic' as const,
        description: 'Remove property access',
      },
      {
        id: 'item-scv',
        product: 'google_search_console',
        productName: 'Search Console',
        classification: 'manual_action_required' as const,
        description: 'Remove site verification — requires manual confirmation',
      },
      {
        id: 'item-gmc',
        product: 'google_merchant_center',
        productName: 'Merchant Center',
        classification: 'reconnect_required' as const,
        description: 'Reconnect required to revoke',
      },
    ],
  },
};

const CONFIRM_RUN_EXECUTING = {
  data: {
    id: 'run-1',
    connectionId: 'conn-1',
    status: 'executing' as const,
    items: [],
    startedAt: new Date().toISOString(),
  },
};

const RUN_COMPLETED_MIXED = {
  data: {
    id: 'run-1',
    connectionId: 'conn-1',
    status: 'completed_with_manual_follow_up' as const,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-ads',
        product: 'google_ads',
        productName: 'Google Ads',
        status: 'revoked_verified' as const,
        outcome: 'Access revoked for 3 accounts',
        secretCleanupResult: 'deleted' as const,
      },
      {
        id: 'item-ga4',
        product: 'ga4',
        productName: 'Google Analytics 4',
        status: 'already_absent' as const,
        outcome: 'Property access already absent',
        secretCleanupResult: 'already_absent' as const,
      },
      {
        id: 'item-scv',
        product: 'google_search_console',
        productName: 'Search Console',
        status: 'attestation_recorded' as const,
        outcome: 'Ownership delegation removed; manual verification cleanup needed',
        nextAction: 'Remove site from Search Console settings manually',
        verificationMethod: 'human_reported' as const,
      },
      {
        id: 'item-gmc',
        product: 'google_merchant_center',
        productName: 'Merchant Center',
        status: 'failed_terminal' as const,
        outcome: 'Could not revoke — account not accessible',
        nextAction: 'Contact Google Merchant Center support',
      },
    ],
  },
};

const RUN_EXECUTING_PENDING_RETRY = {
  data: {
    id: 'run-2',
    connectionId: 'conn-1',
    status: 'executing' as const,
    items: [
      {
        id: 'item-ads',
        product: 'google_ads',
        productName: 'Google Ads',
        status: 'awaiting_client_approval' as const,
        nextAction: 'Client must approve access removal in their Google Ads settings',
      },
      {
        id: 'item-ga4',
        product: 'ga4',
        productName: 'Google Analytics 4',
        status: 'failed_retryable' as const,
        outcome: 'Temporary API error',
      },
    ],
    startedAt: new Date().toISOString(),
  },
};

const CONFIRM_RUN2_EXECUTING = {
  data: {
    id: 'run-2',
    connectionId: 'conn-1',
    status: 'executing' as const,
    items: RUN_EXECUTING_PENDING_RETRY.data.items,
    startedAt: new Date().toISOString(),
  },
};

describe('GoogleOffboardingPanel', () => {
  beforeEach(() => {
    mockPrepareOffboarding.mockReset();
    mockConfirmOffboarding.mockReset();
    mockGetOffboardingRun.mockReset();
    mockRetryOffboardingRun.mockReset();
    mockAttestOffboardingItem.mockReset();
    mockGetToken.mockResolvedValue('test-token');
  });

  it('renders selection state with Begin Offboarding button', () => {
    const qc = buildQueryClient();
    renderWithProviders(
      <GoogleOffboardingPanel
        agencyId="agency-1"
        connectionId="conn-1"
        connectionLabel="Q1 Performance Access"
      />,
      qc,
    );

    expect(screen.getByRole('button', { name: /begin offboarding/i })).toBeInTheDocument();
    expect(screen.getByText(/Q1 Performance Access/)).toBeInTheDocument();
  });

  it('shows all items with classification badges after prepare succeeds', async () => {
    const user = userEvent.setup();
    const qc = buildQueryClient();
    mockPrepareOffboarding.mockResolvedValue(PREPARE_SUCCESS);

    renderWithProviders(
      <GoogleOffboardingPanel
        agencyId="agency-1"
        connectionId="conn-1"
        connectionLabel="Q1 Access"
      />,
      qc,
    );

    await user.click(screen.getByRole('button', { name: /begin offboarding/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Automatic').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Manual action required')).toBeInTheDocument();
    expect(screen.getByText('Reconnect required')).toBeInTheDocument();
    expect(screen.getByText('Google Ads')).toBeInTheDocument();
    expect(screen.getByText('Search Console')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm offboarding/i })).toBeInTheDocument();
  });

  it('API errors render recoverable error state', async () => {
    const user = userEvent.setup();
    const qc = buildQueryClient();
    mockPrepareOffboarding.mockResolvedValue({
      error: { code: 'UPSTREAM_ERROR', message: 'Google API unavailable' },
    });

    renderWithProviders(
      <GoogleOffboardingPanel
        agencyId="agency-1"
        connectionId="conn-1"
        connectionLabel="Q1 Access"
      />,
      qc,
    );

    await user.click(screen.getByRole('button', { name: /begin offboarding/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
    expect(screen.getByText('Google API unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('GoogleOffboardingPanel — full flow receipt rendering', () => {
  beforeEach(() => {
    mockPrepareOffboarding.mockReset();
    mockConfirmOffboarding.mockReset();
    mockGetOffboardingRun.mockReset();
    mockRetryOffboardingRun.mockReset();
    mockAttestOffboardingItem.mockReset();
    mockGetToken.mockResolvedValue('test-token');
    mockPrepareOffboarding.mockResolvedValue(PREPARE_SUCCESS);
    mockConfirmOffboarding.mockResolvedValue(CONFIRM_RUN_EXECUTING);
    mockGetOffboardingRun.mockResolvedValue(RUN_COMPLETED_MIXED);
  });

  it('receipt shows affected asset names, status badges, and next actions without token/secret fields', async () => {
    const user = userEvent.setup();
    const qc = buildQueryClient();

    renderWithProviders(
      <GoogleOffboardingPanel
        agencyId="agency-1"
        connectionId="conn-1"
        connectionLabel="Q1 Access"
      />,
      qc,
    );

    await user.click(screen.getByRole('button', { name: /begin offboarding/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Automatic').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getByRole('button', { name: /confirm offboarding/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm offboarding$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^confirm offboarding$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Follow-up Required/)).toBeInTheDocument();
    });

    expect(screen.getByText('Google Ads')).toBeInTheDocument();
    expect(screen.getByText('Google Analytics 4')).toBeInTheDocument();
    expect(screen.getByText('Search Console')).toBeInTheDocument();
    expect(screen.getByText('Merchant Center')).toBeInTheDocument();
    expect(screen.getAllByText('Revoked & verified').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Already absent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText(/Remove site from Search Console settings/)).toBeInTheDocument();
    expect(screen.getByText(/Contact Google Merchant Center support/)).toBeInTheDocument();
    expect(screen.getByText('Human-reported')).toBeInTheDocument();
    expect(screen.getAllByText(/Secret cleanup:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/cap-token/)).not.toBeInTheDocument();
  });

  it('Search Console human-reported item shows Attest button', async () => {
    const user = userEvent.setup();
    const qc = buildQueryClient();

    renderWithProviders(
      <GoogleOffboardingPanel
        agencyId="agency-1"
        connectionId="conn-1"
        connectionLabel="Q1 Access"
      />,
      qc,
    );

    await user.click(screen.getByRole('button', { name: /begin offboarding/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Automatic').length).toBeGreaterThanOrEqual(1);
    });
    await user.click(screen.getByRole('button', { name: /confirm offboarding/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm offboarding$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^confirm offboarding$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Follow-up Required/)).toBeInTheDocument();
    });

    const attestButtons = screen.getAllByRole('button', { name: /^attest$/i });
    expect(attestButtons.length).toBeGreaterThan(0);
  });

  it('pending Ads approval + retryable error show guidance while cleanup blocked', async () => {
    const user = userEvent.setup();
    const qc = buildQueryClient();
    mockConfirmOffboarding.mockResolvedValue(CONFIRM_RUN2_EXECUTING);
    mockGetOffboardingRun.mockResolvedValue(RUN_EXECUTING_PENDING_RETRY);

    renderWithProviders(
      <GoogleOffboardingPanel
        agencyId="agency-1"
        connectionId="conn-1"
        connectionLabel="Q1 Access"
      />,
      qc,
    );

    await user.click(screen.getByRole('button', { name: /begin offboarding/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Automatic').length).toBeGreaterThanOrEqual(1);
    });
    await user.click(screen.getByRole('button', { name: /confirm offboarding/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^confirm offboarding$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^confirm offboarding$/i }));

    await waitFor(() => {
      expect(screen.getByText('Pending external approval')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
