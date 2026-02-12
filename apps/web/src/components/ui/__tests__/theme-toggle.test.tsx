import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '../theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  const renderWithProvider = (theme: 'light' | 'dark' = 'light') => {
    localStorage.setItem('agency-theme', theme);
    return render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
  };

  it('should render button in light mode', async () => {
    renderWithProvider('light');
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('should render button in dark mode', async () => {
    renderWithProvider('dark');
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /switch to light mode/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('should call toggleTheme when clicked', async () => {
    renderWithProvider('light');
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('agency-theme')).toBe('dark');
    });
  });

  it('should have accessible label', async () => {
    renderWithProvider('light');
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('should have minimum touch target size', async () => {
    renderWithProvider('light');
    await waitFor(() => {
      const button = screen.getByRole('button');
      // Check that the button has w-10 h-10 class which is 40px minimum
      expect(button).toHaveClass('w-10');
      expect(button).toHaveClass('h-10');
    });
  });
});
