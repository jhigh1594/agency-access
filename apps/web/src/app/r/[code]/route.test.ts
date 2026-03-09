import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

vi.mock('@/lib/api/api-env', () => ({
  getApiBaseUrl: vi.fn(() => 'https://api.example.com'),
}));

describe('Affiliate redirect route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets the affiliate click cookie and redirects to the destination path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            clickToken: 'click_123',
            destinationPath: '/pricing',
          },
          error: null,
        }),
      })
    );

    const request = new NextRequest('http://127.0.0.1:3000/r/janedoe?utm_source=newsletter');
    const response = await GET(request, {
      params: Promise.resolve({ code: 'janedoe' }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/pricing?utm_source=newsletter'
    );
    expect(response.cookies.get('ah_aff_click')?.value).toBe('click_123');
    expect(response.cookies.get('ah_aff_click_pending')?.value).toBe('1');
  });

  it('redirects invalid links back to the affiliate program page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    const request = new NextRequest('http://127.0.0.1:3000/r/missing');
    const response = await GET(request, {
      params: Promise.resolve({ code: 'missing' }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/affiliate?invalid=1'
    );
  });
});
