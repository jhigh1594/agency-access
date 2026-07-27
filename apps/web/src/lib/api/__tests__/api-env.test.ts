import { afterEach, describe, expect, it } from 'vitest';
import { getApiBaseUrl, resolveApiUrl } from '../api-env';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('getApiBaseUrl', () => {
  it('throws in production when NEXT_PUBLIC_API_URL is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(() => getApiBaseUrl()).toThrow('NEXT_PUBLIC_API_URL is required in production for onboarding API calls.');
  });

  it('uses localhost fallback in development when NEXT_PUBLIC_API_URL is missing', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('trims trailing slash from configured URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';

    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('resolves relative endpoints against the normalized API base URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';

    expect(resolveApiUrl('/api/dashboard')).toBe('https://api.example.com/api/dashboard');
    expect(resolveApiUrl('api/dashboard')).toBe('https://api.example.com/api/dashboard');
  });

  it('leaves absolute endpoint URLs unchanged', () => {
    expect(resolveApiUrl('https://other.example.com/api/dashboard')).toBe('https://other.example.com/api/dashboard');
  });
});
