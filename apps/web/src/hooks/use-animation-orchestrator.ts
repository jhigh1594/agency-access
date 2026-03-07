import { useEffect, useState } from 'react';
import {
  ANIMATIONS_READY_CLASS,
  ANIMATIONS_READY_EVENT,
  HYDRATED_CLASS,
  HYDRATED_EVENT,
} from '@/lib/animation-lifecycle';

/**
 * Animation Orchestration States
 *
 * Coordinates all animation frameworks through synchronized timing phases:
 *
 * Timing Sequence:
 * 1. SSR/Hydration: Content visible, no transitions (prevent flicker)
 * 2. Mount: Add html.hydrated class → Enable CSS transitions
 * 3. +100ms: Add html.animations-ready class → Start animations
 * 4. Intersection Observer: Reveal elements as they enter viewport
 */
export interface AnimationOrchestratorState {
  /** True after React hydration completes (prevents SSR mismatch) */
  isHydrated: boolean;
  /** True after component mount (html.hydrated class added) */
  isMounted: boolean;
  /** True after 100ms delay (allows layout to settle before animations) */
  animationsReady: boolean;
  /** Combines animationsReady with prefers-reduced-motion check */
  shouldAnimate: boolean;
}

/**
 * Animation Orchestrator Hook
 *
 * Provides a single source of truth for animation readiness across the app.
 * Coordinates timing between Framer Motion, CSS animations, and Intersection Observer.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isHydrated, animationsReady, shouldAnimate } = useAnimationOrchestrator();
 *
 *   return (
 *     <motion.div
 *       initial={shouldAnimate ? { opacity: 0 } : false}
 *       animate={shouldAnimate ? { opacity: 1 } : false}
 *       transition={{ duration: 0.5 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useAnimationOrchestrator(): AnimationOrchestratorState {
  const [isHydrated, setIsHydrated] = useState(() => {
    if (typeof document === 'undefined') {
      return false;
    }

    return document.documentElement.classList.contains(HYDRATED_CLASS);
  });
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof document === 'undefined') {
      return false;
    }

    return document.documentElement.classList.contains(HYDRATED_CLASS);
  });
  const [animationsReady, setAnimationsReady] = useState(() => {
    if (typeof document === 'undefined') {
      return false;
    }

    return document.documentElement.classList.contains(ANIMATIONS_READY_CLASS);
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const syncLifecycle = () => {
      const root = document.documentElement;
      const hydrated = root.classList.contains(HYDRATED_CLASS);
      const ready = root.classList.contains(ANIMATIONS_READY_CLASS);

      setIsHydrated(hydrated);
      setIsMounted(hydrated);
      setAnimationsReady(ready);
    };

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener(HYDRATED_EVENT, syncLifecycle);
    window.addEventListener(ANIMATIONS_READY_EVENT, syncLifecycle);
    syncLifecycle();

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener(HYDRATED_EVENT, syncLifecycle);
      window.removeEventListener(ANIMATIONS_READY_EVENT, syncLifecycle);
    };
  }, []);

  const shouldAnimate = animationsReady && !prefersReducedMotion;

  return {
    isHydrated,
    isMounted,
    animationsReady,
    shouldAnimate,
  };
}

/**
 * Utility hook to get just the shouldAnimate state
 * Useful for components that only need to know if animations should run
 */
export function useShouldAnimate(): boolean {
  const { shouldAnimate } = useAnimationOrchestrator();
  return shouldAnimate;
}
