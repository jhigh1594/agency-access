import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TikTokAssetSelector } from '../TikTokAssetSelector';

vi.mock('framer-motion', () => ({
  m: {
    div: ({ children, animate, transition, initial, exit, whileHover, whileTap, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    label: ({ children, animate, transition, initial, exit, whileHover, whileTap, ...props }: any) => (
      <label {...props}>{children}</label>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('TikTokAssetSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('loads TikTok assets and emits selection payload', async () => {
    const onSelectionChange = vi.fn();

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          advertisers: [
            { id: 'adv_1', name: 'Advertiser 1', status: 'STATUS_ENABLE' },
            { id: 'adv_2', name: 'Advertiser 2', status: 'STATUS_ENABLE' },
          ],
          businessCenters: [
            { id: 'bc_1', name: 'Business Center 1' },
          ],
          businessCenterAssets: [
            {
              bcId: 'bc_1',
              advertisers: [{ id: 'adv_1', name: 'Advertiser 1', status: 'STATUS_ENABLE' }],
            },
          ],
        },
        error: null,
      }),
    } as Response);

    render(
      <TikTokAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={onSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('TikTok Ad Accounts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /advertiser 1/i, hidden: true }));

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          adAccounts: ['adv_1'],
          selectedAdvertiserIds: ['adv_1'],
          selectedBusinessCenterId: undefined,
        })
      );
    });
  });

  it('filters advertisers by selected Business Center', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          advertisers: [
            { id: 'adv_1', name: 'Advertiser 1' },
            { id: 'adv_2', name: 'Advertiser 2' },
          ],
          businessCenters: [
            { id: 'bc_1', name: 'Business Center 1' },
          ],
          businessCenterAssets: [
            {
              bcId: 'bc_1',
              advertisers: [{ id: 'adv_1', name: 'Advertiser 1' }],
            },
          ],
        },
        error: null,
      }),
    } as Response);

    render(
      <TikTokAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Business Center')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Business Center'), {
      target: { value: 'bc_1' },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: /advertiser 1/i, hidden: true })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('checkbox', { name: /advertiser 2/i, hidden: true })
      ).not.toBeInTheDocument();
    });
  });
});
