'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';

interface BrutalistCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function BrutalistCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  id,
  'aria-label': ariaLabel,
}: BrutalistCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel}
          className="sr-only peer"
        />
        <div
          className={cn(
            'h-5 w-5 border-2 border-black bg-paper',
            'peer-focus:ring-2 peer-focus:ring-coral peer-focus:ring-offset-2',
            'peer-checked:bg-coral peer-checked:border-black',
            'transition-colors duration-100'
          )}
        />
        {checked && (
          <Check className="absolute h-3 w-3 text-white pointer-events-none" strokeWidth={3} />
        )}
      </div>
      {label && (
        <span className="text-sm font-medium text-ink">{label}</span>
      )}
    </label>
  );
}
