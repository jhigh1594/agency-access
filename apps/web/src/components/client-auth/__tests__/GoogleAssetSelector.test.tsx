import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, render, waitFor, screen } from '@testing-library/react';
import { GoogleAssetSelector } from '../GoogleAssetSelector';

vi.mock('../AssetGroup', () => ({
  AssetGroup: ({
    title,
    assets,
  }: {
    title: string;
    assets: Array<{ id: string; name: string; description?: string }>;
  }) => (
    <div>
      <div>{title}</div>
      {assets.map((asset) => (
        <div key={asset.id}>{asset.name}</div>
      ))}
    </div>
  ),
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
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
        selectedAssetNames: [],
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
        selectedAssetNames: [],
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
      selectedAssetNames: [],
    });
    expect(screen.getByText(/No Business Profile Locations found/i)).toBeInTheDocument();
  });

  it('formats Google Ads asset labels with account title and formatted ID', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [
          {
            id: '6449142979',
            name: 'Pillar AI Agency MCC',
            formattedId: '644-914-2979',
            nameSource: 'hierarchy',
            type: 'google_ads',
            status: 'active',
          },
          {
            id: '5497559774',
            name: 'Google Ads account • 549-755-9774',
            formattedId: '549-755-9774',
            nameSource: 'fallback',
            type: 'google_ads',
            status: 'active',
          },
        ],
        error: null,
      }),
    } as any);

    render(
      <GoogleAssetSelector
        sessionId="conn-1"
        accessRequestToken="token-1"
        product="google_ads"
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pillar AI Agency MCC • 644-914-2979')).toBeInTheDocument();
      expect(screen.getByText('Google Ads account • 549-755-9774')).toBeInTheDocument();
    });
  });

  it('does not enter a parent update loop when the caller stores selection state', async () => {
    const parentSelectionSpy = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [{ id: 'customers/123', name: 'Account 123' }],
        error: null,
      }),
    } as any);

    function Harness() {
      const [, setSelection] = React.useState<unknown>(null);

      return (
        <GoogleAssetSelector
          sessionId="conn-1"
          accessRequestToken="token-1"
          product="google_ads"
          onSelectionChange={(selection) => {
            parentSelectionSpy(selection);
            setSelection(selection);
          }}
        />
      );
    }

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Ad Accounts')).toBeInTheDocument();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(parentSelectionSpy.mock.calls.length).toBeLessThanOrEqual(3);
    expect(
      consoleErrorSpy.mock.calls.some((call) =>
        call.some(
          (value) => typeof value === 'string' && value.includes('Maximum update depth exceeded')
        )
      )
    ).toBe(false);
  });
});
