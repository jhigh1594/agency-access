import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  normalizeProviderError,
  revokeAdsManagerLink,
  revokeAdsDirectUser,
  revokeAdsPendingInvitation,
  verifyAdsManagerLink,
  verifyAdsUserRemoved,
  revokeGa4AccessBinding,
  verifyGa4BindingRemoved,
  revokeBusinessAdmin,
  revokeBusinessLocationAdmin,
  revokeGtmUserPermission,
  verifyGtmPermissionRemoved,
  revokeMerchantUser,
  verifyMerchantUserRemoved,
  buildSearchConsoleHandoff,
} from '../google-offboarding.js';

vi.mock('../../../lib/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    API_URL: 'http://localhost:3001',
    PORT: 3001,
  },
}));

describe('normalizeProviderError', () => {
  it('classifies 429 as retryable transient_failure', () => {
    const error = Object.assign(new Error('Rate limited'), { status: 429 });
    const result = normalizeProviderError(error);
    expect(result).toMatchObject({
      success: false,
      providerOutcome: 'transient_failure',
      retryable: true,
    });
  });

  it('classifies 503 as retryable transient_failure', () => {
    const error = Object.assign(new Error('Service unavailable'), { status: 503 });
    const result = normalizeProviderError(error);
    expect(result).toMatchObject({
      success: false,
      providerOutcome: 'transient_failure',
      retryable: true,
    });
  });

  it('classifies 403 as non-retryable terminal_failure', () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 });
    const result = normalizeProviderError(error);
    expect(result).toMatchObject({
      success: false,
      providerOutcome: 'terminal_failure',
      retryable: false,
    });
  });

  it('classifies 404 as non-retryable terminal_failure', () => {
    const error = Object.assign(new Error('Not found'), { status: 404 });
    const result = normalizeProviderError(error);
    expect(result).toMatchObject({
      success: false,
      providerOutcome: 'terminal_failure',
      retryable: false,
    });
  });

  it('classifies network errors as retryable transient_failure', () => {
    const error = new Error('ECONNREFUSED');
    const result = normalizeProviderError(error);
    expect(result).toMatchObject({
      success: false,
      providerOutcome: 'transient_failure',
      retryable: true,
    });
  });

  it('classifies fetch failures as retryable transient_failure', () => {
    const error = new Error('fetch failed');
    const result = normalizeProviderError(error);
    expect(result).toMatchObject({
      success: false,
      providerOutcome: 'transient_failure',
      retryable: true,
    });
  });
});

