import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TokenHealthPage from '../page';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue(null),
    isLoaded: true,
    isSignedIn: false,
  }),
}));

vi.mock('@/components/ui', () => ({
  StatCard: ({ label }: { label: string }) => <div>{label}</div>,
  HealthBadge: () => null,
  ExpirationCountdown: () => null,
  PlatformIcon: () => null,
  formatRelativeTime: () => '',
}));

describe('TokenHealthPage signed-out degradation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders without fetching and without an error boundary when signed out', async () => {
    render(<TokenHealthPage />);

    expect(screen.getByText('Token Health')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Loading token health...')).toBeInTheDocument();
    });

    // Missing-token degradation: the signed-out page must not hit the API.
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
