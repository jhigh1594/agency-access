'use client';

import { motion, MotionProps } from 'framer-motion';

/**
 * Motion optimization utilities for mobile performance
 *
 * Provides utilities to respect user preferences and optimize animations
 * for mobile devices while maintaining the Acid Brutalism aesthetic.
 */

/**
 * Detects if the user prefers reduced motion
 *
 * Respects the `prefers-reduced-motion` media query for accessibility.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detects if the current device is mobile-sized
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Optimizes Framer Motion props for mobile and accessibility
 *
 * - Disables animations if user prefers reduced motion
 * - Slightly slows down animations on mobile for smoother experience
 * - Preserves all original properties (spring physics, delays, etc.)
 *
 * @param baseProps - Original Framer Motion props
 * @returns Optimized motion props
 *
 * @example
 * const props = getOptimizedMotionProps({
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 },
 *   transition: { duration: 0.5, delay: 0.2 }
 * });
 *
 * <motion.div {...props}>Content</motion.div>
 */
export function getOptimizedMotionProps<T extends Record<string, any>>(
  baseProps: T
): T {
  // If user prefers reduced motion, disable all animations
  if (prefersReducedMotion()) {
    return {
      ...baseProps,
      transition: { duration: 0 },
    } as T;
  }

  // On mobile, slightly slow down animations for smoother experience
  if (isMobileDevice()) {
    const originalTransition = baseProps.transition || {};
    const duration = typeof originalTransition === 'object' && 'duration' in originalTransition
      ? (originalTransition as any).duration
      : 0.3;

    return {
      ...baseProps,
      transition: {
        ...originalTransition,
        duration: duration * 1.2, // 20% slower on mobile
        ease: originalTransition?.ease || [0.25, 0.1, 0.25, 1.0], // Default easing
      },
    } as T;
  }

  // Desktop: use original props unchanged
  return baseProps;
}

/**
 * Creates optimized animation variants for use with Framer Motion
 *
 * @param variants - Animation variants object
 * @returns Optimized variants
 *
 * @example
 * const variants = createOptimizedVariants({
 *   hidden: { opacity: 0, y: 20 },
 *   visible: { opacity: 1, y: 0 }
 * });
 *
 * <motion.div
 *   variants={variants}
 *   initial="hidden"
 *   animate="visible"
 * />
 */
export function createOptimizedVariants<T extends Record<string, any>>(
  variants: T
): T {
  if (prefersReducedMotion()) {
    // For reduced motion, skip the hidden state entirely
    const optimized: any = {};
    for (const key in variants) {
      optimized[key] = {
        ...variants[key],
        transition: { duration: 0 },
      };
    }
    return optimized as T;
  }

  return variants;
}

/**
 * Intersection Observer options optimized for mobile
 *
 * Returns appropriate threshold and rootMargin values based on device type.
 */
export function getObserverOptions(): IntersectionObserverInit {
  if (isMobileDevice()) {
    // Mobile: Trigger earlier (10% visible) with larger margin
    return {
      threshold: 0.1,
      rootMargin: '50px',
    };
  }

  // Desktop: Standard threshold (20% visible)
  return {
    threshold: 0.2,
    rootMargin: '0px',
  };
}

/**
 * Hook for listening to reduced motion preference changes
 *
 * @returns Current reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mediaQuery.matches);

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

import { useState, useEffect } from 'react';

/**
 * Type-safe wrapper for motion components with optimized props
 *
 * Note: Use getOptimizedMotionProps directly in components since
 * JSX syntax requires .tsx files.
 *
 * @example
 * const props = getOptimizedMotionProps({
 *   initial: { opacity: 0 },
 *   animate: { opacity: 1 }
 * });
 * <motion.div {...props}>Content</motion.div>
 */
