'use client';

/**
 * SingleSelect Component
 *
 * Custom dropdown for single-selection. Replaces native <select> to ensure
 * consistent white background and styling across all browsers/OS.
 * Uses the same pattern as FilterDropdown with full control over appearance.
 */

import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SingleSelectOption {
  value: string;
  label: string;
}

interface SingleSelectProps {
  options: SingleSelectOption[];
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}

export function SingleSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  triggerClassName = '',
  ariaLabel,
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SingleSelectOption) => {
    onChange(option.value, option.label);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        role="combobox"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel ?? displayLabel}
        className={cn(
          'w-full min-h-[44px] px-3 py-2 pr-10 flex items-center justify-between gap-2',
          'border border-border rounded-md text-sm text-ink',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--coral))] focus:border-[rgb(var(--coral))]',
          'transition-all appearance-none cursor-pointer',
          disabled
            ? 'bg-muted/30 cursor-not-allowed opacity-70 dark:bg-muted/50'
            : 'bg-white dark:bg-ink hover:border-border/80 dark:border-white/30',
          isOpen && 'ring-2 ring-[rgb(var(--coral))]/20 border-[rgb(var(--coral))]',
          triggerClassName
        )}
      >
        <span className="flex-1 text-left truncate">
          {value ? displayLabel : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full min-w-full bg-white dark:bg-ink border border-border dark:border-white/30 rounded-md shadow-brutalist-sm overflow-auto max-h-[280px] py-1"
          role="listbox"
          aria-activedescendant={value ? `option-${value}` : undefined}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                id={`option-${option.value}`}
                type="button"
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between gap-3',
                  'transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-accent/20 dark:bg-accent/30 text-ink dark:text-ink font-medium'
                    : 'text-ink dark:text-ink hover:bg-electric/10 dark:hover:bg-white/10'
                )}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-[rgb(var(--coral))] flex-shrink-0" strokeWidth={2} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
