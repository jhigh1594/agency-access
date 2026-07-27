import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createTemplate,
  deleteTemplate,
  getAgencyTemplates,
  setDefaultTemplate,
  updateTemplate,
} from '../templates';

describe('templates API client', () => {
  const fetchMock = vi.fn();
  const getToken = vi.fn(async () => 'token-123');

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
    (global as any).fetch = fetchMock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], error: null }),
    });
  });

  it('lists agency templates through the protected /api route', async () => {
    await getAgencyTemplates('agency-1', getToken);

    const [url, requestOptions] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/api/agencies/agency-1/templates');
    expect((requestOptions.headers as Headers).get('Authorization')).toBe('Bearer token-123');
  });

  it('creates templates through the protected /api route with JSON content', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: 'template-1' }, error: null }),
    });

    await createTemplate(
      {
        agencyId: 'agency-1',
        name: 'Launch',
        platforms: {},
        globalAccessLevel: 'standard',
        intakeFields: [],
        branding: { primaryColor: '#6366f1' },
        createdBy: 'user-1',
      },
      getToken
    );

    const [url, requestOptions] = fetchMock.mock.calls[0];
    const headers = requestOptions.headers as Headers;
    expect(url).toBe('https://api.example.com/api/agencies/agency-1/templates');
    expect(requestOptions.method).toBe('POST');
    expect(headers.get('Authorization')).toBe('Bearer token-123');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('updates, deletes, and sets defaults with /api template routes', async () => {
    await updateTemplate('template-1', { name: 'Updated' }, getToken);
    await deleteTemplate('template-1', getToken);
    await setDefaultTemplate('template-1', getToken);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example.com/api/templates/template-1',
      'https://api.example.com/api/templates/template-1',
      'https://api.example.com/api/templates/template-1/set-default',
    ]);
  });

  it('returns backend error messages from protected routes', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        data: null,
        error: {
          code: 'DUPLICATE_NAME',
          message: 'Template name already exists',
        },
      }),
    });

    const result = await createTemplate(
      {
        agencyId: 'agency-1',
        name: 'Launch',
        platforms: {},
        globalAccessLevel: 'standard',
        intakeFields: [],
        branding: { primaryColor: '#6366f1' },
        createdBy: 'user-1',
      },
      getToken
    );

    expect(result.error).toMatchObject({
      code: 'DUPLICATE_NAME',
      message: 'Template name already exists',
    });
  });

  it('does not call fetch when the auth token is missing', async () => {
    const result = await getAgencyTemplates('agency-1', async () => null);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Missing authentication token',
    });
  });
});
