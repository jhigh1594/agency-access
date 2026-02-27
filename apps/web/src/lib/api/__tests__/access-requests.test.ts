import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccessRequest, getAccessRequest } from '../access-requests';

function getAuthorizationHeader(headers: HeadersInit | undefined): string | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get('Authorization') ?? undefined;
  if (Array.isArray(headers)) {
    const tuple = headers.find(([key]) => key.toLowerCase() === 'authorization');
    return tuple?.[1];
  }

  const record = headers as Record<string, string>;
  return record.Authorization ?? record.authorization;
}

describe('access-requests api client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
  });

  it('includes Authorization header when creating an access request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: 'request-123' },
        error: null,
      }),
    });

    await createAccessRequest(
      {
        agencyId: 'agency-123',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        authModel: 'delegated_access',
        platforms: [],
      },
      async () => 'token-123'
    );

    const [, requestOptions] = fetchMock.mock.calls[0];
    expect(getAuthorizationHeader(requestOptions.headers)).toBe('Bearer token-123');
  });

  it('includes Authorization header when fetching an access request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: 'request-123' },
        error: null,
      }),
    });

    await getAccessRequest('request-123', async () => 'token-123');

    const [, requestOptions] = fetchMock.mock.calls[0];
    expect(getAuthorizationHeader(requestOptions.headers)).toBe('Bearer token-123');
  });
});
