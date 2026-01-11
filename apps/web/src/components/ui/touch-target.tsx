'use client';

import { ReactNode, forwardRef } from 'react';

interface TouchTargetProps {
  children: ReactNode;
  className?: string;
  minSize?: number;
}

/**
 * TouchTarget - A wrapper component ensuring minimum touch target sizes
 *
 * Ensures interactive elements meet accessibility guidelines (44px minimum per Apple HIG)
 * while maintaining the original visual appearance by adding invisible padding.
 *
 * @example
 * <TouchTarget>
 *   <button>Click me</button>
 * </TouchTarget>
 *
 * @example with custom size
 * <TouchTarget minSize={48}>
 *   <a href="/pricing">Pricing</a>
 * </TouchTarget>
 */
export const TouchTarget = forwardRef<HTMLDivElement, TouchTargetProps>(
  ({ children, className = '', minSize = 44 }, ref) => {
    return (
      <div
        ref={ref}
        className={`touch-target-wrapper inline-flex items-center justify-center ${className}`}
        style={{
          minWidth: minSize,
          minHeight: minSize,
        }}
      >
        {children}
      </div>
    );
  }
);

TouchTarget.displayName = 'TouchTarget';
