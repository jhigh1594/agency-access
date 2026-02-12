'use client';

/**
 * FilterDropdown Component
 *
 * A dropdown component for selecting filter options.
 * Provides consistent filtering UI across the application.
 */

import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function FilterDropdown({
  options,
  value,
  onChange,
  label = 'Filter',
  className = '',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || label;

  // Close dropdown when clicking outside
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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          border border-slate-300 rounded-lg
          text-sm text-slate-700 bg-card
          hover:bg-slate-50
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-colors
          min-w-[160px]
          ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-slate-200 rounded-lg shadow-lg py-1">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-4 py-2 text-left text-sm
                  flex items-center justify-between gap-3
                  transition-colors
                  ${isSelected
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
                role="option"
                aria-selected={isSelected}
              >
                <span className="flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <span className={`text-xs ${
                    isSelected ? 'text-indigo-500' : 'text-slate-400'
                  }`}>
                    {option.count}
                  </span>
                )}
                {isSelected && (
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" strokeWidth={2} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
