import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, waitFor, screen } from '@testing-library/react';
import { GoogleAssetSelector } from '../GoogleAssetSelector';

vi.mock('../AssetGroup', () => ({
  AssetGroup: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../AssetSelectorStates', () => ({
  AssetSelectorLoading: ({ message }: { message: string }) => <div>{message}</div>,
  AssetSelectorError: ({ title, message }: { title: string; message: string }) => (
    <div>{`${title}: ${message}`}</div>
  ),
  AssetSelectorEmpty: ({ title, description }: { title: string; description: string }) => (
    <div>{`${title}: ${description}`}</div>
  ),
}));

describe('GoogleAssetSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
  });

  it('publishes loaded asset counts before the user makes a selection', async () => {
    const onSelectionChange = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [
          { id: 'customers/123', name: 'Account 123' },
          { id: 'customers/456', name: 'Account 456' },
        ],
        error: null,
      }),
    } as any);

    render(
      <GoogleAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        product="google_ads"
        onSelectionChange={onSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ad Accounts')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith({
        adAccounts: [],
        availableAssetCount: 2,
      });
    });
  });

  it('shows Business Profile empty-state copy as locations with follow-up guidance', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [],
        error: null,
      }),
    } as any);

    render(
      <GoogleAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        product="google_business_profile"
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No Business Profile Locations found/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Connected to Google, but no business profile locations were found for this login/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Business Profile will stay unresolved until a location is available/i)
    ).toBeInTheDocument();
  });

  it('ignores stale asset responses after the active session and product change', async () => {
    const onSelectionChange = vi.fn();

    let resolveAdsResponse: ((value: any) => void) | undefined;
    let resolveBusinessResponse: ((value: any) => void) | undefined;

    global.fetch = vi.fn((input: any) => {
      const url = String(input);

      if (url.includes('/assets/google_ads?connectionId=conn-1')) {
        return new Promise((resolve) => {
          resolveAdsResponse = resolve;
        }) as any;
      }

      if (url.includes('/assets/google_business_profile?connectionId=conn-2')) {
        return new Promise((resolve) => {
          resolveBusinessResponse = resolve;
        }) as any;
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`)) as any;
    });

    const { rerender } = render(
      <GoogleAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        product="google_ads"
        onSelectionChange={onSelectionChange}
      />
    );

    rerender(
      <GoogleAssetSelector
        sessionId="conn-2"
        accessRequestToken="token-1"
        product="google_business_profile"
        onSelectionChange={onSelectionChange}
      />
    );

    await act(async () => {
      resolveBusinessResponse?.({
        json: async () => ({
          data: [],
          error: null,
        }),
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith({
        businessAccounts: [],
        availableAssetCount: 0,
      });
    });

    await act(async () => {
      resolveAdsResponse?.({
        json: async () => ({
          data: [
            { id: 'customers/123', name: 'Account 123' },
            { id: 'customers/456', name: 'Account 456' },
          ],
          error: null,
        }),
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      businessAccounts: [],
      availableAssetCount: 0,
    });
    expect(screen.getByText(/No Business Profile Locations found/i)).toBeInTheDocument();
  });
});
