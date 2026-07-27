import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import posthog from 'posthog-js';
import { MetaAssetSelector } from '../MetaAssetSelector';

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

describe('MetaAssetSelector interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
  });

  it('reports selected Meta assets after a business is loaded and an asset is clicked', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: {
              businesses: [
                { id: 'biz_client_1', name: 'DogTimez Holdings' },
                { id: 'biz_client_2', name: 'DogTimez Retail' },
              ],
              selectedBusinessId: null,
              selectedBusinessName: null,
              selectionRequired: true,
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
                { id: 'biz_client_1', name: 'DogTimez Holdings' },
                { id: 'biz_client_2', name: 'DogTimez Retail' },
              ],
              selectedBusinessId: 'biz_client_2',
              selectedBusinessName: 'DogTimez Retail',
              selectionRequired: false,
              adAccounts: [],
              pages: [
                {
                  id: 'page_1001',
                  name: 'DogTimez Facebook',
                  category: 'Brand',
                },
              ],
              instagramAccounts: [],
            },
            error: null,
          }),
      } as Response);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={onSelectionChange}
      />
    );

    await screen.findByText('Select Business Portfolio');

    await user.click(screen.getByLabelText('Business Portfolio'));
    await user.click(await screen.findByRole('option', { name: /DogTimez Retail/i }));
    await user.click(screen.getByRole('button', { name: 'Load accounts' }));

    await screen.findByText('Sharing from DogTimez Retail');
    await user.click(screen.getByText('Select pages...', { exact: false }));
    await user.click(await screen.findByText('DogTimez Facebook'));

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          pages: ['page_1001'],
          selectedBusinessId: 'biz_client_2',
          selectedBusinessName: 'DogTimez Retail',
          selectedPagesWithNames: [{ id: 'page_1001', name: 'DogTimez Facebook' }],
        })
      );
    });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('runs preflight again for the chosen portfolio before exposing its assets', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          data: {
            status: 'selection_required',
            canContinue: false,
            nextActor: 'client',
            message: 'Choose a portfolio.',
            handoffAvailable: true,
            businesses: [{ id: 'biz-1', name: 'One' }, { id: 'biz-2', name: 'Two' }],
          },
          error: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          data: {
            status: 'ready',
            canContinue: true,
            nextActor: 'client',
            message: 'Ready.',
            selectedBusinessId: 'biz-2',
            handoffAvailable: true,
          },
          error: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          data: {
            businesses: [{ id: 'biz-1', name: 'One' }, { id: 'biz-2', name: 'Two' }],
            selectedBusinessId: 'biz-2',
            selectedBusinessName: 'Two',
            selectionRequired: false,
            adAccounts: [{ id: 'act-2', name: 'Two Ads' }],
            pages: [{ id: 'page-2', name: 'Two Page' }],
            instagramAccounts: [],
          },
          error: null,
        }),
      } as Response);

    render(
      <MetaAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={() => {}}
      />
    );

    await user.click(await screen.findByLabelText('Business Portfolio'));
    await user.click(await screen.findByRole('option', { name: /Two \(biz-2\)/i }));
    await user.click(screen.getByRole('button', { name: /use this portfolio/i }));

    expect(await screen.findByText('Sharing from Two')).toBeInTheDocument();
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/client/token-1/meta/preflight?connectionId=conn-1&businessId=biz-2'
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'https://api.example.com/api/client/token-1/assets/meta_ads?connectionId=conn-1&businessId=biz-2'
    );
  });
});
