'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * LogoSpinner - AuthHub branded loading spinner
 *
 * Uses the AuthHub logo with a gentle, intermittent spin animation.
 * More distinctive than generic spinners and reinforces brand identity.
 *
 * Design considerations:
 * - Intermittent spin (not continuous) is less dizzying and more elegant
 * - Respects prefers-reduced-motion for accessibility
 * - Works in both light and dark mode
 */

export interface LogoSpinnerProps {
  /** Size variant: sm (16px), md (20px), lg (32px), xl (48px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Screen reader text for loading state */
  loadingText?: string;
}

const sizeClasses: Record<NonNullable<LogoSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const sizePixels: Record<NonNullable<LogoSpinnerProps['size']>, number> = {
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
};

export function LogoSpinner({
  size = 'md',
  className,
  loadingText = 'Loading...',
}: LogoSpinnerProps) {
  const pixelSize = sizePixels[size];

  return (
    <span
      data-testid="logo-spinner"
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-flex items-center justify-center',
        'animate-gentle-spin motion-reduce:animate-none',
        className
      )}
    >
      <Image
        src="/authhub.png"
        alt="AuthHub logo"
        width={pixelSize}
        height={pixelSize}
        className={cn('object-contain', sizeClasses[size])}
        priority
      />
      <span className="sr-only">{loadingText}</span>
    </span>
  );
}
