'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useMobile } from '@/hooks/use-mobile';
import { useAnimationOrchestrator } from '@/hooks/use-animation-orchestrator';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * Reveal Component
 *
 * Wraps content to animate it in when it enters the viewport.
 * Uses the animation orchestrator to ensure smooth, coordinated entrance
 * without flicker or layout shifts.
 *
 * Timing:
 * - Waits for isHydrated before creating IntersectionObserver (not
 *   animationsReady — see the flash note on the effect below)
 * - Prevents SSR observer creation
 * - Smooth opacity-based entrance
 */
export function Reveal({ children, delay = 0, direction = 'up' }: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();
  const { isHydrated } = useAnimationOrchestrator();

  // Map direction to CSS class
  const getDirectionClass = () => {
    switch (direction) {
      case 'up':
        return 'reveal-up';
      case 'down':
        return 'reveal-down';
      case 'left':
        return 'reveal-left';
      case 'right':
        return 'reveal-right';
      default:
        return 'reveal-up';
    }
  };

  useEffect(() => {
    const element = ref.current;
    // Observe as soon as the component is hydrated. Waiting for animationsReady
    // caused a paint-then-hide flash: `html.animations-ready .reveal-element`
    // sets opacity: 0 at +100ms, so above-the-fold content painted visible,
    // got hidden, then transitioned back. Observing at hydration lets
    // in-viewport elements earn `.visible` before (or in the same frame as)
    // the opacity gate applies. The CSS transition itself stays gated on
    // `html.hydrated` / `html.animations-ready` in globals.css.
    if (!element || !isHydrated) return;

    // Mobile-optimized observer options
    const observerOptions: IntersectionObserverInit = {
      // Lower threshold on mobile (trigger earlier) for smoother experience
      threshold: isMobile ? 0.05 : 0.1,
      // Larger rootMargin on mobile to trigger animations before element enters viewport
      rootMargin: isMobile ? '50px' : '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Unobserve after revealing for better performance
            observer.unobserve(entry.target);
          }
        });
      },
      observerOptions
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [isMobile, isHydrated]);

  // Set CSS variable for delay
  const style = {
    '--reveal-delay': `${delay}s`,
  } as React.CSSProperties;

  return (
    <div
      ref={ref}
      className={`reveal-element ${getDirectionClass()} ${isVisible ? 'visible' : ''}`}
      style={style}
    >
      {children}
    </div>
  );
}