describe('Google Ads offboarding', () => {
  beforeEach(() => {
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'dev-token';
    global.fetch = vi.fn();
  });

  it('sets manager link to INACTIVE and returns deleted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        result: { resourceName: 'customers/123/customerManagerLinks/456' },
      }),
    } as Response);

    const result = await revokeAdsManagerLink('tok', '1234567890', '456');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');
    expect(result.retryable).toBe(false);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('customerManagerLinks:mutate');
    const body = JSON.parse(String(call[1]?.body));
    expect(body.operation.update.status).toBe('INACTIVE');
  });

  it('verifies an INACTIVE manager link as deleted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{
          customerManagerLink: { status: 'INACTIVE', managerLinkId: '456' },
        }],
      }),
    } as Response);

    const result = await verifyAdsManagerLink('tok', '1234567890', '456');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');
  });

  it('returns approval_pending when manager link is still PENDING', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{
          customerManagerLink: { status: 'PENDING', managerLinkId: '456' },
        }],
      }),
    } as Response);

    const result = await verifyAdsManagerLink('tok', '1234567890', '456');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('approval_pending');
    expect(result.retryable).toBe(true);
  });

  it('returns already_absent when manager link not found', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    } as Response);

    const result = await verifyAdsManagerLink('tok', '1234567890', '456');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('already_absent');
  });

  it('removes a direct user and returns deleted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        result: { resourceName: 'customers/123/customerUserAccesses/789' },
      }),
    } as Response);

    const result = await revokeAdsDirectUser('tok', '1234567890', '789');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');
    expect(result.retryable).toBe(false);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('customerUserAccesses:mutate');
    const body = JSON.parse(String(call[1]?.body));
    expect(body.operation.remove).toContain('customerUserAccesses/789');
  });

  it('verifies user removed returns already_absent on 404', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
      json: async () => ({}),
    } as Response);

    const result = await verifyAdsUserRemoved('tok', '1234567890', '789');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('already_absent');
  });

  it('verifies user still present returns verification_failed', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        resourceName: 'customers/123/customerUserAccesses/789',
        userId: '789',
        emailAddress: 'agency@example.com',
        accessRole: 'ADMIN',
      }),
    } as Response);

    const result = await verifyAdsUserRemoved('tok', '1234567890', '789');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('verification_failed');
  });

  it('removes pending invitation and returns deleted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        result: { resourceName: 'customers/123/customerUserAccessInvitations/999' },
      }),
    } as Response);

    const result = await revokeAdsPendingInvitation('tok', '1234567890', '999');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('customerUserAccessInvitations:mutate');
    const body = JSON.parse(String(call[1]?.body));
    expect(body.operation.remove).toContain('customerUserAccessInvitations/999');
  });

  it('returns transient_failure on 429 for manager link revocation', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => '{"error": {"message": "Rate limited"}}',
      json: async () => ({ error: { message: 'Rate limited' } }),
    } as Response);

    const result = await revokeAdsManagerLink('tok', '1234567890', '456');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('transient_failure');
    expect(result.retryable).toBe(true);
  });
});

describe('GA4 offboarding', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('deletes an access binding and returns deleted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
    } as Response);

    const result = await revokeGa4AccessBinding('tok', 'accounts/111', 'properties/222', '333');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('properties/222/accessBindings/333');
    expect((call[1] as Record<string, unknown>)?.method).toBe('DELETE');
  });

  it('returns already_absent when GA4 binding returns 404', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
      json: async () => ({}),
    } as Response);

    const result = await revokeGa4AccessBinding('tok', 'accounts/111', 'properties/222', '333');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('already_absent');
  });

  it('returns reconnect_required when management scope is missing', async () => {
    process.env.GOOGLE_MOCK_SCOPES = 'https://www.googleapis.com/auth/analytics.readonly';
    global.fetch = vi.fn();

    const result = await revokeGa4AccessBinding('tok', 'accounts/111', 'properties/222', '333');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('reconnect_required');
    expect(result.reason).toContain('analytics.manage.users');

    delete process.env.GOOGLE_MOCK_SCOPES;
  });

  it('verifies GA4 binding removed returns already_absent on 404', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
      json: async () => ({}),
    } as Response);

    const result = await verifyGa4BindingRemoved('tok', 'accounts/111', 'properties/222', '333');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('already_absent');
  });

  it('verifies GA4 binding still present returns verification_failed', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'properties/222/accessBindings/333',
        emailAddress: 'agency@example.com',
      }),
    } as Response);

    const result = await verifyGa4BindingRemoved('tok', 'accounts/111', 'properties/222', '333');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('verification_failed');
  });
});

