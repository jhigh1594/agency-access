'use client';

import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles (use NonNullable to exclude undefined from Record key type)
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl',
      secondary: 'bg-white text-slate-900 border-2 border-slate-300 hover:bg-amber-500 hover:text-white hover:border-amber-500',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    };

    // Size styles (use NonNullable to exclude undefined from Record key type)
    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'px-4 py-2 text-sm rounded-lg',
      md: 'px-6 py-3 text-base rounded-xl',
      lg: 'px-8 py-4 text-lg rounded-xl',
      xl: 'px-12 py-5 text-xl rounded-2xl',
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
