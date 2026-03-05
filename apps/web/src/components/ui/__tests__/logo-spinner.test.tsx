import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

async function loadLogoSpinner() {
  const mod = await import('../logo-spinner');
  return mod.LogoSpinner;
}

describe('LogoSpinner', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders the AuthHub logo image', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner />);

    const image = screen.getByAltText('AuthHub logo') as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image.src).toContain('authhub.png');
  });

  it('applies gentle-spin animation class', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner />);

    const container = screen.getByTestId('logo-spinner');
    expect(container.className).toContain('animate-gentle-spin');
  });

  it('accepts custom size prop', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner size="lg" />);

    const image = screen.getByAltText('AuthHub logo');
    expect(image.className).toContain('h-8');
    expect(image.className).toContain('w-8');
  });

  it('accepts custom className', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner className="text-coral" />);

    const container = screen.getByTestId('logo-spinner');
    expect(container.className).toContain('text-coral');
  });

  it('has proper accessibility attributes for loading state', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner />);

    const container = screen.getByTestId('logo-spinner');
    expect(container).toHaveAttribute('role', 'status');
    expect(container).toHaveAttribute('aria-label', 'Loading');
  });

  it('supports screen reader text for loading state', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner loadingText="Processing..." />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('uses default loading text when not provided', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies motion-reduce class for accessibility', async () => {
    const LogoSpinner = await loadLogoSpinner();

    render(<LogoSpinner />);

    const container = screen.getByTestId('logo-spinner');
    expect(container.className).toContain('motion-reduce:animate-none');
  });
});
