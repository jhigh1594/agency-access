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
  AssetSelectorEmpty: () => <div>Empty</div>,
}));

vi.mock('../MetaAssetCreator', () => ({
  MetaAssetCreator: ({ onSuccess }: { onSuccess: (asset: { id: string; name: string }) => void }) => (
    <button type="button" onClick={() => onSuccess({ id: 'act_new', name: 'New Account' })}>
      Meta Asset Creator
    </button>
  ),
}));

vi.mock('../GuidedRedirectModal', () => ({
  GuidedRedirectCard: () => <div>Guided Redirect</div>,
}));

describe('MetaAssetSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
  });

  it('requires a business portfolio selection before loading Meta assets', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              businesses: [
                { id: 'biz_1', name: 'Client One' },
                { id: 'biz_2', name: 'Client Two' },
              ],
              selectionRequired: true,
              selectedBusinessId: null,
              selectedBusinessName: null,
              adAccounts: [],
              pages: [],
              instagramAccounts: [],
            },
            error: null,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              businesses: [
                { id: 'biz_1', name: 'Client One' },
                { id: 'biz_2', name: 'Client Two' },
              ],
              selectionRequired: false,
              selectedBusinessId: 'biz_2',
              selectedBusinessName: 'Client Two',
              adAccounts: [{ id: 'act_1', name: 'DogTimez' }],
              pages: [{ id: 'page_1', name: 'Main Page' }],
              instagramAccounts: [],
            },
            error: null,
          }),
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    expect(await screen.findByText(/select business portfolio/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/business portfolio/i));
    fireEvent.click(screen.getByRole('option', { name: /Client Two \(biz_2\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /load accounts/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.example.com/api/client/token-1/meta/preflight?connectionId=conn-1&businessId=biz_2'
      );
    });

    expect(await screen.findByText(/sharing from client two/i)).toBeInTheDocument();
    expect(screen.getByText('Select ad accounts...')).toBeInTheDocument();
  });

  it('preserves the selected business scope when refreshing assets and exposes a switch-business control', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              businesses: [
                { id: 'biz_1', name: 'Client One' },
                { id: 'biz_2', name: 'Client Two' },
              ],
              selectionRequired: false,
              selectedBusinessId: 'biz_2',
              selectedBusinessName: 'Client Two',
              adAccounts: [],
              pages: [],
              instagramAccounts: [],
            },
            error: null,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              businesses: [
                { id: 'biz_1', name: 'Client One' },
                { id: 'biz_2', name: 'Client Two' },
              ],
              selectionRequired: false,
              selectedBusinessId: 'biz_2',
              selectedBusinessName: 'Client Two',
              adAccounts: [{ id: 'act_new', name: 'New Account' }],
              pages: [],
              instagramAccounts: [],
            },
            error: null,
          }),
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        businessId="biz_2"
        onSelectionChange={() => {}}
      />
    );

    expect(await screen.findByText(/sharing from client two/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch business/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /create ad account/i }));
    fireEvent.click(screen.getByRole('button', { name: /meta asset creator/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.example.com/api/client/token-1/meta/preflight?connectionId=conn-1&businessId=biz_2'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /switch business/i }));
    expect(await screen.findByText(/select business portfolio/i)).toBeInTheDocument();
  });

  it.each([
    ['configuration_error', 'Agency setup needed'],
    ['no_portfolio', 'No Business Portfolio found'],
    ['missing_recipe_assets', 'Required Meta assets are missing'],
    ['insufficient_authority', 'A Meta administrator is needed'],
    ['provider_error', 'Meta could not complete the check'],
  ])('renders the %s preflight branch without exposing asset selection', async (status, title) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          status,
          canContinue: false,
          nextActor: status === 'configuration_error' ? 'agency' : status === 'insufficient_authority' ? 'another_meta_admin' : 'client',
          message: `Preflight ${status}`,
          handoffAvailable: status !== 'configuration_error',
          ...(status === 'no_portfolio' || status === 'missing_recipe_assets'
            ? { recoveryUrl: 'https://business.facebook.com/settings' }
            : {}),
        },
        error: null,
      }),
    } as Response));

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(screen.queryByText('Select ad accounts...')).not.toBeInTheDocument();
  });

  it('copies the same invite and lets a different Meta administrator resume without clearing verified work', async () => {
    const onUseDifferentAdministrator = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        data: {
          status: 'insufficient_authority',
          canContinue: false,
          nextActor: 'another_meta_admin',
          message: 'A portfolio administrator must continue.',
          handoffAvailable: true,
        },
        error: null,
      }),
    } as Response));

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
        onUseDifferentAdministrator={onUseDifferentAdministrator}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /send to another administrator/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(window.location.href));
    expect(screen.getByText(/verified native access already completed.*preserved/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /use a different meta administrator/i }));
    expect(onUseDifferentAdministrator).toHaveBeenCalledOnce();
  });
});
