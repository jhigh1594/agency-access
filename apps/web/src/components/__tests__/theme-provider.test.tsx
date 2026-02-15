import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../theme-provider';
import { act } from 'react-dom/test-utils';

let mockPathname: string | null = null;

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    if (typeof localStorage.getItem !== 'function') {
      const storage = new Map<string, string>();
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, String(value));
          },
          removeItem: (key: string) => {
            storage.delete(key);
          },
          clear: () => {
            storage.clear();
          },
        },
      });
    }

    // Clear localStorage before each test
    if (typeof localStorage.clear === 'function') localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');
    mockPathname = null;

    if (typeof window.matchMedia !== 'function') {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }
  });

  afterEach(() => {
    if (typeof localStorage.clear === 'function') localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('should provide light theme by default', async () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });
  });

  it('should provide dark theme when class present', async () => {
    // Set dark theme in localStorage
    localStorage.setItem('agency-theme', 'dark');

    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  it('should force light theme on onboarding paths even when dark is saved', async () => {
    mockPathname = '/onboarding/unified';
    localStorage.setItem('agency-theme', 'dark');

    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('should apply theme to document element on mount', async () => {
    localStorage.setItem('agency-theme', 'dark');

    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should prevent hydration mismatch with initial theme', async () => {
    // No localStorage, should use system preference (light in test env)
    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });

  it('should toggle theme when toggleTheme called', async () => {
    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <div data-testid="theme">{theme}</div>
          <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    await act(async () => {
      screen.getByTestId('toggle').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('agency-theme')).toBe('dark');
    });
  });

  it('should persist theme to localStorage', async () => {
    const TestComponent = () => {
      const { toggleTheme } = useTheme();
      return <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      screen.getByTestId('toggle').click();
    });

    await waitFor(() => {
      expect(localStorage.getItem('agency-theme')).toBe('dark');
    });
  });

  it('should respect system preference on first visit', async () => {
    // Mock system preference
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = mockMatchMedia;

    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  it('should throw error when useTheme called outside provider', () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return <div>{theme}</div>;
    };

    expect(() => render(<TestComponent />)).toThrow('useTheme must be used within ThemeProvider');
  });
});
