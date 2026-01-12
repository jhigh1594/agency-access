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
 * - Waits for animationsReady before creating IntersectionObserver
 * - Prevents SSR observer creation
 * - Smooth opacity-based entrance
 */
export function Reveal({ children, delay = 0, direction = 'up' }: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();
  const { animationsReady } = useAnimationOrchestrator();

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
    // Defer Intersection Observer creation until animations ready
    // This prevents premature observer creation during SSR/hydration
    if (!element || !animationsReady) return;

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
  }, [isMobile, animationsReady]);

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
