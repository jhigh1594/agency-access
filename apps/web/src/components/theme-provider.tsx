'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'agency-theme';

/** Paths that are part of the marketing site and always use light theme. */
function isAlwaysLightPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/compare') ||
    pathname.startsWith('/onboarding')
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const userTheme = stored || (systemPrefersDark ? 'dark' : 'light');

    // Marketing + onboarding always use light; app uses stored/system preference
    const appliedTheme = isAlwaysLightPath(pathname) ? 'light' : userTheme;

    setTheme(appliedTheme);

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(appliedTheme);
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    // On always-light paths keep document light; otherwise apply new theme
    const applied = isAlwaysLightPath(pathname) ? 'light' : newTheme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(applied);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
