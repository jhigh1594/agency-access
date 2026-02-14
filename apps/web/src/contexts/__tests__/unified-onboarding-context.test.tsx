import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { UnifiedOnboardingProvider, useUnifiedOnboarding } from '../unified-onboarding-context';

const mockPush = vi.fn();
const mockGetToken = vi.fn();
let mockOrgId: string | null = null;

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
    user: {
      id: 'user_123',
      firstName: 'Jane',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'jane@example.com' }],
      primaryEmailAddress: { emailAddress: 'jane@example.com' },
    },
  }),
}));

describe('UnifiedOnboardingContext', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId = null;
    mockGetToken.mockResolvedValue('token-123');
    (global as any).fetch = fetchMock;
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <UnifiedOnboardingProvider>{children}</UnifiedOnboardingProvider>
  );

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
});
