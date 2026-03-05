import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PlatformAuthWizard } from '../PlatformAuthWizard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

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

describe('PlatformAuthWizard - TikTok', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('runs TikTok share automation after save and progresses to Step 3 on success', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            advertisers: [{ id: 'adv_1', name: 'Advertiser 1' }],
            businessCenters: [],
            businessCenterAssets: [],
          },
          error: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true }, error: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            success: true,
            results: [{ advertiserId: 'adv_1', status: 'granted', verified: true }],
            manualFallback: { required: false },
          },
          error: null,
        }),
      } as Response);

    render(
      <PlatformAuthWizard
        platform="tiktok"
        platformName="TikTok"
        products={[{ product: 'tiktok_ads', accessLevel: 'standard' }]}
        accessRequestToken="token-1"
        onComplete={vi.fn()}
        initialConnectionId="conn-1"
        initialStep={2}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('TikTok Ad Accounts')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm selection/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('shows manual fallback when TikTok partner automation partially fails', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            advertisers: [{ id: 'adv_1', name: 'Advertiser 1' }, { id: 'adv_2', name: 'Advertiser 2' }],
            businessCenters: [{ id: 'bc_1', name: 'Client BC' }],
            businessCenterAssets: [],
          },
          error: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true }, error: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            success: false,
            results: [
              { advertiserId: 'adv_1', status: 'granted', verified: true },
              { advertiserId: 'adv_2', status: 'failed', error: 'Permission denied' },
            ],
            manualFallback: {
              required: true,
              agencyBusinessCenterId: 'bc_agency_1',
            },
          },
          error: null,
        }),
      } as Response);

    render(
      <PlatformAuthWizard
        platform="tiktok"
        platformName="TikTok"
        products={[{ product: 'tiktok_ads', accessLevel: 'standard' }]}
        accessRequestToken="token-1"
        onComplete={vi.fn()}
        initialConnectionId="conn-1"
        initialStep={2}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('TikTok Ad Accounts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm selection/i }));

    await waitFor(() => {
      expect(screen.getByText(/automation completed with issues/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /continue with partial access/i }));

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });
});
