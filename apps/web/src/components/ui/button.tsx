'use client';

import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'brutalist' | 'brutalist-ghost' | 'brutalist-rounded' | 'brutalist-ghost-rounded';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button - Reusable button component with consistent variants
 *
 * Variants:
 * - primary: Indigo background, used for main actions
 * - secondary: White with border, amber hover effect
 * - success: Emerald background, for completion states
 * - danger: Red background, for errors/destructive actions
 * - ghost: Transparent, for tertiary actions
 *
 * Sizes:
 * - sm: Small buttons for tight spaces
 * - md: Default size
 * - lg: Large prominent buttons
 * - xl: Extra-large call-to-action buttons
 * - icon: Square icon-only buttons (typically w-10 h-10)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles common to all variants
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-feedback';

    // Variant styles (use NonNullable to exclude undefined from Record key type)
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl active:scale-95',
      secondary: 'bg-white text-foreground border-2 border-border hover:bg-accent/20 hover:border-accent active:scale-95',
      success: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md hover:shadow-lg active:scale-95',
      danger: 'bg-error text-white hover:bg-error/90 shadow-md hover:shadow-lg active:scale-95',
      ghost: 'bg-transparent text-muted-foreground hover:bg-muted/10 active:scale-95',
      // Brutalist variants - Hard shadows, no rounded corners, uppercase
      brutalist: 'bg-coral text-white border-2 border-black rounded-none shadow-brutalist hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase tracking-wide',
      'brutalist-ghost': 'bg-transparent text-ink border-2 border-black rounded-none hover:bg-black hover:text-paper hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase tracking-wide',
      // Rounded brutalist variants - Same styling but with rounded corners
      'brutalist-rounded': 'bg-coral text-white border-2 border-black rounded-[0.75rem] shadow-brutalist hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase tracking-wide',
      'brutalist-ghost-rounded': 'bg-transparent text-ink border-2 border-black rounded-[0.75rem] hover:bg-black hover:text-paper hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase tracking-wide',
    };

    // Size styles (use NonNullable to exclude undefined from Record key type)
    // All sizes ensure minimum 44px height for touch targets (iOS HIG)
    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'px-4 py-3 text-sm rounded-lg min-h-[44px]', // Increased py-2→py-3 for mobile
      md: 'px-6 py-3 text-base rounded-xl min-h-[48px]',
      lg: 'px-8 py-4 text-lg rounded-xl min-h-[52px]',
      xl: 'px-12 py-5 text-xl rounded-2xl min-h-[56px]',
      icon: 'p-0 w-11 h-11 rounded-full min-h-[44px]', // Increased w-10→w-11 for 44px minimum
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {children && <span>Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
