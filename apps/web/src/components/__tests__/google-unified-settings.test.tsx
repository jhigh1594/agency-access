import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { GoogleUnifiedSettings } from '../google-unified-settings';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function getAuthHeader(init: RequestInit | undefined): string | undefined {
  const headers = init?.headers as any;
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get('Authorization') ?? undefined;
  return headers.Authorization ?? headers.authorization;
}

describe('GoogleUnifiedSettings', () => {
  const prevEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = prevEnv;
    vi.restoreAllMocks();
  });

  it('includes Authorization header when fetching accounts and asset settings', async () => {
    const fetchMock = vi.fn(async (input: any, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        expect(url).toContain('refresh=true');
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [],
              analyticsProperties: [],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAds: { enabled: true, requestManageUsers: false },
              googleAnalytics: { enabled: true, requestManageUsers: false },
              googleBusinessProfile: { enabled: true, requestManageUsers: false },
              googleTagManager: { enabled: true, requestManageUsers: false },
              googleSearchConsole: { enabled: true, requestManageUsers: false },
              googleMerchantCenter: { enabled: true, requestManageUsers: false },
            },
          }),
        } as any;
      }

      return {
        ok: true,
        json: async () => ({ data: null }),
      } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Assert both GETs include the Clerk token
    await waitFor(() => {
      const calls = fetchMock.mock.calls as Array<[any, RequestInit | undefined]>;
      const accountsCall = calls.find(([input]) =>
        String(input).includes('/agency-platforms/google/accounts')
      );
      const settingsCall = calls.find(([input]) =>
        String(input).includes('/agency-platforms/google/asset-settings?')
      );

      expect(accountsCall).toBeTruthy();
      expect(settingsCall).toBeTruthy();

      expect(getAuthHeader(accountsCall?.[1])).toBe('Bearer mock-token');
      expect(getAuthHeader(settingsCall?.[1])).toBe('Bearer mock-token');
    });
  });

  it('prefers GA4 displayName over resource name in dropdown labels', async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [],
              analyticsProperties: [
                {
                  id: '524870148',
                  name: 'properties/524870148',
                  displayName: 'Pillar AI Agency',
                  type: 'ga4',
                  accountName: 'Main Account',
                },
              ],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAds: { enabled: false, requestManageUsers: false },
              googleAnalytics: { enabled: true, requestManageUsers: false },
              googleBusinessProfile: { enabled: false, requestManageUsers: false },
              googleTagManager: { enabled: false, requestManageUsers: false },
              googleSearchConsole: { enabled: false, requestManageUsers: false },
              googleMerchantCenter: { enabled: false, requestManageUsers: false },
            },
          }),
        } as any;
      }

      return { ok: true, json: async () => ({ data: null }) } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    const { container } = renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    // Open the GA4 selector dropdown (options only rendered when open)
    const ga4Combobox = await screen.findByRole('combobox', { name: /Select GA4 Property/i });
    await user.click(ga4Combobox);

    await waitFor(() => {
      // Ensure the option text uses displayName (not "properties/...")
      expect(container.textContent).toContain('Pillar AI Agency');
    });
    expect(container.textContent).not.toContain('properties/524870148 (524870148)');
  });

  it('can select all and deselect all Google products', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [],
              analyticsProperties: [],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings?')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAds: { enabled: false, requestManageUsers: false },
              googleAnalytics: { enabled: false, requestManageUsers: false },
              googleBusinessProfile: { enabled: false, requestManageUsers: false },
              googleTagManager: { enabled: false, requestManageUsers: false },
              googleSearchConsole: { enabled: false, requestManageUsers: false },
              googleMerchantCenter: { enabled: false, requestManageUsers: false },
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings') && !url.includes('?')) {
        return { ok: true, json: async () => ({ data: true }) } as any;
      }

      return { ok: true, json: async () => ({ data: null }) } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    const { getByRole, getByText } = renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    // Wait until the UI is hydrated
    await waitFor(() => {
      expect(getByRole('checkbox', { name: /^enable google ads account$/i })).toBeInTheDocument();
    });

    await user.click(getByRole('button', { name: /^select all$/i }));

    const productLabels = [
      'Google Ads Account',
      'Google Analytics Account',
      'Google Business Profile Location',
      'Google Tag Manager',
      'Google Search Console',
      'Google Merchant Center',
    ] as const;

    for (const label of productLabels) {
      const checkbox = getByRole('checkbox', { name: new RegExp(`^enable ${label}$`, 'i') });
      expect(checkbox).toBeChecked();
    }

    await user.click(getByRole('button', { name: /^deselect all$/i }));

    for (const label of productLabels) {
      const checkbox = getByRole('checkbox', { name: new RegExp(`^enable ${label}$`, 'i') });
      expect(checkbox).not.toBeChecked();
    }
  });

  it('does not render the removed configuration overview block', async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [],
              analyticsProperties: [],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings?')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAds: { enabled: true, requestManageUsers: false },
              googleAnalytics: { enabled: true, requestManageUsers: false },
              googleBusinessProfile: { enabled: false, requestManageUsers: false },
              googleTagManager: { enabled: false, requestManageUsers: false },
              googleSearchConsole: { enabled: false, requestManageUsers: false },
              googleMerchantCenter: { enabled: false, requestManageUsers: false },
            },
          }),
        } as any;
      }

      return { ok: true, json: async () => ({ data: null }) } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    expect(await screen.findByText(/google products/i)).toBeInTheDocument();
    expect(screen.queryByText(/configuration overview/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/current google setup/i)).not.toBeInTheDocument();
  });

  it('renders Google Ads dropdown labels with account title and formatted ID, including fallback labels', async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [
                {
                  id: '6449142979',
                  name: 'Pillar AI Agency MCC',
                  formattedId: '644-914-2979',
                  nameSource: 'hierarchy',
                  isManager: true,
                  type: 'google_ads',
                  status: 'active',
                },
                {
                  id: '5497559774',
                  name: 'Google Ads account • 549-755-9774',
                  formattedId: '549-755-9774',
                  nameSource: 'fallback',
                  isManager: false,
                  type: 'google_ads',
                  status: 'active',
                },
              ],
              analyticsProperties: [],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAds: { enabled: true, requestManageUsers: false },
              googleAnalytics: { enabled: false, requestManageUsers: false },
              googleBusinessProfile: { enabled: false, requestManageUsers: false },
              googleTagManager: { enabled: false, requestManageUsers: false },
              googleSearchConsole: { enabled: false, requestManageUsers: false },
              googleMerchantCenter: { enabled: false, requestManageUsers: false },
            },
          }),
        } as any;
      }

      return { ok: true, json: async () => ({ data: null }) } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    const { container } = renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    // Open the Google Ads selector (options only rendered when open)
    const adsCombobox = await screen.findByRole('combobox', { name: /Select Ads Account/i });
    await user.click(adsCombobox);

    await waitFor(() => {
      expect(container.textContent).toContain('Pillar AI Agency MCC • 644-914-2979');
      expect(container.textContent).toContain('Google Ads account • 549-755-9774');
    });
  });

  it('warns when the saved Google Ads account is no longer active and excludes it from the dropdown', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [
                {
                  id: '1111111111',
                  name: 'Enabled Account',
                  formattedId: '111-111-1111',
                  nameSource: 'direct',
                  isManager: false,
                  type: 'google_ads',
                  status: 'ENABLED',
                },
              ],
              analyticsProperties: [],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAds: {
                enabled: true,
                accountId: '9999999999',
                requestManageUsers: false,
              },
              googleAnalytics: { enabled: false, requestManageUsers: false },
              googleBusinessProfile: { enabled: false, requestManageUsers: false },
              googleTagManager: { enabled: false, requestManageUsers: false },
              googleSearchConsole: { enabled: false, requestManageUsers: false },
              googleMerchantCenter: { enabled: false, requestManageUsers: false },
            },
          }),
        } as any;
      }

      return { ok: true, json: async () => ({ data: null }) } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    expect(
      await screen.findByText(/previously selected google ads account is no longer active/i)
    ).toBeInTheDocument();

    const adsCombobox = screen.getByRole('combobox', { name: /Select Ads Account/i });
    expect(adsCombobox).toHaveTextContent(/Select Ads Account/i);

    await user.click(adsCombobox);

    // Stale account 9999999999 must not appear in the dropdown
    expect(screen.queryByRole('option', { name: /9999999999/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /Enabled Account.*111-111-1111/i }));
  });

  it('renders Google Ads MCC defaults and limits manager selection to manager accounts', async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [
                {
                  id: '6449142979',
                  name: 'Pillar AI Agency MCC',
                  formattedId: '644-914-2979',
                  nameSource: 'hierarchy',
                  isManager: true,
                  type: 'google_ads',
                  status: 'active',
                },
                {
                  id: '5497559774',
                  name: 'Client Ads Account',
                  formattedId: '549-755-9774',
                  nameSource: 'direct',
                  isManager: false,
                  type: 'google_ads',
                  status: 'active',
                },
              ],
              analyticsProperties: [],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAdsManagement: {
                preferredGrantMode: 'manager_link',
                managerCustomerId: '6449142979',
                managerAccountLabel: 'Pillar AI Agency MCC',
                inviteEmail: 'jon.highmu@gmail.com',
              },
              googleAds: { enabled: true, requestManageUsers: false },
              googleAnalytics: { enabled: false, requestManageUsers: false },
              googleBusinessProfile: { enabled: false, requestManageUsers: false },
              googleTagManager: { enabled: false, requestManageUsers: false },
              googleSearchConsole: { enabled: false, requestManageUsers: false },
              googleMerchantCenter: { enabled: false, requestManageUsers: false },
            },
          }),
        } as any;
      }

      return { ok: true, json: async () => ({ data: null }) } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    const { container } = renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    expect(await screen.findByText(/google ads access method/i)).toBeInTheDocument();

    const managerCombobox = screen.getByRole('combobox', { name: /Select Manager Account/i });
    await user.click(managerCombobox);

    await waitFor(() => {
      expect(container.textContent).toContain('Pillar AI Agency MCC • 644-914-2979');
    });
    expect(container.textContent).not.toContain('Client Ads Account • 549-755-9774');
  });
});
