'use client';

import { useState, useEffect } from 'react';

/**
 * Detects if the current viewport is mobile-sized (< 768px)
 *
 * This hook provides a responsive detection of mobile viewports and
 * updates automatically on window resize. Perfect for conditionally
 * rendering mobile-specific UI components or behaviors.
 *
 * @returns boolean - true if viewport width is less than 768px
 *
 * @example
 * function MyComponent() {
 *   const isMobile = useMobile();
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileNav /> : <DesktopNav />}
 *     </div>
 *   );
 * }
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Extended hook that provides breakpoint detection for all Tailwind breakpoints
 *
 * @returns Object with boolean flags for each breakpoint
 *
 * @example
 * function MyComponent() {
 *   const breakpoints = useBreakpoints();
 *
 *   return (
 *     <div className={breakpoints.isXs ? 'text-sm' : 'text-base'}>
 *       Responsive text
 *     </div>
 *   );
 * }
 */
export function useBreakpoints() {
  const [breakpoints, setBreakpoints] = useState({
    isXs: false,   // < 480px
    isSm: false,   // < 640px
    isMd: false,   // < 768px
    isLg: false,   // < 1024px
    isXl: false,   // < 1280px
  });

  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isXs: width < 480,
        isSm: width < 640,
        isMd: width < 768,
        isLg: width < 1024,
        isXl: width < 1280,
      });
    };

    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  return breakpoints;
}
