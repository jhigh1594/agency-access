'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function Reveal({ children, delay = 0, direction = 'up' }: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Optional: Unobserve after revealing for better performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Trigger animation when element is 10% visible
        threshold: 0.1,
        // Start observing slightly before element enters viewport
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

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
