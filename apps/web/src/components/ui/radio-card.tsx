'use client';

/**
 * RadioCard Component
 *
 * A selectable card for single-choice groups. Supports label, description,
 * optional badge (e.g. "Recommended"), and tooltip. Acid Brutalism styling.
 */

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadioCardProps {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  tooltip?: string;
  isSelected: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

export function RadioCard({
  value,
  label,
  description,
  badge,
  tooltip,
  isSelected,
  onChange,
  disabled = false,
  className,
}: RadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange()}
      className={cn(
        'relative w-full rounded-[1rem] border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[rgb(var(--coral))] focus:ring-offset-2',
        'min-h-[44px] cursor-pointer',
        isSelected
          ? 'border-black bg-card shadow-brutalist-sm'
          : 'border-border bg-paper hover:border-black/50 hover:shadow-brutalist-sm',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      aria-label={label}
      data-value={value}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{label}</span>
            {badge && (
              <span className="inline-flex items-center rounded-full border-2 border-black bg-[rgb(var(--coral))] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-brutalist-sm">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {tooltip && (
          <div
            className="group relative flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Info
              className="h-4 w-4 text-muted-foreground cursor-help"
              aria-label="More information"
            />
            <div className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded border border-border bg-ink p-2 text-[10px] text-white shadow-brutalist opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none">
              {tooltip}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
