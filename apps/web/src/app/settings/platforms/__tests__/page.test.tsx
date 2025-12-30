/**
 * Settings Platforms Page Tests
 *
 * Tests for platform connection management.
 * Following TDD - tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlatformsPage from '../page';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user-123',
    orgId: 'agency-1',
  }),
}));

// Mock React Query
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => mockUseQuery(options),
  useMutation: (options: any) => mockUseMutation(options),
}));

describe('Settings Platforms Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: No platform connections
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    // Default: Mutations
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  describe('Page Content', () => {
    it('should display page title', () => {
      render(<PlatformsPage />);
      expect(screen.getByRole('heading', { name: /platform connections/i })).toBeInTheDocument();
    });

    it('should show "Connect Platform" button', () => {
      render(<PlatformsPage />);
      expect(screen.getByRole('button', { name: /connect platform/i })).toBeInTheDocument();
    });

    it('should navigate to onboarding when clicking "Connect Platform"', async () => {
      const user = userEvent.setup();
      render(<PlatformsPage />);

      const connectButton = screen.getByRole('button', { name: /connect platform/i });
      await user.click(connectButton);

      expect(mockPush).toHaveBeenCalledWith('/onboarding/platforms');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no platforms connected', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/no platforms connected yet/i)).toBeInTheDocument();
    });

    it('should show message encouraging platform connection', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/connect your first platform to get started/i)).toBeInTheDocument();
    });
  });

  describe('Platform Connection Cards', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
            expiresAt: '2024-03-15T10:00:00Z',
            lastRefreshedAt: '2024-01-20T10:00:00Z',
            metadata: {
              businessId: '123456789',
              businessName: 'Acme Marketing',
            },
          },
        ],
        isLoading: false,
        error: null,
      });
    });

    it('should display platform name', () => {
      render(<PlatformsPage />);
      expect(screen.getByText('Meta')).toBeInTheDocument();
    });

    it('should display status badge', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('should display connected by email', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/admin@agency.com/i)).toBeInTheDocument();
    });

    it('should display connected timestamp', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/connected:/i)).toBeInTheDocument();
    });

    it('should display expiry timestamp when available', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/expires:/i)).toBeInTheDocument();
    });

    it('should display last refreshed timestamp when available', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/last refreshed:/i)).toBeInTheDocument();
    });

    it('should display platform metadata', () => {
      render(<PlatformsPage />);
      expect(screen.getByText(/business id:/i)).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
    });

    it('should show refresh button', () => {
      render(<PlatformsPage />);
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should show disconnect button', () => {
      render(<PlatformsPage />);
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should show green badge for active status', () => {
      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<PlatformsPage />);
      const badge = screen.getByText(/active/i);
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should show red badge for expired status', () => {
      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'expired',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<PlatformsPage />);
      const badge = screen.getByText(/expired/i);
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should show yellow badge for invalid status', () => {
      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'invalid',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<PlatformsPage />);
      const badge = screen.getByText(/invalid/i);
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('Refresh Action', () => {
    it('should call refresh mutation on button click', async () => {
      const user = userEvent.setup();
      const mutateFn = vi.fn();

      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseMutation.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      });

      render(<PlatformsPage />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mutateFn).toHaveBeenCalledWith('meta');
    });

    it('should disable refresh button while pending', () => {
      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });

      render(<PlatformsPage />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it('should show success message after successful refresh', async () => {
      const user = userEvent.setup();
      let capturedOnSuccess: any;

      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseMutation.mockImplementation((options: any) => {
        capturedOnSuccess = options.onSuccess;
        return {
          mutate: (platform: string) => {
            capturedOnSuccess();
          },
          isPending: false,
        };
      });

      render(<PlatformsPage />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText(/token refreshed successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message if refresh fails', async () => {
      const user = userEvent.setup();
      let capturedOnError: any;

      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseMutation.mockImplementation((options: any) => {
        capturedOnError = options.onError;
        return {
          mutate: (platform: string) => {
            capturedOnError(new Error('Network error'));
          },
          isPending: false,
        };
      });

      render(<PlatformsPage />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to refresh token/i)).toBeInTheDocument();
      });
    });
  });

  describe('Disconnect Action', () => {
    it('should show confirmation dialog on disconnect click', async () => {
      const user = userEvent.setup();

      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<PlatformsPage />);

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      await user.click(disconnectButton);

      expect(screen.getByText(/are you sure you want to disconnect/i)).toBeInTheDocument();
    });

    it('should call disconnect mutation on confirmation', async () => {
      const user = userEvent.setup();
      const mutateFn = vi.fn();

      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseMutation.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      });

      render(<PlatformsPage />);

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      await user.click(disconnectButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(mutateFn).toHaveBeenCalledWith('meta');
    });

    it('should close dialog on cancel', async () => {
      const user = userEvent.setup();

      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<PlatformsPage />);

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      await user.click(disconnectButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to disconnect/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<PlatformsPage />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message if fetching fails', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<PlatformsPage />);
      expect(screen.getByText(/failed to load platforms/i)).toBeInTheDocument();
    });
  });

  describe('Multiple Platforms', () => {
    it('should display multiple platform connection cards', () => {
      mockUseQuery.mockReturnValue({
        data: [
          {
            id: 'conn-1',
            platform: 'meta',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: 'conn-2',
            platform: 'google',
            status: 'active',
            connectedBy: 'admin@agency.com',
            connectedAt: '2024-01-20T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<PlatformsPage />);

      expect(screen.getByText('Meta')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });
  });
});