describe('Business Profile offboarding', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('deletes an account admin and returns deleted', async () => {
    vi.mocked(fetch).mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('/admins')) {
        return {
          ok: true,
          json: async () => ({
            admins: [
              { name: 'accounts/123/admins/456', role: 'ADMIN' },
              { name: 'accounts/123/admins/789', role: 'OWNER' },
            ],
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    const result = await revokeBusinessAdmin('tok', 'accounts/123', 'accounts/123/admins/456');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');
  });

  it('refuses to remove primary/sole owner', async () => {
    vi.mocked(fetch).mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('/admins')) {
        return {
          ok: true,
          json: async () => ({
            admins: [
              { name: 'accounts/123/admins/789', role: 'PRIMARY_OWNER' },
            ],
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    const result = await revokeBusinessAdmin('tok', 'accounts/123', 'accounts/123/admins/789');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('terminal_failure');
    expect(result.reason).toContain('primary/sole owner');
  });

  it('returns already_absent when admin not found in account', async () => {
    vi.mocked(fetch).mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      if (url.includes('/admins') && (init?.method ?? 'GET') === 'GET') {
        return {
          ok: true,
          json: async () => ({
            admins: [
              { name: 'accounts/123/admins/999', role: 'ADMIN' },
            ],
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    const result = await revokeBusinessAdmin('tok', 'accounts/123', 'accounts/123/admins/456');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('already_absent');
  });

  it('deletes a location admin and returns deleted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    const result = await revokeBusinessLocationAdmin(
      'tok', 'accounts/123', 'accounts/123/locations/456', 'accounts/123/locations/456/admins/789',
    );

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');
  });
});

describe('Tag Manager offboarding', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('deletes a user permission and returns deleted', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    const result = await revokeGtmUserPermission('tok', '600000', '123456');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('accounts/600000/user_permissions/123456');
    expect((call[1] as Record<string, unknown>)?.method).toBe('DELETE');
  });

  it('verifies GTM permission removed returns already_absent on 404', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
      json: async () => ({}),
    } as Response);

    const result = await verifyGtmPermissionRemoved('tok', '600000', '123456');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('already_absent');
  });

  it('verifies GTM permission still present returns verification_failed', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        path: 'accounts/600000/user_permissions/123456',
        emailAddress: 'agency@example.com',
        accountAccess: { containerAccess: [{ containerId: '123' }] },
      }),
    } as Response);

    const result = await verifyGtmPermissionRemoved('tok', '600000', '123456');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('verification_failed');
  });
});

describe('Merchant Center offboarding', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('deletes a user and returns deleted', async () => {
    vi.mocked(fetch).mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      if (url.endsWith('/7890/users') && (init?.method ?? 'GET') === 'GET') {
        return {
          ok: true,
          json: async () => ({
            users: [
              { name: 'accounts/7890/users/user1', role: 'standard' },
              { name: 'accounts/7890/users/user2', role: 'admin' },
            ],
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    const result = await revokeMerchantUser('tok', '7890', 'user1');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('deleted');
  });

  it('refuses to remove the last admin', async () => {
    vi.mocked(fetch).mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      if (url.endsWith('/7890/users') && (init?.method ?? 'GET') === 'GET') {
        return {
          ok: true,
          json: async () => ({
            users: [
              { name: 'accounts/7890/users/user1', role: 'admin' },
            ],
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    const result = await revokeMerchantUser('tok', '7890', 'user1');

    expect(result.success).toBe(false);
    expect(result.providerOutcome).toBe('terminal_failure');
    expect(result.reason).toContain('last admin');
  });

  it('returns already_absent when merchant user returns 404', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [{ name: 'accounts/7890/users/other-admin', role: 'admin' }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found',
        json: async () => ({}),
      } as Response);

    const result = await revokeMerchantUser('tok', '7890', 'user1');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('already_absent');
  });

  it('verifies merchant user removed returns already_absent on 404', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
      json: async () => ({}),
    } as Response);

    const result = await verifyMerchantUserRemoved('tok', '7890', 'user1');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('already_absent');
  });
});

describe('Search Console offboarding', () => {
  it('returns manual_handoff with instructions (no API call)', () => {
    const result = buildSearchConsoleHandoff('https://example.com');

    expect(result.success).toBe(true);
    expect(result.providerOutcome).toBe('manual_handoff');
    expect(result.retryable).toBe(false);
    expect(result.reason).toContain('manually remove');
    expect(result.reason).toContain('example.com');
    expect(result.reason).toContain('Attestation template');
  });

  it('includes the site URL in the manual instruction', () => {
    const result = buildSearchConsoleHandoff('sc-domain:example.com');

    expect(result.reason).toContain('sc-domain:example.com');
  });
});
