import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlatformAuthWizard } from '../PlatformAuthWizard';
import { useSearchParams } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock fetch
global.fetch = vi.fn();

describe('PlatformAuthWizard', () => {
  const mockOnComplete = vi.fn();
  const mockToken = 'test-token';
  const mockPlatform = 'meta_ads';
  const mockPlatformName = 'Meta';
  const mockProducts = [{ product: 'meta_ads', accessLevel: 'standard' }];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
    
    // Mock window.location.href
    const location = { href: '' };
    vi.stubGlobal('location', location);
  });

  it('should render step 1 by default', () => {
    render(
      <PlatformAuthWizard
        platform={mockPlatform}
        platformName={mockPlatformName}
        products={mockProducts}
        accessRequestToken={mockToken}
        onComplete={mockOnComplete}
      />
    );

    // The heading and button both contain "Connect Meta"
    expect(screen.getByRole('heading', { name: `Connect ${mockPlatformName}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Connect ${mockPlatformName}` })).toBeInTheDocument();
  });

  it('should call oauth-url endpoint and redirect on connect click', async () => {
    const mockAuthUrl = 'https://facebook.com/oauth?state=test-state';
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { authUrl: mockAuthUrl, state: 'test-state' } }),
    });

    render(
      <PlatformAuthWizard
        platform={mockPlatform}
        platformName={mockPlatformName}
        products={mockProducts}
        accessRequestToken={mockToken}
        onComplete={mockOnComplete}
      />
    );

    const button = screen.getByRole('button', { name: `Connect ${mockPlatformName}` });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/client/${mockToken}/oauth-url`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ platform: mockPlatform }),
        })
      );
    });

    expect(window.location.href).toBe(mockAuthUrl);
  });

  it('should render step 2 if connectionId is in URL', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockImplementation((key) => {
        if (key === 'connectionId') return 'conn-123';
        if (key === 'platform') return mockPlatform;
        if (key === 'step') return '2';
        return null;
      }),
    });

    // Mock assets fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });

    render(
      <PlatformAuthWizard
        platform={mockPlatform}
        platformName={mockPlatformName}
        products={mockProducts}
        accessRequestToken={mockToken}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Successfully Connected!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to Next Platform →' })).toBeInTheDocument();
  });

  it('should call onComplete when continue button is clicked in step 2', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockImplementation((key) => {
        if (key === 'connectionId') return 'conn-123';
        if (key === 'platform') return mockPlatform;
        if (key === 'step') return '2';
        return null;
      }),
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });

    render(
      <PlatformAuthWizard
        platform={mockPlatform}
        platformName={mockPlatformName}
        products={mockProducts}
        accessRequestToken={mockToken}
        onComplete={mockOnComplete}
      />
    );

    const button = screen.getByRole('button', { name: 'Continue to Next Platform →' });
    fireEvent.click(button);

    expect(mockOnComplete).toHaveBeenCalled();
  });
});

