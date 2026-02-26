import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Platform } from '@agency-platform/shared';

vi.mock('next/image', () => ({
  default: ({ src, alt, unoptimized, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

async function loadPlatformIcon() {
  const mod = await import('../platform-icon');
  return mod.PlatformIcon;
}

describe('PlatformIcon', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders Brandfetch logo image when client id is configured', async () => {
    process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID = 'brandfetch-test';
    const PlatformIcon = await loadPlatformIcon();

    render(<PlatformIcon platform={'google' as Platform} size="md" />);

    const image = screen.getByAltText('Google logo') as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image.src).toContain('cdn.brandfetch.io/google.com?c=brandfetch-test');
  });

  it('falls back to platform initial when Brandfetch client id is missing', async () => {
    delete process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;
    const PlatformIcon = await loadPlatformIcon();

    render(<PlatformIcon platform={'linkedin' as Platform} size="md" />);

    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('falls back to platform initial when logo image fails to load', async () => {
    process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID = 'brandfetch-test';
    const PlatformIcon = await loadPlatformIcon();

    render(<PlatformIcon platform={'google' as Platform} size="md" />);

    fireEvent.error(screen.getByAltText('Google logo'));
    expect(screen.getByText('G')).toBeInTheDocument();
  });
});
