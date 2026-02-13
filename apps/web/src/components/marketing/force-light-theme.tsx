'use client';

import { useEffect } from 'react';

/**
 * Forces light theme for marketing pages.
 * Marketing site should always display in light mode for consistent branding,
 * regardless of user's system preference or stored theme choice.
 */
export function ForceLightTheme() {
  useEffect(() => {
    // Force light theme on marketing pages
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  return null;
}
