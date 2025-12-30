/**
 * OAuth Callback Page Tests
 *
 * Tests for OAuth callback success/error handling.
 * Following TDD - tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallbackPage from '../page';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe('OAuth Callback Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success State', () => {
    beforeEach(() => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'success') return 'true';
        if (param === 'platform') return 'meta';
        if (param === 'error') return null;
        return null;
      });
    });

    it('should display success message', () => {
      render(<CallbackPage />);
      expect(screen.getByRole('heading', { name: /successfully connected/i })).toBeInTheDocument();
    });

    it('should display the connected platform name', () => {
      render(<CallbackPage />);
      expect(screen.getByText(/meta/i)).toBeInTheDocument();
    });

    it('should show success icon', () => {
      render(<CallbackPage />);
      const successIcon = screen.getByTestId('success-icon');
      expect(successIcon).toBeInTheDocument();
    });

    it('should show link to platform settings', () => {
      render(<CallbackPage />);
      const settingsLink = screen.getByRole('link', { name: /manage platforms/i });
      expect(settingsLink).toHaveAttribute('href', '/settings/platforms');
    });

    it('should show link to continue to dashboard', () => {
      render(<CallbackPage />);
      const dashboardLink = screen.getByRole('link', { name: /continue to dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should auto-redirect to settings after 5 seconds', async () => {
      vi.useFakeTimers();
      render(<CallbackPage />);

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(5000);

      expect(mockPush).toHaveBeenCalledWith('/settings/platforms');

      vi.useRealTimers();
    });
  });

  describe('Error State', () => {
    beforeEach(() => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'INVALID_STATE';
        if (param === 'success') return null;
        if (param === 'platform') return null;
        return null;
      });
    });

    it('should display error message', () => {
      render(<CallbackPage />);
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
    });

    it('should show error icon', () => {
      render(<CallbackPage />);
      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should display specific error code', () => {
      render(<CallbackPage />);
      expect(screen.getByText(/invalid_state/i)).toBeInTheDocument();
    });

    it('should show link to try again', () => {
      render(<CallbackPage />);
      const retryLink = screen.getByRole('link', { name: /try again/i });
      expect(retryLink).toHaveAttribute('href', '/onboarding/platforms');
    });

    it('should show link to contact support', () => {
      render(<CallbackPage />);
      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toBeInTheDocument();
    });

    it('should not auto-redirect on error', () => {
      vi.useFakeTimers();
      render(<CallbackPage />);

      vi.advanceTimersByTime(10000);

      expect(mockPush).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Error Messages', () => {
    it('should show friendly message for INVALID_STATE error', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'INVALID_STATE';
        return null;
      });

      render(<CallbackPage />);
      expect(screen.getByText(/security token.*invalid.*expired/i)).toBeInTheDocument();
    });

    it('should show friendly message for TOKEN_EXCHANGE_FAILED error', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'TOKEN_EXCHANGE_FAILED';
        return null;
      });

      render(<CallbackPage />);
      expect(screen.getByText(/unable to complete authorization/i)).toBeInTheDocument();
    });

    it('should show friendly message for CALLBACK_FAILED error', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'CALLBACK_FAILED';
        return null;
      });

      render(<CallbackPage />);
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });

    it('should show generic message for unknown error codes', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'error') return 'UNKNOWN_ERROR_CODE';
        return null;
      });

      render(<CallbackPage />);
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Platform-Specific Success Messages', () => {
    it('should show Meta-specific success message', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'success') return 'true';
        if (param === 'platform') return 'meta';
        return null;
      });

      render(<CallbackPage />);
      expect(screen.getByText(/meta/i)).toBeInTheDocument();
    });

    it('should show Google-specific success message', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'success') return 'true';
        if (param === 'platform') return 'google';
        return null;
      });

      render(<CallbackPage />);
      expect(screen.getByText(/google/i)).toBeInTheDocument();
    });

    it('should show LinkedIn-specific success message', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'success') return 'true';
        if (param === 'platform') return 'linkedin';
        return null;
      });

      render(<CallbackPage />);
      expect(screen.getByText(/linkedin/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockGet.mockImplementation(() => null);
    });

    it('should show loading state when URL params are missing', () => {
      render(<CallbackPage />);
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'success') return 'true';
        if (param === 'platform') return 'meta';
        return null;
      });

      render(<CallbackPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible links with descriptive text', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'success') return 'true';
        if (param === 'platform') return 'meta';
        return null;
      });

      render(<CallbackPage />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });
});
