import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MetaAssetSelector } from '../MetaAssetSelector';

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('@/components/ui/multi-select-combobox', () => ({
  MultiSelectCombobox: ({ placeholder }: { placeholder: string }) => <div>{placeholder}</div>,
}));

vi.mock('../AssetGroup', () => ({
  AssetGroup: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../AssetSelectorStates', () => ({
  AssetSelectorLoading: ({ message }: { message: string }) => <div>{message}</div>,
  AssetSelectorError: ({ title, message }: { title: string; message: string }) => (
    <div>
      <div>{title}</div>
      <div>{message}</div>
    </div>
  ),
}));

vi.mock('../MetaAssetCreator', () => ({
  MetaAssetCreator: ({ onSuccess }: { onSuccess: (asset: { id: string; name: string }) => void }) => (
    <button type="button" onClick={() => onSuccess({ id: 'act_new', name: 'New Account' })}>
      Meta Asset Creator
    </button>
  ),
}));

vi.mock('../MetaBusinessCreator', () => ({
  MetaBusinessCreator: ({
    onSuccess,
  }: {
    onSuccess: (business: { id: string; name: string }) => void;
  }) => (
    <button type="button" onClick={() => onSuccess({ id: 'biz_new', name: 'New Business' })}>
      Meta Business Creator
    </button>
  ),
}));

vi.mock('../MetaBusinessSetupChecklist', () => ({
  MetaBusinessSetupChecklist: ({ businessId }: { businessId: string }) => (
    <div>Setup Checklist for {businessId}</div>
  ),
}));

vi.mock('../GuidedRedirectModal', () => ({
  GuidedRedirectCard: ({ onRefresh }: { onRefresh: () => void }) => (
    <div>
      Guided Redirect
      <button type="button" onClick={onRefresh}>
        Refresh Page List
      </button>
    </div>
  ),
}));

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  } as Response;
}

function assetsResponse(overrides: Record<string, unknown> = {}): Response {
  return jsonResponse({
    data: {
      businesses: [],
      selectionRequired: false,
      selectedBusinessId: null,
      selectedBusinessName: null,
      adAccounts: [],
      pages: [],
      instagramAccounts: [],
      ...overrides,
    },
    error: null,
  });
}

function userPagesResponse(pages: Array<{ id: string; name: string }>): Response {
  return jsonResponse({ data: { pages }, error: null });
}

describe('MetaAssetSelector - zero Business Portfolio branch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
  });

  it('guides the client to create a Facebook Page when they have none, then swaps to the creator', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(assetsResponse()) // assets: zero businesses
      .mockResolvedValueOnce(userPagesResponse([])) // user pages: none yet
      .mockResolvedValueOnce(userPagesResponse([{ id: 'page-1', name: 'Acme Main' }])); // after refresh

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    expect(await screen.findByText(/no business portfolio yet/i)).toBeInTheDocument();
    expect(await screen.findByText(/Guided Redirect/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.example.com/api/client/token-1/create/meta/user-pages?connectionId=conn-1'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /refresh page list/i }));

    expect(await screen.findByText(/Meta Business Creator/i)).toBeInTheDocument();
  });

  it('renders the business creator inline when the client already has a Page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(assetsResponse())
      .mockResolvedValueOnce(userPagesResponse([{ id: 'page-1', name: 'Acme Main' }]));

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    expect(await screen.findByText(/Meta Business Creator/i)).toBeInTheDocument();
  });

  it('flows straight from business creation into the ad-account creator without a reselect journey', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(assetsResponse())
      .mockResolvedValueOnce(userPagesResponse([{ id: 'page-1', name: 'Acme Main' }]))
      .mockResolvedValueOnce(
        assetsResponse({
          businesses: [{ id: 'biz_new', name: 'New Business', verificationStatus: 'unverified' }],
          selectionRequired: false,
          selectedBusinessId: 'biz_new',
          selectedBusinessName: 'New Business',
        })
      );

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    fireEvent.click(await screen.findByText(/Meta Business Creator/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        'https://api.example.com/api/client/token-1/assets/meta_ads?connectionId=conn-1&businessId=biz_new'
      );
    });

    expect(await screen.findByText(/sharing from new business/i)).toBeInTheDocument();
    // One pass: the ad-account creator opens immediately in the new portfolio
    expect(screen.getByText(/Meta Asset Creator/i)).toBeInTheDocument();
    // The just-created business is unverified: the setup checklist renders
    expect(screen.getByText(/setup checklist for biz_new/i)).toBeInTheDocument();
  });

  it('shows the setup checklist for an unverified existing business', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      assetsResponse({
        businesses: [{ id: 'biz_1', name: 'Client One', verificationStatus: 'unverified' }],
        selectionRequired: false,
        selectedBusinessId: 'biz_1',
        selectedBusinessName: 'Client One',
        adAccounts: [{ id: 'act_1', name: 'DogTimez' }],
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    expect(await screen.findByText(/setup checklist for biz_1/i)).toBeInTheDocument();
  });

  it('renders none of the creation UI when businesses exist (regression guard)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      assetsResponse({
        businesses: [{ id: 'biz_1', name: 'Client One', verificationStatus: 'verified' }],
        selectionRequired: false,
        selectedBusinessId: 'biz_1',
        selectedBusinessName: 'Client One',
        adAccounts: [{ id: 'act_1', name: 'DogTimez' }],
        pages: [{ id: 'page_1', name: 'Main Page' }],
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    expect(await screen.findByText(/sharing from client one/i)).toBeInTheDocument();
    expect(screen.queryByText(/no business portfolio yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Meta Business Creator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/setup checklist/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
