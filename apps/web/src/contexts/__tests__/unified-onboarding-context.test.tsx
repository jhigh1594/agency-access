import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { UnifiedOnboardingProvider, useUnifiedOnboarding } from '../unified-onboarding-context';

const mockPush = vi.fn();
const mockGetToken = vi.fn();
let mockOrgId: string | null = null;
let mockUser: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddress: { emailAddress: string } | null;
} | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user_123',
    orgId: mockOrgId,
    getToken: mockGetToken,
  }),
  useUser: () => ({
    user: mockUser,
  }),
}));

describe('UnifiedOnboardingContext', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId = null;
    mockUser = {
      id: 'user_123',
      firstName: 'Jane',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'jane@example.com' }],
      primaryEmailAddress: { emailAddress: 'jane@example.com' },
    };
    mockGetToken.mockResolvedValue('token-123');
    (global as any).fetch = fetchMock;
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <UnifiedOnboardingProvider>{children}</UnifiedOnboardingProvider>
  );

  it('prefills agency name from email domain', async () => {
    mockUser = {
      id: 'user_123',
      firstName: 'Jon',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'jon@pillaraiagency.com' }],
      primaryEmailAddress: { emailAddress: 'jon@pillaraiagency.com' },
    };

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.agencyName).toBe('Pillar AI Agency');
    });
  });

  it('stores website URL in agency settings when creating agency from onboarding', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'agency-1' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'client-1' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'req-1', uniqueToken: 'abc123' }, error: null }),
      });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    act(() => {
      result.current.updateAgency({
        name: 'Acme Agency',
        settings: {
          timezone: 'America/New_York',
          industry: 'digital_marketing',
          website: 'https://acmeagency.com',
        },
      });
      result.current.updateClient({
        name: 'Acme Client',
        email: 'client@acme.com',
      });
    });

    await act(async () => {
      await result.current.createAgencyAndAccessRequest();
    });

    const createAgencyCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes('/api/agencies') && call[1]?.method === 'POST'
    );

    expect(createAgencyCall).toBeDefined();
    const body = JSON.parse(createAgencyCall?.[1]?.body as string);
    expect(body.settings.website).toBe('https://acmeagency.com');
  });

  it('returns deterministic result and stores agency/access ids when creating onboarding request', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'agency-1' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'client-1' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'req-1', uniqueToken: 'abc123' }, error: null }),
      });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    act(() => {
      result.current.updateAgency({
        name: 'Acme Agency',
        settings: {
          timezone: 'America/New_York',
          industry: 'digital_marketing',
        },
      });
      result.current.updateClient({
        name: 'Acme Client',
        email: 'client@acme.com',
      });
    });

    let response: any;
    await act(async () => {
      response = await result.current.createAgencyAndAccessRequest();
    });

    expect(response.ok).toBe(true);
    expect(response.agencyId).toBe('agency-1');
    expect(response.accessRequestId).toBe('req-1');
    expect(result.current.state.agencyId).toBe('agency-1');
    expect(result.current.state.accessRequestId).toBe('req-1');
    expect(result.current.state.accessLink).toContain('/authorize/abc123');
  });

  it('submits team invites to bulk members endpoint and returns success flag', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: [], error: null }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { id: 'agency-1' }, error: null }) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ data: { id: 'client-1' }, error: null }) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ data: { id: 'req-1', uniqueToken: 'abc123' }, error: null }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { invited: 1 }, error: null }) });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    act(() => {
      result.current.updateAgency({
        name: 'Acme Agency',
        settings: {
          timezone: 'America/New_York',
          industry: 'digital_marketing',
        },
      });
      result.current.updateClient({
        name: 'Acme Client',
        email: 'client@acme.com',
      });
      result.current.addTeamInvite({
        email: 'teammate@acme.com',
        role: 'member',
      });
    });

    await act(async () => {
      await result.current.createAgencyAndAccessRequest();
    });

    let inviteResult: boolean | undefined;
    await act(async () => {
      inviteResult = await result.current.sendTeamInvites();
    });

    expect(inviteResult).toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/agencies/agency-1/members/bulk',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('uses org principal for agency resolution and invite target in org context', async () => {
    mockOrgId = 'org_123';

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 'agency-org' }], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'agency-org' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'client-1' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'req-1', uniqueToken: 'abc123', agencyId: 'agency-org' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { invited: 1 }, error: null }),
      });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    act(() => {
      result.current.updateAgency({
        name: 'Acme Agency',
        settings: {
          timezone: 'America/New_York',
          industry: 'digital_marketing',
        },
      });
      result.current.updateClient({
        name: 'Acme Client',
        email: 'client@acme.com',
      });
      result.current.addTeamInvite({
        email: 'teammate@acme.com',
        role: 'member',
      });
    });

    await act(async () => {
      await result.current.createAgencyAndAccessRequest();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/agencies?clerkUserId=org_123',
      expect.objectContaining({ method: 'GET' })
    );

    await act(async () => {
      await result.current.sendTeamInvites();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/agencies/agency-org/members/bulk',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('allows back navigation through platform selection and locks after link generation', () => {
    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    // Step 0 (welcome): cannot go back, can skip
    expect(result.current.state.currentStep).toBe(0);
    expect(result.current.canGoBack()).toBe(false);
    expect(result.current.canSkip()).toBe(true);

    // Step 1 (agency): can go back, cannot skip
    act(() => result.current.nextStep());
    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.canGoBack()).toBe(true);
    expect(result.current.canSkip()).toBe(false);

    // Step 2 (client): can go back, can skip
    act(() => result.current.nextStep());
    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.canGoBack()).toBe(true);
    expect(result.current.canSkip()).toBe(true);

    // Step 3 (platform selection): can still go back before link generation, can skip
    act(() => result.current.nextStep());
    expect(result.current.state.currentStep).toBe(3);
    expect(result.current.canGoBack()).toBe(true);
    expect(result.current.canSkip()).toBe(true);

    // Step 4 (success link): locked back navigation, can still skip
    act(() => result.current.nextStep());
    expect(result.current.state.currentStep).toBe(4);
    expect(result.current.canGoBack()).toBe(false);
    expect(result.current.canSkip()).toBe(true);

    // Step 5 (team): skippable
    act(() => result.current.nextStep());
    expect(result.current.state.currentStep).toBe(5);
    expect(result.current.canSkip()).toBe(true);

    // Step 6 (final): no skip
    act(() => result.current.nextStep());
    expect(result.current.state.currentStep).toBe(6);
    expect(result.current.canSkip()).toBe(false);
  });

  it('skips /api/clients lookup when no agency exists yet', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], error: null }),
    });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    await act(async () => {
      await result.current.loadExistingClients();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/agencies?clerkUserId=user_123',
      expect.objectContaining({ method: 'GET' })
    );
    expect(result.current.state.existingClients).toEqual([]);
    expect(result.current.state.error).toBeNull();
  });

  it('loads clients only after agency lookup succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 'agency-1' }], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 'client-1', name: 'Acme', email: 'client@acme.com' }],
          error: null,
        }),
      });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    await act(async () => {
      await result.current.loadExistingClients();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/agencies?clerkUserId=user_123',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/clients',
      expect.objectContaining({ method: 'GET' })
    );
    expect(result.current.state.existingClients).toEqual([
      { id: 'client-1', name: 'Acme', email: 'client@acme.com' },
    ]);
  });

  it('uses safe defaults for client data when creating access request from skipped steps', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'agency-1' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'client-1' }, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'req-1', uniqueToken: 'abc123' }, error: null }),
      });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    act(() => {
      result.current.updateAgency({
        name: 'Acme Agency',
        settings: {
          timezone: 'America/New_York',
          industry: 'digital_marketing',
        },
      });
      result.current.updateClient({
        name: '',
        email: '',
      });
      result.current.updatePlatforms({
        google: ['google_ads'],
      });
    });

    await act(async () => {
      await result.current.createAgencyAndAccessRequest();
    });

    const createClientCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes('/api/clients')
    );
    expect(createClientCall).toBeDefined();
    const createClientBody = JSON.parse(createClientCall?.[1]?.body as string);
    expect(createClientBody.name).toMatch(/\S/);
    expect(createClientBody.email).toMatch(/@/);
  });

  it('ensures agency exists on completion so dashboard does not loop back to onboarding', async () => {
    mockOrgId = 'org_123';

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'agency-org' }, error: null }),
      });

    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/agencies?clerkUserId=org_123',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/agencies',
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('allows continue on client and platform steps even when skipped', () => {
    const { result } = renderHook(() => useUnifiedOnboarding(), { wrapper });

    // Step 1 setup (agency step)
    act(() => {
      result.current.nextStep(); // move to step 1
      result.current.updateAgency({
        name: 'Acme Agency',
        settings: {
          timezone: 'America/New_York',
          industry: 'digital_marketing',
        },
      });
      result.current.nextStep(); // move to step 2
      result.current.updateClient({
        name: '',
        email: '',
      });
    });
    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.canGoNext()).toBe(true);

    // Step 3 should allow continue even with no platform selection
    act(() => {
      result.current.nextStep(); // move to step 3
      result.current.updatePlatforms({});
    });
    expect(result.current.state.currentStep).toBe(3);
    expect(result.current.canGoNext()).toBe(true);
  });
});
