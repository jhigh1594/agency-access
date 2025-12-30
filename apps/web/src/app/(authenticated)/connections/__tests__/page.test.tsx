/**
 * Connections Page Integration Tests
 *
 * Tests for the redesigned connections page with
 * platform categorization and OAuth flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConnectionsPage from '../page';

// Mock next/navigation
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    orgId: 'test-org-123',
  }),
  useUser: () => ({
    user: {
      primaryEmailAddress: {
        emailAddress: 'admin@test.com',
      },
    },
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ConnectionsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockSearchParams.delete('success');
    mockSearchParams.delete('error');
    mockSearchParams.delete('platform');
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ConnectionsPage />
      </QueryClientProvider>
    );
  };

  it('should categorize platforms correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { platform: 'meta_ads', name: 'Meta Ads', category: 'recommended', connected: false },
          { platform: 'google_ads', name: 'Google Ads', category: 'recommended', connected: false },
          { platform: 'ga4', name: 'Google Analytics', category: 'recommended', connected: false },
          { platform: 'linkedin', name: 'LinkedIn Ads', category: 'recommended', connected: false },
          { platform: 'tiktok', name: 'TikTok Ads', category: 'other', connected: false },
          { platform: 'snapchat', name: 'Snapchat Ads', category: 'other', connected: false },
          { platform: 'instagram', name: 'Instagram', category: 'other', connected: false },
        ],
      }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Recommended')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    // Check recommended platforms
    expect(screen.getByText('Meta Ads')).toBeInTheDocument();
    expect(screen.getByText('Google Ads')).toBeInTheDocument();
    expect(screen.getByText('Google Analytics')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn Ads')).toBeInTheDocument();

    // Check other platforms
    expect(screen.getByText('TikTok Ads')).toBeInTheDocument();
    expect(screen.getByText('Snapchat Ads')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('should display connected email for connected platforms', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            platform: 'meta_ads',
            name: 'Meta Ads',
            category: 'recommended',
            connected: true,
            connectedEmail: 'user@example.com',
            status: 'active',
          },
          { platform: 'google_ads', name: 'Google Ads', category: 'recommended', connected: false },
          { platform: 'ga4', name: 'Google Analytics', category: 'recommended', connected: false },
          { platform: 'linkedin', name: 'LinkedIn Ads', category: 'recommended', connected: false },
          { platform: 'tiktok', name: 'TikTok Ads', category: 'other', connected: false },
          { platform: 'snapchat', name: 'Snapchat Ads', category: 'other', connected: false },
          { platform: 'instagram', name: 'Instagram', category: 'other', connected: false },
        ],
      }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('should show Connect button for unconnected platforms', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { platform: 'meta_ads', name: 'Meta Ads', category: 'recommended', connected: false },
          { platform: 'google_ads', name: 'Google Ads', category: 'recommended', connected: false },
          { platform: 'ga4', name: 'Google Analytics', category: 'recommended', connected: false },
          { platform: 'linkedin', name: 'LinkedIn Ads', category: 'recommended', connected: false },
          { platform: 'tiktok', name: 'TikTok Ads', category: 'other', connected: false },
          { platform: 'snapchat', name: 'Snapchat Ads', category: 'other', connected: false },
          { platform: 'instagram', name: 'Instagram', category: 'other', connected: false },
        ],
      }),
    });

    renderPage();

    await waitFor(() => {
      const connectButtons = screen.getAllByRole('button', { name: /connect/i });
      expect(connectButtons).toHaveLength(7); // All 7 platforms should have Connect buttons
    });
  });

  it('should handle OAuth callback success', async () => {
    mockSearchParams.set('success', 'true');
    mockSearchParams.set('platform', 'meta_ads');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { platform: 'meta_ads', name: 'Meta Ads', category: 'recommended', connected: false },
          { platform: 'google_ads', name: 'Google Ads', category: 'recommended', connected: false },
          { platform: 'ga4', name: 'Google Analytics', category: 'recommended', connected: false },
          { platform: 'linkedin', name: 'LinkedIn Ads', category: 'recommended', connected: false },
          { platform: 'tiktok', name: 'TikTok Ads', category: 'other', connected: false },
          { platform: 'snapchat', name: 'Snapchat Ads', category: 'other', connected: false },
          { platform: 'instagram', name: 'Instagram', category: 'other', connected: false },
        ],
      }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/successfully connected meta_ads/i)).toBeInTheDocument();
    });

    // Should clear URL params
    expect(mockReplace).toHaveBeenCalledWith('/connections');
  });

  it('should handle OAuth callback error', async () => {
    mockSearchParams.set('error', 'TOKEN_EXCHANGE_FAILED');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { platform: 'meta_ads', name: 'Meta Ads', category: 'recommended', connected: false },
          { platform: 'google_ads', name: 'Google Ads', category: 'recommended', connected: false },
          { platform: 'ga4', name: 'Google Analytics', category: 'recommended', connected: false },
          { platform: 'linkedin', name: 'LinkedIn Ads', category: 'recommended', connected: false },
          { platform: 'tiktok', name: 'TikTok Ads', category: 'other', connected: false },
          { platform: 'snapchat', name: 'Snapchat Ads', category: 'other', connected: false },
          { platform: 'instagram', name: 'Instagram', category: 'other', connected: false },
        ],
      }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to connect platform: TOKEN_EXCHANGE_FAILED/i)).toBeInTheDocument();
    });
  });

  it('should initiate OAuth flow on Connect click', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { platform: 'meta_ads', name: 'Meta Ads', category: 'recommended', connected: false },
            { platform: 'google_ads', name: 'Google Ads', category: 'recommended', connected: false },
            { platform: 'ga4', name: 'Google Analytics', category: 'recommended', connected: false },
            { platform: 'linkedin', name: 'LinkedIn Ads', category: 'recommended', connected: false },
            { platform: 'tiktok', name: 'TikTok Ads', category: 'other', connected: false },
            { platform: 'snapchat', name: 'Snapchat Ads', category: 'other', connected: false },
            { platform: 'instagram', name: 'Instagram', category: 'other', connected: false },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { authUrl: 'https://oauth.example.com' },
        }),
      });

    delete (window as any).location;
    (window as any).location = { href: '' };

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Meta Ads')).toBeInTheDocument();
    });

    const connectButtons = screen.getAllByRole('button', { name: /connect/i });
    fireEvent.click(connectButtons[0]); // Click first Connect button (Meta Ads)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agency-platforms/meta_ads/initiate'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test-org-123'),
        })
      );
    });
  });

  it('should show loading indicator while platforms are fetching', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderPage();

    expect(screen.getByText(/loading platforms/i)).toBeInTheDocument();
  });

  it('should display status badge for non-active connections', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            platform: 'linkedin',
            name: 'LinkedIn Ads',
            category: 'recommended',
            connected: true,
            connectedEmail: 'expired@example.com',
            status: 'expired',
          },
          { platform: 'meta_ads', name: 'Meta Ads', category: 'recommended', connected: false },
          { platform: 'google_ads', name: 'Google Ads', category: 'recommended', connected: false },
          { platform: 'ga4', name: 'Google Analytics', category: 'recommended', connected: false },
          { platform: 'tiktok', name: 'TikTok Ads', category: 'other', connected: false },
          { platform: 'snapchat', name: 'Snapchat Ads', category: 'other', connected: false },
          { platform: 'instagram', name: 'Instagram', category: 'other', connected: false },
        ],
      }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('expired')).toBeInTheDocument();
      expect(screen.getByText('expired@example.com')).toBeInTheDocument();
    });
  });
});
