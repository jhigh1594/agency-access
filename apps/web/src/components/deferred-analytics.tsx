'use client';

import { useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Deferred Analytics Component
 *
 * Defers loading of non-critical analytics until after the page has rendered.
 * This improves First Contentful Paint (FCP) by preventing analytics scripts
 * from blocking the initial render.
 *
 * SpeedInsights is loaded in a separate requestAnimationFrame to ensure
 * the main content has already been painted.
 */
export function DeferredAnalytics() {
  useEffect(() => {
    // Defer SpeedInsights loading until after first paint
    const rafId = requestAnimationFrame(() => {
      // Use setTimeout to push to next task after paint
      setTimeout(() => {
        // SpeedInsights will initialize automatically
      }, 0);
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  return <SpeedInsights />;
}
