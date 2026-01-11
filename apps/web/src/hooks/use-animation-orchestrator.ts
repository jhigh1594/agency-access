import { useEffect, useState } from 'react';

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
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [animationsReady, setAnimationsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Phase 1: Mark as hydrated (prevents SSR mismatch)
    setIsHydrated(true);

    // Phase 2: Add html.hydrated class on mount
    requestAnimationFrame(() => {
      setIsMounted(true);
      document.documentElement.classList.add('hydrated');
    });

    // Phase 3: After 100ms delay, add html.animations-ready class
    const timeoutId = setTimeout(() => {
      setAnimationsReady(true);
      document.documentElement.classList.add('animations-ready');
    }, 100);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearTimeout(timeoutId);
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
