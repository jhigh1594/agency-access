'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'agency-theme';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get theme from localStorage OR system preference
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored || (systemPrefersDark ? 'dark' : 'light');

    console.log('[ThemeProvider] Initializing theme:', initialTheme, { stored, systemPrefersDark });

    setTheme(initialTheme);

    // Apply to document (prevents hydration mismatch - client-only)
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);

    console.log('[ThemeProvider] Applied class to document:', document.documentElement.classList.toString());
  }, []);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    console.log('[ThemeProvider] Toggling theme from', theme, 'to', newTheme);

    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    // Apply to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);

    console.log('[ThemeProvider] Applied toggle class:', document.documentElement.classList.toString());
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
